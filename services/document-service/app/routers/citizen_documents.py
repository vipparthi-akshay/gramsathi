import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentList, DocumentOut
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/citizens", tags=["Citizen Documents"])


@router.get("/{citizen_id}/documents", response_model=DocumentList)
async def list_citizen_documents(
    citizen_id: uuid.UUID,
    document_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(
        Document.citizen_id == citizen_id, Document.is_deleted == False
    )
    count_query = select(func.count()).select_from(Document).where(
        Document.citizen_id == citizen_id, Document.is_deleted == False
    )

    if document_type:
        query = query.where(Document.document_type == document_type)
        count_query = count_query.where(Document.document_type == document_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Document.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    docs = result.scalars().all()

    return DocumentList(
        documents=[DocumentOut.model_validate(d) for d in docs],
        total=total,
        page=page,
        page_size=page_size,
    )
