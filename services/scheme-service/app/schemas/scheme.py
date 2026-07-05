from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    category: str
    count: int


class SchemeOut(BaseModel):
    id: UUID
    name: str
    name_hindi: Optional[str] = None
    name_local: Optional[str] = None
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    category: str
    ministry: Optional[str] = None
    state_specific: Optional[str] = None
    eligibility_criteria: Dict[str, Any] = {}
    benefits: Dict[str, Any] = {}
    required_documents: List[Dict[str, Any]] = []
    application_start: Optional[date] = None
    application_end: Optional[date] = None
    is_active: bool = True
    scheme_url: Optional[str] = None
    cpgrams_code: Optional[str] = None
    tags: List[str] = []
    match_keywords: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SchemeCreate(BaseModel):
    name: str = Field(..., max_length=300)
    name_hindi: Optional[str] = Field(None, max_length=300)
    name_local: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    category: str = Field(..., max_length=100)
    ministry: Optional[str] = Field(None, max_length=200)
    state_specific: Optional[str] = Field(None, max_length=100)
    eligibility_criteria: Dict[str, Any] = {}
    benefits: Dict[str, Any] = {}
    required_documents: List[Dict[str, Any]] = []
    application_start: Optional[date] = None
    application_end: Optional[date] = None
    is_active: bool = True
    scheme_url: Optional[str] = Field(None, max_length=500)
    cpgrams_code: Optional[str] = Field(None, max_length=50)
    tags: List[str] = []
    match_keywords: Dict[str, Any] = {}


class SchemeUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=300)
    name_hindi: Optional[str] = Field(None, max_length=300)
    name_local: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    ministry: Optional[str] = Field(None, max_length=200)
    state_specific: Optional[str] = Field(None, max_length=100)
    eligibility_criteria: Optional[Dict[str, Any]] = None
    benefits: Optional[Dict[str, Any]] = None
    required_documents: Optional[List[Dict[str, Any]]] = None
    application_start: Optional[date] = None
    application_end: Optional[date] = None
    is_active: Optional[bool] = None
    scheme_url: Optional[str] = Field(None, max_length=500)
    cpgrams_code: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    match_keywords: Optional[Dict[str, Any]] = None


class SchemeMatch(BaseModel):
    scheme: SchemeOut
    match_score: float = Field(..., ge=0, le=1)
    explanation: str = ""


class EligibilityCheckRequest(BaseModel):
    citizen_id: UUID
    scheme_id: UUID


class EligibilityCheckResult(BaseModel):
    eligible: bool
    score: float
    breakdown: Dict[str, Any] = {}
    missing_requirements: List[str] = []
