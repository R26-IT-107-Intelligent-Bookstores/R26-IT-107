"""Use the trained V2 content branch for new readers and new catalog books.

No application user is assigned a Goodreads identity. The collaborative ID
embeddings and pseudo-pair threshold do not apply to these cold-start inputs.
"""
import hashlib
import os
import threading
from collections import OrderedDict

os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import numpy as np
import torch
from torch import nn
from torch.nn import functional as F


def book_text(book):
    description = (book.get("classification_text") or book["description"]).replace("<br />", " ").replace("<br/>", " ")[:750]
    return f"{book['title']}. {', '.join(book['genres'])}. {description}"[:900]


class HybridContentRanker:
    def __init__(self, model_dir, encoder_dir, encoder=None):
        checkpoint_path = model_dir / "model_best.pt"
        saved = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
        if saved.get("sentence_encoder") != "sentence-transformers/all-MiniLM-L6-v2":
            raise ValueError("The recommender requires the supplied all-MiniLM-L6-v2 encoder.")
        state = saved["model"]
        latent, dimension = state["text_network.0.weight"].shape
        self.network = nn.Sequential(nn.Linear(dimension, latent), nn.LayerNorm(latent), nn.Tanh())
        self.network.load_state_dict({key.removeprefix("text_network."): value
                                      for key, value in state.items() if key.startswith("text_network.")}, strict=True)
        self.network.eval()
        self.scale = float(state["scale"].clamp(0, 5))
        if not np.isfinite(self.scale) or not all(torch.isfinite(p).all() for p in self.network.parameters()):
            raise ValueError("The recommender checkpoint contains invalid weights.")
        if encoder is None:
            from sentence_transformers import SentenceTransformer
            encoder = SentenceTransformer(str(encoder_dir), device="cpu", local_files_only=True, trust_remote_code=False)
        dimension_method = getattr(encoder, "get_embedding_dimension", None) or encoder.get_sentence_embedding_dimension
        if dimension_method() != dimension:
            raise ValueError("Sentence encoder dimension does not match the trained recommender.")
        self.encoder = encoder
        checksum = hashlib.sha256()
        with checkpoint_path.open("rb") as source:
            while chunk := source.read(1024 * 1024):
                checksum.update(chunk)
        self.version = checksum.hexdigest()
        self.cache = OrderedDict()
        self.lock = threading.Lock()

    def _embeddings(self, texts):
        vectors = {}
        missing = []
        for text in dict.fromkeys(texts):
            if text in self.cache:
                vectors[text] = self.cache[text]
                self.cache.move_to_end(text)
            else:
                missing.append(text)
        if missing:
            encoded = self.encoder.encode(missing, normalize_embeddings=True, convert_to_numpy=True,
                                          show_progress_bar=False, batch_size=32)
            for text, vector in zip(missing, encoded):
                vectors[text] = vector
                self.cache[text] = vector
                if len(self.cache) > 4096:
                    self.cache.popitem(last=False)
        return np.stack([vectors[text] for text in texts]).astype(np.float32)

    def scores(self, books, favourites, request):
        interests = ". ".join(part for part in (request.interests, ", ".join(request.genres)) if part)
        profile_texts = [book_text(book) for book in favourites]
        if interests:
            profile_texts.append(interests)
        if not profile_texts:
            profile_texts = [f"Stories expressing {request.target().replace('_', ' ')} emotions."]
        with self.lock, torch.inference_mode():
            vectors = self._embeddings([book_text(book) for book in books] + profile_texts)
            book_vectors = torch.from_numpy(vectors[:len(books)])
            # Training profiles are normalized means of positive book embeddings.
            profile = F.normalize(torch.from_numpy(vectors[len(books):]).mean(dim=0, keepdim=True), dim=-1)
            user_sem = F.normalize(self.network(profile), dim=-1)
            book_sem = F.normalize(self.network(book_vectors), dim=-1)
            content_logit = (book_sem * user_sem).sum(dim=-1) * self.scale
            return torch.sigmoid(content_logit).tolist()
