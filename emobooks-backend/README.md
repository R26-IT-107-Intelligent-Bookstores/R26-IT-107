# EmoBooks emotion catalog microservice

An independent FastAPI service on **port 8010**. It has its own environment,
dependencies, admin accounts and sessions in MongoDB (`emobooks_db`), and a
Neo4j book catalog containing metadata and emotion model results.
It imports no code from PhonoLex, TrendStock, FedBook or EmoBooks-Gemini.
Other services use ports 3001, 5000, 8000, 8501 and 8765; none is reused here.

In the existing admin dashboard, click **EmoBooks** to open
`http://localhost:3000/admin/emobooks`. Add title, author, description, optional
ISBN/genres/cover URL and an optional English story excerpt (paste or `.txt`).
The excerpt takes precedence over the description for inference. Sinhala titles
and author names are supported; this English-trained classifier requires an
English synopsis/excerpt. Genre metadata is entered by the admin; the model
assigns **emotion categories**, not literary genres.

## Local setup (PowerShell)

Run from `emobooks-backend`:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `MONGO_URI` to your MongoDB connection string in this service's `.env`.
Use the independent `MONGO_DB=emobooks_db` database for admin accounts and sessions.
Books are saved only in Neo4j. Never commit `.env` or weights.
The same MongoDB cluster can host this database alongside the other services;
the service does not read or mutate their collections.

Create/start a Neo4j instance (local Neo4j or Neo4j Aura) and set these values
in `emobooks-backend/.env` using its connection details:

```dotenv
NEO4J_URI=neo4j+s://YOUR-INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-database-password
NEO4J_DATABASE=neo4j
```

For a local instance, use `NEO4J_URI=neo4j://localhost:7687` and its actual
password. Use a database dedicated to EmoBooks. The Neo4j account needs read,
write and index/constraint creation permissions. Check the connection and
create the catalog schema before starting the API:

```powershell
.venv\Scripts\python scripts/check_neo4j.py
```

To start a new local Neo4j database with Docker Desktop, set
`NEO4J_USERNAME=neo4j`, `NEO4J_DATABASE=neo4j`, the local URI above and your
chosen `NEO4J_PASSWORD` in `.env`, then run:

```powershell
docker compose -f docker-compose.neo4j.yml up -d
.venv\Scripts\python scripts/check_neo4j.py
```

