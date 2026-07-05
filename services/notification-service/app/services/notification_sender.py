import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)


class NotificationSender:

    def __init__(self):
        self._fcm_app = None
        self._twilio_client = None
        self._initialized = False

    def _ensure_initialized(self):
        if self._initialized:
            return
        if settings.FIREBASE_CREDENTIALS_PATH:
            try:
                import firebase_admin
                from firebase_admin import credentials
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                self._fcm_app = firebase_admin.initialize_app(cred, {
                    'databaseURL': settings.FIREBASE_DATABASE_URL or ''
                })
            except Exception as e:
                logger.warning(f"Firebase initialization failed: {e}")

        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                from twilio.rest import Client
                self._twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            except Exception as e:
                logger.warning(f"Twilio initialization failed: {e}")

        self._initialized = True

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def send_push_notification(
        self,
        citizen_id: UUID,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        fcm_token: Optional[str] = None,
    ) -> bool:
        self._ensure_initialized()
        if not self._fcm_app:
            logger.warning("Firebase not configured, skipping push notification")
            return False

        try:
            from firebase_admin import messaging
            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
                token=fcm_token,
            )
            response = messaging.send(message)
            logger.info(f"FCM sent: {response}")
            return True
        except Exception as e:
            logger.error(f"FCM send failed: {e}")
            return False

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def send_sms(self, mobile: str, message: str) -> bool:
        self._ensure_initialized()

        if self._twilio_client and settings.TWILIO_SMS_FROM:
            try:
                twilio_msg = self._twilio_client.messages.create(
                    body=message,
                    from_=settings.TWILIO_SMS_FROM,
                    to=mobile,
                )
                logger.info(f"Twilio SMS sent: {twilio_msg.sid}")
                return True
            except Exception as e:
                logger.error(f"Twilio SMS failed: {e}")

        if settings.MSG91_AUTH_KEY:
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        "https://api.msg91.com/api/v5/flow/",
                        json={
                            "sender": settings.MSG91_SENDER_ID,
                            "route": settings.MSG91_ROUTE,
                            "sms": [
                                {
                                    "message": message,
                                    "to": [mobile],
                                }
                            ],
                        },
                        headers={
                            "authkey": settings.MSG91_AUTH_KEY,
                            "Content-Type": "application/json",
                        },
                    )
                    if resp.status_code == 200:
                        logger.info(f"MSG91 SMS sent to {mobile}")
                        return True
                    logger.error(f"MSG91 SMS failed: {resp.text}")
            except Exception as e:
                logger.error(f"MSG91 SMS error: {e}")

        logger.warning("SMS not sent: no provider configured")
        return False

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def send_whatsapp(self, mobile: str, message: str) -> bool:
        self._ensure_initialized()
        if not self._twilio_client or not settings.TWILIO_WHATSAPP_FROM:
            logger.warning("Twilio WhatsApp not configured")
            return False

        try:
            from_whatsapp = f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}"
            to_whatsapp = f"whatsapp:{mobile}"
            twilio_msg = self._twilio_client.messages.create(
                body=message,
                from_=from_whatsapp,
                to=to_whatsapp,
            )
            logger.info(f"Twilio WhatsApp sent: {twilio_msg.sid}")
            return True
        except Exception as e:
            logger.error(f"Twilio WhatsApp failed: {e}")
            return False

    def render_template(
        self,
        template_id: str,
        variables: Dict[str, Any],
        language: str = "en",
    ) -> Tuple[str, str]:
        from app.models.database import async_session_factory
        from app.models.template import NotificationTemplate
        from sqlalchemy import select

        import asyncio

        async def _render():
            async with async_session_factory() as session:
                result = await session.execute(
                    select(NotificationTemplate).where(
                        NotificationTemplate.id == template_id,
                        NotificationTemplate.language == language,
                    )
                )
                template = result.scalar_one_or_none()
                if not template:
                    result = await session.execute(
                        select(NotificationTemplate).where(
                            NotificationTemplate.id == template_id,
                            NotificationTemplate.language == "en",
                        )
                    )
                    template = result.scalar_one_or_none()
                if not template:
                    return ("Notification", "You have a new update.")

                title = template.title_template
                body = template.body_template

                def replace_var(match):
                    key = match.group(1)
                    return str(variables.get(key, match.group(0)))

                title = re.sub(r"\{\{(\w+)\}\}", replace_var, title)
                body = re.sub(r"\{\{(\w+)\}\}", replace_var, body)

                return (title, body)

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                from sqlalchemy import select as sa_select
                import asyncio as _asyncio
                return ("Notification", "You have a new update.")
            return loop.run_until_complete(_render())
        except RuntimeError:
            return ("Notification", "You have a new update.")

    async def render_template_async(
        self,
        template_id: str,
        variables: Dict[str, Any],
        language: str = "en",
    ) -> Tuple[str, str]:
        from app.models.database import async_session_factory
        from app.models.template import NotificationTemplate
        from sqlalchemy import select

        async with async_session_factory() as session:
            result = await session.execute(
                select(NotificationTemplate).where(
                    NotificationTemplate.id == template_id,
                    NotificationTemplate.language == language,
                )
            )
            template = result.scalar_one_or_none()
            if not template:
                result = await session.execute(
                    select(NotificationTemplate).where(
                        NotificationTemplate.id == template_id,
                        NotificationTemplate.language == "en",
                    )
                )
                template = result.scalar_one_or_none()
            if not template:
                return ("Notification", "You have a new update.")

            title = template.title_template
            body = template.body_template

            def replace_var(match):
                key = match.group(1)
                return str(variables.get(key, match.group(0)))

            title = re.sub(r"\{\{(\w+)\}\}", replace_var, title)
            body = re.sub(r"\{\{(\w+)\}\}", replace_var, body)

            return (title, body)

    async def send_notification(
        self,
        citizen_id: UUID,
        title: str,
        body: str,
        channels: List[str],
        data: Optional[Dict[str, Any]] = None,
        fcm_token: Optional[str] = None,
        mobile: Optional[str] = None,
    ) -> Dict[str, bool]:
        results = {}
        for channel in channels:
            channel = channel.strip()
            if channel == "in_app":
                results["in_app"] = True
            elif channel == "sms" and mobile:
                results["sms"] = await self.send_sms(mobile, f"{title}\n{body}")
            elif channel == "whatsapp" and mobile:
                results["whatsapp"] = await self.send_whatsapp(mobile, f"{title}\n{body}")
            elif channel == "push":
                results["push"] = await self.send_push_notification(citizen_id, title, body, data, fcm_token)
        return results

    async def bulk_send(
        self,
        citizen_ids: List[UUID],
        template_id: str,
        variables: Dict[str, Any],
        language: str = "en",
        channel: str = "in_app",
    ) -> int:
        title, body = await self.render_template_async(template_id, variables, language)
        from app.models.database import async_session_factory
        from app.models.notification import Notification

        sent_count = 0
        async with async_session_factory() as session:
            for citizen_id in citizen_ids[: settings.MAX_BULK_NOTIFICATIONS]:
                notification = Notification(
                    citizen_id=citizen_id,
                    type=template_id,
                    title=title,
                    body=body,
                    delivery_channel=channel,
                    delivery_status="sent",
                )
                session.add(notification)
                sent_count += 1
            await session.commit()

        logger.info(f"Bulk sent {sent_count} notifications for template {template_id}")
        return sent_count
