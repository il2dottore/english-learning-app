from tests.conftest import ApiClient


def test_reading_articles(client: ApiClient) -> None:
    # 1. List articles
    res = client.get("/api/skills/reading/articles")
    assert res.status_code == 200
    articles = res.json()
    assert len(articles) >= 2
    art_id = articles[0]["id"]

    # 2. Get detail
    detail_res = client.get(f"/api/skills/reading/articles/{art_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "paragraphs" in detail
    assert "highlighted_vocab" in detail
    assert "comprehension_questions" in detail

    # 3. Submit quiz
    questions = detail["comprehension_questions"]
    answers = {q["id"]: q["correct_answer"] for q in questions}
    sub_res = client.post(f"/api/skills/reading/articles/{art_id}/submit", json={"answers": answers})
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["is_passed"] is True
    assert sub_data["score"] == len(questions)


def test_listening_dictation(client: ApiClient) -> None:
    # 1. Get exercises
    res = client.get("/api/skills/listening/exercises?count=3")
    assert res.status_code == 200
    exercises = res.json()
    assert len(exercises) >= 1
    ex = exercises[0]

    # 2. Check dictation
    check_res = client.post(
        "/api/skills/listening/check",
        json={"exercise_id": ex["id"], "user_input": ex["sentence"]},
    )
    assert check_res.status_code == 200
    check_data = check_res.json()
    assert check_data["is_perfect"] is True
    assert check_data["accuracy_percentage"] >= 90.0
    assert len(check_data["diffs"]) > 0


def test_grammar_topics(client: ApiClient) -> None:
    # 1. List topics
    res = client.get("/api/skills/grammar/topics")
    assert res.status_code == 200
    topics = res.json()
    assert len(topics) >= 2
    top_id = topics[0]["id"]

    # 2. Get detail
    detail_res = client.get(f"/api/skills/grammar/topics/{top_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "formula" in detail
    assert "examples" in detail
    assert "practice_questions" in detail

    # 3. Submit grammar quiz
    questions = detail["practice_questions"]
    answers = {q["id"]: q["correct_answer"] for q in questions}
    sub_res = client.post(f"/api/skills/grammar/topics/{top_id}/submit", json={"answers": answers})
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["is_passed"] is True
    assert sub_data["score"] == len(questions)
