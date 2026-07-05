import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import redis.asyncio as aioredis

from app.config import settings


class ConversationContext:
    def __init__(
        self,
        conversation_id: str,
        citizen_id: str,
        language: str = "hi",
        dialect: Optional[str] = None,
    ):
        self.conversation_id = conversation_id
        self.citizen_id = citizen_id
        self.language = language
        self.dialect = dialect
        self.messages: List[Dict[str, Any]] = []
        self.detected_intents: List[str] = []
        self.extracted_entities: Dict[str, Any] = {}
        self.citizen_profile_ref: Optional[str] = None
        self.started_at = datetime.now(timezone.utc)
        self.ended_at: Optional[datetime] = None
        self.metadata: Dict[str, Any] = {}

    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
        })

    def get_recent_messages(self, count: int = 10) -> List[Dict[str, Any]]:
        return self.messages[-count:]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "conversation_id": self.conversation_id,
            "citizen_id": self.citizen_id,
            "language": self.language,
            "dialect": self.dialect,
            "messages": self.messages,
            "detected_intents": self.detected_intents,
            "extracted_entities": self.extracted_entities,
            "citizen_profile_ref": self.citizen_profile_ref,
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationContext":
        ctx = cls(
            conversation_id=data["conversation_id"],
            citizen_id=data["citizen_id"],
            language=data.get("language", "hi"),
            dialect=data.get("dialect"),
        )
        ctx.messages = data.get("messages", [])
        ctx.detected_intents = data.get("detected_intents", [])
        ctx.extracted_entities = data.get("extracted_entities", {})
        ctx.citizen_profile_ref = data.get("citizen_profile_ref")
        if data.get("started_at"):
            ctx.started_at = datetime.fromisoformat(data["started_at"])
        if data.get("ended_at"):
            ctx.ended_at = datetime.fromisoformat(data["ended_at"])
        ctx.metadata = data.get("metadata", {})
        return ctx

    @property
    def message_count(self) -> int:
        return len(self.messages)

    @property
    def summary(self) -> Optional[str]:
        return self.metadata.get("summary")


class ConversationContextManager:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._local_cache: Dict[str, ConversationContext] = {}

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
            )
        return self._redis

    async def get_context(self, conversation_id: str) -> Optional[ConversationContext]:
        try:
            redis = await self._get_redis()
            data = await redis.get(f"conversation:{conversation_id}")
            if data:
                return ConversationContext.from_dict(json.loads(data))
        except (aioredis.ConnectionError, aioredis.TimeoutError, Exception):
            pass

        return self._local_cache.get(conversation_id)

    async def create_context(
        self,
        citizen_id: str,
        language: str = "hi",
        dialect: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> ConversationContext:
        cid = conversation_id or f"conv-{uuid.uuid4().hex[:16]}"
        ctx = ConversationContext(
            conversation_id=cid,
            citizen_id=citizen_id,
            language=language,
            dialect=dialect,
        )
        await self._save_context(ctx)
        return ctx

    async def update_context(
        self,
        conversation_id: str,
        message: str,
        response: str,
        intent: Optional[str] = None,
        entities: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict] = None,
    ):
        ctx = await self.get_context(conversation_id)
        if not ctx:
            return

        ctx.add_message("user", message, metadata=metadata)
        ctx.add_message("assistant", response, metadata={"intent": intent})

        if intent and intent not in ctx.detected_intents:
            ctx.detected_intents.append(intent)

        if entities:
            ctx.extracted_entities.update(entities)

        ctx.metadata["last_activity"] = datetime.now(timezone.utc).isoformat()

        await self._save_context(ctx)

    async def _save_context(self, ctx: ConversationContext):
        self._local_cache[ctx.conversation_id] = ctx

        try:
            redis = await self._get_redis()
            await redis.setex(
                f"conversation:{ctx.conversation_id}",
                86400 * 7,
                json.dumps(ctx.to_dict(), ensure_ascii=False, default=str),
            )
        except (aioredis.ConnectionError, aioredis.TimeoutError, Exception):
            pass

    async def save_conversation_summary(self, conversation_id: str):
        from app.models.gemini_client import GeminiClient

        ctx = await self.get_context(conversation_id)
        if not ctx or not ctx.messages:
            return

        gemini = GeminiClient()
        messages_for_summary = [
            {"role": m["role"], "content": m["content"]}
            for m in ctx.messages
        ]
        summary = gemini.summarize_conversation(messages_for_summary)
        ctx.metadata["summary"] = summary
        ctx.ended_at = datetime.now(timezone.utc)
        await self._save_context(ctx)

    async def clear_context(self, conversation_id: str):
        self._local_cache.pop(conversation_id, None)

        try:
            redis = await self._get_redis()
            await redis.delete(f"conversation:{conversation_id}")
        except Exception:
            pass

    async def list_conversations(
        self,
        citizen_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        all_convs = []

        try:
            redis = await self._get_redis()
            cursor = 0
            pattern = "conversation:*"
            while True:
                cursor, keys = await redis.scan(cursor, match=pattern, count=100)
                for key in keys:
                    data = await redis.get(key)
                    if data:
                        ctx = ConversationContext.from_dict(json.loads(data))
                        if ctx.citizen_id == citizen_id:
                            all_convs.append(ctx)
                if cursor == 0:
                    break
        except Exception:
            all_convs = [
                ctx for ctx in self._local_cache.values()
                if ctx.citizen_id == citizen_id
            ]

        all_convs.sort(key=lambda c: c.started_at, reverse=True)

        total = len(all_convs)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = all_convs[start:end]

        items = []
        for ctx in page_items:
            items.append({
                "id": ctx.conversation_id,
                "citizen_id": ctx.citizen_id,
                "language": ctx.language,
                "dialect": ctx.dialect,
                "summary": ctx.metadata.get("summary"),
                "message_count": ctx.message_count,
                "started_at": ctx.started_at,
                "ended_at": ctx.ended_at,
            })

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }
