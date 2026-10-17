"""Opt-in contract checks against a dedicated Neo4j test instance."""
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

import pytest

from emobooks.book_store import DuplicateBookError, Neo4jBookStore
from emobooks.schemas import BookCreate, LABELS
from emobooks.settings import Settings


@pytest.fixture
def graph():
    uri = os.getenv("NEO4J_TEST_URI")
    if not uri:
        pytest.skip("Set NEO4J_TEST_* to run against a dedicated Neo4j test instance.")
    config = Settings(
        "mongodb://unused", "unused", Path("missing"), (), neo4j_uri=uri,
        neo4j_username=os.getenv("NEO4J_TEST_USERNAME", "neo4j"),
        neo4j_password=os.environ["NEO4J_TEST_PASSWORD"],
        neo4j_database=os.getenv("NEO4J_TEST_DATABASE", "neo4j"),
    )
    store = Neo4jBookStore(config)
    run = str(uuid4())
    username = f"neo4j-test-{run}@example.test"
    try:
        store.ensure_schema()
        document = {
            **BookCreate(title=f"Neo4j test {run}", author="Test Author",
                         description="A happy family celebrates a wonderful reunion.",
                         classification_text="She smiled with joy and laughed happily.",
                         genres=["Drama"], cover_url="/covers/test.jpg").model_dump(),
            "created_by": username, "created_at": datetime.now(timezone.utc),
            "request_key": run, "payload_hash": "test-hash",
            "classification": {"category": "happy", "probabilities": dict(zip(LABELS, [.02, .03, .8, .05, .04, .06])),
                               "emotional_probability": .95, "threshold": .68,
                               "model_name": "test-model", "model_version": "test-version", "chunks": 2},
        }
        yield store, document
    finally:
        try:
            store._query("MATCH (b:Book {created_by: $username}) DETACH DELETE b", {"username": username})
        finally:
            store.close()


def test_real_neo4j_roundtrip_search_and_emotion_relationship(graph):
    store, document = graph
    saved = store.insert(document)
    expected = {**document, "id": saved["id"]}
    assert saved == expected
    assert store.find_submission(document["created_by"], document["request_key"]) == expected
    listing = store.list_books("happy", document["title"], 1, 12)
    assert listing["total"] == 1
    assert listing["books"] == [expected]
    assert store.list_books("sad", document["title"], 1, 12)["total"] == 0
    assert store.find_many([saved["id"]]) == [expected]
    assert "Drama" in store.genres()
    assert any(book["id"] == saved["id"] for book in store.recommendation_candidates("happy", 2000))
    assert store.list_books(None, "' MATCH (x) DETACH DELETE x //", 1, 12)["total"] == 0
    records = store._query(
        "MATCH (b:Book {id: $id})-[:HAS_EMOTION]->(e:Emotion) RETURN e.name AS emotion",
        {"id": saved["id"]}, read=True,
    )
    assert [record["emotion"] for record in records] == ["happy"]
    # Empty ISBNs must permit more than one independently saved book.
    store.insert({**document, "request_key": str(uuid4())})


def test_real_neo4j_duplicate_isbn_is_rejected(graph):
    store, document = graph
    document["isbn_key"] = str(uuid4())
    store.insert(document)
    assert store.find_isbn(document["isbn_key"])["title"] == document["title"]
    with pytest.raises(DuplicateBookError):
        store.insert({**document, "request_key": str(uuid4())})


def test_real_neo4j_concurrent_retries_create_one_book(graph):
    store, document = graph

    def insert():
        try:
            return store.insert(document)
        except DuplicateBookError:
            return None

    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda _: insert(), range(4)))
    assert sum(result is not None for result in results) == 1
    assert store.list_books(None, document["title"], 1, 12)["total"] == 1
