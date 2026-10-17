"""Load the user's two checkpoints locally; no training or remote inference."""
import hashlib
import json
import os
import threading
from pathlib import Path

os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")

import joblib
import numpy as np
import torch
from torch import nn
from transformers import AutoConfig, AutoModel, AutoTokenizer

from .features import extract_features
from .schemas import Classification, LABELS


class ModelUnavailable(RuntimeError):
    pass


class HybridDebertaClassifier(nn.Module):
    def __init__(self, encoder_config, num_features, num_classes):
        super().__init__()
        # Both checkpoints contain the entire encoder. Do not download base weights.
        self.encoder = AutoModel.from_config(encoder_config)
        self.feature_network = nn.Sequential(
            nn.Linear(num_features, 64), nn.LayerNorm(64), nn.GELU(), nn.Dropout(0.15),
            nn.Linear(64, 64), nn.GELU(), nn.Dropout(0.10),
        )
        self.classifier = nn.Sequential(
            nn.Linear(encoder_config.hidden_size + 64, 256), nn.LayerNorm(256),
            nn.GELU(), nn.Dropout(0.25), nn.Linear(256, num_classes),
        )

    def forward(self, input_ids, attention_mask, features):
        hidden = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        mask = attention_mask.unsqueeze(-1).float()
        pooled = (hidden * mask).sum(dim=1) / mask.sum(dim=1).clamp_min(1e-6)
        return self.classifier(torch.cat([pooled, self.feature_network(features)], dim=1))


def combine_probabilities(neutral, emotional_joint, emotion_labels, threshold):
    """The threshold gate may choose neutral even when another joint score is larger."""
    emotional = sum(emotional_joint)
    category = "neutral" if emotional < threshold else emotion_labels[int(np.argmax(emotional_joint))]
    probabilities = {"neutral": float(neutral), **dict(zip(emotion_labels, map(float, emotional_joint)))}
    return category, probabilities, float(emotional)


class EmotionEngine:
    required_files = (
        "config.json", "model_a_best.pt", "model_b_best.pt", "feature_scaler.pkl",
        "tokenizer/tokenizer_config.json", "tokenizer/spm.model", "encoder/config.json",
    )

    def __init__(self, directory: Path, device=""):
        self.directory = directory
        self.device_name = device
        self.loaded = False
        # Serializes model loading/inference to limit CPU/GPU memory usage.
        self.lock = threading.Lock()

    def status(self):
        missing = [name for name in self.required_files if not (self.directory / name).is_file()]
        return {"files_ready": not missing, "loaded": self.loaded, "missing_files": missing}

    def _load(self):
        if self.loaded:
            return
        if not self.status()["files_ready"]:
            raise ModelUnavailable("Emotion model files are missing. Run scripts/prepare_model.py and install the encoder config.")
        config = json.loads((self.directory / "config.json").read_text(encoding="utf-8"))
        if set(config["labels"]) != set(LABELS) or config["num_features"] != 18:
            raise ModelUnavailable("The model labels or feature dimensions do not match this service.")
        self.config = config
        self.device = torch.device(self.device_name or ("cuda" if torch.cuda.is_available() else "cpu"))
        if self.device.type == "cpu":
            torch.set_num_threads(min(4, torch.get_num_threads()))
        encoder_config = AutoConfig.from_pretrained(self.directory / "encoder", local_files_only=True)
        tokenizer = AutoTokenizer.from_pretrained(self.directory / "tokenizer", local_files_only=True)
        scaler = joblib.load(self.directory / "feature_scaler.pkl")
        models = []
        for filename, classes in (("model_a_best.pt", 2), ("model_b_best.pt", 5)):
            # Allocate from the checkpoint rather than initializing two full encoders.
            with torch.device("meta"):
                model = HybridDebertaClassifier(encoder_config, 18, classes)
            state = torch.load(self.directory / filename, map_location="cpu", weights_only=True, mmap=True)
            model.load_state_dict(state, strict=True, assign=True)
            # DeBERTa's deterministic position IDs are non-persistent buffers,
            # so they are intentionally absent from the checkpoint state dict.
            model.encoder.embeddings.position_ids = torch.arange(
                encoder_config.max_position_embeddings, device="cpu",
            ).expand((1, -1))
            model.to(self.device).eval()
            models.append(model)
        self.model_a, self.model_b = models
        self.tokenizer, self.scaler = tokenizer, scaler
        manifest = self.directory / "manifest.json"
        version_data = manifest.read_bytes() if manifest.exists() else (self.directory / "config.json").read_bytes()
        self.version = hashlib.sha256(version_data).hexdigest()[:16]
        self.loaded = True

    @torch.inference_mode()
    def predict(self, text):
        with self.lock:
            try:
                self._load()
            except ModelUnavailable:
                raise
            except Exception as error:
                raise ModelUnavailable("The emotion model could not be loaded. Check the model files and dependencies.") from error
            max_length = self.config["max_length"]
            encoded = self.tokenizer(
                text, truncation=True, max_length=max_length, return_overflowing_tokens=True,
                padding="max_length", return_token_type_ids=False, return_tensors="pt",
            )
            count = len(encoded["input_ids"])
            if count > 64:
                raise ValueError("The classification text is too long. Use a shorter synopsis or excerpt (up to 64 model chunks).")
            # A short input uses the exact training features. Longer inputs are fully
            # processed as non-overlapping token chunks rather than silently truncated.
            texts = [text] if count == 1 else self.tokenizer.batch_decode(encoded["input_ids"], skip_special_tokens=True)
            weights = (encoded["attention_mask"].sum(dim=1).numpy() - 2).clip(min=1).astype(float)
            raw_features = np.stack([extract_features(chunk) for chunk in texts])
            features = torch.tensor(self.scaler.transform(raw_features), dtype=torch.float32, device=self.device)
            neutral_sum = 0.0
            joint_sum = np.zeros(5, dtype=np.float64)
            biases = torch.tensor(self.config["model_b_biases"], device=self.device)
            for start in range(0, count, 4):
                stop = start + 4
                batch = {key: encoded[key][start:stop].to(self.device) for key in ("input_ids", "attention_mask")}
                a = torch.softmax(self.model_a(**batch, features=features[start:stop]).float(), dim=1).cpu().numpy()
                b = torch.softmax(self.model_b(**batch, features=features[start:stop]).float() + biases, dim=1).cpu().numpy()
                chunk_weights = weights[start:stop]
                neutral_sum += float(np.dot(a[:, 0], chunk_weights))
                joint_sum += ((a[:, 1:2] * b) * chunk_weights[:, None]).sum(axis=0)
            neutral = neutral_sum / weights.sum()
            joint = joint_sum / weights.sum()
            category, probabilities, emotional = combine_probabilities(
                neutral, joint, self.config["emotion_labels"], self.config["hierarchical_threshold"],
            )
            return Classification(
                category=category, probabilities=probabilities,
                emotional_probability=emotional, threshold=self.config["hierarchical_threshold"],
                model_name=self.config["model_name"], model_version=self.version, chunks=count,
            )
