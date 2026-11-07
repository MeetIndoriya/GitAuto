import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"

    # Security
    SESSION_SECRET: str = "dev-secret-session-key-must-be-at-least-32-chars-long"
    MASTER_ENCRYPTION_KEY: str = "dev-master-encryption-key-32-bytes-long!!"
    SESSION_COOKIE_NAME: str = "gitauto_session"
    SESSION_MAX_AGE_DAYS: int = 14
    COOKIE_SECURE: bool = False
    COOKIE_SAME_SITE: str = "lax"

    # GitHub OAuth 2.0 Configuration
    GITHUB_CLIENT_ID: Optional[str] = "Ov23liqMpIvxYOHYvCch"
    GITHUB_CLIENT_SECRET: Optional[str] = "d92682c859a8e0596927d581fa5c111b2cc47349"
    GITHUB_REDIRECT_URI: Optional[str] = "https://github--auto.vercel.app/login/api/v1/auth/github/callback"
    AUTHORIZED_GITHUB_USER: Optional[str] = "*"  # Commercial multi-tenant mode: allows any GitHub user

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./gitauto.db"

    # Automation Engine
    DEFAULT_BRANCH: str = "main"
    RATE_LIMIT_WARNING_THRESHOLD: int = 5
    REQUEST_TIMEOUT_SECONDS: float = 10.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
