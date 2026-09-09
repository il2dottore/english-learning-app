from tests.conftest import ApiClient


def test_get_and_update_profile(client: ApiClient) -> None:
    # 1. Get profile
    res = client.get("/api/profile")
    assert res.status_code == 200
    data = res.json()
    assert "user" in data
    assert "goals" in data
    assert "badges" in data
    assert len(data["badges"]) >= 5

    # 2. Update profile info
    update_res = client.put(
        "/api/profile",
        json={"name": "Alex Nguyen", "bio": "Passionate English Learner"},
    )
    assert update_res.status_code == 200
    up_data = update_res.json()
    assert up_data["user"]["name"] == "Alex Nguyen"
    assert up_data["user"]["bio"] == "Passionate English Learner"

    # 3. Update goals
    goals_res = client.put(
        "/api/profile/goals",
        json={"daily_vocab_target": 45, "daily_time_target_minutes": 40},
    )
    assert goals_res.status_code == 200
    g_data = goals_res.json()
    assert g_data["goals"]["daily_vocab_target"] == 45
    assert g_data["goals"]["daily_time_target_minutes"] == 40


def test_export_and_import_backup(client: ApiClient) -> None:
    # Export
    export_res = client.get("/api/profile/export")
    assert export_res.status_code == 200
    pkg = export_res.json()
    assert "version" in pkg
    assert "profile" in pkg
    assert "progress" in pkg

    # Import
    import_res = client.post("/api/profile/import", json=pkg)
    assert import_res.status_code == 200
    assert "khôi phục thành công" in import_res.json()["message"]


def test_reset_progress_validation(client: ApiClient) -> None:
    # Wrong confirm text
    bad_res = client.post("/api/profile/reset", json={"confirm_text": "no"})
    assert bad_res.status_code == 400

    # Correct confirm text
    ok_res = client.post("/api/profile/reset", json={"confirm_text": "RESET"})
    assert ok_res.status_code == 200
