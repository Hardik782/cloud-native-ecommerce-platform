"""
User Service - User profile and preferences management.
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
    logger.info("Starting User Service...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
    yield
    logger.info("Shutting down User Service...")
    await engine.dispose()


app = FastAPI(
    title="User Service",
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

setup_metrics(app, service_name="user-service")

# Create router for user endpoints
user_router = APIRouter(prefix="/api/users", tags=["users"])

@user_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "user-service"}

@user_router.get("/me")
async def get_current_user():
    return {"message": "Current user profile"}

@user_router.put("/me")
async def update_user():
    return {"message": "Update user"}

@user_router.post("/addresses")
async def add_address():
    return {"message": "Add address"}

app.include_router(user_router)

@app.get("/health")
async def health_check_root():
    return {"status": "healthy", "service": "user-service"}

@app.get("/metrics")
async def metrics():
    from app.core.metrics import get_metrics
    return get_metrics()