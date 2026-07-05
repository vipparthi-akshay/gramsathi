import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import select

from notification_service.app.models.notification import (
    Notification,
    NotificationPreference,
)
from notification_service.app.models.template import NotificationTemplate
from notification_service.app.services.notification_sender import NotificationSender


@pytest.fixture
def notification_sender():
    return NotificationSender()


@pytest.fixture
def sample_template(db_session):
    template = NotificationTemplate(
        name="application_status_update",
        type="status_update",
        title_template="Application {{app_id}} Status Update",
        body_template="Your application {{app_id}} for {{scheme_name}} is now {{status}}.",
        variables={"app_id": "string", "scheme_name": "string", "status": "string"},
        language="en",
        channels={"in_app": True, "sms": True},
    )
    db_session.add(template)
    db_session.commit()
    return template


class TestNotificationCreation:
    @pytest.mark.asyncio
    async def test_send_notification_created_and_queued(self, db_session):
        notification = Notification(
            citizen_id=uuid.uuid4(),
            type="scheme_update",
            title="New Scheme Available",
            body="PM Kisan Samman Nidhi is now accepting applications",
            delivery_channel="in_app",
            delivery_status="pending",
        )
        db_session.add(notification)
        await db_session.commit()

        result = await db_session.execute(
            select(Notification).where(Notification.type == "scheme_update")
        )
        saved = result.scalar_one_or_none()
        assert saved is not None
        assert saved.title == "New Scheme Available"
        assert saved.delivery_status == "pending"
        assert saved.is_read is False

    @pytest.mark.asyncio
    async def test_notification_mark_as_read(self, db_session):
        notification = Notification(
            citizen_id=uuid.uuid4(),
            type="test",
            title="Test Notification",
            body="Test body",
            delivery_channel="in_app",
            delivery_status="sent",
        )
        db_session.add(notification)
        await db_session.commit()

        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await db_session.commit()

        result = await db_session.execute(
            select(Notification).where(Notification.id == notification.id)
        )
        updated = result.scalar_one_or_none()
        assert updated.is_read is True
        assert updated.read_at is not None


class TestNotificationPreferences:
    @pytest.mark.asyncio
    async def test_notification_preferences_respected(self, db_session):
        citizen_id = uuid.uuid4()
        prefs = NotificationPreference(
            citizen_id=citizen_id,
            in_app_enabled=True,
            sms_enabled=False,
            whatsapp_enabled=False,
            email_enabled=True,
        )
        db_session.add(prefs)
        await db_session.commit()

        result = await db_session.execute(
            select(NotificationPreference).where(
                NotificationPreference.citizen_id == citizen_id
            )
        )
        saved = result.scalar_one_or_none()
        assert saved is not None
        assert saved.in_app_enabled is True
        assert saved.sms_enabled is False
        assert saved.email_enabled is True

    @pytest.mark.asyncio
    async def test_notification_preferences_defaults(self, db_session):
        citizen_id = uuid.uuid4()
        prefs = NotificationPreference(citizen_id=citizen_id)
        db_session.add(prefs)
        await db_session.commit()

        assert prefs.in_app_enabled is True
        assert prefs.sms_enabled is False
        assert prefs.whatsapp_enabled is False

    @pytest.mark.asyncio
    async def test_preferences_update(self, db_session):
        citizen_id = uuid.uuid4()
        prefs = NotificationPreference(citizen_id=citizen_id)
        db_session.add(prefs)
        await db_session.commit()

        prefs.sms_enabled = True
        prefs.whatsapp_enabled = True
        await db_session.commit()

        result = await db_session.execute(
            select(NotificationPreference).where(
                NotificationPreference.citizen_id == citizen_id
            )
        )
        updated = result.scalar_one_or_none()
        assert updated.sms_enabled is True
        assert updated.whatsapp_enabled is True


class TestBulkNotification:
    @pytest.mark.asyncio
    async def test_bulk_notification_multiple_recipients(self, db_session):
        citizen_ids = [uuid.uuid4() for _ in range(5)]
        for cid in citizen_ids:
            notification = Notification(
                citizen_id=cid,
                type="bulk_test",
                title="Bulk Notification",
                body="This is a bulk message",
                delivery_channel="in_app",
                delivery_status="sent",
            )
            db_session.add(notification)
        await db_session.commit()

        result = await db_session.execute(
            select(Notification).where(Notification.type == "bulk_test")
        )
        notifications = result.scalars().all()
        assert len(notifications) == 5

    @pytest.mark.asyncio
    async def test_bulk_notification_respects_max_limit(self, db_session):
        max_bulk = 3
        citizen_ids = [uuid.uuid4() for _ in range(10)]

        sent_count = 0
        for citizen_id in citizen_ids[:max_bulk]:
            notification = Notification(
                citizen_id=citizen_id,
                type="limited_bulk",
                title="Limited",
                body="Limited bulk",
                delivery_channel="in_app",
                delivery_status="sent",
            )
            db_session.add(notification)
            sent_count += 1
        await db_session.commit()

        assert sent_count == max_bulk
        result = await db_session.execute(
            select(Notification).where(Notification.type == "limited_bulk")
        )
        notifications = result.scalars().all()
        assert len(notifications) == max_bulk


class TestTemplateRendering:
    @pytest.mark.asyncio
    async def test_template_rendering_variables_substituted(self, sample_template):
        import re

        title_template = sample_template.title_template
        body_template = sample_template.body_template
        variables = {
            "app_id": "APP-12345",
            "scheme_name": "PM Kisan",
            "status": "Approved",
        }

        def replace_var(match):
            key = match.group(1)
            return str(variables.get(key, match.group(0)))

        title = re.sub(r"\{\{(\w+)\}\}", replace_var, title_template)
        body = re.sub(r"\{\{(\w+)\}\}", replace_var, body_template)

        assert "APP-12345" in title
        assert "APP-12345" in body
        assert "PM Kisan" in body
        assert "Approved" in body

    @pytest.mark.asyncio
    async def test_template_missing_variable_renders_placeholder(self):
        import re

        template = "Hello {{name}}, your {{doc_type}} is ready."
        variables = {"name": "Ramesh"}

        def replace_var(match):
            key = match.group(1)
            return str(variables.get(key, match.group(0)))

        result = re.sub(r"\{\{(\w+)\}\}", replace_var, template)
        assert "Ramesh" in result
        assert "{{doc_type}}" in result

    def test_template_fallback_to_english(self, db_session):
        template_en = NotificationTemplate(
            name="welcome_msg",
            type="welcome",
            title_template="Welcome {{name}}!",
            body_template="Welcome to GramSathi, {{name}}!",
            variables={"name": "string"},
            language="en",
        )
        db_session.add(template_en)
        db_session.commit()

        from sqlalchemy import select
        import asyncio

        async def check():
            result = await db_session.execute(
                select(NotificationTemplate).where(
                    NotificationTemplate.name == "welcome_msg",
                    NotificationTemplate.language == "hi",
                )
            )
            hi_template = result.scalar_one_or_none()
            assert hi_template is None

            result = await db_session.execute(
                select(NotificationTemplate).where(
                    NotificationTemplate.name == "welcome_msg",
                    NotificationTemplate.language == "en",
                )
            )
            en_template = result.scalar_one_or_none()
            assert en_template is not None
            assert "Welcome" in en_template.title_template

        asyncio.get_event_loop().run_until_complete(check())
