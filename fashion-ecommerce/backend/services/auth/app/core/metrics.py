"""
Prometheus metrics utilities.
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, REGISTRY
from fastapi import Request, Response
import time
from typing import Callable


# Metrics definitions
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


def setup_metrics(app, service_name: str, version: str = "1.0.0"):
    """Setup metrics middleware and endpoints."""
    
    # Set service info
    service_info.labels(service_name=service_name, version=version).set(1)
    
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next: Callable) -> Response:
        """Middleware to collect HTTP metrics."""
        start_time = time.time()
        
        # Increment in-progress requests
        http_requests_in_progress.labels(service=service_name).inc()
        
        try:
            response = await call_next(request)
            duration = time.time() - start_time
            
            # Record metrics
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
    
    @app.get("/metrics")
    async def metrics_endpoint():
        """Prometheus metrics endpoint."""
        return Response(content=generate_latest(REGISTRY), media_type="text/plain")


def get_metrics():
    """Get current metrics."""
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")
