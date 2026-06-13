"""Capability Registry - JSON file-backed avatar registry with heartbeat tracking."""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

from swarm_core.config import REGISTRY_PATH, RETRY_CONFIG


@dataclass
class Avatar:
    """An avatar (agent) registered in the swarm."""
    id: str
    emoji: str = "\U0001f916"
    skills: dict[str, float] = field(default_factory=dict)
    current_load: int = 0
    max_load: int = 10
    success_rate: float = 1.0
    domains: list[str] = field(default_factory=list)
    last_heartbeat: float = field(default_factory=time.time)
    online: bool = True
    public_key: str = ""


class CapabilityRegistry:
    """JSON file-backed registry of swarm avatars and their capabilities."""

    def __init__(self, path: Path | None = None) -> None:
        self._path = path or REGISTRY_PATH
        self._avatars: dict[str, Avatar] = {}
        self._load()

    def register(self, avatar: Avatar) -> None:
        """Register (or update) an avatar in the registry."""
        avatar.last_heartbeat = time.time()
        avatar.online = True
        self._avatars[avatar.id] = avatar
        self._save()

    def deregister(self, avatar_id: str) -> bool:
        """Remove an avatar from the registry."""
        if avatar_id in self._avatars:
            del self._avatars[avatar_id]
            self._save()
            return True
        return False

    def get(self, avatar_id: str) -> Avatar | None:
        """Retrieve a single avatar by ID."""
        self._check_heartbeats()
        return self._avatars.get(avatar_id)

    def list_all(self, online_only: bool = False) -> list[Avatar]:
        """List all registered avatars."""
        self._check_heartbeats()
        if online_only:
            return [a for a in self._avatars.values() if a.online]
        return list(self._avatars.values())

    def heartbeat(
        self, avatar_id: str,
        load: int | None = None,
        success_rate: float | None = None
    ) -> bool:
        """Update the heartbeat timestamp for an avatar."""
        avatar = self._avatars.get(avatar_id)
        if avatar is None:
            return False
        avatar.last_heartbeat = time.time()
        avatar.online = True
        if load is not None:
            avatar.current_load = load
        if success_rate is not None:
            avatar.success_rate = success_rate
        self._save()
        return True

    def _check_heartbeats(self) -> None:
        """Mark avatars offline if heartbeat timeout exceeded."""
        now = time.time()
        timeout = RETRY_CONFIG["heartbeat_timeout_seconds"]
        changed = False
        for avatar in self._avatars.values():
            if avatar.online and (now - avatar.last_heartbeat) > timeout:
                avatar.online = False
                changed = True
        if changed:
            self._save()

    def query(
        self,
        domain: str | None = None,
        skill: str | None = None,
        online_only: bool = True,
        min_confidence: float = 0.0,
    ) -> list[Avatar]:
        """Query avatars by domain, skill, and online status."""
        self._check_heartbeats()
        results: list[Avatar] = []
        for avatar in self._avatars.values():
            if online_only and not avatar.online:
                continue
            if domain and domain not in avatar.domains:
                continue
            if skill and avatar.skills.get(skill, 0.0) < min_confidence:
                continue
            results.append(avatar)
        return results

    def _load(self) -> None:
        """Load registry from JSON file."""
        if not self._path.exists():
            return
        try:
            data = json.loads(self._path.read_text(encoding="utf-8"))
            for avatar_data in data.get("avatars", []):
                avatar = Avatar(**avatar_data)
                avatar.online = False
                self._avatars[avatar.id] = avatar
        except (json.JSONDecodeError, TypeError):
            pass

    def _save(self) -> None:
        """Persist registry to JSON file."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        data = {"avatars": [asdict(a) for a in self._avatars.values()]}
        self._path.write_text(
            json.dumps(data, indent=2, default=str), encoding="utf-8"
        )
