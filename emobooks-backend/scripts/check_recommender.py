"""Load the supplied checkpoint and local encoder, and run a cold-start smoke test."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from emobooks.schemas import RecommendationRequest
from emobooks.settings import Settings


def main():
    from emobooks.preference_model import HybridContentRanker
    settings = Settings.from_env()
    engine = HybridContentRanker(settings.recommender_dir, settings.recommender_encoder_dir)
    scores = engine.scores([
        {"title": "A joyful reunion", "description": "A happy family celebrates a wonderful reunion.", "genres": ["Drama"]},
    ], [], RecommendationRequest(current_emotion="happy", interests="family and friendship"))
    if len(scores) != 1 or not 0 <= scores[0] <= 1:
        raise RuntimeError("Invalid recommendation model output.")
    print(f"Goodreads V2 checkpoint and local encoder ready. Model version: {engine.version[:12]}")


if __name__ == "__main__":
    main()
