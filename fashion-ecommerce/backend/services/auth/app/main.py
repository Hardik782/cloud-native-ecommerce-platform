"""
Auth Service - Authentication and User Management
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import auth, users
from app.core.database import engine, Base
from app.core.metrics import setup_metrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    logger.info("Starting Auth Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
    yield
    # Shutdown
    logger.info("Shutting down Auth Service...")
    await engine.dispose()


app = FastAPI(
    title="Auth Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics
setup_metrics(app, service_name="auth")

# Include all routers under /auth prefix
# This means all endpoints will be available at /auth/*
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/auth/users", tags=["users"])


@app.get("/api/auth/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "auth"}


@app.get("/health")
async def health_check_root():
    """Root health check endpoint."""
    return {"status": "healthy", "service": "auth"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from app.core.metrics import get_metrics
    return get_metrics()