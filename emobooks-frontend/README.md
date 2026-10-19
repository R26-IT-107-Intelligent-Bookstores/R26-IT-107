# EmoBooks book entry

Standalone Next.js frontend for emotion-based reading discovery and book
management. The original EmoBooks reader interface is available at `/discover`:
current emotion → Continue/Change direction → optional preferences → results.
`/` keeps the book-entry form and saved-book Edit/Delete actions. There are no
login screens, accounts or other project dashboards.

## Find books for your mood

Open `/discover` or choose **Find books for my mood** from book management.
For Angry → Happy, choose Angry / Disgusted, Continue, Change emotion, Happy,
Continue, then optional genres, favourite books and interests. **Find books** or
**Skip preferences** calls the deployed recommendation model. Continue current
emotion keeps the selected emotion as the target.

`/recommendations` shows actual catalog matches, search, genre filters and ranking.
Book cards link to `/books/{id}` and can be bookmarked to `/saved` in this browser.
Choices survive refresh in session storage; bookmarks use local storage. Missing
matches show an empty state. Story emotion and relevance scores do not guarantee
a change in the reader's feelings.

Use this directory as the frontend deployment root. `frontend-web` is the original
shared application and is not needed by this app.

## Run locally

From `emobooks-frontend`:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open `http://localhost:3000`. The default API is the deployed service at
`https://sami201-emobooks-backend.hf.space`, which connects to Neo4j Aura and
hosts both models. No local backend, model files or MongoDB are needed when
running this frontend with `npm run dev`. Restart an existing dev server after
changing its API URL. To use a local backend instead, set
`NEXT_PUBLIC_EMOBOOKS_API_URL=http://localhost:8010` before starting or building.

The page accepts book metadata, an English introduction or separate English
excerpt, and optional `.txt` upload. A successful response shows the saved book's
emotion and all six scores. Failed submissions keep the form, and retries reuse
the submission key to prevent duplicate saves. Editing loads the original input
into the form. Metadata edits preserve the scores; changed story text is
reclassified. Delete requires confirmation and removes the book from Neo4j.

The root body tolerates attributes injected by Grammarly before React hydration;
server rendering and checks on the rest of the page remain enabled.

## Deploy

On Vercel, set the project root to `emobooks-frontend` and use the Next.js preset.
Set `NEXT_PUBLIC_EMOBOOKS_API_URL` to the HTTPS backend URL before building.
Configure the backend's `CORS_ORIGINS` with the exact frontend origin. Rebuild
after changing the public API URL. No database credentials belong in this frontend.

This frontend has no Python or model dependencies. The backend hosts the models
and connects to Neo4j Aura through the HTTPS Query API on port 443.

## Validate

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

Browser tests run the production build on port 3186 against an isolated API double;
the normal suite does not write to a real database or run the models.
For a live read-only mood journey check, set `EMOBOOKS_LIVE_READ_TEST=1` and run
`npx playwright test e2e/live-recommendations.spec.ts`. It checks Angry → Happy
and Continue Angry against the deployed recommendation API without changing books.
For an explicit live CRUD check, set `EMOBOOKS_LIVE_TEST=1` and run
`npx playwright test e2e/live-crud.spec.ts`. It creates a UUID-tagged test book,
edits it, verifies persistence after reload and deletes it. The backend must allow
the test origin `http://127.0.0.1:3186` in `CORS_ORIGINS`.
`EMOBOOKS_TEST_URL=http://localhost:3000` runs tests against an existing dev
server, without starting or stopping it. `EMOBOOKS_TEST_DEV=1` starts an isolated
dev server when no other dev server for this directory is running.
