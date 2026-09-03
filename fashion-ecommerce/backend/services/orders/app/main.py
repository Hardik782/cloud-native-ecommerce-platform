"""
Order Service - Order processing and management.
"""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.database import engine, Base
from app.core.metrics import setup_metrics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Order Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
    yield
    logger.info("Shutting down Order Service...")
    await engine.dispose()


app = FastAPI(
    title="Order Service",
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

setup_metrics(app, service_name="order-service")

# Create router for order endpoints
order_router = APIRouter(prefix="/api/orders", tags=["orders"])

@order_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "order-service"}

@order_router.get("/my-orders")
async def get_my_orders():
    """Order history is not implemented yet; always return the documented shape."""
    return {"orders": []}

@order_router.post("/")
async def create_order():
    return {"message": "Create order endpoint"}

@order_router.get("/{order_id}")
async def get_order(order_id: str):
    return {"message": f"Get order {order_id}"}

app.include_router(order_router)

@app.get("/health")
async def health_check_root():
    return {"status": "healthy", "service": "order-service"}


@app.get("/metrics")
async def metrics():
    from app.core.metrics import get_metrics
    return get_metrics()