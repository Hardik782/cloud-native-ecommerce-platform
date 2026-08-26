"""
Gateway configuration.
"""
from pydantic_settings import BaseSettings
from typing import Dict


class Settings(BaseSettings):
    """Application settings."""
    
    SERVICE_NAME: str = "gateway"
    SERVICE_PORT: int = 8000
    
    # Service URLs - these must match the container names in docker-compose
    AUTH_SERVICE_URL: str = "http://fashion-ecommerce-auth:8000"
    PRODUCT_SERVICE_URL: str = "http://fashion-ecommerce-products:8000"
    ORDER_SERVICE_URL: str = "http://fashion-ecommerce-orders:8000"
    ORDERS_SERVICE_URL: str = "http://fashion-ecommerce-orders-management:8000"
    USER_SERVICE_URL: str = "http://fashion-ecommerce-users:8000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()