from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.products.models import Product
from app.modules.products.schemas import ProductCreate


class ProductRepository:
    def list(self, db: Session, *, skip: int, limit: int) -> list[Product]:
        statement = select(Product).where(Product.is_active.is_(True)).order_by(Product.id).offset(skip).limit(limit)
        return list(db.scalars(statement))

    def count(self, db: Session) -> int:
        return db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))) or 0

    def get(self, db: Session, product_id: int) -> Product | None:
        return db.get(Product, product_id)

    def create(self, db: Session, payload: ProductCreate) -> Product:
        product = Product(**payload.model_dump())
        db.add(product)
        db.commit()
        db.refresh(product)
        return product
