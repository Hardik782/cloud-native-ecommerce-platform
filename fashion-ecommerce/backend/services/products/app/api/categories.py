"""
Category API endpoints.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.core.database import get_db
from app.models.product import Category, Product
from app.schemas.category import CategoryResponse, CategoryListResponse

router = APIRouter()


@router.get("/", response_model=CategoryListResponse)
async def get_categories(
    gender: Optional[str] = Query(None, regex="^(men|women|unisex|all)$"),
    db: AsyncSession = Depends(get_db),
):
    """Get all categories with product counts."""
    query = select(
        Category,
        func.count(Product.id).label("product_count")
    ).outerjoin(Product, Product.category_id == Category.id)
    
    # Apply gender filter
    if gender and gender != 'all':
        if gender == 'unisex':
            query = query.where(Category.gender == 'unisex')
        else:
            query = query.where(Category.gender == gender)
    
    query = query.group_by(Category.id).order_by(Category.name)
    
    result = await db.execute(query)
    rows = result.all()
    
    categories = []
    for row in rows:
        category = row[0]
        product_count = row[1] or 0
        categories.append(CategoryResponse(
            id=category.id,
            name=category.name,
            description=category.description,
            image_url=category.image_url,
            product_count=product_count,
        ))
    
    return CategoryListResponse(categories=categories)