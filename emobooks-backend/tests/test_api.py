from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import mongomock
import pytest
from fastapi.testclient import TestClient

from emobooks.auth import passwords, token_key
from emobooks.main import create_app
from emobooks.schemas import Classification
from emobooks.settings import Settings


class TestClassifier:
    __test__ = False

    def __init__(self):
        self.calls = []
        self.fail = False
        self.category = "happy"

    def status(self):
        return {"files_ready": True, "loaded": True, "missing_files": []}

    def predict(self, text):
        self.calls.append(text)
        if self.fail:
            raise RuntimeError("model not available")
        return Classification(
            category=self.category, probabilities={"angry_disgusted": .02, "fearful": .03, "happy": .8,
                "neutral": .05, "sad": .04, "surprised": .06}, emotional_probability=.95,
            threshold=.68, model_name="test-model", model_version="test-checkpoint", chunks=1,
        )


@pytest.fixture
def api(catalog):
    db = mongomock.MongoClient(tz_aware=True).emobooks_tests
    db.admin_users.insert_one({"username": "admin@example.test", "password": passwords.hash("test-password"), "role": "admin"})
    engine = TestClassifier()
    config = Settings("mongodb://unused", "emobooks_tests", Path("missing"), ("http://localhost:3000",))
    with TestClient(create_app(config, db, engine, book_store=catalog, preference_engine=TestPreferences())) as client:
        session = client.post("/api/admin/login", json={"username": "admin@example.test", "password": "test-password"})
        token = session.json()["access_token"]
        client.headers["Authorization"] = f"Bearer {token}"
        yield client, db, engine, token, catalog


class TestPreferences:
    __test__ = False
    version = "test-preference-checkpoint"

    def status(self):
        return {"files_ready": True, "loaded": True, "missing_files": []}

    def scores(self, books, favourites, request):
        return [.7 for _ in books]


def book(**updates):
    return {"title": "A joyful reunion", "author": "Test Author", "description": "She smiled with joy and laughed happily when her family returned home.", "genres": ["Drama"], **updates}


def save(client, payload=None, key=None):
    return client.post("/api/emobooks/books", json=payload or book(), headers={"Idempotency-Key": key or str(uuid4())})


def test_admin_role_cannot_be_forged(api):
    client, db, engine, token, catalog = api
    client.headers.pop("Authorization")
    assert client.get("/api/emobooks/books", headers={"X-User-Role": "admin"}).status_code == 401
    assert save(client).status_code == 401
    assert not engine.calls
    assert client.post("/api/admin/login", json={"username": "admin@example.test", "password": "wrong"}).status_code == 401
    client.headers["Authorization"] = f"Bearer {token}"
    db.admin_users.update_one({"username": "admin@example.test"}, {"$set": {"role": "user"}})
    assert save(client).status_code == 403


def test_expired_and_revoked_sessions(api):
    client, db, engine, token, catalog = api
    db.admin_sessions.update_one({"_id": token_key(token)}, {"$set": {"expires_at": datetime.now(timezone.utc) - timedelta(seconds=1)}})
    assert save(client).status_code == 401
    login = client.post("/api/admin/login", json={"username": "admin@example.test", "password": "test-password"})
    client.headers["Authorization"] = "Bearer " + login.json()["access_token"]
    assert client.delete("/api/admin/session").status_code == 204
    assert client.get("/api/admin/me").status_code == 401


def test_classification_is_persisted_with_all_scores(api):
    client, db, engine, token, catalog = api
    response = save(client, book(title="මඩොල් දූව", classification_text="She celebrated her wonderful success with joyful friends."))
    assert response.status_code == 201, response.text
    saved = response.json()
    assert saved["classification"]["category"] == "happy"
    assert engine.calls == ["She celebrated her wonderful success with joyful friends."]
    assert len(saved["classification"]["probabilities"]) == 6
    stored = next(doc for doc in catalog.documents if doc["title"] == "මඩොල් දූව")
    assert stored["classification"] == saved["classification"]
    assert stored["created_by"] == "admin@example.test"
    assert db.books.count_documents({}) == 0  # MongoDB must never receive catalog writes.
    result = client.get("/api/emobooks/books?category=happy&q=මඩොල්").json()
    assert result["total"] == 1
    assert result["category_counts"]["happy"] == 1
    assert result["books"][0]["id"] == saved["id"]
    assert "payload_hash" not in result["books"][0]
    assert client.get("/api/emobooks/books?category=sad").json()["total"] == 0


def test_duplicate_retries_do_not_run_model_or_insert_again(api):
    client, db, engine, token, catalog = api
    key = str(uuid4())
    first = save(client, key=key)
    replay = save(client, key=key)
    assert first.status_code == replay.status_code == 201
    assert first.json()["id"] == replay.json()["id"]
    assert len(engine.calls) == len(catalog.documents) == 1
    assert save(client, book(title="A different title"), key).status_code == 409


def test_duplicate_isbn_normalization(api):
    client, db, engine, token, catalog = api
    assert save(client, book(isbn="978-955-123-4567")).status_code == 201
    assert save(client, book(isbn="9789551234567")).status_code == 409
    assert len(engine.calls) == 1
    # Books without an ISBN are allowed independently.
    assert save(client).status_code == 201
    assert save(client, book(title="Another story")).status_code == 201


