"""
Proxy routing for API Gateway.
"""
from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
import httpx
from typing import Dict

from app.core.config import settings

router = APIRouter(prefix="/api", tags=["proxy"])

# Map service prefixes to their base URLs
SERVICE_ROUTES: Dict[str, str] = {
    "/auth": settings.AUTH_URL,
    "/products": settings.PRODUCTS_URL,
    "/orders": settings.ORDERS_URL,
    "/users": settings.USERS_URL,
}


def get_service_url(path: str) -> str:
    """Get the service URL for a given path."""
    for prefix, url in SERVICE_ROUTES.items():
        if path.startswith(prefix):
            return url
    return None


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def proxy(request: Request, path: str):
    """Proxy requests to the appropriate service."""
    service_url = get_service_url(f"/{path}")
    
    if not service_url:
        return JSONResponse(
            status_code=404,
            content={"error": f"Service not found for path: /{path}"}
        )
    
    # Build target URL - preserve the full path
    target_url = f"{service_url}/api/{path}"
    
    if request.query_params:
        target_url += f"?{request.query_params}"
    
    headers = dict(request.headers)
    headers.pop("host", None)
    
    client: httpx.AsyncClient = request.app.state.client
    
    try:
        response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=await request.body() if request.method in ["POST", "PUT", "PATCH"] else None,
        )
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers),
        )
        
    except httpx.TimeoutException:
        return JSONResponse(
            status_code=504,
            content={"error": "Gateway timeout", "service": service_url}
        )
    except httpx.ConnectError:
        return JSONResponse(
            status_code=503,
            content={"error": "Service unavailable", "service": service_url}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )