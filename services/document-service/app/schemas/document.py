import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class OCRResult(BaseModel):
    raw_text: str = ""
    extracted_fields: Dict[str, Any] = {}
    confidence: float = 0.0
    document_type: str = ""
    processor_used: str = ""


class DocumentOut(BaseModel):
    id: uuid.UUID
    citizen_id: uuid.UUID
    document_type: str
    original_filename: str
    storage_path: str
    file_size: int
    mime_type: Optional[str] = None
    ocr_extracted_data: Optional[Dict[str, Any]] = None
    ocr_confidence: Optional[float] = None
    ocr_processed_at: Optional[datetime] = None
    verification_status: str
    verified_by: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    id: uuid.UUID
    filename: str
    document_type: str
    file_size: int
    ocr_result: Optional[OCRResult] = None
    message: str = "Document uploaded successfully"


class DocumentList(BaseModel):
    documents: List[DocumentOut]
    total: int
    page: int = 1
    page_size: int = 20


class DocumentVerifyRequest(BaseModel):
    status: str = Field(..., pattern="^(verified|rejected|needs_review)$")
    notes: Optional[str] = None
    verified_by: str


class AutoFillRequest(BaseModel):
    citizen_id: uuid.UUID
    form_fields: List[str] = Field(..., description="List of field names needed")
    document_types: Optional[List[str]] = None


class AutoFillResponse(BaseModel):
    filled_data: Dict[str, Any]
    missing_fields: List[str] = []
    confidence_score: float = 0.0
