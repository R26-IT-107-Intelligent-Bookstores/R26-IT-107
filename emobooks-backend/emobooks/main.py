import hashlib
import json
import logging
import re
import threading
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from neo4j.exceptions import DriverError, Neo4jError
from pymongo.errors import PyMongoError
from starlette.concurrency import run_in_threadpool

from .auth import authenticate, sign_in, token_key
from .book_store import BookStoreUnavailable, DuplicateBookError, Neo4jBookStore
from .database import connect, ensure_indexes
from .recommendations import LazyPreferenceEngine, public_book, recommend
from .schemas import BookCreate, BookLookup, BookRecord, Emotion, LoginRequest, PublicBook, RecommendationRequest, RecommendationResponse
from .settings import Settings

logger = logging.getLogger("emobooks")
bearer = HTTPBearer(auto_error=False)


class LazyEngine:
    def __init__(self, settings):
        self.settings = settings
        self.engine = None
        self.lock = threading.Lock()

    def status(self):
        required = ("config.json", "model_a_best.pt", "model_b_best.pt", "feature_scaler.pkl",
                    "encoder/config.json", "tokenizer/tokenizer_config.json", "tokenizer/spm.model")
        missing = [name for name in required if not (self.settings.model_dir / name).is_file()]
        return {"files_ready": not missing, "loaded": bool(self.engine and self.engine.loaded), "missing_files": missing}

    def predict(self, text):
        with self.lock:
            if self.engine is None:
                from .inference import EmotionEngine
                self.engine = EmotionEngine(self.settings.model_dir, self.settings.model_device)
        return self.engine.predict(text)


def serialize(document):
    return {key: document[key] for key in BookRecord.model_fields}


