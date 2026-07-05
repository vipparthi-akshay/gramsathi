import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import jwt as pyjwt
import pytest

from auth_service.app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    get_password_hash,
    hash_otp,
    verify_otp,
    verify_password,
    verify_refresh_token,
)


@pytest.fixture
def jwt_keys():
    return {
        "private": """-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0vL1mE6GZ0lG5fJbL0Y2L1v5v5v5v5v5v5v5v5v5v5v5v5v5
v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5
-----END RSA PRIVATE KEY-----""",
        "public": """-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vL1mE6GZ0lG5fJbL0Y2
L1v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5v5
-----END PUBLIC KEY-----""",
    }


class TestJWTSigning:
    def test_jwt_rs256_signing(self):
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id, "citizen")
        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert payload["role"] == "citizen"
        assert payload["type"] == "access"
        assert "jti" in payload
        assert "iat" in payload
        assert "exp" in payload

    def test_jwt_tampered_token_rejected(self):
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id, "citizen")

        parts = token.split(".")
        tampered = parts[0] + "." + parts[1] + ".invalidsignature"

        with pytest.raises(ValueError, match="Invalid token"):
            decode_token(tampered)

    def test_jwt_expired_token_rejected(self):
        user_id = str(uuid.uuid4())

        from auth_service.app.utils.security import settings

        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "role": "citizen",
            "type": "access",
            "iat": now - timedelta(hours=2),
            "exp": now - timedelta(hours=1),
            "jti": str(uuid.uuid4()),
        }
        token = pyjwt.encode(payload, settings.JWT_PRIVATE_KEY, algorithm=settings.JWT_ALGORITHM)
        with pytest.raises(ValueError, match="Invalid token"):
            decode_token(token)

    def test_jwt_invalid_algorithm(self):
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "role": "citizen",
            "type": "access",
            "iat": now,
            "exp": now + timedelta(hours=1),
            "jti": str(uuid.uuid4()),
        }
        token = pyjwt.encode(payload, "secret", algorithm="HS256")

        with pytest.raises(ValueError, match="Invalid token"):
            decode_token(token)

    def test_refresh_token_type_check(self):
        user_id = str(uuid.uuid4())
        refresh_token = create_refresh_token(user_id)
        payload = verify_refresh_token(refresh_token)
        assert payload["type"] == "refresh"

        access_token = create_access_token(user_id, "citizen")
        with pytest.raises(ValueError, match="refresh"):
            verify_refresh_token(access_token)

    def test_refresh_token_structure(self):
        user_id = str(uuid.uuid4())
        token = create_refresh_token(user_id)
        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
        assert "jti" in payload


class TestPasswordHashing:
    def test_password_hashing_bcrypt_round_trip(self):
        passwords = [
            "SimplePass1!",
            "Complex@123#Secure",
            "a" * 50,
            "1234567890",
            "  spaces around  ",
        ]
        for password in passwords:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed) is True
            assert verify_password(password + "wrong", hashed) is False

    def test_password_hashing_unique_salts(self):
        hashes = [get_password_hash("samepassword") for _ in range(5)]
        assert len(set(hashes)) == 5

    def test_bcrypt_hash_format(self):
        hashed = get_password_hash("testpassword")
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$")


class TestAadhaarHashing:
    def test_aadhaar_hashing_sha256_consistent(self):
        aadhaar = "1234-5678-9012"
        hash1 = hashlib.sha256(aadhaar.encode()).hexdigest()
        hash2 = hashlib.sha256(aadhaar.encode()).hexdigest()
        assert hash1 == hash2
        assert len(hash1) == 64

    def test_aadhaar_hashing_different_values(self):
        aadhaar1 = "1234-5678-9012"
        aadhaar2 = "9876-5432-1098"
        hash1 = hashlib.sha256(aadhaar1.encode()).hexdigest()
        hash2 = hashlib.sha256(aadhaar2.encode()).hexdigest()
        assert hash1 != hash2

    def test_aadhaar_hashing_not_reversible(self):
        aadhaar = "1111-2222-3333"
        hashed = hashlib.sha256(aadhaar.encode()).hexdigest()
        assert aadhaar not in hashed


class TestRateLimiterSlidingWindow:
    @pytest.mark.asyncio
    async def test_sliding_window_count_tracking(self, redis_client):
        from auth_service.app.utils.rate_limiter import RateLimiter

        limiter = RateLimiter(redis_client)
        key = "test:sliding"

        for i in range(5):
            allowed = await limiter.check_rate_limit(key, 5, 60)
            assert allowed, f"Request {i+1} should be allowed"

        allowed = await limiter.check_rate_limit(key, 5, 60)
        assert not allowed, "6th request should be blocked"

        remaining = await limiter.get_remaining(key, 5, 60)
        assert remaining == 0

    @pytest.mark.asyncio
    async def test_sliding_window_old_entries_removed(self, redis_client):
        import time

        limiter = RateLimiter(redis_client)
        key = "test:sliding:old"

        now = int(time.time())
        await redis_client.zadd(key, {now - 100: now - 100, now - 50: now - 50, now: now})
        await redis_client.expire(key, 60)

        remaining = await limiter.get_remaining(key, 5, 30)
        assert remaining >= 0

    @pytest.mark.asyncio
    async def test_concurrent_rate_limit_keys(self, redis_client):
        limiter = RateLimiter(redis_client)
        keys = [f"test:concurrent:{i}" for i in range(10)]

        for key in keys:
            allowed = await limiter.check_rate_limit(key, 3, 60)
            assert allowed

    @pytest.mark.asyncio
    async def test_retry_after_calculation(self, redis_client):
        limiter = RateLimiter(redis_client)
        key = "test:retryafter"

        for i in range(3):
            await limiter.check_rate_limit(key, 3, 60)

        allowed = await limiter.check_rate_limit(key, 3, 60)
        assert not allowed

        retry_after = await limiter.get_retry_after(key, 60)
        assert retry_after >= 0


class TestSQLInjectionPrevention:
    def test_special_chars_in_inputs_safe(self):
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1; SELECT * FROM admin;",
            "' OR '1'='1",
            "'; EXEC xp_cmdshell('dir'); --",
            "<script>alert('xss')</script>",
            "${system('rm -rf /')}",
            "admin'--",
            "1 UNION SELECT * FROM passwords",
            "'; DELETE FROM otp_records; --",
        ]

        for inp in malicious_inputs:
            otp = generate_otp()
            assert len(otp) == 6
            assert otp.isdigit()

            hashed = hash_otp(inp + otp)
            assert verify_otp(inp + otp, hashed) is True
            assert verify_otp("wrong", hashed) is False

    def test_sql_injection_otp_verify(self):
        malicious_otps = [
            "' OR '1'='1",
            "123456'; DROP TABLE otp_records; --",
            "'; SELECT * FROM users; --",
        ]
        for otp_str in malicious_otps:
            hashed = hash_otp(otp_str)
            assert verify_otp(otp_str, hashed) is True

            assert verify_otp("000000", hashed) is False

    def test_mobile_number_validation_pattern(self):
        import re

        pattern = r"^\+?[1-9]\d{9,14}$"
        valid = [
            "+919876543210",
            "+911234567890",
            "919876543210",
        ]
        invalid = [
            "",
            "+",
            "123",
            "+91234",
            "abcd",
            "+9100000000000",
        ]
        for v in valid:
            assert re.match(pattern, v), f"Should be valid: {v}"
        for inv in invalid:
            assert not re.match(pattern, inv), f"Should be invalid: {inv}"
