from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import configure_logging
from app.db.session import init_db
from app.modules.courses.router import router as courses_router
from app.modules.products.router import router as products_router
from app.modules.profile.router import router as profile_router
from app.modules.progress.router import router as progress_router
from app.modules.skills.router import router as skills_router
from app.modules.testing.router import router as testing_router
from app.modules.vocabulary.router import router as vocabulary_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    init_db()
    yield


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Hello World FastAPI backend with SQLite and a demo products module.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.get("/", tags=["system"])
def hello_world() -> dict[str, str]:
    return {"message": "Hello World"}


@app.get("/api/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "backend", "database": "sqlite"}


app.include_router(products_router)
app.include_router(vocabulary_router)
app.include_router(courses_router)
app.include_router(testing_router)
app.include_router(progress_router)
app.include_router(skills_router)
app.include_router(profile_router)
