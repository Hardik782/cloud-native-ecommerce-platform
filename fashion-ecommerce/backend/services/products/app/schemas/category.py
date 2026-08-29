"""
Category Pydantic schemas.
"""
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, List


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: UUID
    product_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class CategoryListResponse(BaseModel):
    categories: List[CategoryResponse]
