from typing import List, Optional
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.scheme import Scheme
from app.schemas.scheme import (
    CategoryOut,
    EligibilityCheckRequest,
    EligibilityCheckResult,
    SchemeCreate,
    SchemeMatch,
    SchemeOut,
    SchemeUpdate,
)
from app.utils.dependencies import get_admin_user, get_current_user, get_db_session

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("", response_model=dict)
async def list_schemes(
    category: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    ministry: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    query = select(Scheme).where(Scheme.is_active == True, Scheme.is_deleted == False)
    count_query = select(func.count(Scheme.id)).where(
        Scheme.is_active == True, Scheme.is_deleted == False
    )

    if category:
        query = query.where(Scheme.category == category)
        count_query = count_query.where(Scheme.category == category)

    if state:
        query = query.where(
            (Scheme.state_specific == state) | (Scheme.state_specific.is_(None))
        )
        count_query = count_query.where(
            (Scheme.state_specific == state) | (Scheme.state_specific.is_(None))
        )

    if ministry:
        query = query.where(Scheme.ministry == ministry)
        count_query = count_query.where(Scheme.ministry == ministry)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            Scheme.name.ilike(pattern)
            | Scheme.name_hindi.ilike(pattern)
            | Scheme.description.ilike(pattern)
            | Scheme.tags.as_string().ilike(pattern)
        )
        count_query = count_query.where(
            Scheme.name.ilike(pattern)
            | Scheme.name_hindi.ilike(pattern)
            | Scheme.description.ilike(pattern)
            | Scheme.tags.as_string().ilike(pattern)
        )

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(Scheme.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    schemes = result.scalars().all()

    return {
        "items": [SchemeOut.model_validate(s) for s in schemes],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/categories", response_model=List[CategoryOut])
async def list_categories(
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme.category, func.count(Scheme.id).label("count"))
        .where(Scheme.is_active == True, Scheme.is_deleted == False)
        .group_by(Scheme.category)
        .order_by(Scheme.category)
    )
    rows = result.all()
    return [CategoryOut(category=row[0], count=row[1]) for row in rows]


@router.get("/{scheme_id}", response_model=SchemeOut)
async def get_scheme(
    scheme_id: UUID,
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id, Scheme.is_deleted == False)
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found",
        )
    return scheme


@router.get("/match", response_model=List[SchemeMatch])
async def match_schemes(
    citizen_id: UUID = Query(...),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.AI_SERVICE_URL}/api/v1/match-schemes",
                json={"citizen_id": str(citizen_id), "limit": limit},
                timeout=30.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                return [
                    SchemeMatch(
                        scheme=SchemeOut.model_validate(item["scheme"]),
                        match_score=item.get("match_score", 0),
                        explanation=item.get("explanation", ""),
                    )
                    for item in data.get("matches", data if isinstance(data, list) else [])
                ]
    except Exception:
        pass

    result = await db.execute(
        select(Scheme).where(Scheme.is_active == True, Scheme.is_deleted == False)
        .order_by(Scheme.created_at.desc())
        .limit(limit)
    )
    schemes = result.scalars().all()
    return [
        SchemeMatch(
            scheme=SchemeOut.model_validate(s),
            match_score=0.5,
            explanation="AI service unavailable. Showing recent schemes.",
        )
        for s in schemes
    ]


@router.post("/eligibility", response_model=EligibilityCheckResult)
async def check_eligibility(
    request: EligibilityCheckRequest,
    db: AsyncSession = Depends(get_db_session),
):
    from app.utils.eligibility_engine import CitizenProfile, EligibilityEngine

    result = await db.execute(
        select(Scheme).where(Scheme.id == request.scheme_id, Scheme.is_deleted == False)
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"http://citizen-service:8000/api/v1/citizens/{request.citizen_id}",
                timeout=10.0,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Citizen not found")
            citizen_data = resp.json()
    except httpx.RequestError:
        raise HTTPException(
            status_code=503, detail="Citizen service unavailable"
        )

    profile = CitizenProfile(
        id=citizen_data["id"],
        date_of_birth=citizen_data.get("date_of_birth"),
        gender=citizen_data.get("gender"),
        state=citizen_data.get("state"),
        district=citizen_data.get("district"),
        caste_category=citizen_data.get("caste_category"),
        annual_income=citizen_data.get("annual_income"),
        occupation=citizen_data.get("occupation"),
        is_farmer=citizen_data.get("is_farmer", False),
        has_disability=citizen_data.get("has_disability", False),
        disability_type=citizen_data.get("disability_type"),
        education_level=citizen_data.get("education_level"),
        is_bpl=citizen_data.get("annual_income", 0) < 50000 if citizen_data.get("annual_income") else False,
    )

    engine = EligibilityEngine()
    eligibility_result = engine.check_eligibility(profile, scheme)

    return EligibilityCheckResult(
        eligible=eligibility_result.eligible,
        score=eligibility_result.score,
        breakdown=eligibility_result.breakdown,
        missing_requirements=eligibility_result.missing_requirements,
    )


@router.post("", response_model=SchemeOut, status_code=status.HTTP_201_CREATED)
async def create_scheme(
    scheme_data: SchemeCreate,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    scheme = Scheme(**scheme_data.model_dump())
    db.add(scheme)
    await db.flush()
    await db.refresh(scheme)
    return scheme


@router.put("/{scheme_id}", response_model=SchemeOut)
async def update_scheme(
    scheme_id: UUID,
    scheme_data: SchemeUpdate,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id, Scheme.is_deleted == False)
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    update_dict = scheme_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(scheme, field, value)

    db.add(scheme)
    await db.flush()
    await db.refresh(scheme)
    return scheme


@router.delete("/{scheme_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheme(
    scheme_id: UUID,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(Scheme.id == scheme_id, Scheme.is_deleted == False)
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    scheme.is_deleted = True
    scheme.is_active = False
    db.add(scheme)
    await db.flush()
