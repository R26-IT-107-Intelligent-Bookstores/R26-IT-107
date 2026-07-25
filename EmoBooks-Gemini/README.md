# EmoBooks-Gemini · SSKG-SL Demo

Stylistic-Semantic Knowledge Graph for Sinhala literature recommendation.
Demo implementation of the proposed SSKG-SL component using **Gemini API**
for stylistic + cultural feature extraction and **Neo4j** for the knowledge graph.

## Architecture

```
books_enriched.json (948 Sinhala books)
        │
        ▼
[1] Gemini 2.5 Flash → stylistic features (metaphor density, narrative
                       rhythm, complexity, richness, emotional intensity)
                       + cultural tags (themes, motifs, era, region)
[2] gemini-embedding-001 → 3072-d semantic vector per book
[3] Neo4j graph: (Book)-[HAS_THEME|HAS_MOTIF|SET_IN|FROM_REGION]->(...)
                 (Author)-[WROTE]->(Book)
                 + emotion_tags / emotional_intensity on Book
[4] Hybrid recommender:
       score = 0.4 · cosine(style_vec) + 0.4 · cosine(embedding)
             + 0.2 · normalized graph-neighbor overlap
[5] Chat librarian (FastAPI + Gemini):
       turn 1..N — detect emotion + intent (maintain/switch/amplify)
       on ready  — Cypher fetch + 2nd Gemini call picks one book
                   and writes a conversational pitch in user's language
```

## Prerequisites

- Python 3.11+
- Docker (for Neo4j) — Docker Desktop or `colima start`
- A Gemini API key — https://aistudio.google.com/app/apikey

## Clone & setup

```bash
git clone git@github.com:Innocubelk/emoBooks.git
cd emoBooks/EmoBooks-Gemini

# 1. Configure secrets
cp .env.example .env
# edit .env and set GEMINI_API_KEY=...

# 2. Python environment
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# 3. Start Neo4j (community edition, free)
docker compose up -d
# wait ~15s, browser UI at http://localhost:7474 (neo4j / emobooks123)
```

## Build the knowledge graph

The repo ships **without** generated caches (`sskg_features.json`,
`sskg_embeddings.json`) — they're rebuilt from the catalog the first time
you run the pipeline.

```bash
# Use LIMIT=20 for a quick demo run; omit for the full 948 books.
LIMIT=20 .venv/bin/python scripts/01_extract_features.py
.venv/bin/python scripts/02_embed.py
.venv/bin/python scripts/03_load_neo4j.py
```

Cost & time on the full catalog:
- step 1: ~80 min, ≈ a few dollars of Gemini Flash usage
- step 2: ~10 min on `gemini-embedding-001`
- step 3: ~30 s

Each script is **idempotent** — rerun safely if it stops mid-way.

## Run the web app

```bash
.venv/bin/uvicorn app:app --port 8765
# open http://localhost:8765
```

Two tabs:

- **Chat with the Librarian** — describe how you feel; the bot detects your
  current emotion, asks whether you want to *maintain*, *switch* or *amplify*
  it, and picks one book by name with a personalised pitch. Speaks the same
  language you write in.
- **Browse / Similar Books** — search the catalog and view stylistic
  fingerprint + hybrid-similarity recommendations for any book.

## API endpoints

- `POST /api/chat` — body `{session_id?, message}` → reply, detected state, picked book + alternatives
- `POST /api/chat/reset` — clear a session
- `GET  /api/books?q=` — search by title/author
- `GET  /api/book/{id}` — book details + stylistic vector
- `GET  /api/recommend/{id}?k=5` — hybrid book-to-book recommendations
- `GET  /api/graph/{id}` — neighborhood (for visualization)

`{id}` = `"<title>::<author>"` — URL-encode the `::`.

## Project layout

```
EmoBooks-Gemini/
├── app.py                       FastAPI: chat + browse + graph endpoints
├── docker-compose.yml           Neo4j 5.20 community
├── requirements.txt
├── .env.example                 template — copy to .env, add API key
├── scripts/
│   ├── 01_extract_features.py   Gemini → stylistic + cultural JSON
│   ├── 02_embed.py              Gemini-embedding-001 → 3072-d vectors
│   └── 03_load_neo4j.py         knowledge-graph ingest
├── templates/index.html         tabbed UI shell
├── static/{style.css, app.js}   chat + browse front-end
└── artifacts/                   regenerated caches (gitignored)
```

## Notes (demo cuts)

- No GNN — weighted cosine + graph overlap (good enough for demo).
- No Sinhala NLP pipeline — Gemini does feature extraction in one shot.
- Run `LIMIT=20` first to validate end-to-end on a few cents of API spend.
- Source catalog `artifacts/books_enriched.json` (948 Sinhala books) ships
  with the repo. Scripts also fall back to `../artifacts/books_enriched.json`
  if you're running inside the larger EmoBooks monorepo.
