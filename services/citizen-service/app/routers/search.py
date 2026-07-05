from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.citizen import Citizen
from app.schemas.citizen import CitizenOut
from app.utils.dependencies import get_admin_user, get_db_session

router = APIRouter(prefix="/citizens", tags=["citizens"])


@router.get("/search", response_model=dict)
async def search_citizens(
    q: Optional[str] = Query(None, description="Search query for name, mobile, or aadhaar"),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db_session),
):
    query = select(Citizen)
    count_query = select(func.count(Citizen.id))

    if q:
        pattern = f"%{q}%"
        query = query.where(
            Citizen.name.ilike(pattern)
            | Citizen.mobile_number.ilike(pattern)
            | Citizen.aadhaar_hash.ilike(pattern)
        )
        count_query = count_query.where(
            Citizen.name.ilike(pattern)
            | Citizen.mobile_number.ilike(pattern)
            | Citizen.aadhaar_hash.ilike(pattern)
        )

    if state:
        query = query.where(Citizen.state == state)
        count_query = count_query.where(Citizen.state == state)

    if district:
        query = query.where(Citizen.district == district)
        count_query = count_query.where(Citizen.district == district)

    total = (await db.execute(count_query)).scalar() or 0

    offset = (page - 1) * page_size
    query = query.order_by(Citizen.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    citizens = result.scalars().all()

    return {
        "items": [CitizenOut.model_validate(c) for c in citizens],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }
