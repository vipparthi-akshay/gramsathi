import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import get_db
from app.models.template import NotificationTemplate
from app.schemas.notification import TemplateCreate, TemplateOut, TemplateUpdate
from app.utils.dependencies import get_admin_user

router = APIRouter(prefix="/templates", tags=["Notification Templates"])


@router.post("", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: TemplateCreate,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(NotificationTemplate).where(
            NotificationTemplate.name == body.name,
            NotificationTemplate.language == body.language,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Template '{body.name}' already exists for language '{body.language}'",
        )

    template = NotificationTemplate(
        name=body.name,
        type=body.type,
        title_template=body.title_template,
        body_template=body.body_template,
        variables=body.variables,
        language=body.language,
        channels=body.channels,
    )
    db.add(template)
    await db.flush()

    return TemplateOut.model_validate(template)


@router.get("", response_model=List[TemplateOut])
async def list_templates(
    type_filter: Optional[str] = Query(None, alias="type"),
    language: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(NotificationTemplate)
    count_query = select(func.count()).select_from(NotificationTemplate)

    if type_filter:
        query = query.where(NotificationTemplate.type == type_filter)
        count_query = count_query.where(NotificationTemplate.type == type_filter)
    if language:
        query = query.where(NotificationTemplate.language == language)
        count_query = count_query.where(NotificationTemplate.language == language)

    query = query.order_by(NotificationTemplate.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    templates = result.scalars().all()

    return [TemplateOut.model_validate(t) for t in templates]


@router.get("/{template_id}", response_model=TemplateOut)
async def get_template(
    template_id: uuid.UUID,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationTemplate).where(NotificationTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return TemplateOut.model_validate(template)


@router.put("/{template_id}", response_model=TemplateOut)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationTemplate).where(NotificationTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(template, field, value)

    await db.flush()
    return TemplateOut.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(NotificationTemplate).where(NotificationTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    await db.delete(template)
    return None
