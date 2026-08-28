"""Import books_with_reviews.txt into the PhonoLex MongoDB books collection.

Safe defaults:
- Reads MY_MONGO_URI from phonolex-backend/.env.
- Targets only the phonolex_db.books collection.
- Does not delete documents or touch any other database/collection.
- Runs as a dry-run unless --write is supplied.
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

EXPECTED_COUNT = 1050
DEFAULT_SOURCE = Path(__file__).with_name("books_with_reviews.txt")
BOOK_LINE_RE = re.compile(
    r"^(?P<title>.+?)(?:\s+—\s+(?P<author>.+?))?\s+\[ISBN:\s*(?P<isbn>\d{10,13})\]\s+\((?P<mentions>[^)]*)\)$"
)
MENTION_RE = re.compile(r"(?P<platform>[a-zA-Z_]+)\s*=\s*(?P<count>\d+)")


def parse_mentions(value: str, line_number: int) -> dict[str, int]:
    mentions: dict[str, int] = {}
    for match in MENTION_RE.finditer(value):
        mentions[match.group("platform")] = int(match.group("count"))

    if not mentions:
        raise ValueError(f"Line {line_number}: no platform mention counts found")
    return mentions


def parse_books(source: Path) -> list[dict[str, Any]]:
    books: list[dict[str, Any]] = []
    invalid_lines: list[str] = []

    with source.open("r", encoding="utf-8-sig") as file:
        for line_number, raw_line in enumerate(file, start=1):
            line = raw_line.strip()
            if not line or line.startswith("FedBook-Sem") or line.startswith("Total books:") or set(line) == {"="}:
                continue

            match = BOOK_LINE_RE.fullmatch(line)
            if not match:
                invalid_lines.append(f"Line {line_number}: {line}")
                continue

            isbn = match.group("isbn").strip()
            if not isbn:
                invalid_lines.append(f"Line {line_number}: missing ISBN")
                continue

            mentions = parse_mentions(match.group("mentions"), line_number)
            books.append(
                {
                    "isbn": isbn,
                    "title": match.group("title").strip(),
                    "author": (match.group("author") or "Unknown").strip(),
                    "platformMentions": mentions,
                    "totalMentions": sum(mentions.values()),
                    "source": "books_with_reviews.txt",
                }
            )

    if invalid_lines:
        preview = "\n".join(invalid_lines[:5])
        raise ValueError(f"Could not parse {len(invalid_lines)} data line(s). First errors:\n{preview}")
    if len(books) != EXPECTED_COUNT:
        raise ValueError(f"Expected {EXPECTED_COUNT} books, parsed {len(books)}")

    isbns = [book["isbn"] for book in books]
    if len(isbns) != len(set(isbns)):
        raise ValueError("Duplicate ISBN values found; refusing to write")

    return books


def import_books(books: list[dict[str, Any]], mongo_uri: str) -> None:
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10_000)
    try:
        client.admin.command("ping")
        collection = client["phonolex_db"]["books"]

        imported_at = datetime.now(timezone.utc)
        operations = [
            UpdateOne(
                {"isbn": {"$eq": book["isbn"]}},
                {
                    "$set": {
                        "title": book["title"],
                        "author": book["author"],
                        "platformMentions": book["platformMentions"],
                        "totalMentions": book["totalMentions"],
                        "source": book["source"],
                        "reviewsImportedAt": imported_at,
                    },
                    "$setOnInsert": {"createdAt": imported_at},
                },
                upsert=True,
            )
            for book in books
        ]

        result = collection.bulk_write(operations, ordered=False)
        print(
            f"Imported {len(books)} books into phonolex_db.books: "
            f"{result.upserted_count} inserted, {result.modified_count} updated."
        )
    finally:
        client.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=DEFAULT_SOURCE, help="Path to books_with_reviews.txt")
    parser.add_argument("--write", action="store_true", help="Write validated records to MongoDB")
    args = parser.parse_args()

    load_dotenv(Path(__file__).with_name(".env"))
    books = parse_books(args.file)
    print(f"Validated {len(books)} books from {args.file.name}.")

    if not args.write:
        print("Dry-run only. Re-run with --write to upsert into phonolex_db.books.")
        return

    import os

    mongo_uri = os.getenv("MY_MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("MY_MONGO_URI is not set in phonolex-backend/.env")
    import_books(books, mongo_uri)


if __name__ == "__main__":
    main()
