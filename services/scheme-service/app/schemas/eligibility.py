from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EligibilityRequest(BaseModel):
    citizen_id: UUID
    scheme_id: UUID


class EligibilityResponse(BaseModel):
    eligible: bool
    score: float = Field(..., ge=0, le=1)
    breakdown: Dict[str, Any] = {}
    missing_requirements: List[str] = []


class BatchEligibilityRequest(BaseModel):
    citizen_id: UUID
    scheme_ids: List[UUID] = Field(..., min_length=1, max_length=50)


class BatchEligibilityResponse(BaseModel):
    results: List[EligibilityResponse]


class CriteriaExplanationRequest(BaseModel):
    scheme_id: UUID
    language: str = "en"
