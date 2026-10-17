import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Emotion = Literal["angry_disgusted", "fearful", "happy", "neutral", "sad", "surprised"]
LABELS = ("angry_disgusted", "fearful", "happy", "neutral", "sad", "surprised")


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class BookCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    title: str = Field(min_length=1, max_length=250)
    author: str = Field(min_length=1, max_length=250)
    isbn: str = Field(default="", max_length=32)
    genres: list[str] = Field(default_factory=list, max_length=10)
    description: str = Field(min_length=20, max_length=5000)
    classification_text: str = Field(default="", max_length=16000)
    cover_url: str = Field(default="", max_length=2000)

    @field_validator("genres")
    @classmethod
    def clean_genres(cls, genres):
        cleaned = list(dict.fromkeys(genre.strip() for genre in genres if genre.strip()))
        if any(len(genre) > 60 for genre in cleaned):
            raise ValueError("Genre names must be 60 characters or fewer.")
        return cleaned

    @field_validator("cover_url")
    @classmethod
    def valid_cover(cls, value):
        if value and not (value.startswith(("https://", "http://")) or (
            value.startswith("/") and not value.startswith("//")
        )):
            raise ValueError("Use an http(s) cover URL or a local /image path.")
        return value

    def inference_text(self):
        text = self.classification_text or self.description
        words = re.findall(r"[A-Za-z]+", text)
        letters = [char for char in text if char.isalpha()]
        english_letters = sum(char.isascii() for char in letters)
        if len(words) < 4 or not letters or english_letters / len(letters) < 0.8:
            raise ValueError("Provide an English synopsis or story excerpt with at least four words for classification.")
        return text


class Classification(BaseModel):
    category: Emotion
    probabilities: dict[Emotion, float]
    emotional_probability: float = Field(ge=0, le=1)
    threshold: float = Field(ge=0, le=1)
    model_name: str
    model_version: str
    chunks: int = Field(ge=1)


class BookRecord(BookCreate):
    id: str
    classification: Classification
    created_at: datetime
    created_by: str


class PublicBook(BaseModel):
    id: str
    title: str
    author: str
    isbn: str
    genres: list[str]
    description: str
    cover_url: str
    emotion: Emotion


class BookLookup(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ids: list[str] = Field(max_length=100)

    @field_validator("ids")
    @classmethod
    def valid_ids(cls, values):
        if any(not value or len(value) > 100 for value in values):
            raise ValueError("Book IDs must contain 1 to 100 characters.")
        return list(dict.fromkeys(values))


class RecommendationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    current_emotion: Emotion
    goal_mode: Literal["continue", "change"] = "continue"
    target_emotion: Emotion | None = None
    genres: list[str] = Field(default_factory=list, max_length=10)
    favourite_book_ids: list[str] = Field(default_factory=list, max_length=50)
    interests: str = Field(default="", max_length=300)
    limit: int = Field(default=12, ge=1, le=50)

    @field_validator("genres")
    @classmethod
    def valid_genres(cls, values):
        if any(not value.strip() or len(value) > 60 for value in values):
            raise ValueError("Genre names must contain 1 to 60 characters.")
        return list(dict.fromkeys(value.strip() for value in values))

    @field_validator("favourite_book_ids")
    @classmethod
    def valid_favourites(cls, values):
        return BookLookup.valid_ids(values)

    @model_validator(mode="after")
    def valid_goal(self):
        if self.goal_mode == "change" and (not self.target_emotion or self.target_emotion == self.current_emotion):
            raise ValueError("Choose a different target emotion for Change emotion.")
        return self

    def target(self):
        return self.current_emotion if self.goal_mode == "continue" else self.target_emotion


class RecommendedBook(PublicBook):
    recommendation_reason: str
    relevance_score: float


class RecommendationResponse(BaseModel):
    books: list[RecommendedBook]
    target_emotion: Emotion
    ranking_method: str = "goodreads_v2_cold_start_content"
    model_version: str | None = None
