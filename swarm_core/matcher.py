"""Capability Matcher - scores avatars against task requirements."""
from __future__ import annotations

from swarm_core.registry import Avatar, CapabilityRegistry


class CapabilityMatcher:
    """Weighted scoring matcher for routing tasks to avatars.

    Scoring weights:
        skill_match   = 60%
        domain_match  = 25%
        load_balance  = 15%
    """

    SKILL_WEIGHT = 0.60
    DOMAIN_WEIGHT = 0.25
    LOAD_WEIGHT = 0.15

    def __init__(self, registry: CapabilityRegistry) -> None:
        self._registry = registry

    def match(
        self,
        required_skills: list[str],
        domain: str | None = None,
        online_only: bool = True,
        top_n: int = 3,
    ) -> list[tuple[Avatar, float]]:
        """Score all eligible avatars and return top-N with scores."""
        candidates = self._registry.list_all(online_only=online_only)
        if not candidates:
            return []

        scored: list[tuple[Avatar, float]] = []
        for avatar in candidates:
            score = self._score(avatar, required_skills, domain)
            if score > 0:
                scored.append((avatar, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_n]

    def _score(
        self, avatar: Avatar,
        required_skills: list[str],
        domain: str | None
    ) -> float:
        """Compute a 0.0-1.0 match score for an avatar."""
        if not required_skills:
            skill_score = 0.5
        else:
            skill_scores: list[float] = []
            for skill in required_skills:
                skill_scores.append(avatar.skills.get(skill, 0.0))
            skill_score = sum(skill_scores) / max(len(skill_scores), 1)

        if domain is None:
            domain_score = 1.0
        elif domain in avatar.domains:
            domain_score = 1.0
        else:
            domain_score = 0.0

        max_load = max(avatar.max_load, 1)
        load_ratio = avatar.current_load / max_load
        load_score = max(0.0, 1.0 - load_ratio)

        total = (
            self.SKILL_WEIGHT * skill_score
            + self.DOMAIN_WEIGHT * domain_score
            + self.LOAD_WEIGHT * load_score
        )
        return round(total, 4)

    def match_fallback(self) -> list[tuple[Avatar, float]]:
        """Return ALL online avatars with equal scores as a fallback."""
        avatars = self._registry.list_all(online_only=True)
        return [(a, 0.5) for a in avatars]
