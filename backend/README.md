# FastAPI Backend

A small FastAPI + SQLite backend scaffold managed with UV.

## Run

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open <http://127.0.0.1:8000/docs> for Swagger UI.

The root endpoint returns `Hello World`. The demo `products` module reads and seeds SQLite data automatically.

## API

```text
GET  /                  # Hello World
GET  /api/health        # Health check
GET  /api/products      # List products
GET  /api/products/{id} # Get one product
POST /api/products      # Create a product
```

## Checks

```bash
uv run pytest -q
uv run ruff check .
uv run ruff format --check .
uv run pyright
```

## Structure

```text
backend/
|-- app/
|   |-- main.py                         # FastAPI application entry point
|   |-- core/                           # Settings, logging, security, exceptions
|   |-- db/
|   |   |-- base.py                      # SQLAlchemy declarative base
|   |   |-- session.py                   # SQLite engine, sessions, seed data
|   |   \-- migrations/                  # Alembic configuration and revisions
|   |-- modules/
|   |   |-- products/                    # Complete demo module
|   |   |   |-- router.py                # HTTP endpoints
|   |   |   |-- service.py               # Business logic
|   |   |   |-- repository.py            # Database queries
|   |   |   |-- schemas.py               # Request/response schemas
|   |   |   \-- models.py                # SQLAlchemy model
|   |   |-- auth/                        # Auth module scaffold
|   |   \-- users/                       # Users module scaffold
|   \-- common/                          # Shared dependencies and helpers
|-- tests/                               # API and module tests
|-- data/                                # Local SQLite database files
|-- alembic.ini                          # Alembic settings
|-- pyproject.toml                       # Project and tool configuration
|-- .env.example                         # Environment template
\-- Dockerfile                           # Container image definition
```
