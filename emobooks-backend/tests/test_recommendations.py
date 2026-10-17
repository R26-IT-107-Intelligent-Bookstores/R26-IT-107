from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock

import mongomock
import pytest
from fastapi.testclient import TestClient

from emobooks.main import create_app
from emobooks.schemas import BookCreate, LABELS
from emobooks.settings import Settings


def saved_book(book_id, emotion="happy", **updates):
    return {
        **BookCreate(title=f"Story {book_id}", author="An Author", genres=["Adventure"],
                     description="A happy family celebrates their joyful reunion.").model_dump(),
        "id": book_id, "created_by": "private-admin", "created_at": datetime.now(timezone.utc),
        "request_key": "private-request-key", "payload_hash": "private-payload-hash",
        "classification": {"category": emotion, "probabilities": {label: .8 if label == emotion else .04 for label in LABELS},
                           "emotional_probability": .95, "threshold": .68,
                           "model_name": "test-classifier", "model_version": "emotion-checkpoint", "chunks": 1},
        **updates,
    }


@pytest.fixture
def public_api(catalog):
    config = Settings("mongodb://unused", "unused", Path("missing"), ())
    engine = Mock(version="preference-checkpoint")
    engine.scores.side_effect = lambda books, favourites, request: [.9 if book["id"] == "high" else .3 for book in books]
    with TestClient(create_app(config, mongomock.MongoClient().db, book_store=catalog, preference_engine=engine)) as client:
        yield client, catalog, engine


def test_guest_continue_and_change_use_the_selected_emotion(public_api):
    client, catalog, engine = public_api
    catalog.documents = [saved_book("low"), saved_book("high"), saved_book("sad", "sad")]
    response = client.post("/api/emobooks/recommendations", json={"current_emotion": "happy", "goal_mode": "continue", "target_emotion": "sad"})
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["target_emotion"] == "happy"
    assert [book["id"] for book in data["books"]] == ["high", "low"]
    assert data["model_version"] == "preference-checkpoint"
    assert data["ranking_method"] == "goodreads_v2_cold_start_content"
    assert data["books"][0]["relevance_score"] > data["books"][1]["relevance_score"]
    response = client.post("/api/emobooks/recommendations", json={"current_emotion": "happy", "goal_mode": "change", "target_emotion": "sad"})
    assert [book["id"] for book in response.json()["books"]] == ["sad"]
    assert response.json()["target_emotion"] == "sad"
    assert client.post("/api/emobooks/books", json={}).status_code == 401


def test_preferences_and_real_favourite_books_are_passed_to_the_model(public_api):
    client, catalog, engine = public_api
    catalog.documents = [saved_book("favourite"), saved_book("high")]
    response = client.post("/api/emobooks/recommendations", json={"current_emotion": "happy",
        "genres": ["adventure"], "favourite_book_ids": ["favourite", "old-demo-id"], "interests": "friendship"})
    assert response.status_code == 200
    assert [book["id"] for book in response.json()["books"]] == ["high"]
    candidates, favourites, request = engine.scores.call_args.args
    assert [book["id"] for book in favourites] == ["favourite"]
    assert request.interests == "friendship"
    assert request.genres == ["adventure"]
    assert "Adventure" in response.json()["books"][0]["recommendation_reason"]


def test_empty_catalog_returns_no_invented_or_demo_books(public_api):
    client, catalog, engine = public_api
    response = client.post("/api/emobooks/recommendations", json={"current_emotion": "neutral"})
    assert response.status_code == 200
    assert response.json()["books"] == []
    engine.scores.assert_not_called()


@pytest.mark.parametrize("failure", [RuntimeError("missing weights"), [float("nan")], []])
def test_model_failure_returns_503_without_a_demo_fallback(public_api, failure):
    client, catalog, engine = public_api
    catalog.documents = [saved_book("high")]
    if isinstance(failure, Exception):
        engine.scores.side_effect = failure
    else:
        engine.scores.side_effect = None
        engine.scores.return_value = failure
    response = client.post("/api/emobooks/recommendations", json={"current_emotion": "happy"})
    assert response.status_code == 503
    assert "books" not in response.json()


@pytest.mark.parametrize("payload", [
    {"current_emotion": "angry"},
    {"current_emotion": "happy", "goal_mode": "change"},
    {"current_emotion": "sad", "goal_mode": "change", "target_emotion": "sad"},
    {"current_emotion": "happy", "interests": "x" * 301},
    {"current_emotion": "happy", "limit": 51},
    {"current_emotion": "happy", "favourite_book_ids": ["x" * 101]},
    {"current_emotion": "happy", "genres": ["x" * 61]},
    {"current_emotion": "happy", "genres": [" "]},
    {"current_emotion": "happy", "user_id": "forged-goodreads-user"},
])
def test_invalid_goals_and_unbounded_preferences_are_rejected(public_api, payload):
    client, _, engine = public_api
    assert client.post("/api/emobooks/recommendations", json=payload).status_code == 422
    engine.scores.assert_not_called()


def test_angry_disgusted_is_a_supported_model_category(public_api):
    client, catalog, _ = public_api
    catalog.documents = [saved_book("angry", "angry_disgusted")]
    response = client.post("/api/emobooks/recommendations", json={"current_emotion": "angry_disgusted"})
    assert response.status_code == 200
    assert response.json()["books"][0]["emotion"] == "angry_disgusted"


def test_public_catalog_details_and_lookup_never_expose_admin_or_excerpt_data(public_api):
    client, catalog, _ = public_api
    catalog.documents = [saved_book("high", classification_text="private full story excerpt")]
    listing = client.get("/api/emobooks/catalog").json()
    assert listing["genres"] == ["Adventure"]
    assert listing["total"] == 1
    detail = client.get("/api/emobooks/catalog/high").json()
    lookup = client.post("/api/emobooks/catalog/lookup", json={"ids": ["high", "deleted"]}).json()
    assert listing["books"] == lookup == [detail]
    assert set(detail) == {"id", "title", "author", "isbn", "description", "genres", "emotion", "cover_url"}
    assert client.get("/api/emobooks/catalog/missing").status_code == 404
    assert client.get("/api/emobooks/catalog?page_size=10000").status_code == 422
    assert client.post("/api/emobooks/catalog/lookup", json={"ids": ["id"] * 101}).status_code == 422


def test_neo4j_outage_is_reported_by_the_guest_endpoints(public_api, monkeypatch):
    from neo4j.exceptions import ServiceUnavailable

    client, catalog, _ = public_api
    monkeypatch.setattr(catalog, "recommendation_candidates", Mock(side_effect=ServiceUnavailable("offline")))
    assert client.post("/api/emobooks/recommendations", json={"current_emotion": "happy"}).status_code == 503
