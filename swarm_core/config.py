"""Swarm Core configuration constants.

Centralizes all configurable paths, stream names, and retry parameters.
"""
import os
from pathlib import Path

# Base directory for Swarm Core data
SWARM_CORE_DIR = Path(os.environ.get(
    "SWARM_CORE_DIR",
    Path.home() / "AppData" / "Local" / "hermes" / "swarm_core"
))
SWARM_CORE_DIR.mkdir(parents=True, exist_ok=True)

# Registry persistence
REGISTRY_PATH = SWARM_CORE_DIR / "registry.json"

# Redis stream names (used by EventBus)
STREAM_NAMES: dict[str, str] = {
    "task_stream": "swarm:task_stream",
    "insight_stream": "swarm:insight_stream",
    "heartbeat_stream": "swarm:heartbeat_stream",
    "skill_request_stream": "swarm:skill_request_stream",
    "dead_letter_stream": "swarm:dead_letter_stream",
}

# Retry / DLQ configuration
RETRY_CONFIG: dict[str, int] = {
    "max_retries": 3,
    "heartbeat_timeout_seconds": 120,
    "consumer_block_ms": 5000,
    "consumer_count": 1,
}

# Priority levels used in task routing
PRIORITY_LEVELS: tuple[str, str, str] = ("critical", "normal", "background")
