from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OTPSendRequest(BaseModel):
    mobile_number: str = Field(
        ..., pattern=r"^\+?[1-9]\d{9,14}$", description="Mobile number with country code"
    )


class OTPSendResponse(BaseModel):
    success: bool
    message: str
    expires_in: int
    debug_otp: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    mobile_number: str = Field(
        ..., pattern=r"^\+?[1-9]\d{9,14}$"
    )
    otp: str = Field(..., min_length=4, max_length=8)


class UserOut(BaseModel):
    id: UUID
    mobile_number: str
    name: Optional[str] = None
    role: str
    is_verified: bool
    preferred_language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OTPVerifyResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    expires_in: int


class LogoutRequest(BaseModel):
    refresh_token: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    preferred_language: Optional[str] = Field(None, max_length=10)
    role: Optional[str] = Field(None, pattern=r"^(citizen|admin|super_admin)$")
    is_active: Optional[bool] = None


class PaginatedUsers(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    page_size: int
    total_pages: int
