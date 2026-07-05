import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.otp import OTPRecord
from app.models.session import Session
from app.models.user import User
from app.schemas.auth import (
    LogoutRequest,
    OTPVerifyRequest,
    OTPVerifyResponse,
    OTPSendRequest,
    OTPSendResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserOut,
)
from app.utils.dependencies import get_current_user
from app.utils.rate_limiter import RateLimiter
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_otp,
    verify_otp,
    verify_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_rate_limiter(request: Request) -> RateLimiter:
    return request.app.state.rate_limiter


@router.post("/otp/send", response_model=OTPSendResponse)
async def send_otp(
    body: OTPSendRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
):
    mobile = body.mobile_number
    rate_key = f"otp_send:{mobile}"

    if settings.RATE_LIMIT_ENABLED:
        allowed = await rate_limiter.check_rate_limit(
            rate_key,
            settings.RATE_LIMIT_OTP_SEND,
            settings.RATE_LIMIT_OTP_WINDOW_SECONDS,
        )
        if not allowed:
            retry_after = await rate_limiter.get_retry_after(
                rate_key,
                settings.RATE_LIMIT_OTP_WINDOW_SECONDS,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            )

    result = await db.execute(
        select(OTPRecord).where(
            OTPRecord.mobile_number == mobile,
            OTPRecord.purpose == "login",
            OTPRecord.is_used.is_(False),
            OTPRecord.expires_at > datetime.now(timezone.utc),
        ).order_by(OTPRecord.created_at.desc())
    )
    existing_otp = result.scalar_one_or_none()
    if existing_otp:
        seconds_since_creation = (
            datetime.now(timezone.utc) - existing_otp.created_at
        ).total_seconds()
        if seconds_since_creation < settings.OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_RESEND_COOLDOWN_SECONDS - seconds_since_creation)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new OTP.",
            )

    otp = generate_otp()
    otp_hash = hash_otp(otp)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.OTP_EXPIRE_MINUTES
    )

    otp_record = OTPRecord(
        mobile_number=mobile,
        otp_hash=otp_hash,
        purpose="login",
        expires_at=expires_at,
    )
    db.add(otp_record)
    await db.flush()

    debug_otp = otp if settings.APP_ENV == "development" else None

    return OTPSendResponse(
        success=True,
        message="OTP sent successfully",
        expires_in=settings.OTP_EXPIRE_MINUTES * 60,
        debug_otp=debug_otp,
    )


@router.post("/otp/verify", response_model=OTPVerifyResponse)
async def verify_otp_endpoint(
    body: OTPVerifyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
):
    mobile = body.mobile_number
    rate_key = f"otp_verify:{mobile}"

    if settings.RATE_LIMIT_ENABLED:
        allowed = await rate_limiter.check_rate_limit(
            rate_key,
            settings.RATE_LIMIT_LOGIN_ATTEMPTS,
            settings.RATE_LIMIT_LOGIN_WINDOW_SECONDS,
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many verification attempts. Please try again later.",
            )

    result = await db.execute(
        select(OTPRecord).where(
            OTPRecord.mobile_number == mobile,
            OTPRecord.purpose == "login",
            OTPRecord.is_used.is_(False),
            OTPRecord.expires_at > datetime.now(timezone.utc),
        ).order_by(OTPRecord.created_at.desc()).limit(1)
    )
    otp_record = result.scalar_one_or_none()
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid OTP found. Please request a new OTP.",
        )

    otp_record.attempts += 1
    await db.flush()

    if otp_record.attempts > settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum OTP attempts exceeded. Please request a new OTP.",
        )

    if not verify_otp(body.otp, otp_record.otp_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please try again.",
        )

    otp_record.is_used = True
    await db.flush()

    result = await db.execute(
        select(User).where(User.mobile_number == mobile)
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            mobile_number=mobile,
            role="citizen",
            is_verified=True,
        )
        db.add(user)
        await db.flush()
    elif not user.is_verified:
        user.is_verified = True

    user.last_login_at = datetime.now(timezone.utc)

    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id))

    refresh_payload = decode_token(refresh_token)
    refresh_token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    session = Session(
        user_id=user.id,
        refresh_token_hash=refresh_token_hash,
        access_token_id=refresh_payload.get("jti"),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        ),
    )
    db.add(session)

    return OTPVerifyResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    body: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = verify_refresh_token(body.refresh_token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    user_id = payload.get("sub")
    refresh_token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()

    result = await db.execute(
        select(Session).where(
            Session.refresh_token_hash == refresh_token_hash,
            Session.is_revoked.is_(False),
            Session.expires_at > datetime.now(timezone.utc),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or expired.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    access_token = create_access_token(str(user.id), user.role)

    return TokenRefreshResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    refresh_token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()

    result = await db.execute(
        select(Session).where(Session.refresh_token_hash == refresh_token_hash)
    )
    session = result.scalar_one_or_none()
    if session:
        session.is_revoked = True

    return None


@router.get("/me", response_model=UserOut)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return UserOut.model_validate(current_user)
