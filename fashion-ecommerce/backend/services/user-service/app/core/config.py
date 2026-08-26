"""
User service configuration.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SERVICE_NAME: str = "user-service"
    SERVICE_PORT: int = 8000
    DATABASE_URL: str = "postgresql://postgres:postgres123@postgres:5432/users_db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()