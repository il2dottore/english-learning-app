from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.base import Base
from app.modules.products.models import Product

settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
if settings.database_url.startswith("sqlite:///") and ":memory:" not in settings.database_url:
    database_path = Path(settings.database_url.removeprefix("sqlite:///"))
    if not database_path.is_absolute():
        database_path = Path.cwd() / database_path
    database_path.parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.scalar(select(Product.id).limit(1)) is None:
            db.add_all(
                [
                    Product(
                        sku="DEMO-001",
                        name="Vocabulary Flashcards",
                        description="Starter flashcards for daily English practice.",
                        price=9.99,
                    ),
                    Product(
                        sku="DEMO-002",
                        name="Listening Practice Pack",
                        description="Short listening exercises for B2 and C1 learners.",
                        price=14.50,
                    ),
                    Product(
                        sku="DEMO-003",
                        name="Grammar Review Guide",
                        description="A compact guide for reviewing advanced grammar.",
                        price=12.00,
                    ),
                ]
            )
            db.commit()
