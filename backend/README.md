# Backend FastAPI

Backend scaffold cho team phát triển tiếp:

- FastAPI với root endpoint `Hello World`.
- SQLite + SQLAlchemy 2.x, session dependency và seed dữ liệu tự động.
- Alembic config sẵn cho database migrations.
- Module demo `products` có đủ router, service, repository, schema và model.
- `auth` và `users` đã có khung module để mở rộng sau.

## Chạy bằng UV

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Mở <http://127.0.0.1:8000/docs> để xem API.

## API demo

```bash
curl http://127.0.0.1:8000/
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/products
curl http://127.0.0.1:8000/api/products/1
```

Database được tạo tại `backend/data/app.db` khi app khởi động lần đầu. Nếu bảng `products` chưa có dữ liệu, app sẽ seed ba product mẫu.

## Migration

```bash
uv run alembic revision --autogenerate -m "create products"
uv run alembic upgrade head
```

## Test

```bash
uv run pytest
```

## Static checks

```bash
uv run ruff check .
uv run ruff format --check .
uv run pyright
```

`ruff` kiểm tra lint/import và format; `pyright` kiểm tra kiểu tĩnh cho `app/` và `tests/`.
