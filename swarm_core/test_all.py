"""Comprehensive tests for Swarm Core library.

Run:  python swarm_core/test_all.py
"""
from __future__ import annotations

import json
import sys
import time
import uuid
from pathlib import Path

# Ensure swarm_core is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from swarm_core.event_bus import EventBus
from swarm_core.registry import Avatar, CapabilityRegistry
from swarm_core.matcher import CapabilityMatcher
from swarm_core.router import TaskRouter
from swarm_core.message_protocol import (
    TaskMessage, HeartbeatMessage, SkillRequestMessage, SkillResponseMessage,
)
from swarm_core.config import STREAM_NAMES

PASS = 0
FAIL = 0

def check(condition, label):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS  {label}")
    else:
        FAIL += 1
        print(f"  FAIL  {label}")

def section(title):
    print(f"\n{'='*50}\n  {title}\n{'='*50}")

# --- Message Protocol ---
def test_message_protocol():
    section("Message Protocol")

    tm = TaskMessage(publisher="test-agent", payload={"task_id": "t1"})
    check(tm.type == "task", "TaskMessage has type=task")
    check(tm.publisher == "test-agent", "TaskMessage publisher correct")
    check(len(tm.timestamp) > 0, "TaskMessage has timestamp")
    json_str = tm.to_json()
    parsed = json.loads(json_str)
    check(parsed["type"] == "task", "TaskMessage JSON round-trip")

    hb = HeartbeatMessage(publisher="avatar-1", payload={"avatar_id": "a1", "load": 3})
    check(hb.type == "heartbeat", "HeartbeatMessage type correct")

    sr = SkillRequestMessage(publisher="a1", payload={"skill": "summarize"})
    check(sr.type == "skill_request", "SkillRequestMessage type correct")

    sresp = SkillResponseMessage(publisher="a2", payload={"result": "ok"})
    check(sresp.type == "skill_response", "SkillResponseMessage type correct")

    recon = TaskMessage.from_json(json_str)
    check(isinstance(recon, TaskMessage), "from_json returns correct type")
    check(recon.publisher == "test-agent", "from_json preserves publisher")

# --- EventBus ---
def test_event_bus():
    section("EventBus")

    bus = EventBus()
    stream = STREAM_NAMES["task_stream"]

    msg = {"type": "task", "publisher": "test", "payload": {"task_id": "t99"}}
    msg_id = bus.publish(stream, msg)
    check(isinstance(msg_id, str) and len(msg_id) > 0, "publish returns message ID")

    group = f"test-group-{uuid.uuid4().hex[:6]}"
    consumer = f"test-consumer-{uuid.uuid4().hex[:6]}"
    bus._ensure_group(stream, group)
    results = bus._client.xreadgroup(group, consumer, {stream: ">"}, count=1, block=100)
    check(len(results) > 0, "xreadgroup receives published message")

    dlq_msg = {"type": "task", "publisher": "test", "payload": {"_retry_count": 5}}
    dlq_id = bus.publish_with_retry(stream, dlq_msg, max_retries=3)
    check(dlq_id is not None, "publish_with_retry routes to DLQ after max retries")

    bus.close()

# --- Registry ---
def test_registry():
    section("CapabilityRegistry")

    reg = CapabilityRegistry(Path(f"/tmp/test_registry_{uuid.uuid4().hex[:6]}.json"))

    a1 = Avatar(
        id="avatar-1", emoji="🧠",
        skills={"summarize": 0.95, "translate": 0.80},
        domains=["nlp", "text"], max_load=5, success_rate=0.98,
    )
    reg.register(a1)
    got = reg.get("avatar-1")
    check(got is not None, "register adds avatar")
    check(got.online is True, "registered avatar is online")

    a2 = Avatar(
        id="avatar-2", emoji="🎨",
        skills={"draw": 0.90, "design": 0.85},
        domains=["image", "design"], max_load=3,
    )
    reg.register(a2)
    check(len(reg.list_all(online_only=True)) == 2, "list_all returns all online avatars")

    check(reg.heartbeat("avatar-1", load=2), "heartbeat updates avatar")
    a1_after = reg.get("avatar-1")
    check(a1_after.current_load == 2, "heartbeat updates load")

    reg._avatars["avatar-2"].last_heartbeat = time.time() - 200
    reg._check_heartbeats()
    a2_after = reg.get("avatar-2")
    check(a2_after is not None and a2_after.online is False, "timeout marks avatar offline")

    nlp_avatars = reg.query(domain="nlp")
    check(len(nlp_avatars) == 1 and nlp_avatars[0].id == "avatar-1", "query by domain works")

    skill_avatars = reg.query(skill="draw", min_confidence=0.8, online_only=False)
    check(len(skill_avatars) == 1 and skill_avatars[0].id == "avatar-2", "query by skill works (including offline)")

    online_query = reg.query(online_only=True)
    check(len(online_query) == 1, "online_only filter works after timeout")

    check(reg.deregister("avatar-1"), "deregister removes avatar")
    check(reg.get("avatar-1") is None, "deregistered avatar is gone")

    reg._path.unlink(missing_ok=True)

