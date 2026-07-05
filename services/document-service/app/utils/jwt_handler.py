from jose import JWTError, jwt

from app.config import settings


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True},
        )
        return payload
    except JWTError as e:
        raise ValueError(f"Invalid token: {str(e)}")
