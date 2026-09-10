"""
User service configuration.

All values are read from environment variables instead of being hardcoded.
Values are injected by:
  - Docker Compose: from the root `.env` file (see docker-compose.yml)
  - Kubernetes: from the `ecommerce-secrets` Secret (see gitops/secrets.yml)
  - Local development: from a `.env` file placed next to this service
"""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Service
    SERVICE_NAME: str = Field(min_length=1)
    SERVICE_PORT: int = Field(ge=1, le=65535)

    # Database (format: postgresql://user:password@host:port/database)
    DATABASE_URL: str = Field(min_length=1)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()