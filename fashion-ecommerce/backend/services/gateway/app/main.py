"""
Gateway Service - API Gateway routing all requests.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.metrics import setup_metrics
from app.routes import proxy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager."""
    logger.info("Starting Gateway Service...")
    app.state.client = httpx.AsyncClient(timeout=30.0)
    yield
    logger.info("Shutting down Gateway Service...")
    await app.state.client.aclose()


app = FastAPI(
    title="Gateway Service",
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
setup_metrics(app, service_name="gateway")

# Include proxy routes
app.include_router(proxy.router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "gateway"}


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from app.core.metrics import get_metrics
    return get_metrics()