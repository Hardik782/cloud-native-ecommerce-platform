import enum
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
import uuid
from app.core.database import Base


class ProductStatus(str, enum.Enum):
    """Product status enum."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    
    def __str__(self):
        return self.value


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    gender = Column(String(20), default='unisex')
    image_url = Column(String(500), nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    products = relationship("Product", back_populates="category")
    children = relationship("Category", backref=backref("parent", remote_side=[id]))


class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), unique=True, nullable=True)
    description = Column(Text, nullable=True)
    short_description = Column(Text, nullable=True)
    sku = Column(String(100), unique=True, nullable=True)
    brand = Column(String(100), nullable=True)
    
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    gender = Column(String(20), default='unisex')
    
    price = Column(Numeric(10, 2), nullable=False)
    compare_price = Column(Numeric(10, 2), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)
    
    inventory_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=5)
    
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    status = Column(String(50), default='draft')
    product_metadata = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product")
    sizes = relationship("ProductSize", back_populates="product")


class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    image_url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    product = relationship("Product", back_populates="images")


class ProductSize(Base):
    __tablename__ = "product_sizes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    size = Column(String(20), nullable=False)
    gender = Column(String(20), default='unisex')
    inventory_quantity = Column(Integer, default=0)
    sku_suffix = Column(String(10), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    product = relationship("Product", back_populates="sizes")