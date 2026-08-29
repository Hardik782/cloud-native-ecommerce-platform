"""
Product Pydantic schemas.
"""
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


class ProductImageBase(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_primary: bool = False
    sort_order: int = 0


class ProductImageResponse(ProductImageBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)


class ProductSizeBase(BaseModel):
    size: str
    gender: Optional[str] = 'unisex'
    inventory_quantity: int = 0
    sku_suffix: Optional[str] = None


class ProductSizeResponse(ProductSizeBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = 'unisex'
    price: Decimal = Field(..., gt=0)
    compare_price: Optional[Decimal] = Field(None, gt=0)
    inventory_quantity: int = Field(0, ge=0)
    is_featured: bool = False


class ProductCreate(ProductBase):
    category_id: Optional[UUID] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=100)
    brand: Optional[str] = Field(None, max_length=100)
    gender: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    compare_price: Optional[Decimal] = Field(None, gt=0)
    inventory_quantity: Optional[int] = Field(None, ge=0)
    is_featured: Optional[bool] = None
    category_id: Optional[UUID] = None


class ProductResponse(ProductBase):
    id: UUID
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None
    is_featured: bool
    is_active: bool
    status: str
    images: List[ProductImageResponse] = []
    sizes: List[ProductSizeResponse] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    pagination: dict