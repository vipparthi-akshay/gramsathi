import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> dict:
    token = credentials.credentials
    payload = None

    if settings.JWT_PUBLIC_KEY:
        try:
            payload = jwt.decode(
                token,
                settings.JWT_PUBLIC_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError:
            payload = None

    if payload is None:
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{settings.AUTH_SERVICE_URL}/api/v1/auth/verify",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=10.0,
                )
                if resp.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired token",
                    )
                payload = resp.json()
        except httpx.RequestError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth service unavailable",
            )

    return {
        "id": payload.get("id") or payload.get("user_id"),
        "email": payload.get("email"),
        "role": payload.get("role", "citizen"),
        "is_admin": payload.get("is_admin", False),
    }


async def get_admin_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    if not current_user.get("is_admin") and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def get_gov_officer(
    current_user: dict = Depends(get_current_user),
) -> dict:
    allowed_roles = {"admin", "gov_officer", "tehsildar", "sdo"}
    if current_user.get("role") not in allowed_roles and not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Government officer access required",
        )
    return current_user


async def get_db_session(
    db: AsyncSession = Depends(get_db),
) -> AsyncSession:
    return db
