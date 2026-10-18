# Intelligent-Bookstore

Windows local development (run these commands from this repository root):

```powershell
.\setup.cmd
.\start.cmd
```

`setup.cmd` installs the main frontend dependencies and creates a separate
`.venv` for PhonoLex, EmoBooks and TrendStock predictions. It also installs
TrendStock's Node.js dependencies. It requires Python 3.11 (with the Windows
`py` launcher), Node.js 22 LTS, internet access and enough disk space for
TensorFlow/PyTorch. It can be rerun after dependency updates. It preserves
existing `.env` files and creates starter files only when absent.

`start.cmd` starts **frontend-web :3000**, **phonolex-backend :8000**,
**emobooks-backend :8010** and **trendstock-backend :5000** together. Open
http://localhost:3000. Press Ctrl+C in that terminal to stop all four servers.
The runner stops its other servers if one fails, rejects ports that are already
occupied, and does not stop
unrelated processes. Backend changes require restarting `start.cmd`; the
frontend retains Next.js hot reload.
Stop the local servers before rerunning setup. Setup checks for occupied app
ports and workspace Node build workers before changing dependencies; Windows
cannot replace loaded native modules such as `lightningcss`. The Windows runner
owns its server process trees in a Job Object so detached build workers also stop
when the runner closes.
The root runner selects Next.js's supported `--webpack` development mode to
avoid the Turbopack cold compilation hang observed on this Windows workspace.
Backends become ready before frontend compilation starts.

PhonoLex, EmoBooks and the TrendStock dashboard URLs are set to localhost for
this run. Other TrendStock requests still use the remote URL hardcoded in
`frontend-web/lib/api.js`; making those local would require an application
source change. FedBook connections are preserved and its services are not
installed or started. **EmoBooks-Gemini is excluded.** No application source
code or existing frontend environment settings are rewritten.

Before the first run, configure the existing backend environment files:

- `phonolex-backend/.env`: `MY_MONGO_URI` and `LAKINI_MONGO_URI`.
- `emobooks-backend/.env`: `MONGO_URI`, `NEO4J_URI`, `NEO4J_USERNAME`,
  `NEO4J_PASSWORD` and `NEO4J_DATABASE` (see its `.env.example`).
- `trendstock-backend/.env`: `MONGO_URI`. If this file is missing, setup copies
  the existing PhonoLex `LAKINI_MONGO_URI` connection and selects the `trendstock`
  database, matching PhonoLex's existing integration. Existing files are preserved.
- Restore the supplied PhonoLex datasets/model and EmoBooks emotion/recommender
  files if missing. Installation does not train or download private model exports.
  See [EmoBooks setup](emobooks-backend/README.md) for model preparation and
  one-time admin provisioning. Database books/admin accounts are not seeded or
  overwritten by these root commands.

For Neo4j configured as localhost:7687, the runner starts the existing
`emobooks-backend/docker-compose.neo4j.yml` service automatically if the port
is closed. Have Docker Desktop running. A configured remote Neo4j instance or
an already running local instance is used directly; MongoDB must already be
reachable at the configured URI. A local API can still use a cloud database.
The runner verifies Neo4j connectivity and prepares its catalog indexes; it
does not create MongoDB servers or change database credentials. Neo4j remains
running on Ctrl+C so existing data/services are retained.

Useful checks/options:

```powershell
.\start.cmd --check
.\start.cmd --skip-docker
.\start.cmd --timeout 300
```

PhonoLex's original `requirements.txt` is a machine-wide dependency snapshot
that pins protobuf 7, conflicting with TensorFlow 2.19. The root installer
uses `scripts/requirements-phonolex-local.txt` for the API's runtime dependencies
and lets pip resolve compatible transitive versions; the original file is
unchanged. EmoBooks uses its existing requirements and CPU PyTorch in its own
environment. Node dependencies are installed using `npm ci` and their existing lockfiles.
TrendStock's existing `py` prediction calls use its `.venv` through the process's
`VIRTUAL_ENV` setting, so the application source needs no edits.

On Windows, the Python backend wrapper uses DNS servers from active Windows
network adapters. This avoids MongoDB SRV lookup failures caused by stale
adapter entries in dnspython's registry discovery. It changes only these child
processes, not system DNS or backend source. Set `LOCAL_DNS_SERVERS` to a
comma-separated list of DNS server IPs to override this per-run selection.

Known existing application issue: `/api/trends/ml-predict` returns HTTP 500.
`ml-service/predict.py` supplies names such as `Current Stock`, but the saved
model expects `Current_Stock`. Its scikit-learn version matches the installed
1.8.0 environment. Correcting the feature names requires an application change;
the root launcher does not rewrite prediction code or retrain/replace models.
