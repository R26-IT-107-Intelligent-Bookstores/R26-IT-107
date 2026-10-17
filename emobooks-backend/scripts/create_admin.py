"""Provision an EmoBooks administrator locally. No public admin signup endpoint."""
import argparse
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from emobooks.auth import passwords
from emobooks.database import connect, ensure_indexes
from emobooks.settings import Settings


def create_admin(username, password):
    if len(password) < 8:
        raise ValueError("Use a password of at least 8 characters.")
    settings = Settings.from_env()
    with connect(settings) as client:
        db = client[settings.mongo_db]
        ensure_indexes(db)
        username = username.strip().lower()
        db.admin_users.update_one({"username": username}, {"$set": {
            "password": passwords.hash(password), "role": "admin",
        }}, upsert=True)
        # Changing the password invalidates previous sessions.
        db.admin_sessions.delete_many({"username": username})
    print("EmoBooks admin account saved.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--username", required=True)
    args = parser.parse_args()
    first = getpass.getpass("Admin password: ")
    if first != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")
    create_admin(args.username, first)
