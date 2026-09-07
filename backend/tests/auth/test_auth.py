from app.modules.auth import router


def test_auth_module_has_router() -> None:
    assert router.router.prefix == "/api/auth"
