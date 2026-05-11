# EmoBooks-Gemini — Quick Start

Minimum steps to get the chat librarian running on your machine.

## Prerequisites

- Python 3.11+ (3.12 works)
- Docker (Docker Desktop or Docker Engine)
- A Gemini API key — https://aistudio.google.com/app/apikey

Check:

```bash
python3 --version
docker --version
```

---

## First-time setup

Run these once after cloning the repo.

### 1. Move into the project

```bash
cd EmoBooks-Gemini
```

### 2. Create the `.env` file with your secrets

```bash
cp .env.example .env
```

Open `.env` in any editor and set:

```
GEMINI_API_KEY=<paste-your-key-here>
```

Leave the other values as-is unless you have a reason to change them.

### 3. Create a Python virtual environment and install dependencies

```bash
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
```

### 4. Start Neo4j (the knowledge graph database)

```bash
docker compose up -d
```

First run pulls the `neo4j:5.20-community` image (~250 MB). Wait ~15 seconds, then verify:

```bash
docker ps --filter name=emobooks-neo4j --format "{{.Names}} {{.Status}}"
```

Expected: `emobooks-neo4j Up X seconds (healthy)`.

Neo4j browser UI: http://localhost:7474 — login `neo4j` / `emobooks123`.

### 5. Build the knowledge graph (one-time per dataset)

These three scripts populate Neo4j from the catalog. Run them in order.

```bash
LIMIT=20 .venv/bin/python scripts/01_extract_features.py
.venv/bin/python scripts/02_embed.py
.venv/bin/python scripts/03_load_neo4j.py
```

- `LIMIT=20` processes only 20 books — enough to demo, costs a few cents on Gemini API. Drop the `LIMIT=20` prefix to process the full 948-book catalog (~80 min, ~few dollars of API usage).
- All three scripts are idempotent — safe to rerun if interrupted.

After step 5 you'll have:
- `artifacts/sskg_features.json` — stylistic + cultural features
- `artifacts/sskg_embeddings.json` — 3072-d Gemini embeddings
- A populated Neo4j graph

---

## Run the app

```bash
.venv/bin/uvicorn app:app --port 8765
```

Open http://localhost:8765 in a browser. Two tabs:

- **Chat with the Librarian** — describe how you feel; the bot picks one book.
- **Browse / Similar Books** — search the catalog and view recommendations.

Stop the server: `Ctrl+C` in the terminal.

---

## Day-to-day commands

After first-time setup, this is all you need:

```bash
# from EmoBooks-Gemini/
docker compose up -d                          # start Neo4j (if stopped)
.venv/bin/uvicorn app:app --port 8765         # start the web app
```

Stop everything when done:

```bash
# Ctrl+C the uvicorn process first, then:
docker compose down                           # stop Neo4j (data persists in volume)
```

To remove the Neo4j data too: `docker compose down -v`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | You ran `python app.py` instead of `.venv/bin/uvicorn ...`. Use the venv binary, or activate it first with `source .venv/bin/activate`. |
| `KeyError: 'GEMINI_API_KEY'` | `.env` is missing or doesn't contain the key. See setup step 2. |
| `neo4j.exceptions.ServiceUnavailable` | Neo4j isn't running. `docker compose up -d` and wait 15s. |
| Port 8765 already in use | `--port 8766` (or any free port) on the uvicorn command. |
| Port 7474 / 7687 already in use | Some other Neo4j is running. `docker ps` to find it; stop it or change ports in `docker-compose.yml`. |
| `429 RESOURCE_EXHAUSTED` from Gemini | Rate limited. Wait a minute and rerun — scripts resume from where they left off. |

---

## What's actually running

```
[browser] ── http://localhost:8765 ──► [uvicorn / FastAPI app.py]
                                              │
                                              ├──► Neo4j (bolt://localhost:7687)
                                              │
                                              └──► Gemini API (chat + embedding)
```

Configuration lives in `.env`. Catalog is `artifacts/books_enriched.json` (ships with repo). Generated caches (`sskg_features.json`, `sskg_embeddings.json`) are gitignored — rebuild via the three scripts.
