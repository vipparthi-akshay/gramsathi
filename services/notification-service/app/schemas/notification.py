import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class NotificationOut(BaseModel):
    id: uuid.UUID
    citizen_id: uuid.UUID
    type: str
    title: str
    body: str
    metadata: Optional[Dict[str, Any]] = None
    is_read: bool = False
    read_at: Optional[datetime] = None
    delivery_channel: str
    delivery_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationPreferenceOut(BaseModel):
    citizen_id: uuid.UUID
    in_app_enabled: bool = True
    sms_enabled: bool = False
    whatsapp_enabled: bool = False
    email_enabled: bool = False
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    muted_types: Optional[List[str]] = None

    model_config = {"from_attributes": True}


class NotificationPreferenceUpdate(BaseModel):
    in_app_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    email_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    muted_types: Optional[List[str]] = None


class NotificationSendRequest(BaseModel):
    citizen_id: uuid.UUID
    type: str = Field(
        ...,
        pattern=(
            r"^(application_update|scheme_alert|deadline_reminder|"
            r"payment_confirmation|grievance_update|welcome|system)$"
        ),
    )
    title: str = Field(..., max_length=500)
    body: str = Field(..., max_length=5000)
    metadata: Optional[Dict[str, Any]] = None
    delivery_channel: str = Field(default="in_app", pattern=r"^(in_app|sms|whatsapp|email|all)$")
    template_id: Optional[uuid.UUID] = None


class NotificationSendResponse(BaseModel):
    id: uuid.UUID
    delivery_status: str
    message: str = "Notification sent successfully"


class TemplateOut(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    title_template: str
    body_template: str
    variables: Optional[Dict[str, Any]] = None
    language: str
    channels: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TemplateCreate(BaseModel):
    name: str = Field(..., max_length=200)
    type: str = Field(
        ...,
        pattern=(
            r"^(application_update|scheme_alert|deadline_reminder|"
            r"payment_confirmation|grievance_update|welcome|system)$"
        ),
    )
    title_template: str = Field(..., max_length=500)
    body_template: str = Field(..., max_length=5000)
    variables: Optional[Dict[str, Any]] = None
    language: str = "en"
    channels: Optional[Dict[str, Any]] = None


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    title_template: Optional[str] = Field(None, max_length=500)
    body_template: Optional[str] = Field(None, max_length=5000)
    variables: Optional[Dict[str, Any]] = None
    language: Optional[str] = None
    channels: Optional[Dict[str, Any]] = None


class BulkSendRequest(BaseModel):
    citizen_ids: List[uuid.UUID]
    type: str
    title: str = Field(..., max_length=500)
    body: str = Field(..., max_length=5000)
    metadata: Optional[Dict[str, Any]] = None
