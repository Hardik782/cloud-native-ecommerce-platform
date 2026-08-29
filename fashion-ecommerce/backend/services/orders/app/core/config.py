"""
Order service configuration.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    SERVICE_NAME: str = "order-service"
    SERVICE_PORT: int = 8000
    
    DATABASE_URL: str = "postgresql://postgres:postgres123@postgres:5432/orders_db"
    AUTH_SERVICE_URL: str = "http://auth:8000"
    PRODUCT_SERVICE_URL: str = "http://product-service:8000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()