# English Learning Application

Mock English learning project with a FastAPI backend and an Electron desktop app.

## Structure

```text
english-learning-app/
|-- backend/              # FastAPI, SQLite, tests, and static checks
|-- desktop/              # Electron + React desktop scaffold
|-- data/                 # B2 and C1 vocabulary JSON/XLSX files
\-- README.md             # Project overview
```

## Setup & Run

### 1. Backend (FastAPI)

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --port 8005
```

Quality check & tests:

```bash
uv run pytest
uv run ruff check .
uv run pyright
```

API Documentation: <http://127.0.0.1:8005/docs>

### 2. Desktop App (Electron + React)

Trong một terminal khác:

```bash
cd desktop
npm install
npm run dev
```

