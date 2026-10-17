"""Persist the catalog and complete emotion model output in Neo4j."""
import hashlib
import json
import threading
from uuid import uuid4

from neo4j import GraphDatabase
from neo4j.exceptions import ConstraintError

from .schemas import BookCreate, LABELS


class BookStoreUnavailable(RuntimeError):
    pass


class DuplicateBookError(RuntimeError):
    pass


def submission_key(username, request_key):
    return hashlib.sha256(json.dumps([username, request_key]).encode()).hexdigest()


def to_properties(document):
    """Neo4j properties cannot contain nested maps; keep scores queryable."""
    properties = {key: document[key] for key in BookCreate.model_fields}
    properties.update({key: document[key] for key in (
        "id", "created_by", "created_at", "request_key", "payload_hash",
    )})
    properties["submission_key"] = submission_key(document["created_by"], document["request_key"])
    # Missing ISBNs must be absent, so independent books can omit an ISBN.
    if document.get("isbn_key"):
        properties["isbn_key"] = document["isbn_key"]
    classification = document["classification"]
    properties.update({key: value for key, value in classification.items() if key != "probabilities"})
    properties.update({f"probability_{label}": classification["probabilities"][label] for label in LABELS})
    return properties


def from_properties(properties):
    document = {key: properties[key] for key in BookCreate.model_fields}
    document.update({key: properties[key] for key in (
        "id", "created_by", "created_at", "request_key", "payload_hash",
    )})
    if hasattr(document["created_at"], "to_native"):
        document["created_at"] = document["created_at"].to_native()
    if "isbn_key" in properties:
        document["isbn_key"] = properties["isbn_key"]
    document["classification"] = {key: properties[key] for key in (
        "category", "emotional_probability", "threshold", "model_name", "model_version", "chunks",
    )}
    document["classification"]["probabilities"] = {
        label: properties[f"probability_{label}"] for label in LABELS
    }
    return document


class Neo4jBookStore:
    def __init__(self, settings):
        self.settings = settings
        self._driver = None
        self._driver_lock = threading.Lock()
        self._schema_lock = threading.Lock()
        self._schema_ready = False

    def _get_driver(self):
        with self._driver_lock:
            if self._driver is None:
                if not all((self.settings.neo4j_uri, self.settings.neo4j_username, self.settings.neo4j_password)):
                    raise BookStoreUnavailable("Set NEO4J_URI, NEO4J_USERNAME and NEO4J_PASSWORD in this service's .env.")
                try:
                    self._driver = GraphDatabase.driver(
                        self.settings.neo4j_uri,
                        auth=(self.settings.neo4j_username, self.settings.neo4j_password),
                        connection_timeout=5, connection_acquisition_timeout=7,
                        max_transaction_retry_time=5,
                    )
                except ValueError as error:
                    raise BookStoreUnavailable("Check the Neo4j connection settings.") from error
            return self._driver

    def _query(self, query, parameters=None, *, read=False):
        records, _, _ = self._get_driver().execute_query(
            query, parameters_=parameters or {}, database_=self.settings.neo4j_database,
            routing_="r" if read else "w",
        )
        return records

    def ensure_schema(self):
        with self._schema_lock:
            if self._schema_ready:
                return
            for statement in (
                "CREATE CONSTRAINT emobooks_book_id IF NOT EXISTS FOR (b:Book) REQUIRE b.id IS UNIQUE",
                "CREATE CONSTRAINT emobooks_book_isbn IF NOT EXISTS FOR (b:Book) REQUIRE b.isbn_key IS UNIQUE",
                "CREATE CONSTRAINT emobooks_submission IF NOT EXISTS FOR (b:Book) REQUIRE b.submission_key IS UNIQUE",
                "CREATE CONSTRAINT emobooks_emotion IF NOT EXISTS FOR (e:Emotion) REQUIRE e.name IS UNIQUE",
                "CREATE INDEX emobooks_category IF NOT EXISTS FOR (b:Book) ON (b.category)",
                "CREATE INDEX emobooks_created_at IF NOT EXISTS FOR (b:Book) ON (b.created_at)",
            ):
                self._query(statement)
            self._schema_ready = True

    def ping(self):
        self._query("RETURN 1 AS connected", read=True)

    def find_submission(self, username, request_key):
        # Read from the writer so retries after a restart do not depend on replica lag.
        records = self._query(
            "MATCH (b:Book {submission_key: $key}) RETURN b",
            {"key": submission_key(username, request_key)},
        )
        return from_properties(records[0]["b"]) if records else None

    def find_isbn(self, isbn_key):
        records = self._query(
            "MATCH (b:Book {isbn_key: $isbn}) RETURN b", {"isbn": isbn_key}, read=True,
        )
        return from_properties(records[0]["b"]) if records else None

    def insert(self, document):
        # Recheck after a failed startup: never write without uniqueness constraints.
        self.ensure_schema()
        properties = to_properties({**document, "id": str(uuid4())})
        try:
            records = self._query(
                """CREATE (b:Book)
                SET b = $properties
                WITH b
                MERGE (e:Emotion {name: b.category})
                CREATE (b)-[:HAS_EMOTION]->(e)
                RETURN b""",
                {"properties": properties},
            )
        except ConstraintError as error:
            raise DuplicateBookError("A book with this ISBN or submission already exists.") from error
        return from_properties(records[0]["b"])

    def list_books(self, category, query, page, page_size):
        where = """WHERE ($category IS NULL OR b.category = $category)
            AND ($query = '' OR toLower(b.title) CONTAINS $query
                OR toLower(b.author) CONTAINS $query OR toLower(b.isbn) CONTAINS $query)"""
        parameters = {"category": category, "query": query.strip().lower()}
        records = self._query(
            f"MATCH (b:Book) {where} RETURN b ORDER BY b.created_at DESC, b.id DESC SKIP $skip LIMIT $limit",
            {**parameters, "skip": (page - 1) * page_size, "limit": page_size}, read=True,
        )
        total = self._query(f"MATCH (b:Book) {where} RETURN count(b) AS total", parameters, read=True)[0]["total"]
        counts = dict.fromkeys(LABELS, 0)
        for record in self._query("MATCH (b:Book) RETURN b.category AS category, count(b) AS count", read=True):
            if record["category"] in counts:
                counts[record["category"]] = record["count"]
        return {"books": [from_properties(record["b"]) for record in records], "total": total,
                "page": page, "page_size": page_size, "category_counts": counts}

    def close(self):
        if self._driver is not None:
            self._driver.close()

    def find_many(self, ids):
        if not ids:
            return []
        records = self._query("MATCH (b:Book) WHERE b.id IN $ids RETURN b", {"ids": ids}, read=True)
        return [from_properties(record["b"]) for record in records]

    def genres(self):
        records = self._query("MATCH (b:Book) UNWIND b.genres AS genre RETURN DISTINCT genre ORDER BY genre", read=True)
        return [record["genre"] for record in records]

    def recommendation_candidates(self, category, limit):
        records = self._query(
            "MATCH (b:Book {category: $category}) RETURN b ORDER BY b.created_at DESC, b.id DESC LIMIT $limit",
            {"category": category, "limit": limit}, read=True,
        )
        return [from_properties(record["b"]) for record in records]
