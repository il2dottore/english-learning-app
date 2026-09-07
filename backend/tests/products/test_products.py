from uuid import uuid4

from tests.conftest import ApiClient


def test_products_are_seeded(client: ApiClient) -> None:
    response = client.get("/api/products")

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 3
    assert payload["items"][0]["sku"] == "DEMO-001"


def test_product_can_be_created(client: ApiClient) -> None:
    sku = f"TEST-{uuid4().hex[:8].upper()}"
    response = client.post(
        "/api/products",
        json={
            "sku": sku,
            "name": "Test product",
            "description": "Created by the API test.",
            "price": "5.00",
        },
    )

    assert response.status_code == 201
    assert response.json()["name"] == "Test product"
