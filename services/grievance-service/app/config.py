from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Grievance Service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/grievance_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_PUBLIC_KEY: str
    JWT_ALGORITHM: str = "RS256"

    SENTRY_DSN: Optional[str] = None
    GCP_PROJECT_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    AI_SERVICE_URL: str = "http://ai-service:8000"
    GEMINI_API_KEY: Optional[str] = None

    CPGRAMS_API_ENABLED: bool = False
    CPGRAMS_API_URL: Optional[str] = None
    CPGRAMS_API_KEY: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


settings = Settings()
