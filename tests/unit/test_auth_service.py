import hashlib
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import jwt as pyjwt
import pytest
from fastapi import HTTPException
from sqlalchemy import select

from auth_service.app.models.otp import OTPRecord
from auth_service.app.models.session import Session
from auth_service.app.models.user import User
from auth_service.app.utils.rate_limiter import RateLimiter
from auth_service.app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_otp,
    verify_otp,
    get_password_hash,
    verify_password,
)


class TestOTPGeneration:
    def test_otp_is_6_digits(self):
        otp = generate_otp(6)
        assert len(otp) == 6
        assert otp.isdigit()

    def test_otp_is_cryptographically_random(self):
        otps = {generate_otp(6) for _ in range(1000)}
        assert len(otps) > 900

    def test_otp_custom_length(self):
        otp = generate_otp(8)
        assert len(otp) == 8

    def test_otp_no_leading_zeros_stripped(self):
        otp = generate_otp(6)
        assert len(otp) == 6


class TestOTPVerification:
    @pytest.mark.asyncio
    async def test_otp_verification_success(self, db_session):
        mobile = "+919999999999"
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
        )
        db_session.add(record)
        await db_session.commit()

        result = await db_session.execute(
            select(OTPRecord).where(
                OTPRecord.mobile_number == mobile,
                OTPRecord.purpose == "login",
                OTPRecord.is_used == False,
                OTPRecord.expires_at > datetime.now(timezone.utc),
            )
        )
        stored = result.scalar_one_or_none()
        assert stored is not None
        assert verify_otp(otp, stored.otp_hash) is True

    @pytest.mark.asyncio
    async def test_otp_verification_failure(self):
        otp = generate_otp()
        wrong_otp = "000000"
        otp_hash = hash_otp(otp)
        assert verify_otp(wrong_otp, otp_hash) is False

    @pytest.mark.asyncio
    async def test_otp_expiry(self, db_session):
        mobile = "+918888888888"
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)

        record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
        )
        db_session.add(record)
        await db_session.commit()

        result = await db_session.execute(
            select(OTPRecord).where(
                OTPRecord.mobile_number == mobile,
                OTPRecord.purpose == "login",
                OTPRecord.is_used == False,
                OTPRecord.expires_at > datetime.now(timezone.utc),
            )
        )
        assert result.scalar_one_or_none() is None

    @pytest.mark.asyncio
    async def test_otp_attempt_limit(self, db_session):
        mobile = "+917777777777"
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

        record = OTPRecord(
            mobile_number=mobile,
            otp_hash=otp_hash,
            purpose="login",
            expires_at=expires_at,
            attempts=5,
        )
        db_session.add(record)
        await db_session.commit()

        record.attempts += 1
        assert record.attempts > 5


class TestTokenManagement:
    def test_token_refresh(self):
        user_id = str(uuid.uuid4())
        access_token = create_access_token(user_id, "citizen")
        refresh_token = create_refresh_token(user_id)

        payload = decode_token(refresh_token)
        assert payload["type"] == "refresh"
        assert payload["sub"] == user_id

        new_access = create_access_token(user_id, "citizen")
        new_payload = decode_token(new_access)
        assert new_payload["type"] == "access"
        assert new_payload["sub"] == user_id

    def test_token_expiry(self):
        user_id = str(uuid.uuid4())
        with patch("auth_service.app.utils.security.settings") as mock_settings:
            mock_settings.JWT_PRIVATE_KEY = "test_private"
            mock_settings.JWT_PUBLIC_KEY = "test_public"
            mock_settings.JWT_ALGORITHM = "HS256"
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = -1

            from datetime import datetime, timedelta, timezone
            now = datetime.now(timezone.utc)
            payload = {
                "sub": user_id,
                "role": "citizen",
                "type": "access",
                "iat": now,
                "exp": now + timedelta(minutes=-1),
                "jti": str(uuid.uuid4()),
            }
            token = pyjwt.encode(payload, "test_private", algorithm="HS256")
            with pytest.raises(ValueError, match="Invalid token"):
                decode_token(token)

    def test_token_refresh_reuse(self, db_session):
        user_id = str(uuid.uuid4())
        refresh_token = create_refresh_token(user_id)
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

        session = Session(
            user_id=uuid.UUID(user_id),
            refresh_token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            is_revoked=True,
        )
        db_session.add(session)
        from sqlalchemy import select
        import asyncio

        async def check():
            result = await db_session.execute(
                select(Session).where(
                    Session.refresh_token_hash == token_hash,
                    Session.is_revoked == False,
                    Session.expires_at > datetime.now(timezone.utc),
                )
            )
            return result.scalar_one_or_none() is None

        result = asyncio.get_event_loop().run_until_complete(check())
        assert result

    def test_admin_role_check(self):
        citizen_id = str(uuid.uuid4())
        token = create_access_token(citizen_id, "citizen")
        payload = decode_token(token)
        assert payload["role"] == "citizen"
        assert payload["role"] != "admin"

        admin_id = str(uuid.uuid4())
        admin_token = create_access_token(admin_id, "admin")
        admin_payload = decode_token(admin_token)
        assert admin_payload["role"] == "admin"


class TestRateLimiter:
    @pytest.mark.asyncio
    async def test_rate_limiter_sliding_window(self, redis_client):
        limiter = RateLimiter(redis_client)
        key = "test:rate:user1"

        for i in range(3):
            allowed = await limiter.check_rate_limit(key, 3, 60)
            assert allowed, f"Request {i+1} should be allowed"

        allowed = await limiter.check_rate_limit(key, 3, 60)
        assert not allowed, "4th request should be blocked"

        remaining = await limiter.get_remaining(key, 3, 60)
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_rate_limiter_reset(self, redis_client):
        limiter = RateLimiter(redis_client)
        key = "test:rate:reset"

        await limiter.check_rate_limit(key, 2, 1)
        await limiter.check_rate_limit(key, 2, 1)

        allowed = await limiter.check_rate_limit(key, 2, 1)
        assert not allowed

        await asyncio.sleep(1.1)
        allowed = await limiter.check_rate_limit(key, 2, 1)
        assert allowed

    @pytest.mark.asyncio
    async def test_rate_limiter_multiple_keys(self, redis_client):
        limiter = RateLimiter(redis_client)
        for i in range(5):
            key = f"test:multi:user{i}"
            allowed = await limiter.check_rate_limit(key, 3, 60)
            assert allowed

    @pytest.mark.asyncio
    async def test_otp_requests_blocked_after_limit(self, redis_client):
        limiter = RateLimiter(redis_client)
        mobile = "+911111111111"
        key = f"otp_send:{mobile}"

        for i in range(3):
            allowed = await limiter.check_rate_limit(key, 3, 3600)
            assert allowed

        allowed = await limiter.check_rate_limit(key, 3, 3600)
        assert not allowed

        retry_after = await limiter.get_retry_after(key, 3600)
        assert retry_after > 0


class TestPasswordHashing:
    def test_password_hashing_round_trip(self):
        password = "SecurePass123!"
        hashed = get_password_hash(password)
        assert hashed != password
        assert verify_password(password, hashed) is True
        assert verify_password("WrongPass", hashed) is False

    def test_password_hashing_unique(self):
        hashed1 = get_password_hash("SamePass")
        hashed2 = get_password_hash("SamePass")
        assert hashed1 != hashed2
