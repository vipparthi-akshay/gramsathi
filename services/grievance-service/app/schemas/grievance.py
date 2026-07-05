import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GrievanceOut(BaseModel):
    id: uuid.UUID
    citizen_id: uuid.UUID
    category: str
    department: Optional[str] = None
    subject: str
    description: str
    ai_drafted_complaint: Optional[str] = None
    original_language: str
    status: str
    priority: str
    cpgrams_ref: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GrievanceCreate(BaseModel):
    citizen_id: uuid.UUID
    category: str = Field(..., pattern="^(scheme_related|document_issue|payment_delay|staff_behavior|technical|other)$")
    department: Optional[str] = None
    subject: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=20)
    original_language: str = Field(default="en", max_length=10)
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")


class GrievanceUpdate(BaseModel):
    category: Optional[str] = Field(
        None, pattern=r"^(scheme_related|document_issue|payment_delay|staff_behavior|technical|other)$"
    )
    department: Optional[str] = None
    subject: Optional[str] = Field(None, min_length=10, max_length=500)
    description: Optional[str] = Field(None, min_length=20)
    status: Optional[str] = Field(None, pattern="^(draft|submitted|under_review|escalated|resolved|closed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|critical)$")
    assigned_to: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None


class GrievanceDraftRequest(BaseModel):
    description: str = Field(..., min_length=20)
    category: Optional[str] = None
    original_language: str = Field(default="en", max_length=10)


class GrievanceDraftResponse(BaseModel):
    drafted_complaint: str
    category: str
    department: str
    subject: str
    priority: str


class ComplaintTrackingOut(BaseModel):
    id: uuid.UUID
    grievance_id: uuid.UUID
    action: str
    action_by: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
