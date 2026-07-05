import httpx
from fastapi import HTTPException, Request, status

from app.config import settings
from app.services.bigquery_client import BigQueryClient

_bq_client: BigQueryClient | None = None


def get_bigquery_client() -> BigQueryClient:
    global _bq_client
    if _bq_client is None:
        _bq_client = BigQueryClient()
    return _bq_client


async def get_admin_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/v1/auth/me",
                headers={"Authorization": auth_header},
            )
            if resp.status_code == 200:
                user = resp.json()
                if user.get("role") not in ("admin", "super_admin"):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Admin access required",
                    )
                return user
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable",
        )


async def get_db_session():
    return None
