from typing import List, Optional

from pydantic import BaseModel, Field


class VoiceStartRequest(BaseModel):
    language: str = Field(default="hi", pattern=r"^[a-z]{2}(-[A-Z]{2})?$")
    dialect: Optional[str] = None
    citizen_id: str = Field(..., min_length=1)


class VoiceStartResponse(BaseModel):
    session_id: str
    expires_in: int = 300


class VoiceChunkRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    audio_base64: str = Field(..., min_length=1)
    encoding: str = Field(default="LINEAR16", pattern=r"^(LINEAR16|MULAW|FLAC)$")
    sample_rate: int = Field(default=16000, ge=8000, le=48000)


class VoiceChunkResponse(BaseModel):
    transcript: str
    audio_response_base64: Optional[str] = None
    is_final: bool = False
    suggested_actions: List[str] = []


class VoiceEndResponse(BaseModel):
    session_id: str
    duration: int
    message_count: int
    summary: str
