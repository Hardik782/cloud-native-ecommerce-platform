"""
Orders Management Service
"""
from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest, REGISTRY
import logging
import time
from typing import Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Orders Management Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Metrics Definitions
# ============================================

http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code', 'service']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint', 'service'],
    buckets=(0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0)
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'HTTP requests currently in progress',
    ['service']
)

service_info = Gauge(
    'service_info',
    'Service information',
    ['service_name', 'version']
)

# Set service info
service_info.labels(service_name="orders-management", version="1.0.0").set(1)

# ============================================
# Metrics Middleware
# ============================================

@app.middleware("http")
async def metrics_middleware(request: Request, call_next: Callable) -> Response:
    """Middleware to collect HTTP metrics."""
    start_time = time.time()
    service_name = "orders-management"
    
    http_requests_in_progress.labels(service=service_name).inc()
    
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        
        http_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
            service=service_name
        ).inc()
        
        http_request_duration_seconds.labels(
            method=request.method,
            endpoint=request.url.path,
            service=service_name
        ).observe(duration)
        
        return response
    finally:
        http_requests_in_progress.labels(service=service_name).dec()

# ============================================
# Routes
# ============================================

# Create router for order management endpoints
orders_router = APIRouter(prefix="/api/orders-management", tags=["orders-management"])

@orders_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "orders-management"}

@orders_router.get("/")
async def get_all_orders():
    return {"message": "Get all orders"}

@orders_router.get("/{order_id}")
async def get_order(order_id: str):
    return {"message": f"Get order {order_id}"}

app.include_router(orders_router)

# Root health check
@app.get("/health")
async def health_check_root():
    return {"status": "healthy", "service": "orders-management"}

# ============================================
# Metrics Endpoint
# ============================================

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")