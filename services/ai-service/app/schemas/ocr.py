from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class OCRField(BaseModel):
    name: str
    value: Any
    confidence: float = Field(..., ge=0.0, le=1.0)
    is_valid: bool = True


class OCRFlag(BaseModel):
    field: str
    severity: str = Field(default="warning", pattern=r"^(info|warning|error|critical)$")
    message: str


class OCRProcessRequest(BaseModel):
    image_base64: str = Field(..., min_length=1)
    document_type: str = Field(default="general", min_length=1)
    citizen_id: str = Field(..., min_length=1)
    document_id: Optional[str] = None


class OCRProcessResponse(BaseModel):
    document_type: str
    extracted_fields: Dict[str, OCRField]
    overall_confidence: float = Field(..., ge=0.0, le=1.0)
    needs_review: bool = False
    flags: List[OCRFlag] = []


class OCRAnalyzeRequest(BaseModel):
    ocr_data: Dict[str, Any]
    document_type: str = Field(..., min_length=1)
    purpose: str = Field(..., min_length=1)


class OCRAnalyzeResponse(BaseModel):
    analysis: str
    flags: List[OCRFlag] = []
    suggestions: List[str] = []
    overall_confidence: float = Field(..., ge=0.0, le=1.0)
