from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FamilyMemberOut(BaseModel):
    id: UUID
    name: str
    relation: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    aadhaar_hash: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FamilyMemberCreate(BaseModel):
    name: str = Field(..., max_length=200)
    relation: str = Field(..., max_length=50)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    aadhaar_hash: Optional[str] = Field(None, max_length=64)


class CitizenOut(BaseModel):
    id: UUID
    user_id: UUID
    aadhaar_hash: Optional[str] = None
    mobile_number: Optional[str] = None
    name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    caste_category: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    pin_code: Optional[str] = None
    annual_income: Optional[Decimal] = None
    is_farmer: bool = False
    has_disability: bool = False
    disability_type: Optional[str] = None
    education_level: Optional[str] = None
    occupation: Optional[str] = None
    preferred_language: Optional[str] = None
    preferred_dialect: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CitizenUpdate(BaseModel):
    aadhaar_hash: Optional[str] = Field(None, max_length=64)
    mobile_number: Optional[str] = Field(None, max_length=15)
    name: Optional[str] = Field(None, max_length=200)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=20)
    caste_category: Optional[str] = Field(None, max_length=50)
    state: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    block: Optional[str] = Field(None, max_length=100)
    village: Optional[str] = Field(None, max_length=100)
    pin_code: Optional[str] = Field(None, max_length=10)
    annual_income: Optional[Decimal] = None
    is_farmer: Optional[bool] = None
    has_disability: Optional[bool] = None
    disability_type: Optional[str] = Field(None, max_length=100)
    education_level: Optional[str] = Field(None, max_length=100)
    occupation: Optional[str] = Field(None, max_length=200)
    preferred_language: Optional[str] = Field(None, max_length=10)
    preferred_dialect: Optional[str] = Field(None, max_length=50)


class CitizenSummary(BaseModel):
    profile: CitizenOut
    active_applications_count: int = 0
    pending_documents_count: int = 0
