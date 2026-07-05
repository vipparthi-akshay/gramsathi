from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.citizen import Citizen
from app.models.family import FamilyMember
from app.schemas.citizen import (
    CitizenOut,
    CitizenSummary,
    CitizenUpdate,
    FamilyMemberCreate,
    FamilyMemberOut,
)
from app.utils.dependencies import (
    get_citizen_or_404,
    get_current_user,
    get_db_session,
)

router = APIRouter(prefix="/citizens", tags=["citizens"])


def _check_owner_or_admin(citizen: Citizen, current_user: dict) -> None:
    user_id = current_user.get("id")
    is_admin = current_user.get("is_admin") or current_user.get("role") == "admin"
    if str(citizen.user_id) != str(user_id) and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this profile",
        )


@router.get("/{citizen_id}", response_model=CitizenOut)
async def get_citizen(
    citizen_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    citizen = await get_citizen_or_404(citizen_id, db)
    _check_owner_or_admin(citizen, current_user)
    return citizen


@router.put("/{citizen_id}", response_model=CitizenOut)
async def update_citizen(
    citizen_id: UUID,
    update_data: CitizenUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    citizen = await get_citizen_or_404(citizen_id, db)
    _check_owner_or_admin(citizen, current_user)

    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(citizen, field, value)

    db.add(citizen)
    await db.flush()
    await db.refresh(citizen)
    return citizen


@router.get("/{citizen_id}/family", response_model=List[FamilyMemberOut])
async def list_family_members(
    citizen_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    citizen = await get_citizen_or_404(citizen_id, db)
    _check_owner_or_admin(citizen, current_user)

    result = await db.execute(
        select(FamilyMember).where(FamilyMember.citizen_id == citizen_id)
    )
    return result.scalars().all()


@router.post(
    "/{citizen_id}/family",
    response_model=FamilyMemberOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_family_member(
    citizen_id: UUID,
    member_data: FamilyMemberCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    citizen = await get_citizen_or_404(citizen_id, db)
    _check_owner_or_admin(citizen, current_user)

    member = FamilyMember(
        citizen_id=citizen_id,
        **member_data.model_dump(),
    )
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


@router.delete(
    "/{citizen_id}/family/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_family_member(
    citizen_id: UUID,
    member_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    citizen = await get_citizen_or_404(citizen_id, db)
    _check_owner_or_admin(citizen, current_user)

    result = await db.execute(
        select(FamilyMember).where(
            FamilyMember.id == member_id,
            FamilyMember.citizen_id == citizen_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Family member not found",
        )
    await db.delete(member)
    await db.flush()


@router.get("/{citizen_id}/summary", response_model=CitizenSummary)
async def get_citizen_summary(
    citizen_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    citizen = await get_citizen_or_404(citizen_id, db)
    _check_owner_or_admin(citizen, current_user)

    active_count = 0
    pending_docs = 0

    try:
        import httpx

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"http://scheme-service:8000/api/v1/citizens/{citizen_id}/applications",
                headers={"Authorization": f"Bearer {current_user.get('token', '')}"},
                timeout=10.0,
            )
            if resp.status_code == 200:
                apps = resp.json()
                active_count = sum(
                    1
                    for a in apps
                    if a.get("status") in ("submitted", "under_review")
                )
                pending_docs = sum(
                    1
                    for a in apps
                    if any(
                        d.get("verification_status") != "verified"
                        for d in a.get("documents_submitted", [])
                    )
                )
    except Exception:
        pass

    return CitizenSummary(
        profile=CitizenOut.model_validate(citizen),
        active_applications_count=active_count,
        pending_documents_count=pending_docs,
    )
