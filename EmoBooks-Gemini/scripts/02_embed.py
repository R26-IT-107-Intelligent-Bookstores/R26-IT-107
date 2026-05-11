"""Compute Gemini embeddings per book (semantic vector).

Reads:  ../artifacts/books_enriched.json + sskg_features.json
Writes: artifacts/sskg_embeddings.json  ({book_id: [floats]})
"""
import json, os
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

BOOKS = ROOT / "artifacts" / "books_enriched.json"
if not BOOKS.exists():
    BOOKS = ROOT.parent / "artifacts" / "books_enriched.json"
FEATS = ROOT / "artifacts" / "sskg_features.json"
OUT = ROOT / "artifacts" / "sskg_embeddings.json"

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = os.getenv("GEMINI_EMBED_MODEL", "text-embedding-004")


def book_id(b):
    return f"{b['title']}::{b.get('author','unknown')}"


def text_for(b, f):
    parts = [
        b.get("title", ""),
        f"by {b.get('author','')}",
        b.get("description", ""),
        "themes: " + ", ".join((f or {}).get("themes", []) or b.get("themes", []) or []),
        "motifs: " + ", ".join((f or {}).get("motifs", [])),
        f"era: {(f or {}).get('historical_era','')}",
        f"region: {(f or {}).get('region','')}",
    ]
    return ". ".join(p for p in parts if p)


def main():
    books = json.loads(BOOKS.read_text())
    feats = json.loads(FEATS.read_text()) if FEATS.exists() else {}
    cache = json.loads(OUT.read_text()) if OUT.exists() else {}

    todo = [b for b in books if book_id(b) not in cache and book_id(b) in feats]
    print(f"embedding {len(todo)} books (cached {len(cache)})")

    for i, b in enumerate(tqdm(todo)):
        bid = book_id(b)
        try:
            r = client.models.embed_content(model=MODEL, contents=text_for(b, feats.get(bid)))
            cache[bid] = r.embeddings[0].values
        except Exception as e:
            print(f"[skip] {bid}: {e}")
            continue
        if (i + 1) % 50 == 0:
            OUT.write_text(json.dumps(cache))

    OUT.write_text(json.dumps(cache))
    print(f"saved -> {OUT}  ({len(cache)} embeddings)")


if __name__ == "__main__":
    main()