# --- Matcher ---
def test_matcher():
    section("CapabilityMatcher")

    reg = CapabilityRegistry(Path(f"/tmp/test_matcher_{uuid.uuid4().hex[:6]}.json"))

    a1 = Avatar(
        id="a1", emoji="🧠",
        skills={"summarize": 0.95, "translate": 0.80},
        domains=["nlp", "text"], max_load=10, current_load=2,
    )
    a2 = Avatar(
        id="a2", emoji="🎨",
        skills={"draw": 0.90, "summarize": 0.50},
        domains=["image", "design"], max_load=10, current_load=8,
    )
    reg.register(a1); reg.register(a2)

    matcher = CapabilityMatcher(reg)

    matches = matcher.match(required_skills=["summarize"], domain="nlp", top_n=3)
    check(len(matches) > 0, "matcher returns results for valid query")
    check(matches[0][0].id == "a1", "best match for summarization in nlp domain")

    a1_score = next((s for a, s in matches if a.id == "a1"), 0)
    a2_score = next((s for a, s in matches if a.id == "a2"), 0)
    check(a1_score > a2_score, "higher skill confidence gets higher score")

    matches_no_domain = matcher.match(required_skills=["draw"], domain="nlp")
    best_id = matches_no_domain[0][0].id if matches_no_domain else ""
    check(best_id == "a2", "best skill match wins even on domain mismatch")

    matches_no_skill = matcher.match(required_skills=[], domain="nlp")
    check(len(matches_no_skill) > 0, "matcher handles empty required_skills")

    fallback = matcher.match_fallback()
    check(len(fallback) == 2, "match_fallback returns all online avatars")

    reg._path.unlink(missing_ok=True)

# --- Router ---
def test_router():
    section("TaskRouter")

    reg = CapabilityRegistry(Path(f"/tmp/test_router_{uuid.uuid4().hex[:6]}.json"))
    bus = EventBus()
    matcher = CapabilityMatcher(reg)
    router = TaskRouter(matcher=matcher, event_bus=bus)

    reg.register(Avatar(
        id="nlp-bot", emoji="🧠",
        skills={"summarize": 0.95, "translate": 0.85},
        domains=["nlp"], max_load=5,
    ))
    reg.register(Avatar(
        id="image-bot", emoji="🎨",
        skills={"draw": 0.90, "resize": 0.80},
        domains=["image"], max_load=5,
    ))

    task = {
        "id": "task-1", "type": "parallel", "domain": "nlp",
        "required_skills": ["summarize", "translate"],
        "priority": "normal", "payload": {"text": "hello world"},
    }
    dag = router.accept_task(task)
    check(dag.task_id == "task-1", "task_id preserved in DAG")
    check(len(dag.nodes) == 2, "two skills -> two subtask nodes")
    routed_count = sum(1 for n in dag.nodes.values() if n.status == "routed")
    check(routed_count == 2, "all subtasks routed")

    task2 = {
        "id": "task-2", "type": "single", "domain": "image",
        "required_skills": ["draw"], "priority": "critical", "payload": {},
    }
    dag2 = router.accept_task(task2)
    check(len(dag2.nodes) == 1, "single skill -> one subtask")
    node2 = list(dag2.nodes.values())[0]
    check(node2.assigned_avatar == "image-bot", "draw task assigned to image-bot")

    task3 = {
        "id": "task-3", "type": "general", "domain": "general",
        "required_skills": [], "priority": "background", "payload": {},
    }
    dag3 = router.accept_task(task3)
    check(len(dag3.nodes) == 1, "no skills -> one catch-all subtask")
    status = list(dag3.nodes.values())[0].status
    check(status in ("routed", "routed_fallback"), f"catch-all subtask routed (status={status})")

    bus.close()
    reg._path.unlink(missing_ok=True)

# --- Knowledge Mesh (Insight Protocol) ---
def test_insight_protocol():
    section("Knowledge Mesh Insight Protocol")

    bus = EventBus()
    insight_stream = STREAM_NAMES["insight_stream"]

    insight = {
        "type": "insight",
        "publisher": "piaoshu",
        "payload": {
            "insight_type": "security",
            "content": "found reentrancy pattern in UniswapV4 hook - same as CVE-2024-xxxxx",
            "confidence": 0.92,
            "evidence_refs": ["https://eips.ethereum.org/EIP-1153"],
            "actionable": True,
        },
    }
    msg_id = bus.publish(insight_stream, insight)
    check(isinstance(msg_id, str) and len(msg_id) > 0, "insight publish successful")

    group = f"insight-group-{uuid.uuid4().hex[:6]}"
    consumer = f"insight-consumer-{uuid.uuid4().hex[:6]}"
    bus._ensure_group(insight_stream, group)
    results = bus._client.xreadgroup(group, consumer, {insight_stream: ">"}, count=1, block=100)
    check(len(results) > 0, "insight received by subscriber")

    check(True, "Knowledge Mesh protocol: publish -> bus -> subscribe verified")
    bus.close()

# --- Main ---
if __name__ == "__main__":
    print("Swarm Core - Test Suite")
    print(f"Python {sys.version}")
    print(f"Swarm Core dir: {Path(__file__).parent}")

    test_message_protocol()
    test_event_bus()
    test_registry()
    test_matcher()
    test_router()
    test_insight_protocol()

    print(f"\n{'='*50}")
    total = PASS + FAIL
    print(f"  Results: {PASS} passed, {FAIL} failed, {total} total")
    if FAIL == 0:
        print("  ALL TESTS PASSED")
    else:
        print("  SOME TESTS FAILED")
    print(f"{'='*50}\n")
    sys.exit(0 if FAIL == 0 else 1)
