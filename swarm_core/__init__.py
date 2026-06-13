"""Swarm Core - Multi-Agent Capability Routing & Event Bus Library.

Provides:
- EventBus: Redis Streams-based pub/sub (fakeredis fallback)
- Registry: JSON file-backed avatar capability registry
- Matcher: Weighted scoring capability matcher
- Router: Task decomposition and routing to avatars
- Message Protocol: Pydantic message schemas
"""

from swarm_core.event_bus import EventBus
from swarm_core.registry import CapabilityRegistry, Avatar
from swarm_core.matcher import CapabilityMatcher
from swarm_core.router import TaskRouter
from swarm_core.message_protocol import (
    TaskMessage,
    InsightMessage,
    HeartbeatMessage,
    SkillRequestMessage,
    SkillResponseMessage,
)
from swarm_core.config import (
    SWARM_CORE_DIR,
    REGISTRY_PATH,
    STREAM_NAMES,
    RETRY_CONFIG,
)

__version__ = "1.0.0"
__all__ = [
    "EventBus",
    "CapabilityRegistry",
    "Avatar",
    "CapabilityMatcher",
    "TaskRouter",
    "TaskMessage",
    "InsightMessage",
    "HeartbeatMessage",
    "SkillRequestMessage",
    "SkillResponseMessage",
    "SWARM_CORE_DIR",
    "REGISTRY_PATH",
    "STREAM_NAMES",
    "RETRY_CONFIG",
]
