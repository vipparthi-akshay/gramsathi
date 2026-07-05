from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "GramSathi Citizen Service"
    APP_ENV: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/gramsathi_citizen"
    REDIS_URL: str = "redis://localhost:6379/0"

    AUTH_SERVICE_URL: str = "http://auth-service:8000"
    JWT_ALGORITHM: str = "RS256"
    JWT_PUBLIC_KEY: str = ""

    SENTRY_DSN: str = ""

    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
