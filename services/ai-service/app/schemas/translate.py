from typing import Optional

from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8192)
    source_language: Optional[str] = Field(default=None, pattern=r"^[a-z]{2}(-[A-Z]{2})?$|^$")
    target_language: str = Field(..., pattern=r"^[a-z]{2}(-[A-Z]{2})?$")


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: Optional[str] = None
    target_language: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class DetectRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)


class DetectResponse(BaseModel):
    language: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    dialect: Optional[str] = None
