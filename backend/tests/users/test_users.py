from app.modules.users import router


def test_users_module_has_router() -> None:
    assert router.router.prefix == "/api/users"
