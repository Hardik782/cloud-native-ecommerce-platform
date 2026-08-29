"""
Product Service - Product catalog management.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import products, categories
from app.core.database import engine, Base
from app.core.metrics import setup_metrics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager."""
    logger.info("Starting Product Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
    yield
    logger.info("Shutting down Product Service...")
    await engine.dispose()


app = FastAPI(
    title="Product Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

setup_metrics(app, service_name="product-service")


# ============================================
# Health checks - keep these at the app level,
# NOT in the products router
# ============================================

@app.get("/api/products/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "product-service"}


@app.get("/health")
async def health_check_root():
    """Root health check."""
    return {"status": "healthy", "service": "product-service"}

# Include routers
app.include_router(categories.router, prefix="/api/products/categories", tags=["categories"])
app.include_router(products.router, prefix="/api/products", tags=["products"])


@app.get("/metrics")
async def metrics():
    from app.core.metrics import get_metrics
    return get_metrics()