def test_invalid_or_unsupported_input_is_not_saved(api):
    client, db, engine, token, catalog = api
    assert save(client, book(title=" ")).status_code == 422
    assert save(client, book(classification_text="මේ සිංහල කතාවේ අන්තර්ගතය හැඟීම් ගැන විස්තර කරයි.")).status_code == 422
    assert save(client, book(cover_url="javascript:alert(1)")).status_code == 422
    assert save(client, book(classification_text="x" * 16001)).status_code == 422
    assert save(client, book(category="happy")).status_code == 422
    assert not catalog.documents
    assert db.books.count_documents({}) == 0
    assert not engine.calls


def test_unavailable_model_does_not_save_unclassified_book(api):
    client, db, engine, token, catalog = api
    engine.fail = True
    response = save(client)
    assert response.status_code == 503
    assert not catalog.documents
    assert db.books.count_documents({}) == 0


def test_search_is_literal_and_pagination_is_bounded(api):
    client, db, engine, token, catalog = api
    for index in range(3):
        assert save(client, book(title=f"Story {index}")).status_code == 201
    assert client.get("/api/emobooks/books?q=.*").json()["total"] == 0
    page = client.get("/api/emobooks/books?page=2&page_size=2").json()
    assert page["total"] == 3 and len(page["books"]) == 1
    assert client.get("/api/emobooks/books?page_size=10000").status_code == 422


def test_cors_only_allows_configured_frontend(api):
    client, *_ = api
    allowed = client.options("/api/emobooks/books", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,idempotency-key"})
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:3000"
    denied = client.options("/api/emobooks/books", headers={"Origin": "https://unrelated.example", "Access-Control-Request-Method": "POST"})
    assert denied.status_code == 400


def test_status_checks_the_neo4j_catalog(api):
    client, *_ = api
    response = client.get("/api/emobooks/status")
    assert response.status_code == 200
    assert response.json()["book_database"] == "neo4j"
    assert response.json()["admin_database"] == "mongodb"


def test_admin_published_book_is_available_to_guest_emotion_discovery(api):
    client, db, engine, token, catalog = api
    intro = "A family reunion brings friends back together after a long journey."
    excerpt = "She smiled with joy and celebrated her wonderful reunion with friends."
    response = save(client, book(description=intro, classification_text=excerpt))
    assert response.status_code == 201
    saved = response.json()
    assert engine.calls == [excerpt]
    client.headers.pop("Authorization")
    public = client.get(f"/api/emobooks/catalog/{saved['id']}")
    assert public.status_code == 200
    assert public.json()["description"] == intro
    assert "classification_text" not in public.json()
    for request in (
        {"current_emotion": "happy", "goal_mode": "continue"},
        {"current_emotion": "sad", "goal_mode": "change", "target_emotion": "happy"},
    ):
        suggestions = client.post("/api/emobooks/recommendations", json=request)
        assert suggestions.status_code == 200
        assert [book["id"] for book in suggestions.json()["books"]] == [saved["id"]]
    assert client.post("/api/emobooks/recommendations", json={"current_emotion": "sad"}).json()["books"] == []
    assert db.books.count_documents({}) == 0


@pytest.mark.parametrize("operation,path", [
    ("find_submission", "/api/emobooks/books"),
    ("list_books", "/api/emobooks/books"),
    ("ping", "/api/emobooks/status"),
    ("insert", "/api/emobooks/books"),
])
def test_neo4j_failure_never_returns_success_or_writes_to_mongo(api, monkeypatch, operation, path):
    from neo4j.exceptions import ServiceUnavailable

    client, db, engine, token, catalog = api

    def unavailable(*args, **kwargs):
        raise ServiceUnavailable("test outage")

    monkeypatch.setattr(catalog, operation, unavailable)
    response = save(client) if operation in ("find_submission", "insert") else client.get(path)
    assert response.status_code == 503
    assert "Neo4j" in response.json()["detail"]
    assert not catalog.documents
    assert db.books.count_documents({}) == 0
    if operation == "find_submission":
        assert not engine.calls


def test_concurrent_submission_conflict_replays_the_saved_book(api, monkeypatch):
    from emobooks.book_store import DuplicateBookError

    client, db, engine, token, catalog = api
    original_insert = catalog.insert

    def competing_insert(document):
        original_insert(document)  # Another request committed before this insert.
        raise DuplicateBookError()

    monkeypatch.setattr(catalog, "insert", competing_insert)
    response = save(client)
    assert response.status_code == 201
    assert response.json()["id"] == catalog.documents[0]["id"]
    assert len(catalog.documents) == 1


def test_missing_neo4j_configuration_keeps_docs_and_login_available(api):
    from emobooks.book_store import Neo4jBookStore

    _, db, engine, _, _ = api
    config = Settings("mongodb://unused", "emobooks_tests", Path("missing"), ())
    with TestClient(create_app(config, db, engine, book_store=Neo4jBookStore(config))) as client:
        assert client.get("/health").status_code == 200
        assert client.get("/docs").status_code == 200
        login = client.post("/api/admin/login", json={"username": "admin@example.test", "password": "test-password"})
        assert login.status_code == 200
        client.headers["Authorization"] = "Bearer " + login.json()["access_token"]
        assert save(client).status_code == 503
        assert not engine.calls
