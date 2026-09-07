from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.common.dependencies import get_db
from app.common.pagination import PaginationParams, pagination_params
from app.modules.products.schemas import ProductCreate, ProductList, ProductRead
from app.modules.products.service import ProductService

router = APIRouter(prefix="/api/products", tags=["products"])
service = ProductService()


@router.get("", response_model=ProductList)
def list_products(
    pagination: Annotated[PaginationParams, Depends(pagination_params)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductList:
    return service.list_products(db, skip=pagination.skip, limit=pagination.limit)


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    return service.get_product(db, product_id)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    return service.create_product(db, payload)
