from tests.conftest import ApiClient


def test_generate_test(client: ApiClient) -> None:
    res = client.post("/api/testing/generate", json={"level": "B2", "count": 5, "mode": "standard"})
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
    assert all("prompt" in q and "options" in q for q in data)
    assert all(len(q["options"]) == 4 for q in data)


def test_submit_test_and_history(client: ApiClient) -> None:
    # 1. Generate 3 questions
    gen_res = client.post("/api/testing/generate", json={"level": "ALL", "count": 3, "mode": "quick"})
    assert gen_res.status_code == 200
    questions = gen_res.json()
    assert len(questions) == 3

    # 2. Submit answers (1 correct, others wrong)
    q0 = questions[0]
    q1 = questions[1]
    answers = [
        {"question_id": q0["id"], "selected_answer": q0["correct_answer"]},
        {"question_id": q1["id"], "selected_answer": "Sai hoàn toàn"},
    ]

    submit_res = client.post(
        "/api/testing/submit",
        json={
            "title": "Unit Test Quiz",
            "level": "ALL",
            "mode": "quick",
            "duration_seconds": 45,
            "answers": answers,
        },
    )
    assert submit_res.status_code == 200
    result = submit_res.json()
    assert result["total_questions"] == 2
    assert result["correct_count"] == 1
    assert result["score_percentage"] == 50.0
    assert result["current_streak"] >= 1

    # 3. Check history
    hist_res = client.get("/api/testing/history")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["total_tests"] >= 1
    assert any(item["title"] == "Unit Test Quiz" for item in hist_data["items"])

    # 4. Check mistakes
    mistakes_res = client.get("/api/testing/mistakes")
    assert mistakes_res.status_code == 200
    mistakes_data = mistakes_res.json()
    assert mistakes_data["total_mistakes"] >= 1
    assert any(m["vocab_id"] == q1["id"] for m in mistakes_data["items"])
