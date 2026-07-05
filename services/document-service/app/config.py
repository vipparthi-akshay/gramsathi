from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "Document Service"
    APP_ENV: str = "development"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/document_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_PUBLIC_KEY: str
    JWT_ALGORITHM: str = "RS256"

    SENTRY_DSN: Optional[str] = None
    GCP_PROJECT_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    GCS_BUCKET_NAME: str = "gramsathi-documents"
    GCS_PRESIGNED_URL_EXPIRY: int = 3600

    DOCUMENT_AI_PROCESSOR_AADHAAR: Optional[str] = None
    DOCUMENT_AI_PROCESSOR_INCOME: Optional[str] = None
    DOCUMENT_AI_PROCESSOR_LAND_RECORD: Optional[str] = None
    DOCUMENT_AI_PROCESSOR_BANK_PASSBOOK: Optional[str] = None

    MAX_FILE_SIZE_MB: int = 20
    ALLOWED_MIME_TYPES: str = "image/jpeg,image/png,image/tiff,application/pdf"

    OCR_CONFIDENCE_THRESHOLD: float = 0.7
    GEMINI_API_KEY: Optional[str] = None

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


settings = Settings()
