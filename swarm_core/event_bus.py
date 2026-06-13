"""Swarm Event Bus - Pub/sub over Redis Streams (fakeredis fallback).

Wraps Redis Streams with Consumer Groups for reliable message delivery.
Supports Dead Letter Stream after max_retries exhausted.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Generator

try:
    import redis as _redis
    _HAS_REDIS = True
except ImportError:
    _HAS_REDIS = False

try:
    import fakeredis
    _HAS_FAKEREDIS = True
except ImportError:
    _HAS_FAKEREDIS = False

from swarm_core.config import RETRY_CONFIG, STREAM_NAMES


class EventBus:
    """Publish/subscribe event bus backed by Redis Streams.

    Automatically falls back to fakeredis (in-memory) when no real Redis
    connection is available. Consumer groups are created on first subscribe.
    """

    def __init__(self, redis_url: str | None = None) -> None:
        self._client: Any = None
        self._consumer_id: str = f"consumer-{uuid.uuid4().hex[:8]}"

        if redis_url and _HAS_REDIS:
            try:
                self._client = _redis.Redis.from_url(redis_url, decode_responses=True)
                self._client.ping()
            except Exception:
                self._client = None

        if self._client is None:
            if _HAS_FAKEREDIS:
                self._client = fakeredis.FakeRedis(decode_responses=True)
            elif _HAS_REDIS:
                self._client = _redis.Redis(decode_responses=True)
            else:
                raise RuntimeError(
                    "No Redis driver available. Install 'redis' or 'fakeredis'."
                )

    def publish(self, stream: str, message: dict[str, Any]) -> str:
        """Publish a message dict to a Redis stream."""
        fields: dict[str, str] = {
            "type": str(message.get("type", "unknown")),
            "publisher": str(message.get("publisher", "unknown")),
            "timestamp": str(message.get(
                "timestamp", datetime.now(timezone.utc).isoformat()
            )),
            "payload": json.dumps(message.get("payload", {})),
        }
        return self._client.xadd(stream, fields)

    def subscribe(
        self, stream: str, group: str, consumer: str | None = None
    ) -> Generator[dict[str, Any], None, None]:
        """Subscribe to a stream as part of a consumer group."""
        consumer = consumer or self._consumer_id
        self._ensure_group(stream, group)

        while True:
            results = self._client.xreadgroup(
                group, consumer, {stream: ">"},
                block=RETRY_CONFIG["consumer_block_ms"], count=1
            )
            if not results:
                continue

            for _stream_name, messages in results:
                for msg_id, fields in messages:
                    try:
                        payload = json.loads(fields.get("payload", "{}"))
                    except (json.JSONDecodeError, TypeError):
                        payload = {}

                    decoded: dict[str, Any] = {
                        "id": msg_id,
                        "type": fields.get("type", "unknown"),
                        "publisher": fields.get("publisher", "unknown"),
                        "timestamp": fields.get("timestamp", ""),
                        "payload": payload,
                    }
                    yield decoded
                    self._client.xack(stream, group, msg_id)

    def publish_with_retry(
        self, stream: str, message: dict[str, Any],
        max_retries: int | None = None
    ) -> str | None:
        """Publish with dead-letter stream routing after max retries."""
        max_retries = max_retries if max_retries is not None else RETRY_CONFIG["max_retries"]
        retry_count = message.get("payload", {}).get("_retry_count", 0)

        if retry_count >= max_retries:
            dlq_stream = STREAM_NAMES.get(
                "dead_letter_stream", "swarm:dead_letter_stream"
            )
            message.setdefault("payload", {})["_dlq_reason"] = "max_retries_exceeded"
            return self.publish(dlq_stream, message)

        message.setdefault("payload", {})["_retry_count"] = retry_count + 1
        return self.publish(stream, message)

    def _ensure_group(self, stream: str, group: str) -> None:
        """Create the consumer group if it doesn't already exist."""
        try:
            self._client.xgroup_create(stream, group, id="0", mkstream=True)
        except Exception:
            pass

    def close(self) -> None:
        """Close the underlying Redis connection."""
        try:
            self._client.close()
        except Exception:
            pass
