"""Pydantic message schemas for Swarm Core inter-agent communication.

Each message type has: type discriminator, publisher, timestamp, and payload.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field


class _BaseMessage(BaseModel):
    """Shared fields for all swarm messages."""

    type: str
    publisher: str = "unknown"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    payload: dict[str, Any] = Field(default_factory=dict)

    def to_json(self) -> str:
        return self.model_dump_json()

    @classmethod
    def from_json(cls, data: str | bytes | dict) -> "_BaseMessage":
        if isinstance(data, (str, bytes)):
            data = json.loads(data)
        type_map: dict[str, type[_BaseMessage]] = {
            "task": TaskMessage,
            "insight": InsightMessage,
            "heartbeat": HeartbeatMessage,
            "skill_request": SkillRequestMessage,
            "skill_response": SkillResponseMessage,
        }
        msg_type = data.get("type", "")
        model_cls = type_map.get(msg_type, _BaseMessage)
        return model_cls(**data)


class TaskMessage(_BaseMessage):
    """Message for task dispatching / result reporting."""
    type: Literal["task"] = "task"  # type: ignore[assignment]
    payload: dict[str, Any] = Field(default_factory=lambda: {
        "task_id": "", "subtask_id": "", "domain": "",
        "required_skills": [], "priority": "normal", "status": "pending",
    })


class InsightMessage(_BaseMessage):
    """Message for broadcasting insights / observations."""
    type: Literal["insight"] = "insight"  # type: ignore[assignment]
    payload: dict[str, Any] = Field(default_factory=lambda: {
        "insight_type": "", "content": "", "confidence": 0.0
    })


class HeartbeatMessage(_BaseMessage):
    """Periodic heartbeat for liveness tracking."""
    type: Literal["heartbeat"] = "heartbeat"  # type: ignore[assignment]
    payload: dict[str, Any] = Field(default_factory=lambda: {
        "avatar_id": "", "load": 0, "success_rate": 0.0,
    })


class SkillRequestMessage(_BaseMessage):
    """Request for a skill execution from another avatar."""
    type: Literal["skill_request"] = "skill_request"  # type: ignore[assignment]
    payload: dict[str, Any] = Field(default_factory=lambda: {
        "request_id": "", "skill": "", "args": {}
    })


class SkillResponseMessage(_BaseMessage):
    """Response to a skill execution request."""
    type: Literal["skill_response"] = "skill_response"  # type: ignore[assignment]
    payload: dict[str, Any] = Field(default_factory=lambda: {
        "request_id": "", "skill": "", "result": None, "error": None
    })
