from tests.conftest import ApiClient


def test_get_dashboard_summary(client: ApiClient) -> None:
    res = client.get("/api/progress/dashboard")
    assert res.status_code == 200
    data = res.json()

    # Check streak structure
    assert "streak" in data
    assert "current_streak" in data["streak"]
    assert "longest_streak" in data["streak"]
    assert "is_active_today" in data["streak"]

    # Check last 7 days
    assert "last_7_days_activity" in data
    assert len(data["last_7_days_activity"]) == 7

    # Check vocab mastery
    assert "vocab_mastery" in data
    assert data["vocab_mastery"]["total_vocab"] == 2015
    assert data["vocab_mastery"]["b2_total"] == 700
    assert data["vocab_mastery"]["c1_total"] == 1315

    # Check course progress
    assert "course_progress" in data
    assert data["course_progress"]["b2_total_lessons"] == 24
    assert data["course_progress"]["c1_total_lessons"] == 16

    # Check recent tests
    assert "recent_tests" in data
    assert isinstance(data["recent_tests"], list)
