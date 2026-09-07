from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    price: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=10, decimal_places=2)


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class ProductList(BaseModel):
    items: list[ProductRead]
    total: int
    skip: int
    limit: int