The first start downloads the image and initializes the database. Neo4j Browser
is available at `http://localhost:7474`. This separate Compose file starts only
Neo4j; it keeps data in a named Docker volume and binds ports to localhost.
The password from `.env` initializes a fresh database; changing `.env` later
does not change the password of an existing database. Stop it without deleting
data with `docker compose -f docker-compose.neo4j.yml stop`.
See [Neo4j Docker setup](https://neo4j.com/docs/operations-manual/current/docker/introduction/).

This prints `Neo4j connected. Book catalog constraints and indexes are ready.`
when setup succeeds. Existing `.env` files need the new `NEO4J_*` entries;
do not overwrite an existing `.env` with the example. A missing/unavailable
Neo4j catalog returns 503 for catalog operations; health/docs and admin login
remain available while configuring the connection.

Prepare the supplied trusted model export (supports flat ZIPs and the original
`final_hierarchical_emotion_model/` prefix):

```powershell
.venv\Scripts\python scripts/prepare_model.py "$env:USERPROFILE\Downloads\final_hierarchical_emotion_model.zip"
.venv\Scripts\hf.exe download microsoft/deberta-v3-base config.json --local-dir models/final_hierarchical_emotion_model/encoder
.venv\Scripts\python scripts/create_admin.py --username your-admin@example.com
.venv\Scripts\python -m uvicorn emobooks.main:app --host 127.0.0.1 --port 8010
```

The admin provisioning script prompts for the password and stores its
PBKDF2-SHA256 hash. There is no public admin registration endpoint. Provision
matching credentials in the existing bookstore authentication system if you
want its Sign In screen to start the EmoBooks session automatically. The
EmoBooks tab also has its own sign-in screen and works independently.

Frontend `frontend-web/.env.local`:

```dotenv
NEXT_PUBLIC_EMOBOOKS_API_URL=http://localhost:8010
```

Restart Next.js after changing environment variables. The default is already
`http://localhost:8010`; set an HTTPS URL when deploying. API docs:
`http://localhost:8010/docs`. Use one Uvicorn worker for a single model copy.
Docker alternative after preparing `.env` and model files: `docker compose up --build`.
The model directory is mounted read-only and is not copied into the image.
Docker Compose starts the API only; MongoDB and Neo4j must be reachable external
instances. For Neo4j running on the Windows host, use
`NEO4J_URI=bolt://host.docker.internal:7687` inside the API container.

## Classification and storage

The architecture, 18 feature values/order, Porter stemming, VADER sentiment,
mean pooling, saved StandardScaler, stage-B biases and neutral gate match the
provided training/export code. Only local checkpoints are loaded. The base
encoder **configuration** is downloaded once during setup; its pretrained
weights are unnecessary because both checkpoints already contain encoders.
Runtime inference makes no network calls and does not train either model.

Stage A estimates neutral/emotional scores. Stage B estimates five emotional
classes. The stored six-class scores are `P(neutral)` and
`P(emotional) * P(class | emotional)` after adding the exported stage-B biases.
The category follows the exported threshold (0.68 in the supplied ZIP), so the
selected category need not have the largest joint score. These describe the
text, not an expected effect on the reader.

Short input is processed as in training (128-token maximum). Longer text is
split into non-overlapping model token chunks, each using its own engineered
features. Scores are averaged with weights equal to the number of content
tokens, then the same neutral gate is applied. All chunks are processed; the
limit is 64 chunks and 16,000 characters for a separate excerpt. Document
aggregation is an inference policy, not a calibrated book-level model.

Neo4j `Book` nodes store metadata, the submitted description/excerpt, category, all six scores,
emotional score, threshold, model/checkpoint fingerprint, chunk count,
creator and UTC timestamp. An unavailable classifier never saves an
unclassified record. Database failures return 503 and no success notification.
Normalized ISBNs are unique when supplied. `Idempotency-Key` makes retries of
the same submission safe, including a lost HTTP response after a successful save.
Search, category counts/filtering and pagination read persisted database records.
All catalog reads/writes use Neo4j, with no MongoDB fallback or duplicate catalog
write. Admin credentials/sessions still use MongoDB. Existing books previously
saved to MongoDB are not automatically migrated.

Each save creates `(b:Book)-[:HAS_EMOTION]->(e:Emotion)` atomically. Book properties
include `title`, `author`, `isbn`, `genres`, `description`, `classification_text`,
`cover_url`, `category`, six `probability_<emotion>` values,
`emotional_probability`, `threshold`, `model_name`, `model_version`, `chunks`,
`created_by` and `created_at`. The API reconstructs the same nested
`classification` response used by the admin dashboard. The cover is stored as
the submitted URL/path; this API does not upload image binary data.

To view saved books and their model-assigned emotions in Neo4j Browser/Aura:

```cypher
MATCH (b:Book)-[r:HAS_EMOTION]->(e:Emotion)
RETURN b, r, e
LIMIT 50;
```

## Public recommendations

The user interface reads the same Neo4j catalog written by the admin flow.
Continue emotion selects the current category; Change emotion requires a distinct
target category and selects that category instead. The UI's `angry` choice maps
to the classifier's `angry_disgusted` label. No books from the bundled Goodreads
metadata or the old demo catalog are inserted or returned as suggestions.

Prepare the supplied Goodreads V2 ZIP and download its original Sentence-BERT
encoder once (from `emobooks-backend`):

```powershell
.venv\Scripts\python scripts/prepare_recommender.py "$env:USERPROFILE\Downloads\goodreads_hybrid_recommender_v2 (1).zip"
.venv\Scripts\hf.exe download sentence-transformers/all-MiniLM-L6-v2 --local-dir models/recommender_encoder --include config.json config_sentence_transformers.json modules.json sentence_bert_config.json "tokenizer*" vocab.txt special_tokens_map.json model.safetensors 1_Pooling/config.json
.venv\Scripts\python scripts/check_recommender.py
```

Configure these paths in `.env` if the defaults are unsuitable:

```dotenv
RECOMMENDER_DIR=models/goodreads_hybrid_recommender_v2
RECOMMENDER_ENCODER_DIR=models/recommender_encoder
RECOMMENDER_CANDIDATE_LIMIT=2000
```

The checkpoint is loaded locally with `weights_only=True`. The encoder is loaded
with `local_files_only=True`; runtime does not download or train models. It runs
on CPU, independently of the emotion model device. The bounded embedding cache
uses book content as its key, so new/changed books need no retraining or static
Goodreads ID assignment. Restart the service after replacing model files.

**Cold-start adaptation:** The supplied model's collaborative embeddings require
the exact training Goodreads user/book IDs. App users and newly added catalog
books have no such mapping. This integration uses the actual trained
`Linear -> LayerNorm -> Tanh` text network and learned scale, without assigning
random Goodreads identities. It averages normalized favourite-book and optional
genre/interest embeddings into a reader profile, projects profile and book vectors
using the trained network, and scores the semantic term from the V2 forward pass.
With no preferences, an emotion-based text prompt provides the initial profile.
Book text follows the training title/genres/750-character description recipe
(900 characters total), using the saved English excerpt when one was supplied.

Only books with the selected classifier category are eligible. Up to the latest
`RECOMMENDER_CANDIDATE_LIMIT` matching books are ranked; favourites are excluded
from suggestions. Relevance is `100 * (0.80 * sigmoid(content_logit) +
0.15 * stored_target_emotion_score + 0.05 * selected_genre_overlap)`. This fusion
is an application policy, not a calibrated probability of liking a book or
changing a reader's emotion. The Goodreads pseudo-pair threshold and known-user
test metrics do not validate this new cold-start adaptation. The training
children-domain/English-text limitations still apply.

Missing candidate books return an empty list. Missing/broken models or Neo4j
failures return 503; there is no demo fallback. Guest responses expose only public
book metadata, emotion and relevance/reason fields. Full excerpts, admin names,
session data and idempotency metadata are not included. Reading selections are
used for the request and are not persisted by this API.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/emobooks/catalog` | Public metadata, search/pagination and available genres |
| GET | `/api/emobooks/catalog/{id}` | Public book detail |
| POST | `/api/emobooks/catalog/lookup` | Resolve up to 100 saved/favourite IDs |
| POST | `/api/emobooks/recommendations` | Emotion selection plus trained content ranking; up to 50 suggestions |

Example guest request:

```json
{
  "current_emotion": "sad",
  "goal_mode": "change",
  "target_emotion": "happy",
  "genres": ["Adventure"],
  "favourite_book_ids": [],
  "interests": "friendship and family",
  "limit": 12
}
```

## Admin API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Process liveness |
| POST | `/api/admin/login` | Verify service admin credentials; issue 8-hour bearer session |
| GET | `/api/admin/me` | Verify session and current DB admin role |
| DELETE | `/api/admin/session` | Revoke current session |
| GET | `/api/emobooks/status` | Neo4j catalog, MongoDB admin store and model file readiness |
| GET | `/api/emobooks/books` | Saved books, search, emotion filter, pagination and category counts |
| POST | `/api/emobooks/books` | Classify, then persist; requires `Idempotency-Key` |

All admin routes in this table except liveness/login require the bearer token.
The public catalog/recommendation routes above are available to guests. The browser stores
it in sessionStorage, separate from the public reading flow. The database
stores only its SHA256 digest. Expiry is checked on every call independently
of MongoDB TTL cleanup, and the current server-side role is checked. No role or
username supplied by the browser grants access. Configure exact CORS origins
in `.env` for your deployment. Admin password updates revoke existing sessions.

## Validation

```powershell
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m pytest
```

Tests exercise authentication/expiry/role checks, persistence and filtering,
duplicate ISBNs, retry idempotency, unsupported input, model failure, CORS,
feature ordering and the threshold gate. API tests use an isolated in-memory
Mongo implementation for authentication, an isolated catalog double and a test
classifier. Storage tests cover the full Neo4j property roundtrip, parameterized
search and schema failure handling. Optional real-Neo4j tests run against an
explicit test instance (never set these to a production database):

```powershell
$env:NEO4J_TEST_URI = "neo4j://localhost:7687"
$env:NEO4J_TEST_USERNAME = "neo4j"
$env:NEO4J_TEST_PASSWORD = "your-test-password"
$env:NEO4J_TEST_DATABASE = "neo4j"
.venv\Scripts\python -m pytest tests/test_neo4j_integration.py -q
```

These tests create temporary books and delete only their own book nodes.
Recommendation tests additionally cover continue/change validation, public data
redaction, favourite resolution, model failures, and the trained semantic forward
formula for books/readers with no Goodreads IDs. `scripts/check_recommender.py`
verifies the real supplied checkpoint plus the local encoder; run a real emotion
model smoke test separately when configuring a new environment.

Implementation references: [FastAPI bearer authentication](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
and [Transformers Auto classes](https://huggingface.co/docs/transformers/model_doc/auto).
Neo4j references: [Python driver queries](https://neo4j.com/docs/python-manual/current/query-simple/)
and [uniqueness constraints](https://neo4j.com/docs/cypher-manual/current/schema/constraints/create-constraints/).
