import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Settings:
    mongo_uri: str
    mongo_db: str
    model_dir: Path
    cors_origins: tuple[str, ...]
    session_hours: int = 8
    model_device: str = ""
    neo4j_uri: str = "neo4j://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""
    neo4j_database: str = "neo4j"
    recommender_dir: Path = ROOT / "models/goodreads_hybrid_recommender_v2"
    recommender_encoder_dir: Path = ROOT / "models/recommender_encoder"
    recommender_candidate_limit: int = 2000

    @classmethod
    def from_env(cls):
        # This service owns its configuration; never loads another backend's .env.
        load_dotenv(ROOT / ".env")
        directory = Path(os.getenv("MODEL_DIR", "models/final_hierarchical_emotion_model"))
        return cls(
            mongo_uri=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
            mongo_db=os.getenv("MONGO_DB", "emobooks_db"),
            model_dir=directory if directory.is_absolute() else ROOT / directory,
            cors_origins=tuple(origin.strip() for origin in os.getenv(
                "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
            ).split(",") if origin.strip()),
            session_hours=int(os.getenv("SESSION_HOURS", "8")),
            model_device=os.getenv("MODEL_DEVICE", ""),
            neo4j_uri=os.getenv("NEO4J_URI", "neo4j://localhost:7687"),
            neo4j_username=os.getenv("NEO4J_USERNAME", "neo4j"),
            neo4j_password=os.getenv("NEO4J_PASSWORD", ""),
            neo4j_database=os.getenv("NEO4J_DATABASE", "neo4j"),
            recommender_dir=ROOT / os.getenv("RECOMMENDER_DIR", "models/goodreads_hybrid_recommender_v2"),
            recommender_encoder_dir=ROOT / os.getenv("RECOMMENDER_ENCODER_DIR", "models/recommender_encoder"),
            recommender_candidate_limit=max(1, int(os.getenv("RECOMMENDER_CANDIDATE_LIMIT", "2000"))),
        )
