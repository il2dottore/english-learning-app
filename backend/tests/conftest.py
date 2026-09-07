import asyncio
from typing import Any

import pytest
from httpx2 import ASGITransport, AsyncClient, Response

from app.db.session import init_db
from app.main import app


class ApiClient:
    def __init__(self) -> None:
        init_db()

    def get(self, url: str) -> Response:
        return asyncio.run(self._request("GET", url))

    def post(self, url: str, *, json: dict[str, Any]) -> Response:
        return asyncio.run(self._request("POST", url, json=json))

    async def _request(self, method: str, url: str, **kwargs: Any) -> Response:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://testserver") as client:
            return await client.request(method, url, **kwargs)


@pytest.fixture
def client() -> ApiClient:
    return ApiClient()
