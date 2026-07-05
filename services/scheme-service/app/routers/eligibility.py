from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheme import Scheme
from app.schemas.eligibility import (
    BatchEligibilityRequest,
    BatchEligibilityResponse,
    EligibilityRequest,
    EligibilityResponse,
)
from app.utils.dependencies import get_current_user, get_db_session
from app.utils.eligibility_engine import CitizenProfile, EligibilityEngine

router = APIRouter(prefix="/eligibility", tags=["eligibility"])


async def _fetch_citizen_profile(citizen_id: UUID) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"http://citizen-service:8000/api/v1/citizens/{citizen_id}",
                timeout=10.0,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Citizen not found")
            return resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Citizen service unavailable")


def _build_citizen_profile(data: dict) -> CitizenProfile:
    return CitizenProfile(
        id=data["id"],
        date_of_birth=data.get("date_of_birth"),
        gender=data.get("gender"),
        state=data.get("state"),
        district=data.get("district"),
        caste_category=data.get("caste_category"),
        annual_income=data.get("annual_income"),
        occupation=data.get("occupation"),
        is_farmer=data.get("is_farmer", False),
        has_disability=data.get("has_disability", False),
        disability_type=data.get("disability_type"),
        education_level=data.get("education_level"),
        is_bpl=data.get("annual_income", 0) < 50000 if data.get("annual_income") else False,
    )


@router.post("/check", response_model=EligibilityResponse)
async def check_eligibility(
    request: EligibilityRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(Scheme.id == request.scheme_id, Scheme.is_deleted.is_(False))
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    citizen_data = await _fetch_citizen_profile(request.citizen_id)
    profile = _build_citizen_profile(citizen_data)

    engine = EligibilityEngine()
    eligibility_result = engine.check_eligibility(profile, scheme)

    return EligibilityResponse(
        eligible=eligibility_result.eligible,
        score=eligibility_result.score,
        breakdown=eligibility_result.breakdown,
        missing_requirements=eligibility_result.missing_requirements,
    )


@router.post("/batch", response_model=BatchEligibilityResponse)
async def batch_check_eligibility(
    request: BatchEligibilityRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(
            Scheme.id.in_(request.scheme_ids),
            Scheme.is_deleted.is_(False),
        )
    )
    schemes = result.scalars().all()

    if not schemes:
        raise HTTPException(status_code=404, detail="No schemes found")

    citizen_data = await _fetch_citizen_profile(request.citizen_id)
    profile = _build_citizen_profile(citizen_data)

    engine = EligibilityEngine()
    results = engine.batch_check(profile, list(schemes))

    return BatchEligibilityResponse(
        results=[
            EligibilityResponse(
                eligible=r.eligible,
                score=r.score,
                breakdown=r.breakdown,
                missing_requirements=r.missing_requirements,
            )
            for r in results
        ]
    )


@router.get("/criteria/{scheme_id}", response_model=dict)
async def get_criteria_explanation(
    scheme_id: UUID,
    language: str = Query("en", max_length=10),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id, Scheme.is_deleted.is_(False))
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    criteria = scheme.eligibility_criteria or {}
    name = scheme.name_hindi or scheme.name if language == "hi" else scheme.name
    description = (
        scheme.description_hindi or scheme.description
        if language == "hi"
        else scheme.description
    )

    explanation_parts = []
    for key, value in criteria.items():
        if isinstance(value, dict):
            parts = [f"{k}: {v}" for k, v in value.items()]
            explanation_parts.append({"criterion": key, "details": parts, "raw": value})
        elif isinstance(value, list):
            explanation_parts.append({"criterion": key, "details": value, "raw": value})
        else:
            explanation_parts.append({"criterion": key, "details": [str(value)], "raw": value})

    return {
        "scheme_id": str(scheme.id),
        "scheme_name": name,
        "description": description,
        "category": scheme.category,
        "ministry": scheme.ministry,
        "state_specific": scheme.state_specific,
        "criteria": explanation_parts,
        "benefits": scheme.benefits,
        "required_documents": scheme.required_documents,
    }
