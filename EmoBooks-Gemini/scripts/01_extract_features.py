"""Extract stylistic + cultural features for each book using Gemini.

Reads:  ../artifacts/books_enriched.json
Writes: artifacts/sskg_features.json  (idempotent — resumes on rerun)
"""
import json, os, sys, time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

BOOKS = ROOT / "artifacts" / "books_enriched.json"
if not BOOKS.exists():
    BOOKS = ROOT.parent / "artifacts" / "books_enriched.json"
OUT = ROOT / "artifacts" / "sskg_features.json"
OUT.parent.mkdir(exist_ok=True)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SCHEMA = {
    "type": "object",
    "properties": {
        "metaphor_density": {"type": "number"},      # 0..1
        "sentence_complexity": {"type": "number"},   # 0..1
        "narrative_rhythm": {"type": "number"},      # 0..1 (slow=0, brisk=1)
        "lexical_richness": {"type": "number"},      # 0..1
        "emotional_intensity": {"type": "number"},   # 0..1
        "themes": {"type": "array", "items": {"type": "string"}},
        "motifs": {"type": "array", "items": {"type": "string"}},
        "historical_era": {"type": "string"},
        "region": {"type": "string"},
    },
    "required": ["metaphor_density", "sentence_complexity", "narrative_rhythm",
                 "lexical_richness", "emotional_intensity", "themes",
                 "motifs", "historical_era", "region"],
}

PROMPT = """You are analyzing a Sinhala/Sri Lankan literary work. From the
metadata below, infer stylistic and cultural features. Return JSON only.

Title: {title}
Author: {author}
Tone: {tone}
Pacing: {pacing}
Themes: {themes}
Description: {description}

Score numeric fields 0..1. Themes/motifs: 3-6 short tags. Era examples:
"colonial", "post-independence", "contemporary", "ancient", "rural-modern".
Region: e.g. "rural-southern", "colombo-urban", "hill-country", "general-sl".
"""


def book_id(b):
    return f"{b['title']}::{b.get('author','unknown')}"


def main():
    books = json.loads(BOOKS.read_text())
    cache = {}
    if OUT.exists():
        cache = json.loads(OUT.read_text())
    print(f"loaded {len(books)} books, {len(cache)} cached")

    limit = int(os.getenv("LIMIT", "0")) or len(books)
    todo = [b for b in books[:limit] if book_id(b) not in cache]
    print(f"extracting {len(todo)}")

    for i, b in enumerate(tqdm(todo)):
        prompt = PROMPT.format(
            title=b.get("title", ""),
            author=b.get("author", ""),
            tone=b.get("tone", ""),
            pacing=b.get("pacing", ""),
            themes=", ".join(b.get("themes") or []),
            description=b.get("description", ""),
        )
        try:
            resp = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SCHEMA,
                    temperature=0.2,
                ),
            )
            cache[book_id(b)] = json.loads(resp.text)
        except Exception as e:
            print(f"\n[skip] {book_id(b)}: {e}", file=sys.stderr)
            continue

        if (i + 1) % 25 == 0:
            OUT.write_text(json.dumps(cache, ensure_ascii=False, indent=2))

    OUT.write_text(json.dumps(cache, ensure_ascii=False, indent=2))
    print(f"saved -> {OUT}  ({len(cache)} books)")


if __name__ == "__main__":
    main()
