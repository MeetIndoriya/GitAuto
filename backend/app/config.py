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

    # Optional GitHub OAuth configuration (dynamic token auth used by default)
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_REDIRECT_URI: Optional[str] = None
    AUTHORIZED_GITHUB_USER: Optional[str] = "octocat"

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
