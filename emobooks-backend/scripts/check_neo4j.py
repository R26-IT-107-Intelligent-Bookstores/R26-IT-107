"""Check Neo4j credentials and prepare the book catalog constraints/indexes."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from neo4j.exceptions import DriverError, Neo4jError

from emobooks.book_store import BookStoreUnavailable, Neo4jBookStore
from emobooks.settings import ROOT, Settings


def main():
    settings = Settings.from_env()
    required = {
        "NEO4J_URI": settings.neo4j_uri,
        "NEO4J_USERNAME": settings.neo4j_username,
        "NEO4J_PASSWORD": settings.neo4j_password,
    }
    missing = [name for name, value in required.items() if not value or not value.strip()]
    if missing:
        print(f"Neo4j setup failed: missing or empty {', '.join(missing)}.", file=sys.stderr)
        print(f"Set the database connection details in {ROOT / '.env'} and run this check again.", file=sys.stderr)
        return 1
    store = Neo4jBookStore(settings)
    try:
        store.ping()
        store.ensure_schema()
    except (Neo4jError, DriverError, BookStoreUnavailable) as error:
        # Do not print credentials or raw driver errors containing connection details.
        print(f"Neo4j setup failed ({type(error).__name__}). Check NEO4J_* settings, connectivity and schema permissions.", file=sys.stderr)
        return 1
    finally:
        store.close()
    print("Neo4j connected. Book catalog constraints and indexes are ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
