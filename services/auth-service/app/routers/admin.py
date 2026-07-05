import math
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.user import User
from app.schemas.auth import PaginatedUsers, UserOut, UserUpdate
from app.utils.dependencies import get_admin_user

router = APIRouter(prefix="/admin", tags=["Admin Auth"])


@router.get("/users", response_model=PaginatedUsers)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_active: bool | None = None,
    is_verified: bool | None = None,
    role: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    query = select(User)
    count_query = select(func.count(User.id))

    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)
    if is_verified is not None:
        query = query.where(User.is_verified == is_verified)
        count_query = count_query.where(User.is_verified == is_verified)
    if role is not None:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            User.mobile_number.ilike(search_pattern) | User.name.ilike(search_pattern)
        )
        count_query = count_query.where(
            User.mobile_number.ilike(search_pattern) | User.name.ilike(search_pattern)
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    total_pages = max(1, math.ceil(total / page_size))
    offset = (page - 1) * page_size

    query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedUsers(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return UserOut.model_validate(user)


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    if "role" in update_data and admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can change user roles",
        )

    for field, value in update_data.items():
        setattr(user, field, value)

    return UserOut.model_validate(user)


@router.post("/users/{user_id}/verify", response_model=UserOut)
async def verify_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_verified = True

    return UserOut.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete a super admin user",
        )

    user.is_active = False
    return None
