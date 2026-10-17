"""MongoDB storage for administrator credentials and sessions only."""
from pymongo import MongoClient


def connect(settings):
    return MongoClient(
        settings.mongo_uri, serverSelectionTimeoutMS=7000, connectTimeoutMS=5000,
        tz_aware=True,
    )


def ensure_indexes(database):
    database.admin_users.create_index("username", unique=True)
    database.admin_sessions.create_index("expires_at", expireAfterSeconds=0)
