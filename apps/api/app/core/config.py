from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://symbio:symbio@localhost:5432/symbio"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALG: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 120

    CORS_ORIGINS: str = "http://localhost:3000"
    WEB_BASE_URL: str = "http://localhost:3000"
    API_BASE_URL: str = "http://127.0.0.1:8000"

    MEILI_URL: str = "http://localhost:7700"
    MEILI_MASTER_KEY: str = "masterKey"

    S3_ENDPOINT: str = "http://localhost:9010"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_REGION: str = "us-east-1"
    S3_BUCKET: str = "symbio"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@symbio.local"
    EMAIL_DEV_LOG: bool = True

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    STEAM_API_KEY: str = ""

    PAYMENT_PROVIDER: str = "mock"
    YUKASSA_SHOP_ID: str = ""
    YUKASSA_SECRET_KEY: str = ""
    CLOUDPAYMENTS_PUBLIC_ID: str = ""
    CLOUDPAYMENTS_API_SECRET: str = ""

    DEFAULT_COMMISSION_PERCENT: float = 15.0

    CRON_SECRET: str = ""


settings = Settings()
