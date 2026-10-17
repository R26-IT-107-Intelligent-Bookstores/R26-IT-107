"""Isolated catalog double; API tests never connect to a user's databases."""
from copy import deepcopy
from uuid import uuid4

import pytest

from emobooks.book_store import DuplicateBookError
from emobooks.schemas import LABELS


class MemoryBookStore:
    def __init__(self):
        self.documents = []

    def ensure_schema(self):
        pass

    def ping(self):
        pass

    def close(self):
        pass

    def find_many(self, ids):
        return [deepcopy(doc) for doc in self.documents if doc["id"] in ids]

    def genres(self):
        return sorted({genre for doc in self.documents for genre in doc["genres"]})

    def recommendation_candidates(self, category, limit):
        return [deepcopy(doc) for doc in self.documents if doc["classification"]["category"] == category][:limit]

    def find_submission(self, username, request_key):
        return next((deepcopy(doc) for doc in self.documents
                     if doc["created_by"] == username and doc["request_key"] == request_key), None)

    def find_isbn(self, isbn_key):
        return next((deepcopy(doc) for doc in self.documents if doc.get("isbn_key") == isbn_key), None)

    def insert(self, document):
        if (self.find_submission(document["created_by"], document["request_key"])
                or (document.get("isbn_key") and self.find_isbn(document["isbn_key"]))):
            raise DuplicateBookError()
        document = deepcopy({**document, "id": str(uuid4())})
        self.documents.append(document)
        return deepcopy(document)

    def list_books(self, category, query, page, page_size):
        query = query.strip().lower()
        docs = [deepcopy(doc) for doc in self.documents
                if (not category or doc["classification"]["category"] == category)
                and (not query or any(query in doc[field].lower() for field in ("title", "author", "isbn")))]
        docs.sort(key=lambda doc: (doc["created_at"], doc["id"]), reverse=True)
        counts = {label: sum(doc["classification"]["category"] == label for doc in self.documents) for label in LABELS}
        start = (page - 1) * page_size
        return {"books": docs[start:start + page_size], "total": len(docs), "page": page,
                "page_size": page_size, "category_counts": counts}


@pytest.fixture
def catalog():
    return MemoryBookStore()
