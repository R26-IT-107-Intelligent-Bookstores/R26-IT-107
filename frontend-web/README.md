This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run these commands from the `frontend-web` directory. First, install dependencies:

```bash
npm install
```

For local development, run the development server (no production build is required):

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production server

Build the app before starting the production server:

```bash
npm run build
npm start
```

`npm start` serves the production build in `.next`; it does not create that build.
If you see "Could not find a production build", run `npm run build` and wait for it
to finish successfully before running `npm start`. Rebuild after changing the app.
The build downloads the configured Geist fonts from Google Fonts, so internet access
is required during the build.

On Windows PowerShell, if execution policy blocks `npm.ps1`, use `npm.cmd` in place
of `npm` (for example, `npm.cmd run dev`).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## EmoBooks

The public reading flow at `/emobooks` uses the FastAPI service on port 8010.
Set `NEXT_PUBLIC_EMOBOOKS_API_URL=http://localhost:8010` in `.env.local`, restart
Next.js after changes, and follow [backend setup](../emobooks-backend/README.md)
for both local models, Neo4j and administrator provisioning.

- `/emobooks`: emotion check-in and books from the live catalog.
- `/emobooks/discover`: continue/change emotion, available genres, favourite
  catalog books, and reading interests.
- `/emobooks/recommendations`: model-ranked Neo4j books, reasons, relevance,
  search, genre filtering and sorting, with loading/error/empty/retry states.
- `/emobooks/books/[id]`: public metadata resolved by the actual saved book ID.
- `/emobooks/saved`: browser-saved IDs resolved against the live catalog,
  including unavailable-book and connection-error handling.
- `/emobooks/about`: how suggestions and browser preferences work.

Admin book entry at `/admin/emobooks` sends an English synopsis/excerpt through
`final_hierarchical_emotion_model`, saving metadata and all emotion scores to
Neo4j. Admin accounts/sessions use MongoDB. Guest recommendations select the
current or target classifier category, then rank available books using the
supplied Goodreads V2 learned text network with a cold-start reader profile.
The pretrained collaborative ID embeddings are not assigned to application
users or new books. Relevance is a ranking value, not a probability or a
prediction of an emotional change. See the backend README for the exact policy.

Bookstore login opens `/admin/emobooks` for admins and `/emobooks` for readers.
`/admin` also opens the book dashboard; publishing still requires a valid
server-verified EmoBooks admin session. The admin form asks for title, author
and a short public introduction, with optional genres, ISBN and cover URL. Choose
the English introduction as the model input, or provide a separate English
synopsis/excerpt by pasting text or importing a UTF-8 `.txt` file. A reader-card
preview shows the public metadata. Publication is confirmed only after
classification and storage succeed, with a link to the saved reader detail page.
Reader tabs refresh their catalog and emotion recommendations after publication
or when returning to the tab.

UI components live in `components/emobooks/`; API adapters and typed contracts
live in `lib/emobooks/`. The picker initially shows the latest 100 books; saved
IDs are resolved independently of that page. The public flow needs no login.
There is no demo catalog or synthetic-score fallback when the service is down.

Choices persist in sessionStorage (`emobooks:request:v1`); saved IDs persist in
localStorage (`emobooks:saved:v1`). Choices are sent to the recommendation API
when finding suggestions. Browser storage failure leaves the current visit
usable. Backend responses omit full excerpts and admin/private metadata.

Validation: `npx tsc --noEmit` and
`npx eslint app/emobooks components/emobooks lib/emobooks`.

Browser regression checks: `npm run test:emobooks` (run
`npx playwright install chromium` once if the browser is missing). These checks
cover role-based login destinations, text import, public introductions,
cross-tab publication, retry idempotency, and continue/change emotion choices.
They intercept the API with isolated test data and do not publish to your real
databases. The test runner reuses a frontend at `http://localhost:3000` or starts
the development server when it is absent.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
