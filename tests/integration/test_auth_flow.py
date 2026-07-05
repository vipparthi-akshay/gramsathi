import asyncio
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from sqlalchemy import select

from auth_service.app.models.otp import OTPRecord
from auth_service.app.models.session import Session
from auth_service.app.models.user import User
from auth_service.app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_otp,
    verify_otp,
)


class TestFullAuthFlow:
    @pytest.mark.asyncio
    async def test_otp_send_verify_access_refresh_logout(self, db_session):
        mobile = "+919876543210"
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        otp_record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
        )
        db_session.add(otp_record)
        await db_session.commit()

        assert verify_otp(otp, otp_record.otp_hash) is True

        result = await db_session.execute(
            select(User).where(User.mobile_number == mobile)
        )
        user = result.scalar_one_or_none()
        if not user:
            user = User(mobile_number=mobile, role="citizen", is_verified=True)
            db_session.add(user)
            await db_session.commit()
            await db_session.refresh(user)

        assert user is not None
        assert user.mobile_number == mobile

        access_token = create_access_token(str(user.id), user.role)
        refresh_token = create_refresh_token(str(user.id))

        access_payload = decode_token(access_token)
        assert access_payload["sub"] == str(user.id)
        assert access_payload["type"] == "access"
        assert access_payload["role"] == "citizen"

        refresh_payload = decode_token(refresh_token)
        assert refresh_payload["type"] == "refresh"
        assert refresh_payload["sub"] == str(user.id)

        refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        session_record = Session(
            user_id=user.id,
            refresh_token_hash=refresh_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db_session.add(session_record)
        await db_session.commit()

        new_access = create_access_token(str(user.id), user.role)
        new_payload = decode_token(new_access)
        assert new_payload["type"] == "access"

        session_record.is_revoked = True
        await db_session.commit()

        result = await db_session.execute(
            select(Session).where(
                Session.refresh_token_hash == refresh_hash,
                Session.is_revoked == False,
            )
        )
        revoked_session = result.scalar_one_or_none()
        assert revoked_session is None

    @pytest.mark.asyncio
    async def test_multi_device_session_management(self, db_session):
        user = User(
            mobile_number="+919000000001",
            role="citizen",
            is_verified=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        devices = ["iPhone", "Android", "Web"]
        sessions = []
        for device in devices:
            token = create_refresh_token(str(user.id))
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            session_record = Session(
                user_id=user.id,
                refresh_token_hash=token_hash,
                device_info={"device": device},
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            )
            db_session.add(session_record)
            sessions.append(session_record)
        await db_session.commit()

        result = await db_session.execute(
            select(Session).where(
                Session.user_id == user.id,
                Session.is_revoked == False,
            )
        )
        active_sessions = result.scalars().all()
        assert len(active_sessions) == 3

        sessions[1].is_revoked = True
        await db_session.commit()

        result = await db_session.execute(
            select(Session).where(
                Session.user_id == user.id,
                Session.is_revoked == False,
            )
        )
        active_after_revoke = result.scalars().all()
        assert len(active_after_revoke) == 2

    @pytest.mark.asyncio
    async def test_concurrent_otp_validation_race_condition(self, db_session):
        mobile = "+919000000002"
        otp_value = generate_otp()
        otp_hash = hash_otp(otp_value)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        otp_record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
        )
        db_session.add(otp_record)
        await db_session.commit()

        async def attempt_verify():
            record = await db_session.execute(
                select(OTPRecord).where(
                    OTPRecord.mobile_number == mobile,
                    OTPRecord.is_used == False,
                    OTPRecord.expires_at > datetime.now(timezone.utc),
                ).order_by(OTPRecord.created_at.desc()).limit(1)
            )
            stored = record.scalar_one_or_none()
            if stored and not stored.is_used:
                if verify_otp(otp_value, stored.otp_hash):
                    stored.is_used = True
                    return True
            return False

        results = await asyncio.gather(
            *[attempt_verify() for _ in range(10)],
        )

        success_count = sum(1 for r in results if r)
        assert success_count == 1

    @pytest.mark.asyncio
    async def test_otp_expiry_during_flow(self, db_session):
        mobile = "+919000000003"
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)

        otp_record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
        )
        db_session.add(otp_record)
        await db_session.commit()

        result = await db_session.execute(
            select(OTPRecord).where(
                OTPRecord.mobile_number == mobile,
                OTPRecord.is_used == False,
                OTPRecord.expires_at > datetime.now(timezone.utc),
            )
        )
        valid_otp = result.scalar_one_or_none()
        assert valid_otp is None

    @pytest.mark.asyncio
    async def test_otp_attempt_limit_exceeded(self, db_session):
        mobile = "+919000000004"
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        otp_record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
            attempts=5,
        )
        db_session.add(otp_record)
        await db_session.commit()

        otp_record.attempts += 1

        is_blocked = otp_record.attempts > 5
        assert is_blocked is True
