import hashlib

import numpy as np
import pytest
import torch
from torch import nn
from torch.nn import functional as F

from emobooks.preference_model import HybridContentRanker, book_text
from emobooks.schemas import RecommendationRequest


class DeterministicEncoder:
    def __init__(self):
        self.calls = []

    def get_embedding_dimension(self):
        return 4

    def encode(self, texts, **kwargs):
        self.calls.extend(texts)
        values = np.array([list(hashlib.sha256(text.encode()).digest()[:4]) for text in texts], dtype=np.float32)
        return values / np.linalg.norm(values, axis=1, keepdims=True)


@pytest.fixture
def checkpoint(tmp_path):
    torch.manual_seed(42)
    projection = nn.Sequential(nn.Linear(4, 3), nn.LayerNorm(3), nn.Tanh()).eval()
    state = {f"text_network.{key}": value for key, value in projection.state_dict().items()}
    state["scale"] = torch.tensor(2.5)
    torch.save({"model": state, "nusers": 1, "nbooks": 1, "latent": 3,
                "sentence_encoder": "sentence-transformers/all-MiniLM-L6-v2"}, tmp_path / "model_best.pt")
    return tmp_path, projection


def test_new_books_and_new_readers_use_the_trained_content_branch(checkpoint):
    directory, projection = checkpoint
    engine = HybridContentRanker(directory, directory, encoder=DeterministicEncoder())
    # More books than the checkpoint's ID table: none has a Goodreads index.
    books = [{"id": str(index), "title": f"Story {index}", "genres": ["Adventure"],
              "description": f"A family travels through a magical land {index}."} for index in range(3)]
    favourites = [books[0]]
    request = RecommendationRequest(current_emotion="happy", interests="friendship")
    actual = engine.scores(books, favourites, request)
    encoder = DeterministicEncoder()
    vectors = torch.from_numpy(encoder.encode([book_text(book) for book in books] + [book_text(books[0]), "friendship"]))
    with torch.inference_mode():
        user_profile = F.normalize(vectors[3:].mean(0, keepdim=True), dim=-1)
        # The semantic term in ImprovedHybridRecommender.forward from the supplied training code.
        semantic = (F.normalize(projection(user_profile), dim=-1) * F.normalize(projection(vectors[:3]), dim=-1)).sum(-1) * 2.5
        expected = torch.sigmoid(semantic).tolist()
    assert np.allclose(actual, expected)
    assert len(engine.version) == 64


def test_cached_book_features_are_refreshed_when_text_changes(checkpoint):
    directory, _ = checkpoint
    encoder = DeterministicEncoder()
    engine = HybridContentRanker(directory, directory, encoder=encoder)
    request = RecommendationRequest(current_emotion="sad")
    book = {"title": "A story", "genres": [], "description": "The original story."}
    engine.scores([book], [], request)
    count = len(encoder.calls)
    engine.scores([book], [], request)
    assert len(encoder.calls) == count
    engine.scores([{**book, "description": "A new description."}], [], request)
    assert len(encoder.calls) == count + 1


def test_english_excerpt_is_used_for_content_features_when_available():
    book = {"title": "Title", "genres": ["Drama"], "description": "Public description",
            "classification_text": "English story excerpt " * 100}
    text = book_text(book)
    assert "English story excerpt" in text
    assert "Public description" not in text
    assert len(text) <= 900
