"""Load books + features + embeddings into Neo4j as a knowledge graph.

Schema:
  (Book {id, title, author, description, style_vec, embedding})
  (Author {name})  -[:WROTE]-> (Book)
  (Book) -[:HAS_THEME]-> (Theme {name})
  (Book) -[:HAS_MOTIF]-> (Motif {name})
  (Book) -[:SET_IN]-> (Era {name})
  (Book) -[:FROM_REGION]-> (Region {name})
"""
import json, os
from pathlib import Path
from dotenv import load_dotenv
from neo4j import GraphDatabase
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

BOOKS = ROOT / "artifacts" / "books_enriched.json"
if not BOOKS.exists():
    BOOKS = ROOT.parent / "artifacts" / "books_enriched.json"
FEATS = ROOT / "artifacts" / "sskg_features.json"
EMBS = ROOT / "artifacts" / "sskg_embeddings.json"

URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PWD = os.getenv("NEO4J_PASSWORD", "emobooks123")


def book_id(b):
    return f"{b['title']}::{b.get('author','unknown')}"


SCHEMA = [
    "CREATE CONSTRAINT book_id IF NOT EXISTS FOR (b:Book) REQUIRE b.id IS UNIQUE",
    "CREATE CONSTRAINT author_name IF NOT EXISTS FOR (a:Author) REQUIRE a.name IS UNIQUE",
    "CREATE CONSTRAINT theme_name IF NOT EXISTS FOR (t:Theme) REQUIRE t.name IS UNIQUE",
    "CREATE CONSTRAINT motif_name IF NOT EXISTS FOR (m:Motif) REQUIRE m.name IS UNIQUE",
    "CREATE CONSTRAINT era_name IF NOT EXISTS FOR (e:Era) REQUIRE e.name IS UNIQUE",
    "CREATE CONSTRAINT region_name IF NOT EXISTS FOR (r:Region) REQUIRE r.name IS UNIQUE",
]

UPSERT = """
MERGE (b:Book {id: $id})
SET b.title = $title,
    b.author = $author,
    b.description = $description,
    b.style_vec = $style_vec,
    b.embedding = $embedding,
    b.tone = $tone,
    b.pacing = $pacing,
    b.emotion_tags = $emotion_tags,
    b.emotional_intensity = $emotional_intensity
MERGE (a:Author {name: $author})
MERGE (a)-[:WROTE]->(b)
WITH b
UNWIND $themes AS th
  MERGE (t:Theme {name: th})
  MERGE (b)-[:HAS_THEME]->(t)
WITH b
UNWIND $motifs AS mo
  MERGE (m:Motif {name: mo})
  MERGE (b)-[:HAS_MOTIF]->(m)
WITH b
FOREACH (_ IN CASE WHEN $era <> '' THEN [1] ELSE [] END |
  MERGE (e:Era {name: $era})
  MERGE (b)-[:SET_IN]->(e))
WITH b
FOREACH (_ IN CASE WHEN $region <> '' THEN [1] ELSE [] END |
  MERGE (r:Region {name: $region})
  MERGE (b)-[:FROM_REGION]->(r))
"""


def main():
    books = json.loads(BOOKS.read_text())
    feats = json.loads(FEATS.read_text()) if FEATS.exists() else {}
    embs = json.loads(EMBS.read_text()) if EMBS.exists() else {}

    driver = GraphDatabase.driver(URI, auth=(USER, PWD))
    with driver.session() as s:
        for q in SCHEMA:
            s.run(q)
        loaded = 0
        for b in tqdm(books):
            bid = book_id(b)
            f = feats.get(bid)
            if not f:
                continue
            style_vec = [
                float(f.get("metaphor_density", 0)),
                float(f.get("sentence_complexity", 0)),
                float(f.get("narrative_rhythm", 0)),
                float(f.get("lexical_richness", 0)),
                float(f.get("emotional_intensity", 0)),
            ]
            themes = list({*(f.get("themes") or []), *(b.get("themes") or [])})
            motifs = list(f.get("motifs") or [])
            s.run(UPSERT, {
                "id": bid,
                "title": b.get("title", ""),
                "author": b.get("author", "unknown"),
                "description": b.get("description", ""),
                "tone": b.get("tone", ""),
                "pacing": b.get("pacing", ""),
                "style_vec": style_vec,
                "embedding": embs.get(bid, []),
                "emotion_tags": list({*(b.get("emotion_tags") or [])}),
                "emotional_intensity": float(f.get("emotional_intensity", 0)),
                "themes": [t for t in themes if t],
                "motifs": [m for m in motifs if m],
                "era": f.get("historical_era", "") or "",
                "region": f.get("region", "") or "",
            })
            loaded += 1
    driver.close()
    print(f"loaded {loaded} books into Neo4j @ {URI}")


if __name__ == "__main__":
    main()
