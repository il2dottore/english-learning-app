# english-learning-app
English Learning Application - Mock Project 

## Project structure

- `backend/`: FastAPI + SQLite backend scaffold managed with UV.
- `desktop/`: Electron + React + TypeScript desktop application.
- `data/`: B2 and C1 vocabulary JSON data.

Backend demo module: `GET /api/products` đọc dữ liệu mock từ SQLite; root `GET /` chỉ trả `Hello World`.

## Run the backend

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --port 8000
```

## Run the desktop app

In another terminal:

```bash
cd desktop
npm install
npm run dev
```

The desktop renderer hiện chỉ hiển thị `Hello World`; các module Electron và feature folders đã được scaffold sẵn.
