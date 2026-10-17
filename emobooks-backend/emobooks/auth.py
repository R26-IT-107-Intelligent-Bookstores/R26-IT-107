import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from passlib.context import CryptContext

passwords = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
# Prevent unknown accounts from taking a noticeably faster path.
DUMMY_HASH = passwords.hash(secrets.token_urlsafe(24))


def token_key(token):
    return hashlib.sha256(token.encode()).hexdigest()


def sign_in(database, username, password, hours):
    user = database.admin_users.find_one({"username": username.strip().lower()})
    valid_password = passwords.verify(password, user["password"] if user else DUMMY_HASH)
    if not user or not valid_password or user.get("role") != "admin":
        raise HTTPException(401, "Invalid admin username or password.")
    token = secrets.token_urlsafe(48)
    database.admin_sessions.insert_one({
        "_id": token_key(token), "username": user["username"],
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=hours),
    })
    return {"access_token": token, "token_type": "bearer", "username": user["username"], "expires_in": hours * 3600}


def authenticate(database, token):
    session = database.admin_sessions.find_one({
        "_id": token_key(token), "expires_at": {"$gt": datetime.now(timezone.utc)},
    })
    if not session:
        raise HTTPException(401, "Your EmoBooks admin session has expired. Please sign in again.")
    user = database.admin_users.find_one({"username": session["username"], "role": "admin"})
    if not user:
        raise HTTPException(403, "Admin access is required.")
    return user["username"]
