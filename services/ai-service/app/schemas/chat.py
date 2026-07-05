from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)
    conversation_id: Optional[str] = None
    language: str = Field(default="hi", pattern=r"^[a-z]{2}(-[A-Z]{2})?$")
    dialect: Optional[str] = None
    citizen_id: str = Field(..., min_length=1)


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    suggested_replies: List[str] = []
    schemes: Optional[List[Dict[str, Any]]] = None
    intent: str


class ConversationOut(BaseModel):
    id: str
    citizen_id: str
    language: str
    dialect: Optional[str] = None
    summary: Optional[str] = None
    message_count: int = 0
    started_at: datetime
    ended_at: Optional[datetime] = None


class ConversationListOut(BaseModel):
    items: List[ConversationOut]
    total: int
    page: int
    page_size: int
