from tests.conftest import ApiClient


def test_vocabulary_list(client: ApiClient) -> None:
    response = client.get("/api/vocabulary?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] > 0
    assert len(data["items"]) <= 10


def test_vocabulary_filter_by_level(client: ApiClient) -> None:
    response = client.get("/api/vocabulary?level=b2&limit=5")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["level"] == "B2"


def test_vocabulary_stats(client: ApiClient) -> None:
    response = client.get("/api/vocabulary/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2000
    assert data["b2_count"] == 700
    assert data["c1_count"] == 1315
    assert "parts_of_speech" in data


def test_vocabulary_random_flashcards(client: ApiClient) -> None:
    response = client.get("/api/vocabulary/random?limit=5&level=c1")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 5
    for item in items:
        assert item["level"] == "C1"


def test_vocabulary_quiz_generation(client: ApiClient) -> None:
    response = client.get("/api/vocabulary/quiz?count=4&level=b2")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 4
    for q in questions:
        assert len(q["options"]) == 4
        assert q["correct_answer"] in q["options"]


def test_review_and_srs_queue(client: ApiClient) -> None:
    # 1. Get first item
    first_item = client.get("/api/vocabulary?limit=1").json()["items"][0]
    vocab_id = first_item["id"]

    # 2. Submit rating 3 (Đã thuộc)
    review_res = client.post(f"/api/vocabulary/{vocab_id}/review", json={"rating": 3})
    assert review_res.status_code == 200
    progress = review_res.json()
    assert progress["vocabulary_id"] == vocab_id
    assert progress["box_level"] >= 2

    # 3. Check SRS stats
    stats_res = client.get("/api/vocabulary/srs/stats")
    assert stats_res.status_code == 200
    srs_stats = stats_res.json()
    assert srs_stats["learning_count"] + srs_stats["mastered_count"] >= 1


def test_toggle_star_and_starred_list(client: ApiClient) -> None:
    item = client.get("/api/vocabulary?limit=1").json()["items"][0]
    vocab_id = item["id"]

    # Toggle star on
    star_res = client.post(f"/api/vocabulary/{vocab_id}/star", json={})
    assert star_res.status_code == 200
    assert star_res.json()["is_starred"] is True

    # Check starred list
    starred_res = client.get("/api/vocabulary/starred")
    assert starred_res.status_code == 200
    starred_items = starred_res.json()["items"]
    assert any(x["id"] == vocab_id for x in starred_items)

    # Toggle star off
    unstar_res = client.post(f"/api/vocabulary/{vocab_id}/star", json={})
    assert unstar_res.status_code == 200
    assert unstar_res.json()["is_starred"] is False


def test_cloze_and_synonym_exercises(client: ApiClient) -> None:
    # Test cloze
    cloze_res = client.get("/api/vocabulary/exercises/cloze?count=3&level=b2")
    assert cloze_res.status_code == 200
    cloze_list = cloze_res.json()
    assert len(cloze_list) > 0
    assert "________" in cloze_list[0]["cloze_sentence"]
    assert len(cloze_list[0]["options"]) == 4

    # Test synonyms
    syn_res = client.get("/api/vocabulary/exercises/synonyms?count=4&level=b2")
    assert syn_res.status_code == 200
    syn_list = syn_res.json()
    assert len(syn_list) > 0
    assert syn_list[0]["word"]
    assert syn_list[0]["synonym"]
