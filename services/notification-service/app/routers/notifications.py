import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.notification import Notification, NotificationPreference
from app.schemas.notification import (
    BulkSendRequest,
    NotificationOut,
    NotificationPreferenceOut,
    NotificationPreferenceUpdate,
    NotificationSendRequest,
    NotificationSendResponse,
)
from app.services.notification_sender import NotificationSender
from app.utils.dependencies import get_current_user, get_admin_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_sender(request: Request) -> NotificationSender:
    if not hasattr(request.app.state, "notification_sender"):
        request.app.state.notification_sender = NotificationSender()
    return request.app.state.notification_sender


@router.get("", response_model=dict)
async def get_notifications(
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None, alias="type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citizen_id = uuid.UUID(current_user["id"])

    query = select(Notification).where(Notification.citizen_id == citizen_id)
    count_query = select(func.count()).select_from(Notification).where(
        Notification.citizen_id == citizen_id
    )

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)
        count_query = count_query.where(Notification.is_read == is_read)

    if notification_type:
        query = query.where(Notification.type == notification_type)
        count_query = count_query.where(Notification.type == notification_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Notification.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    notifications = result.scalars().all()

    unread_count_result = await db.execute(
        select(func.count()).select_from(Notification).where(
            Notification.citizen_id == citizen_id,
            Notification.is_read == False,
        )
    )
    unread_count = unread_count_result.scalar() or 0

    return {
        "notifications": [NotificationOut.model_validate(n) for n in notifications],
        "total": total,
        "page": page,
        "page_size": page_size,
        "unread_count": unread_count,
    }


@router.put("/{notification_id}/read", response_model=NotificationOut)
async def mark_as_read(
    notification_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citizen_id = uuid.UUID(current_user["id"])

    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.citizen_id == citizen_id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)

    return NotificationOut.model_validate(notification)


@router.put("/read-all")
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citizen_id = uuid.UUID(current_user["id"])

    await db.execute(
        update(Notification)
        .where(
            Notification.citizen_id == citizen_id,
            Notification.is_read == False,
        )
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )

    return {"message": "All notifications marked as read"}


@router.get("/preferences", response_model=NotificationPreferenceOut)
async def get_preferences(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citizen_id = uuid.UUID(current_user["id"])

    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.citizen_id == citizen_id)
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = NotificationPreference(citizen_id=citizen_id)
        db.add(prefs)
        await db.flush()

    return NotificationPreferenceOut.model_validate(prefs)


@router.put("/preferences", response_model=NotificationPreferenceOut)
async def update_preferences(
    body: NotificationPreferenceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citizen_id = uuid.UUID(current_user["id"])

    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.citizen_id == citizen_id)
    )
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = NotificationPreference(citizen_id=citizen_id)
        db.add(prefs)

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(prefs, field, value)

    await db.flush()
    return NotificationPreferenceOut.model_validate(prefs)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    citizen_id = uuid.UUID(current_user["id"])

    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.citizen_id == citizen_id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    await db.delete(notification)
    return None


@router.post("/send", response_model=NotificationSendResponse, status_code=status.HTTP_201_CREATED)
async def send_notification(
    body: NotificationSendRequest,
    request: Request,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
    sender: NotificationSender = Depends(get_sender),
):
    channels = ["in_app"]
    if body.delivery_channel == "all":
        channels = ["in_app", "sms", "whatsapp", "push"]
    elif body.delivery_channel:
        channels = [body.delivery_channel]

    notification = Notification(
        citizen_id=body.citizen_id,
        type=body.type,
        title=body.title,
        body=body.body,
        metadata=body.metadata,
        delivery_channel=body.delivery_channel,
        delivery_status="sent",
    )
    db.add(notification)
    await db.flush()

    delivery_results = await sender.send_notification(
        citizen_id=body.citizen_id,
        title=body.title,
        body=body.body,
        channels=channels,
        data=body.metadata,
    )

    return NotificationSendResponse(
        id=notification.id,
        delivery_status="sent" if any(delivery_results.values()) else "failed",
    )


@router.post("/send-bulk", status_code=status.HTTP_201_CREATED)
async def send_bulk_notifications(
    body: BulkSendRequest,
    current_user: dict = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    sent_count = 0
    max_bulk = settings.MAX_BULK_NOTIFICATIONS

    for citizen_id in body.citizen_ids[:max_bulk]:
        notification = Notification(
            citizen_id=citizen_id,
            type=body.type,
            title=body.title,
            body=body.body,
            metadata=body.metadata,
            delivery_channel="in_app",
            delivery_status="sent",
        )
        db.add(notification)
        sent_count += 1

    await db.flush()

    return {
        "message": f"Bulk notification sent to {sent_count} citizens",
        "sent_count": sent_count,
        "total_requested": len(body.citizen_ids),
    }
