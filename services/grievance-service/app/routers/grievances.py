import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.grievance import Grievance
from app.models.complaint_tracking import ComplaintTracking
from app.schemas.grievance import (
    ComplaintTrackingOut,
    GrievanceCreate,
    GrievanceDraftRequest,
    GrievanceDraftResponse,
    GrievanceOut,
    GrievanceUpdate,
)
from app.utils.dependencies import get_current_user, get_gov_officer

router = APIRouter(tags=["Grievances"])


@router.post("/grievances", response_model=GrievanceOut, status_code=status.HTTP_201_CREATED)
async def create_grievance(
    body: GrievanceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    grievance = Grievance(
        citizen_id=body.citizen_id,
        category=body.category,
        department=body.department,
        subject=body.subject,
        description=body.description,
        original_language=body.original_language,
        priority=body.priority,
        status="draft",
    )
    db.add(grievance)
    await db.flush()

    tracking = ComplaintTracking(
        grievance_id=grievance.id,
        action="created",
        action_by=uuid.UUID(current_user["id"]),
        notes="Grievance filed",
    )
    db.add(tracking)

    return GrievanceOut.model_validate(grievance)


@router.get("/grievances/{grievance_id}", response_model=GrievanceOut)
async def get_grievance(
    grievance_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    user_role = current_user["role"]
    user_id = current_user["id"]
    if user_role == "citizen" and str(grievance.citizen_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return GrievanceOut.model_validate(grievance)


@router.put("/grievances/{grievance_id}", response_model=GrievanceOut)
async def update_grievance(
    grievance_id: uuid.UUID,
    body: GrievanceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    user_role = current_user["role"]
    user_id = current_user["id"]

    if user_role == "citizen":
        if str(grievance.citizen_id) != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        if grievance.status not in ("draft",):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only edit grievances in draft status",
            )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(grievance, field, value)
    grievance.updated_at = datetime.now(timezone.utc)

    tracking = ComplaintTracking(
        grievance_id=grievance.id,
        action="updated",
        action_by=uuid.UUID(user_id),
        notes=f"Grievance updated: {', '.join(update_data.keys())}",
    )
    db.add(tracking)

    return GrievanceOut.model_validate(grievance)


@router.get("/citizens/{citizen_id}/grievances")
async def list_citizen_grievances(
    citizen_id: uuid.UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_role = current_user["role"]
    user_id = current_user["id"]
    if user_role == "citizen" and str(citizen_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    query = select(Grievance).where(Grievance.citizen_id == citizen_id)
    count_query = select(func.count()).select_from(Grievance).where(Grievance.citizen_id == citizen_id)

    if status_filter:
        query = query.where(Grievance.status == status_filter)
        count_query = count_query.where(Grievance.status == status_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(desc(Grievance.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    grievances = result.scalars().all()

    return {
        "grievances": [GrievanceOut.model_validate(g) for g in grievances],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/grievances/pending", response_model=List[GrievanceOut])
async def list_pending_grievances(
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    query = select(Grievance).where(
        Grievance.status.in_(["submitted", "under_review"])
    )

    if priority:
        query = query.where(Grievance.priority == priority)
    if category:
        query = query.where(Grievance.category == category)

    query = query.order_by(
        desc(Grievance.priority == "critical"),
        desc(Grievance.priority == "high"),
        desc(Grievance.created_at),
    )
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    grievances = result.scalars().all()

    return [GrievanceOut.model_validate(g) for g in grievances]


@router.post("/grievances/{grievance_id}/submit")
async def submit_grievance(
    grievance_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    if grievance.status != "draft":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Grievance is not in draft status")

    grievance.status = "submitted"
    grievance.updated_at = datetime.now(timezone.utc)

    tracking = ComplaintTracking(
        grievance_id=grievance.id,
        action="submitted",
        action_by=uuid.UUID(current_user["id"]),
        notes="Grievance submitted for review",
    )
    db.add(tracking)

    return GrievanceOut.model_validate(grievance)


@router.post("/grievances/{grievance_id}/escalate", response_model=GrievanceOut)
async def escalate_grievance(
    grievance_id: uuid.UUID,
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db),
    notes: Optional[str] = None,
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    grievance.status = "escalated"
    grievance.priority = "high" if grievance.priority == "medium" else "critical"
    grievance.updated_at = datetime.now(timezone.utc)

    tracking = ComplaintTracking(
        grievance_id=grievance.id,
        action="escalated",
        action_by=uuid.UUID(current_user["id"]),
        notes=notes or f"Grievance escalated to {grievance.priority} priority",
    )
    db.add(tracking)

    return GrievanceOut.model_validate(grievance)


@router.post("/grievances/{grievance_id}/resolve", response_model=GrievanceOut)
async def resolve_grievance(
    grievance_id: uuid.UUID,
    resolution_notes: str,
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    grievance.status = "resolved"
    grievance.resolution_notes = resolution_notes
    grievance.resolved_at = datetime.now(timezone.utc)
    grievance.updated_at = datetime.now(timezone.utc)

    tracking = ComplaintTracking(
        grievance_id=grievance.id,
        action="resolved",
        action_by=uuid.UUID(current_user["id"]),
        notes=resolution_notes,
    )
    db.add(tracking)

    return GrievanceOut.model_validate(grievance)


@router.post("/grievances/{grievance_id}/reopen", response_model=GrievanceOut)
async def reopen_grievance(
    grievance_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")
    if grievance.status not in ("resolved", "closed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only resolved/closed grievances can be reopened",
        )

    grievance.status = "under_review"
    grievance.resolved_at = None
    grievance.updated_at = datetime.now(timezone.utc)

    tracking = ComplaintTracking(
        grievance_id=grievance.id,
        action="reopened",
        action_by=uuid.UUID(current_user["id"]),
        notes="Grievance reopened",
    )
    db.add(tracking)

    return GrievanceOut.model_validate(grievance)


@router.post("/ai/grievances/draft", response_model=GrievanceDraftResponse)
async def ai_draft_grievance(
    body: GrievanceDraftRequest,
    current_user: dict = Depends(get_current_user),
):
    if settings.GEMINI_API_KEY:
        try:
            draft = await _draft_with_gemini(body.description, body.category, body.original_language)
            return draft
        except Exception:
            pass

    if settings.AI_SERVICE_URL:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    f"{settings.AI_SERVICE_URL}/api/v1/ai/grievance/draft",
                    json=body.model_dump(),
                )
                if resp.status_code == 200:
                    return GrievanceDraftResponse(**resp.json())
        except Exception:
            pass

    return _fallback_draft(body.description, body.category)


async def _draft_with_gemini(description: str, category: Optional[str], language: str) -> GrievanceDraftResponse:
    async with httpx.AsyncClient(timeout=30.0) as client:
        prompt = f"""Convert this citizen grievance description into a formal complaint.
Category: {category or 'Not specified'}
Language: {language}
Description: {description}

Return ONLY a JSON with:
- drafted_complaint (formal version in {language})
- category (one of: scheme_related, document_issue, payment_delay, staff_behavior, technical, other)
- department (most relevant gov department)
- subject (short 10 word max title)
- priority (low, medium, high, or critical)"""
        resp = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            params={"key": settings.GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        if resp.status_code == 200:
            result = resp.json()
            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
            clean = text.strip().strip("```json").strip("```").strip()
            return GrievanceDraftResponse(**json.loads(clean))

    raise ValueError("Gemini API call failed")


def _fallback_draft(description: str, category: Optional[str]) -> GrievanceDraftResponse:
    lines = [line.strip() for line in description.split("\n") if line.strip()]
    subject = lines[0][:100] if lines else "Grievance regarding government service"
    if len(subject) > 100:
        subject = subject[:97] + "..."

    cat = category or "other"
    dept_map = {
        "scheme_related": "Department of Social Welfare",
        "document_issue": "Department of Revenue",
        "payment_delay": "Department of Finance",
        "staff_behavior": "Department of Personnel",
        "technical": "Department of IT",
        "other": "General Administration Department",
    }
    department = dept_map.get(cat, "General Administration Department")

    drafted = f"""Formal Complaint

Subject: {subject}

Respected Sir/Madam,

This is to bring to your kind attention a matter requiring urgent intervention.

{description}

I request the concerned authorities to look into this matter at the earliest and provide necessary resolution.

Thanking You,
[Citizen Name]
[Contact Information]"""

    return GrievanceDraftResponse(
        drafted_complaint=drafted,
        category=cat,
        department=department,
        subject=subject,
        priority="medium",
    )


@router.get("/grievances/{grievance_id}/tracking", response_model=List[ComplaintTrackingOut])
async def get_grievance_tracking(
    grievance_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Grievance).where(Grievance.id == grievance_id))
    grievance = result.scalar_one_or_none()
    if not grievance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")

    user_role = current_user["role"]
    user_id = current_user["id"]
    if user_role == "citizen" and str(grievance.citizen_id) != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    result = await db.execute(
        select(ComplaintTracking)
        .where(ComplaintTracking.grievance_id == grievance_id)
        .order_by(ComplaintTracking.created_at.desc())
    )
    tracking = result.scalars().all()

    return [ComplaintTrackingOut.model_validate(t) for t in tracking]
