from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application
from app.models.scheme import Scheme
from app.schemas.application import (
    ApplicationApprove,
    ApplicationCreate,
    ApplicationOut,
    ApplicationReject,
    ApplicationReview,
    ApplicationUpdate,
    BulkApproveRequest,
)
from app.utils.dependencies import (
    get_admin_user,
    get_current_user,
    get_db_session,
    get_gov_officer,
)

router = APIRouter(prefix="/applications", tags=["applications"])


async def _get_application_or_404(
    application_id: UUID, db: AsyncSession
) -> Application:
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return app


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Scheme).where(Scheme.id == app_data.scheme_id, Scheme.is_deleted == False)
    )
    scheme = result.scalar_one_or_none()
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")

    application = Application(
        citizen_id=app_data.citizen_id,
        scheme_id=app_data.scheme_id,
        form_data=app_data.form_data,
        documents_submitted=app_data.documents_submitted,
        status="draft",
    )
    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


@router.get("/{application_id}", response_model=ApplicationOut)
async def get_application(
    application_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    application = await _get_application_or_404(application_id, db)
    return application


@router.put("/{application_id}", response_model=ApplicationOut)
async def update_application(
    application_id: UUID,
    app_data: ApplicationUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    application = await _get_application_or_404(application_id, db)

    if application.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update draft applications",
        )

    update_dict = app_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(application, field, value)

    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


@router.post("/{application_id}/submit", response_model=ApplicationOut)
async def submit_application(
    application_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    application = await _get_application_or_404(application_id, db)

    if application.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft applications can be submitted",
        )

    application.status = "submitted"
    application.submitted_at = datetime.now(timezone.utc)
    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


@router.post("/{application_id}/review", response_model=ApplicationOut)
async def review_application(
    application_id: UUID,
    review_data: ApplicationReview,
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db_session),
):
    application = await _get_application_or_404(application_id, db)

    if application.status not in ("submitted", "needs_info"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is not in a reviewable state",
        )

    application.status = "under_review"
    application.reviewed_at = datetime.now(timezone.utc)
    application.processed_by = current_user.get("id")
    if review_data.ai_summary:
        application.ai_summary = review_data.ai_summary

    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


@router.post("/{application_id}/approve", response_model=ApplicationOut)
async def approve_application(
    application_id: UUID,
    approve_data: ApplicationApprove,
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db_session),
):
    application = await _get_application_or_404(application_id, db)

    if application.status != "under_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application must be under review to approve",
        )

    application.status = "approved"
    application.processed_by = current_user.get("id")
    if approve_data.government_ref_id:
        application.government_ref_id = approve_data.government_ref_id

    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


@router.post("/{application_id}/reject", response_model=ApplicationOut)
async def reject_application(
    application_id: UUID,
    reject_data: ApplicationReject,
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db_session),
):
    application = await _get_application_or_404(application_id, db)

    if application.status not in ("submitted", "under_review", "needs_info"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application cannot be rejected in its current state",
        )

    application.status = "rejected"
    application.rejection_reason = reject_data.rejection_reason
    application.processed_by = current_user.get("id")
    application.reviewed_at = datetime.now(timezone.utc)

    db.add(application)
    await db.flush()
    await db.refresh(application)
    return application


@router.get("/pending", response_model=dict)
async def list_pending_applications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_gov_officer),
    db: AsyncSession = Depends(get_db_session),
):
    query = select(Application).where(
        Application.status.in_(["submitted", "under_review", "needs_info"])
    )
    count_query = select(func.count(Application.id)).where(
        Application.status.in_(["submitted", "under_review", "needs_info"])
    )

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * page_size
    query = query.order_by(Application.created_at.asc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    apps = result.scalars().all()

    return {
        "items": [ApplicationOut.model_validate(a) for a in apps],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("/bulk-approve", response_model=dict)
async def bulk_approve_applications(
    bulk_data: BulkApproveRequest,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        update(Application)
        .where(
            Application.id.in_(bulk_data.application_ids),
            Application.status == "under_review",
        )
        .values(
            status="approved",
            processed_by=current_user.get("id"),
            reviewed_at=now,
            government_ref_id=bulk_data.government_ref_id,
            updated_at=now,
        )
        .returning(Application.id)
    )
    updated_ids = result.scalars().all()

    return {
        "message": f"Approved {len(updated_ids)} applications",
        "approved_ids": [str(uid) for uid in updated_ids],
    }


citizen_router = APIRouter(prefix="/citizens", tags=["citizens"])


@citizen_router.get("/{citizen_id}/applications", response_model=List[ApplicationOut])
async def list_citizen_applications(
    citizen_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    result = await db.execute(
        select(Application)
        .where(Application.citizen_id == citizen_id)
        .order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()
    return [ApplicationOut.model_validate(a) for a in apps]
