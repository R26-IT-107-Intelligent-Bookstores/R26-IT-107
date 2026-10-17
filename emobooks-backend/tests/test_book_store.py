from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock

import pytest
from neo4j.exceptions import ConstraintError, ServiceUnavailable
from neo4j.time import DateTime

from emobooks.book_store import DuplicateBookError, Neo4jBookStore, from_properties, to_properties
from emobooks.schemas import BookCreate, LABELS
from emobooks.settings import Settings


@pytest.fixture
def document():
    return {
        **BookCreate(title="A story", author="An Author", description="A happy family celebrates a wonderful reunion.",
                     genres=["Drama", "Adventure"]).model_dump(),
        "id": "stable-id", "created_by": "admin@example.test", "created_at": datetime.now(timezone.utc),
        "request_key": "request-123456789", "payload_hash": "payload-hash",
        "classification": {"category": "happy", "probabilities": dict(zip(LABELS, [.02, .03, .8, .05, .04, .06])),
                           "emotional_probability": .95, "threshold": .68,
                           "model_name": "test-model", "model_version": "fingerprint", "chunks": 2},
    }


@pytest.fixture
def store():
    store = Neo4jBookStore(Settings("mongodb://unused", "unused", Path("missing"), ()))
    store._driver = Mock()
    store._driver.execute_query.return_value = ([], None, None)
    return store


def test_complete_book_and_scores_survive_neo4j_property_roundtrip(document):
    properties = to_properties(document)
    assert all(not isinstance(value, dict) for value in properties.values())
    assert "isbn_key" not in properties
    properties["created_at"] = DateTime.from_native(document["created_at"])
    assert from_properties(properties) == document
    document["isbn_key"] = "9781234567890"
    assert from_properties(to_properties(document)) == document


def test_failed_schema_setup_is_retried_before_any_write(store, document):
    store._driver.execute_query.side_effect = ServiceUnavailable("offline")
    with pytest.raises(ServiceUnavailable):
        store.insert(document)
    assert not store._schema_ready
    assert all("CREATE (b:Book)" not in call.args[0] for call in store._driver.execute_query.call_args_list)
    store._driver.execute_query.side_effect = None
    store.ensure_schema()
    assert store._schema_ready


def test_constraint_conflict_is_reported_for_idempotent_replay(store, document):
    store._schema_ready = True
    store._driver.execute_query.side_effect = ConstraintError("duplicate ISBN")
    with pytest.raises(DuplicateBookError):
        store.insert(document)


def test_search_is_parameterized_and_uses_the_selected_database(store):
    store._driver.execute_query.side_effect = [([], None, None), ([{"total": 0}], None, None), ([], None, None)]
    query = "' MATCH (x) DETACH DELETE x //"
    result = store.list_books(None, query, 2, 12)
    assert result["total"] == 0
    first_call = store._driver.execute_query.call_args_list[0]
    assert query not in first_call.args[0]
    assert first_call.kwargs["parameters_"]["query"] == query.lower()
    assert first_call.kwargs["parameters_"]["skip"] == 12
    assert first_call.kwargs["database_"] == "neo4j"