def create_app(settings=None, database=None, engine=None, book_store=None, preference_engine=None):
    settings = settings or Settings.from_env()
    client = None if database is not None else connect(settings)
    db = database if database is not None else client[settings.mongo_db]
    classifier = engine if engine is not None else LazyEngine(settings)
    catalog = book_store if book_store is not None else Neo4jBookStore(settings)
    preferences = preference_engine if preference_engine is not None else LazyPreferenceEngine(settings)

    @asynccontextmanager
    async def lifespan(app):
        try:
            await run_in_threadpool(ensure_indexes, db)
        except PyMongoError:
            # Keep health/docs available while the database is being configured.
            logger.error("EmoBooks admin database is unavailable; check MONGO_URI and database network access.")
        try:
            await run_in_threadpool(catalog.ensure_schema)
        except (Neo4jError, DriverError, BookStoreUnavailable):
            logger.error("EmoBooks catalog is unavailable; check NEO4J_* settings and database network access.")
        try:
            yield
        finally:
            catalog.close()
            if client is not None:
                client.close()

    app = FastAPI(title="EmoBooks Emotion Catalog API", version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware, allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type", "Authorization", "Idempotency-Key"],
    )

    @app.exception_handler(PyMongoError)
    async def database_error(request: Request, error):
        logger.error("EmoBooks database operation failed: %s", type(error).__name__)
        return JSONResponse(status_code=503, content={"detail": "The EmoBooks database is unavailable. Please try again."})

    @app.exception_handler(Neo4jError)
    @app.exception_handler(DriverError)
    @app.exception_handler(BookStoreUnavailable)
    async def catalog_error(request: Request, error):
        logger.error("EmoBooks Neo4j operation failed: %s", type(error).__name__)
        return JSONResponse(status_code=503, content={
            "detail": "The Neo4j book catalog is unavailable. Check the backend Neo4j configuration and retry.",
        })

    def admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
        if not credentials or credentials.scheme.lower() != "bearer":
            raise HTTPException(401, "Sign in to EmoBooks with an admin account.", headers={"WWW-Authenticate": "Bearer"})
        return authenticate(db, credentials.credentials)

    @app.get("/health")
    def health():
        return {"service": "emobooks", "status": "ok"}

    @app.post("/api/admin/login")
    def login(data: LoginRequest):
        return sign_in(db, data.username, data.password, settings.session_hours)

    @app.get("/api/admin/me")
    def me(username: str = Depends(admin)):
        return {"username": username, "role": "admin"}

    @app.delete("/api/admin/session", status_code=204)
    def logout(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), username: str = Depends(admin)):
        db.admin_sessions.delete_one({"_id": token_key(credentials.credentials)})

    @app.get("/api/emobooks/status")
    def status(username: str = Depends(admin)):
        db.command("ping")
        catalog.ping()
        return {"database": "connected", "book_database": "neo4j", "admin_database": "mongodb",
                "model": classifier.status(), "recommender": preferences.status()}

    @app.get("/api/emobooks/catalog")
    def public_catalog(q: str = Query(default="", max_length=250), page: int = Query(default=1, ge=1),
                       page_size: int = Query(default=100, ge=1, le=100)):
        result = catalog.list_books(None, q, page, page_size)
        result["books"] = [public_book(book) for book in result["books"]]
        result["genres"] = catalog.genres()
        return result

    @app.post("/api/emobooks/catalog/lookup", response_model=list[PublicBook])
    def lookup_books(data: BookLookup):
        return [public_book(book) for book in catalog.find_many(data.ids)]

    @app.get("/api/emobooks/catalog/{book_id}", response_model=PublicBook)
    def book_details(book_id: str):
        books = catalog.find_many([book_id])
        if not books:
            raise HTTPException(404, "This book is no longer in the EmoBooks catalog.")
        return public_book(books[0])

    @app.post("/api/emobooks/recommendations", response_model=RecommendationResponse)
    def recommendations(data: RecommendationRequest):
        try:
            return recommend(catalog, preferences, data, settings.recommender_candidate_limit)
        except (Neo4jError, DriverError, BookStoreUnavailable):
            raise
        except Exception as error:
            logger.error("EmoBooks recommendation model failed: %s", type(error).__name__)
            raise HTTPException(503, "Book suggestions are temporarily unavailable. Please try again shortly.") from error

    @app.get("/api/emobooks/books")
    def list_books(
        username: str = Depends(admin), category: Emotion | None = None,
        q: str = Query(default="", max_length=250), page: int = Query(default=1, ge=1),
        page_size: int = Query(default=12, ge=1, le=100),
    ):
        result = catalog.list_books(category, q, page, page_size)
        result["books"] = [BookRecord(**serialize(document)) for document in result["books"]]
        return result

    @app.post("/api/emobooks/books", response_model=BookRecord, status_code=201)
    def add_book(
        data: BookCreate, username: str = Depends(admin),
        request_key: str = Header(alias="Idempotency-Key", min_length=16, max_length=80),
    ):
        payload = data.model_dump()
        payload_hash = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

        def replay():
            existing = catalog.find_submission(username, request_key)
            if existing and existing.get("payload_hash") != payload_hash:
                raise HTTPException(409, "This request was already used for a different book. Refresh and try again.")
            return existing

        existing = replay()
        if existing:
            return serialize(existing)
        try:
            text = data.inference_text()
        except ValueError as error:
            raise HTTPException(422, str(error)) from error
        isbn_key = re.sub(r"[\s-]", "", data.isbn).upper()
        if isbn_key and catalog.find_isbn(isbn_key):
            raise HTTPException(409, "A book with this ISBN has already been added.")
        try:
            classification = classifier.predict(text)
        except ValueError as error:
            raise HTTPException(422, str(error)) from error
        except Exception as error:
            logger.error("Emotion classification failed: %s", type(error).__name__)
            raise HTTPException(503, "The emotion model is unavailable. Check model setup and retry; this book has not been saved.") from error
        document = {
            **payload, "classification": classification.model_dump(), "created_by": username,
            "created_at": datetime.now(timezone.utc), "request_key": request_key, "payload_hash": payload_hash,
        }
        if isbn_key:
            document["isbn_key"] = isbn_key
        try:
            # Book properties and the emotion relationship commit in one transaction.
            document = catalog.insert(document)
        except DuplicateBookError as error:
            existing = replay()
            if existing:
                return serialize(existing)
            raise HTTPException(409, "A book with this ISBN has already been added.") from error
        return serialize(document)

    return app


app = create_app()
