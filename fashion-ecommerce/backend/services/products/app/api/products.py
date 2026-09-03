"""
Product API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import Optional, List
import math
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import Product, ProductStatus
from app.schemas.product import ProductResponse, ProductListResponse

router = APIRouter()

# ============================================
# IMPORTANT: Specific routes must come BEFORE
# dynamic routes like /{product_id}
# ============================================

@router.get("/genders")
async def get_genders():
    """Get available genders."""
    return ["men", "women", "unisex", "all"]


@router.get("/", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    gender: Optional[str] = Query(None, regex="^(men|women|unisex|all)$"),
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: str = Query("created_at", regex="^(created_at|price|name)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
):
    """Get products with filtering and pagination."""
    
    query = select(Product).where(Product.status == ProductStatus.PUBLISHED).options(
        selectinload(Product.images),
        selectinload(Product.sizes),
        selectinload(Product.category)
    )
    
    # Apply gender filter
    # NOTE: unisex products are only shown under the "Unisex" tab and
    # the "All" view; they must NOT appear in the Men/Women listings.
    if gender and gender != 'all':
        query = query.where(Product.gender == gender)
    
    # Apply category filter
    if category:
        query = query.where(Product.category.has(name=category))
    
    # Apply search filter
    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%"),
            )
        )
    
    # Apply price filters
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    
    # Apply sorting
    if sort_by == "created_at":
        col = Product.created_at
    elif sort_by == "price":
        col = Product.price
    else:
        col = Product.name
    
    if sort_order == "desc":
        query = query.order_by(col.desc())
    else:
        query = query.order_by(col.asc())
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    total_pages = math.ceil(total / limit)
    
    return ProductListResponse(
        products=[ProductResponse.model_validate(p) for p in products],
        pagination={
            "current_page": page,
            "total_pages": total_pages,
            "total": total,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a single product by ID."""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.status == ProductStatus.PUBLISHED
        ).options(
            selectinload(Product.images),
            selectinload(Product.sizes),
            selectinload(Product.category)
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return ProductResponse.model_validate(product)