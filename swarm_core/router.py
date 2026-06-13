"""Task Router - decomposes tasks into DAGs and routes subtasks to avatars."""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from swarm_core.event_bus import EventBus
from swarm_core.matcher import CapabilityMatcher
from swarm_core.config import STREAM_NAMES, PRIORITY_LEVELS


@dataclass
class SubtaskNode:
    """A node in the task DAG."""
    subtask_id: str
    task_id: str
    domain: str
    required_skills: list[str] = field(default_factory=list)
    priority: str = "normal"
    payload: dict[str, Any] = field(default_factory=dict)
    assigned_avatar: str | None = None
    dependencies: list[str] = field(default_factory=list)
    status: str = "pending"


@dataclass
class TaskDAG:
    """A directed acyclic graph of subtasks."""
    task_id: str
    nodes: dict[str, SubtaskNode] = field(default_factory=dict)
    edges: list[tuple[str, str]] = field(default_factory=list)


class TaskRouter:
    """Accepts a task dict, decomposes into a subtask DAG, and routes each
    subtask to the best-matching avatar via the CapabilityMatcher."""

    def __init__(
        self, matcher: CapabilityMatcher,
        event_bus: EventBus | None = None
    ) -> None:
        self._matcher = matcher
        self._event_bus = event_bus

    def accept_task(self, task: dict[str, Any]) -> TaskDAG:
        """Accept a task dict and return a routed TaskDAG."""
        task_id = task.get("id", str(uuid.uuid4()))
        dag = self._decompose(task, task_id)
        self._route_dag(dag)
        return dag

    def _decompose(self, task: dict[str, Any], task_id: str) -> TaskDAG:
        """Break a task into a DAG of subtasks."""
        required_skills: list[str] = task.get("required_skills", [])
        domain: str = task.get("domain", "general")
        priority: str = task.get("priority", "normal")
        if priority not in PRIORITY_LEVELS:
            priority = "normal"
        payload: dict[str, Any] = task.get("payload", {})

        dag = TaskDAG(task_id=task_id)

        if not required_skills:
            node = SubtaskNode(
                subtask_id=f"{task_id}_main", task_id=task_id,
                domain=domain, required_skills=[],
                priority=priority, payload=payload,
            )
            dag.nodes[node.subtask_id] = node
            return dag

        prev_id: str | None = None
        for i, skill in enumerate(required_skills):
            node = SubtaskNode(
                subtask_id=f"{task_id}_step{i}", task_id=task_id,
                domain=domain, required_skills=[skill],
                priority=priority,
                payload={**payload, "skill": skill},
            )
            dag.nodes[node.subtask_id] = node
            if task.get("type") == "sequential" and prev_id:
                node.dependencies.append(prev_id)
                dag.edges.append((prev_id, node.subtask_id))
            prev_id = node.subtask_id

        return dag

    def _route_dag(self, dag: TaskDAG) -> None:
        """Assign each subtask node to the best-matching avatar."""
        for node in dag.nodes.values():
            matches = self._matcher.match(
                required_skills=node.required_skills,
                domain=node.domain, online_only=True, top_n=1,
            )
            if matches:
                avatar, score = matches[0]
                node.assigned_avatar = avatar.id
                node.status = "routed"
                if self._event_bus is not None:
                    self._event_bus.publish(
                        stream=STREAM_NAMES["task_stream"],
                        message={
                            "type": "task",
                            "publisher": "router",
                            "payload": {
                                "task_id": node.task_id,
                                "subtask_id": node.subtask_id,
                                "domain": node.domain,
                                "required_skills": node.required_skills,
                                "priority": node.priority,
                                "assigned_avatar": avatar.id,
                                "status": "routed",
                                "match_score": score,
                                "payload": node.payload,
                            },
                        },
                    )
            else:
                fallback_matches = self._matcher.match_fallback()
                if fallback_matches:
                    avatar, _ = fallback_matches[0]
                    node.assigned_avatar = avatar.id
                    node.status = "routed_fallback"
                else:
                    node.status = "failed"
