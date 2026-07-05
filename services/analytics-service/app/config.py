from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Analytics Service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    GCP_PROJECT_ID: Optional[str] = None
    BIGQUERY_DATASET: str = "gramsathi_analytics"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/gramsathi"
    REDIS_URL: str = "redis://localhost:6379/0"
    AUTH_SERVICE_URL: str = "http://auth-service:8000"

    SENTRY_DSN: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    EXPORT_BUCKET: str = "gramsathi-exports-dev"
    EXPORT_EXPIRE_HOURS: int = 24

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
