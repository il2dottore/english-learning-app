from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundError
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import ProductCreate, ProductList, ProductRead


class ProductService:
    def __init__(self, repository: ProductRepository | None = None) -> None:
        self.repository = repository or ProductRepository()

    def list_products(self, db: Session, *, skip: int, limit: int) -> ProductList:
        return ProductList(
            items=[ProductRead.model_validate(item) for item in self.repository.list(db, skip=skip, limit=limit)],
            total=self.repository.count(db),
            skip=skip,
            limit=limit,
        )

    def get_product(self, db: Session, product_id: int) -> ProductRead:
        product = self.repository.get(db, product_id)
        if product is None:
            raise ResourceNotFoundError("Product not found")
        return ProductRead.model_validate(product)

    def create_product(self, db: Session, payload: ProductCreate) -> ProductRead:
        return ProductRead.model_validate(self.repository.create(db, payload))
