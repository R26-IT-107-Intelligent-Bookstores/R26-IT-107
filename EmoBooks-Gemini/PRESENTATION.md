# EmoBooks-Gemini — Mid Evaluation Overview (50%)

A presentation-ready walkthrough of the EmoBooks-Gemini sub-project.

---

## 1. Project Overview

**EmoBooks-Gemini** is the **SSKG-SL** (Stylistic-Semantic Knowledge Graph for Sinhala Literature) prototype from the project's proposal. It is an **emotion-aware Sinhala-novel recommender**: the user chats in English or Sinhala about how they feel right now, the system detects their **current emotion** + **intent** (maintain / switch / amplify it), then picks **one** book from a 948-title Sinhala catalog with a personalised pitch. Recommendations are computed from a **knowledge graph (Neo4j)** that encodes each book's *stylistic fingerprint* (how it reads) + *cultural context* (what it's about) — not from sales history. Everything runs locally except two LLM calls per chat turn that go to Google Gemini.

**Architecture in one picture:**

```
948 Sinhala books (curated + scraped)
       │
       ▼
 [Gemini 2.5 Flash]  →  5-D style vector + themes/motifs/era/region
       │
       ▼
 [gemini-embedding-001]  →  3072-D semantic vector
       │
       ▼
 [Neo4j 5.20]  ──  Book / Author / Theme / Motif / Era / Region nodes
                   + WROTE / HAS_THEME / HAS_MOTIF / SET_IN / FROM_REGION edges
       │
       ▼
 [Hybrid recommender]  score = 0.4·cosine(style) + 0.4·cosine(semantic) + 0.2·graph_overlap
       │
       ▼
 [FastAPI app]  chat tab + browse tab + graph endpoint
       │
       ▼
 [HTML/JS frontend]  http://localhost:8765
```

---

## 2. Dataset — how it's organised

**Source catalog** `artifacts/books_enriched.json` — **948 Sinhala books**, 528 KB. Each row:

| Field | Type | Example |
|---|---|---|
| `title`, `title_original` | string | `"Leela"` |
| `author`, `author_original` | string | `"Martin Wickramasinghe"` |
| `language` | string | `"si"` |
| `tone` | string | `"romantic"` |
| `pacing` | string | `"medium"` |
| `themes` | array | `["love", "family", "tradition"]` |
| `emotion_tags` | array | `["love", "sadness"]` |
| `description` | string | one-paragraph blurb |
| `source` | string | `"curated"` or scrape source |

**Generated layer 1** `artifacts/sskg_features.json` — Gemini-extracted per book (5 numeric + 4 categorical):

```json
{
  "metaphor_density":     0.78,
  "sentence_complexity":  0.65,
  "narrative_rhythm":     0.40,
  "lexical_richness":     0.82,
  "emotional_intensity":  0.71,
  "themes":  ["village life", "betrayal", "redemption"],
  "motifs":  ["river", "rain", "monsoon"],
  "historical_era":  "post-independence",
  "region":  "rural-southern"
}
```

All numeric fields are scaled `0..1` (`narrative_rhythm`: slow=0, brisk=1).

**Generated layer 2** `artifacts/sskg_embeddings.json` — 3072-D semantic vector per book (one float array per `book_id`).

**Final destination — Neo4j graph.** All three layers merge into one knowledge graph (see Section 6).

---

## 3. `requirements.txt` — packages in plain language

| Package | What it does | Why we need it |
|---|---|---|
| **`google-genai`** | Official Python SDK for Google's Gemini API | Calling Gemini 2.5 Flash for feature extraction + chat, and gemini-embedding-001 for vectors |
| **`neo4j`** | Official Python driver for Neo4j | Talking to the graph database (Cypher queries) |
| **`fastapi`** | Modern Python web framework | The web API (`/api/chat`, `/api/books`, etc.) — also auto-generates OpenAPI docs |
| **`uvicorn`** | ASGI server | Actually runs the FastAPI app (`uvicorn app:app`) |
| **`numpy`** | Numerical computing | Vector math (cosine, normalization) when needed |
| **`jinja2`** | HTML templating | Renders `templates/index.html` from the `/` route |
| **`python-dotenv`** | `.env` file loader | Reads `GEMINI_API_KEY`, `NEO4J_PASSWORD` etc. into the process |
| **`tqdm`** | Progress bars | Visual progress when extracting features for 948 books (~80 min) |

**Outside requirements.txt** but required: **Docker** (to run Neo4j) and **Python 3.11+**.

---

## 4. About the Model

### Two Gemini models, one graph database

| Component | Model | Purpose | Output |
|---|---|---|---|
| Feature extractor | **Gemini 2.5 Flash** | Reads each book's metadata + description, returns a structured JSON of stylistic + cultural features | Schema-constrained JSON, `temperature=0.2` |
| Embedding model | **gemini-embedding-001** | Encodes each book's textual signature into a dense semantic vector | 3072-dimensional `float32` array |
| Chat librarian | **Gemini 2.5 Flash** | (Two calls per recommendation) — Call 1: detect emotion/intent; Call 2: pick one book + write pitch | JSON with schema (state) + JSON with `chosen_id` + `message` |
| Knowledge graph | **Neo4j 5.20 Community** | Stores books + relations + style/embedding vectors as node properties | Cypher query engine |

### Why structured JSON outputs

Both Gemini calls use **`response_schema`** + **`response_mime_type="application/json"`** — Gemini's *constrained decoding* mode. The model is *forced* to emit syntactically valid JSON matching the schema. No regex parsing, no broken responses.

### The hybrid recommender (the math)

For book-to-book similarity (`app.py:130-155`):

```
score(b₁, b₂) = 0.4 × cos(style_vec₁, style_vec₂)        // how does it read?
              + 0.4 × cos(embedding₁,  embedding₂)        // what is it about?
              + 0.2 × overlap(b₁,b₂) / max_overlap        // graph proximity
```

- `cos(...)` = standard cosine similarity
- `overlap(b₁,b₂)` = number of shared neighbours (themes / motifs / era / region) in the knowledge graph
- Normalised so the graph term stays in `[0,1]`

### The chat librarian — two-call pattern

`app.py:242 chat_turn()` and `app.py:378 pick_and_recommend()`:

1. **Call 1 — state detection.** User message → Gemini returns:
   `{reply, detected_emotion, intent, target_emotion, target_intensity, themes_of_interest, ready_to_recommend}`
2. **Filter via Neo4j.** If `ready_to_recommend=true`, run a Cypher emotion query that fetches up to 200 candidates whose `emotion_tags` match the target.
3. **Score in Python.** `0.7 × intensity_fit + 0.3 × theme_overlap` ranks candidates.
4. **Call 2 — pick + pitch.** Top-5 candidates + reader state → Gemini returns:
   `{chosen_id, message}` — one book + a 2-3 sentence pitch in the user's language.
5. The chosen `book_id` is appended to `session.recommended` so the next request returns a *different* book.

### Canonical emotion set

Six labels: `joy`, `sadness`, `love`, `calm`, `lonely`, `anger`. Broader feelings the user types are aliased to these via `EMOTION_ALIAS` (e.g. `hope → joy`, `melancholy → sadness`, `anxious → calm`, `rage → anger`).

---

## 5. What we've done — the 50% checkpoint

| # | Deliverable | Status |
|---|---|---|
| 1 | 948-book Sinhala catalog (shared with root project) | Done |
| 2 | Gemini-based stylistic + cultural feature extractor | Done |
| 3 | Semantic embedding pipeline (3072-D vectors) | Done |
| 4 | Neo4j knowledge graph schema + loader | Done |
| 5 | Hybrid recommender (style + semantic + graph) | Done |
| 6 | Two-call Gemini chat librarian | Done |
| 7 | FastAPI REST API (7 endpoints) | Done |
| 8 | HTML/JS frontend (chat + browse tabs) | Done |
| 9 | Docker Compose for Neo4j (one-command setup) | Done |
| 10 | End-to-end demo verified (LIMIT=20 pipeline run) | Done |
| 11 | Setup documentation | Done (`README.md`, `QUICKSTART.md`) |

**Demo readiness:** can be shown end-to-end on a laptop in under 5 minutes (`docker compose up -d` + three pipeline scripts + `uvicorn`).

---

## 6. Neo4j — what's actually in the graph

**Yes — fully implemented.** Server: Neo4j 5.20 Community, runs in Docker (`emobooks-neo4j` container). Ports `7474` (browser UI) and `7687` (Bolt protocol). Default credentials `neo4j / emobooks123`.

### Schema (created in `03_load_neo4j.py`)

**6 node labels:**

| Label | Properties |
|---|---|
| `Book` | `id`, `title`, `author`, `description`, `tone`, `pacing`, `emotion_tags`, `emotional_intensity`, `style_vec` (5 floats), `embedding` (3072 floats) |
| `Author` | `name` |
| `Theme` | `name` |
| `Motif` | `name` |
| `Era` | `name` |
| `Region` | `name` |

**5 relationship types:**

```
(Author)-[:WROTE]->(Book)
(Book)-[:HAS_THEME]->(Theme)
(Book)-[:HAS_MOTIF]->(Motif)
(Book)-[:SET_IN]->(Era)
(Book)-[:FROM_REGION]->(Region)
```

**6 unique constraints** on every name/id field so we get fast lookup + idempotent upserts (`MERGE` instead of `CREATE`).

### Cypher queries used at runtime (all in `app.py`)

| Query | Purpose |
|---|---|
| `SEARCH_Q` | Search books by title/author substring |
| `GET_BOOK` | Fetch a book + all themes/motifs/era/region |
| `CANDIDATES_Q` | Find books that share ≥1 theme/motif/era/region with a given book (graph traversal) |
| `EMOTION_QUERY` | Find books whose `emotion_tags` match a target emotion |
| `GRAPH_Q` | Fetch a book's 1-hop neighbourhood (for visualisation) |

### Quick demo Cypher (paste in browser at http://localhost:7474)

```cypher
// Count what's loaded
MATCH (b:Book) RETURN count(b);

// Show one book's full neighbourhood
MATCH (b:Book {title:"Leela"})-[r]-(n) RETURN b, r, n;

// Find books with overlapping themes & motifs
MATCH (b1:Book)-[:HAS_THEME|HAS_MOTIF]->(x)<-[:HAS_THEME|HAS_MOTIF]-(b2:Book)
WHERE b1.title="Madol Doova" AND b1<>b2
RETURN b2.title, count(DISTINCT x) AS shared ORDER BY shared DESC LIMIT 5;
```

---

## 7. File-by-file walkthrough

| File | Purpose | LOC | Key bits |
|---|---|---|---|
| `app.py` | **The whole web app.** FastAPI routes, chat logic, hybrid recommender, Cypher queries | ~444 | `chat_turn()`, `pick_and_recommend()`, `find_books_by_emotion()`, scoring formula at line 144 |
| `scripts/01_extract_features.py` | Stage 1 of pipeline. Gemini 2.5 Flash → 5-D style vec + themes/motifs/era/region. **Idempotent** (caches by `book_id`) | ~107 | `SCHEMA` (lines 25-41), `PROMPT` (lines 43-56) |
| `scripts/02_embed.py` | Stage 2. `gemini-embedding-001` → 3072-D vector per book | ~67 | `text_for()` (lines 29-39) concatenates title + author + description + themes for embedding input |
| `scripts/03_load_neo4j.py` | Stage 3. Creates constraints, then upserts every book + relationships in one Cypher `MERGE` | ~123 | `SCHEMA` (lines 35-42), `UPSERT` (lines 44-73) |
| `docker-compose.yml` | Single-service stack: Neo4j 5.20 Community + APOC plugin + named volumes for persistence | ~21 | Memory: heap 512m → 1G |
| `requirements.txt` | 8 Python packages | 8 lines | See Section 3 |
| `.env.example` | Template for secrets/config — copy to `.env` and fill in `GEMINI_API_KEY` | — | Other vars: `NEO4J_*`, `BOOKS_SOURCE`, `*_CACHE` paths |
| `templates/index.html` | Tabbed UI shell (Chat tab + Browse tab) | ~52 | Loaded via Jinja2 from `/` |
| `static/app.js` | Frontend logic — chat panel, browse search, fetches `/api/*` | ~180 | Vanilla JS, no framework |
| `static/style.css` | Styling | ~89 | Minimal — no Tailwind / no shadcn |
| `README.md` | Full project description + architecture diagram + run instructions | ~126 | Reference doc |
| `QUICKSTART.md` | Step-by-step runbook | ~120 | First-time setup + day-to-day commands |
| `artifacts/books_enriched.json` | **The source catalog** (committed to repo, 528 KB, 948 entries) | — | Sample row shown in Section 2 |
| `artifacts/sskg_features.json` | Generated layer 1 (gitignored — rebuilt by script 01) | — | Sample shown in Section 2 |
| `artifacts/sskg_embeddings.json` | Generated layer 2 (gitignored — rebuilt by script 02) | — | `{book_id: [3072 floats]}` |

---

## 8. What we're doing next — the other 50%

| Priority | Task | Why |
|---|---|---|
| **High** | **Run the full pipeline on all 948 books** (currently only 20 done) | The demo today uses a *sliver* of the catalog. ~80 min + a few USD of Gemini Flash usage |
| **High** | **Evaluation harness** — measure recommendation precision, response latency, API cost per session | We have no quantitative numbers yet — only qualitative demos |
| **Medium** | **Graph-visualisation tab** in the frontend (using `/api/graph/{id}` endpoint that already exists) | The endpoint returns nodes + links but no UI consumes it yet |
| **Medium** | **Cold-start handling** — what happens when a book is added that has no features yet | Currently the system silently skips books without features in the loader |
| **Medium** | **GNN upgrade** — replace `0.2 × graph_overlap` with a learned graph embedding (Node2Vec / GraphSAGE) | The README explicitly notes "No GNN — weighted cosine + graph overlap (good enough for demo)" |
| **Medium** | **A/B comparison vs. the root Llama-based system** — same query, two recommenders, measure preference | Strongest evidence for the proposal's claim |
| **Low** | **Production deployment** — public URL, HTTPS, rate-limiting, monitoring, secret rotation | After evaluation results are in |
| **Low** | **Native Sinhala NLP** — currently Gemini handles everything; could measure benefit of dedicated Sinhala tokeniser / sentencepiece model | Research extension |
| **Low** | **Persisted sessions** (Redis) — currently `SESSIONS` is an in-memory dict, lost on restart | Productionisation |

---

## 9. Two-line elevator pitch (for the slide deck)

> **EmoBooks-Gemini** is the SSKG-SL prototype from the project's proposal: an emotion-aware chat recommender for **948 Sinhala novels**, where every book is represented in a **Neo4j knowledge graph** as a 5-dimensional *stylistic fingerprint* + a 3072-dimensional *semantic embedding* + a web of *theme / motif / era / region* relations, all extracted by **Gemini 2.5 Flash**. A user describes how they feel, two Gemini calls (state detection → book pick) plus a **hybrid 0.4 / 0.4 / 0.2 score** over style, semantics, and graph-overlap pick **one** matching book and write a personalised pitch in the user's language.
>
> **50% done:** full pipeline, graph, hybrid recommender, chat, web UI, Docker setup, demo verified end-to-end on a 20-book slice. **Next 50%:** full-catalog run, quantitative evaluation, graph visualisation, GNN upgrade, head-to-head comparison with the Llama-based root system.

---

## 10. Demo script (5 minutes)

1. `docker compose up -d` — Neo4j starts on ports 7474 / 7687.
2. Show the empty Neo4j browser at http://localhost:7474.
3. `LIMIT=20 .venv/bin/python scripts/01_extract_features.py` — show progress bar.
4. Open the generated `artifacts/sskg_features.json` in the IDE — show one row with the 5 numeric fields + themes/motifs/era/region.
5. `.venv/bin/python scripts/02_embed.py` then `scripts/03_load_neo4j.py`.
6. Back to Neo4j browser → paste the demo Cypher → show the graph visualisation of one book's neighbourhood.
7. `.venv/bin/uvicorn app:app --port 8765` → open http://localhost:8765.
8. In the chat tab, type something like *"I'm feeling lonely tonight and want a book that makes me feel less alone."* — show the librarian's reply, the detected emotion, and the recommended book.
9. Type *"give me a different one"* — show the system picks a different book (`session.recommended` tracks what's already been suggested).
10. Switch to the Browse tab → search for a known title → show its stylistic fingerprint + top-5 similar books from the hybrid recommender.
