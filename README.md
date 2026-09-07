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

## Run

Backend:

```bash
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload --port 8000
```

Desktop app, in another terminal:

```bash
cd desktop
npm install
npm run dev
```

Backend docs: <http://127.0.0.1:8000/docs>
