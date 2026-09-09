from tests.conftest import ApiClient


def test_list_courses(client: ApiClient) -> None:
    res = client.get("/api/courses")
    assert res.status_code == 200
    courses = res.json()
    assert len(courses) >= 2
    ids = [c["id"] for c in courses]
    assert "b2-first" in ids
    assert "c1-advanced" in ids


def test_get_course_detail(client: ApiClient) -> None:
    res = client.get("/api/courses/b2-first")
    assert res.status_code == 200
    course = res.json()
    assert course["id"] == "b2-first"
    assert len(course["units"]) == 6
    # First lesson of first unit should be unlocked
    assert course["units"][0]["lessons"][0]["is_unlocked"] is True


def test_get_lesson_detail(client: ApiClient) -> None:
    res = client.get("/api/courses/b2-first/lessons/b2-u1-l1")
    assert res.status_code == 200
    lesson = res.json()
    assert lesson["id"] == "b2-u1-l1"
    assert len(lesson["vocabularies"]) > 0
    assert len(lesson["checkpoint_quiz"]) > 0
    assert lesson["grammar_focus"]


def test_complete_lesson_and_unlock_next(client: ApiClient) -> None:
    # 1. Complete Lesson 1 with passing score
    res = client.post(
        "/api/courses/b2-first/lessons/b2-u1-l1/complete",
        json={"score": 90},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["passed"] is True
    assert data["earned_xp"] == 60
    assert data["completed_lesson_id"] == "b2-u1-l1"
    assert data["next_lesson_id"] == "b2-u1-l2"

    # 2. Check that Lesson 2 is now unlocked
    c_res = client.get("/api/courses/b2-first")
    assert c_res.status_code == 200
    u1_lessons = c_res.json()["units"][0]["lessons"]
    l1 = next(x for x in u1_lessons if x["id"] == "b2-u1-l1")
    l2 = next(x for x in u1_lessons if x["id"] == "b2-u1-l2")
    assert l1["is_completed"] is True
    assert l2["is_unlocked"] is True


def test_get_lesson_detail_rich_academic_content(client: ApiClient) -> None:
    res = client.get("/api/courses/b2-first/lessons/b2-u1-l1")
    assert res.status_code == 200
    data = res.json()
    assert "grammar_lesson" in data
    assert data["grammar_lesson"] is not None
    assert "concept" in data["grammar_lesson"]
    assert "formula" in data["grammar_lesson"]
    assert len(data["grammar_lesson"]["rules"]) > 0

    assert "reading_passage" in data
    assert data["reading_passage"] is not None
    assert len(data["reading_passage"]["passage"]) > 50
    assert data["passing_score_pct"] == 60


def test_complete_lesson_failing_score(client: ApiClient) -> None:
    res = client.post(
        "/api/courses/b2-first/lessons/b2-u1-l3/complete",
        json={"score": 40},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["passed"] is False
    assert data["earned_xp"] == 0
    assert data["next_lesson_id"] is None
