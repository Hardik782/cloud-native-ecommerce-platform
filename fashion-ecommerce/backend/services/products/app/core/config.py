"""
Product service configuration.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    SERVICE_NAME: str = "product-service"
    SERVICE_PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres123@postgres:5432/products_db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()