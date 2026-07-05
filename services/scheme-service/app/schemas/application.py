from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ApplicationOut(BaseModel):
    id: UUID
    citizen_id: UUID
    scheme_id: UUID
    status: str
    form_data: Dict[str, Any] = {}
    documents_submitted: List[Dict[str, Any]] = []
    ai_prefill_session_id: Optional[str] = None
    government_ref_id: Optional[str] = None
    rejection_reason: Optional[str] = None
    ai_summary: Optional[str] = None
    processed_by: Optional[UUID] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    citizen_id: UUID
    scheme_id: UUID
    form_data: Dict[str, Any] = {}
    documents_submitted: List[Dict[str, Any]] = []


class ApplicationUpdate(BaseModel):
    form_data: Optional[Dict[str, Any]] = None
    documents_submitted: Optional[List[Dict[str, Any]]] = None


class ApplicationSubmit(BaseModel):
    pass


class ApplicationReview(BaseModel):
    ai_summary: Optional[str] = Field(None, max_length=2000)


class ApplicationApprove(BaseModel):
    government_ref_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class ApplicationReject(BaseModel):
    rejection_reason: str = Field(..., min_length=1, max_length=2000)


class BulkApproveRequest(BaseModel):
    application_ids: List[UUID] = Field(..., min_length=1, max_length=100)
    government_ref_id: Optional[str] = None
