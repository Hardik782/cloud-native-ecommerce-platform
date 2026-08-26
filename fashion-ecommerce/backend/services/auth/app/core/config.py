"""
Auth service configuration.
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    SERVICE_NAME: str = "auth"
    SERVICE_PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres123@postgres:5432/auth_db"
    
    # JWT
    JWT_SECRET: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_IN: int = 3600  # 1 hour
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()