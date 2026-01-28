"""
Configuration settings for the backend application.
Uses Pydantic Settings for environment variable management.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "Light Encounter Tabernacle API"
    DEBUG: bool = True
    
    # Database (PostgreSQL)
    # Format: postgresql+asyncpg://user:password@host:port/database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/letw_db"
    
    # JWT Authentication
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email Settings
    # Resend API (recommended for production)
    RESEND_API_KEY: str = ""  # Get from https://resend.com/api-keys

    # SMTP Settings (fallback if Resend not configured)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Email sender details
    EMAIL_FROM_NAME: str = "Light Encounter Tabernacle"
    EMAIL_FROM_ADDRESS: str = "noreply@letw.org"
    EMAIL_ENABLED: bool = False  # Set to True when email is configured
    
    # Frontend URL (for verification links)
    FRONTEND_URL: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
