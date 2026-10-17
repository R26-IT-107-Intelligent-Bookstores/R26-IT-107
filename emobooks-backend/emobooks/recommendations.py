"""Emotion filtering and a cold-start adapter for the supplied Goodreads V2 model."""
import math
import threading

from .schemas import PublicBook, RecommendedBook, RecommendationResponse


def public_book(document):
    return PublicBook(**{key: document[key] for key in PublicBook.model_fields if key != "emotion"},
                      emotion=document["classification"]["category"])


class LazyPreferenceEngine:
    def __init__(self, settings):
        self.settings = settings
        self.engine = None
        self.lock = threading.Lock()

    def status(self):
        paths = {
            "model_best.pt": self.settings.recommender_dir / "model_best.pt",
            "encoder/modules.json": self.settings.recommender_encoder_dir / "modules.json",
            "encoder/model.safetensors": self.settings.recommender_encoder_dir / "model.safetensors",
        }
        missing = [name for name, path in paths.items() if not path.is_file()]
        return {"files_ready": not missing, "loaded": self.engine is not None, "missing_files": missing,
                "method": "goodreads_v2_cold_start_content"}

    @property
    def version(self):
        return self.engine.version if self.engine else None

    def scores(self, books, favourites, request):
        with self.lock:
            if self.engine is None:
                from .preference_model import HybridContentRanker
                self.engine = HybridContentRanker(self.settings.recommender_dir, self.settings.recommender_encoder_dir)
        return self.engine.scores(books, favourites, request)


def recommend(catalog, engine, request, candidate_limit):
    target = request.target()
    favourites = catalog.find_many(request.favourite_book_ids)
    candidates = [book for book in catalog.recommendation_candidates(target, candidate_limit)
                  if book["classification"]["category"] == target and book["id"] not in request.favourite_book_ids]
    if not candidates:
        return RecommendationResponse(books=[], target_emotion=target)
    scores = engine.scores(candidates, favourites, request)
    if len(scores) != len(candidates) or not all(math.isfinite(score) and 0 <= score <= 1 for score in scores):
        raise RuntimeError("Invalid preference model scores.")
    wanted = {genre.casefold() for genre in request.genres}
    ranked = []
    for book, content_score in zip(candidates, scores):
        matched = [genre for genre in book["genres"] if genre.casefold() in wanted]
        genre_score = len({genre.casefold() for genre in matched}) / len(wanted) if wanted else 0
        emotion_score = book["classification"]["probabilities"][target]
        # Application ranking policy, not an emotion-change or user-like probability.
        score = .8 * content_score + .15 * emotion_score + .05 * genre_score
        direction = "current emotion" if request.goal_mode == "continue" else "chosen emotion"
        reason = f"The story is classified as {target.replace('_', ' / ')} and matches your {direction}."
        if matched:
            reason += f" It also matches your interest in {', '.join(matched)}."
        if favourites:
            reason += " Your favourite books help order these suggestions."
        elif request.interests:
            reason += " Your reading interests help order these suggestions."
        ranked.append(RecommendedBook(**public_book(book).model_dump(), recommendation_reason=reason,
                                      relevance_score=round(100 * score, 2)))
    ranked.sort(key=lambda book: (-book.relevance_score, book.title.casefold(), book.id))
    return RecommendationResponse(books=ranked[:request.limit], target_emotion=target, model_version=engine.version)
