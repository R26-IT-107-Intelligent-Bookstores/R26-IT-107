import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { BookInput, SavedBook } from "../lib/emobooks/api";

const introduction = "A family celebrates a joyful reunion after a wonderful adventure.";
const excerpt = "She smiled with joy and laughed happily when her family came home.";

async function mockBackend(page: Page, failures = 0) {
  const state = { submissions: [] as { payload: Record<string, unknown>; key: string; bearer: string | undefined }[], calls: [] as string[],
    books: [] as SavedBook[], mutations: [] as string[], failures: { PUT: 0, DELETE: 0 } };
  const savedBook = (payload: BookInput, id: string): SavedBook => {
    const category = payload.description.includes("sorrow") ? "sad" : "happy";
    return { ...payload, id, created_at: "2026-10-18T12:00:00Z", classification: {
      category, probabilities: { angry_disgusted: .04, fearful: .04, happy: category === "happy" ? .8 : .04, neutral: .04, sad: category === "sad" ? .8 : .04, surprised: .04 },
      emotional_probability: .96, threshold: .68, chunks: 1, model_name: "test-model", model_version: "test-checkpoint",
    } };
  };
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type,idempotency-key", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS" };
    const send = (data: unknown, status = 200) => route.fulfill({ status, headers, contentType: "application/json", body: JSON.stringify(data) });
    if (request.method() === "OPTIONS") return send({});
    state.calls.push(path);
    if (path === "/api/emobooks/status") return send({ database: "connected", model: { files_ready: true, loaded: true, missing_files: [] } });
    if (path === "/api/emobooks/books" && request.method() === "GET") {
      const url = new URL(request.url());
      const query = (url.searchParams.get("q") || "").toLowerCase();
      const books = state.books.filter((book) => book.title.toLowerCase().includes(query));
      return send({ books, total: books.length, page: 1, page_size: 8 });
    }
    if (path === "/api/emobooks/books" && request.method() === "POST") {
      const payload = request.postDataJSON();
      state.submissions.push({ payload, key: request.headers()["idempotency-key"], bearer: request.headers()["authorization"] });
      if (failures-- > 0) return send({ detail: "The catalog is temporarily unavailable. Retry this submission." }, 503);
      const result = savedBook(payload, "saved-book"); state.books.push(result);
      return send(result, 201);
    }
    if (path === "/api/emobooks/books/saved-book" && request.method() === "PUT") {
      state.mutations.push("PUT");
      if (state.failures.PUT-- > 0) return send({ detail: "Edit failed. Your original book is unchanged." }, 503);
      const updated = savedBook(request.postDataJSON(), "saved-book"); state.books = [updated];
      return send(updated);
    }
    if (path === "/api/emobooks/books/saved-book" && request.method() === "DELETE") {
      state.mutations.push("DELETE");
      if (state.failures.DELETE-- > 0) return send({ detail: "Delete failed. Please retry." }, 503);
      state.books = []; return send({ deleted: "saved-book" });
    }
    return send({ detail: "Unexpected request" }, 404);
  });
  return state;
}

async function fillBook(page: Page) {
  await page.getByLabel(/^Book title/).fill("The joyful journey");
  await page.getByLabel(/^Author/).fill("Test Author");
  await page.getByLabel(/^Short introduction/).fill(introduction);
  await page.getByLabel(/^Genres/).fill("Adventure, Drama");
}

test("opens directly and saves an uploaded excerpt without login", async ({ page }) => {
  const state = await mockBackend(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Add a book", exact: true })).toBeVisible();
  await expect(page.getByLabel(/password/i)).toHaveCount(0);
  await fillBook(page);
  await page.getByRole("radio", { name: "Use separate English text or a .txt file" }).check();
  await page.getByLabel("Upload English text (.txt)").setInputFiles({ name: "story.txt", mimeType: "text/plain", buffer: Buffer.from(excerpt) });
  await expect(page.getByLabel("English synopsis or story excerpt *")).toHaveValue(excerpt);
  await expect(page.getByRole("region", { name: "Book preview" })).toContainText(introduction);
  await page.getByRole("button", { name: "Analyze & save book" }).click();
  await expect(page.getByRole("heading", { name: "Book saved to the catalog" })).toBeVisible();
  expect(state.submissions).toHaveLength(1);
  expect(state.submissions[0].payload.classification_text).toBe(excerpt);
  expect(state.submissions[0].payload.genres).toEqual(["Adventure", "Drama"]);
  expect(state.submissions[0].bearer).toBeUndefined();
  expect(state.submissions[0].key).toBeTruthy();
  expect(state.calls.every((path) => path.startsWith("/api/emobooks/"))).toBe(true);
  await expect(page.getByLabel(/^Book title/)).toHaveValue("");
});

test("failed saves keep the input and retry with the same submission key", async ({ page }) => {
  const state = await mockBackend(page, 1);
  await page.goto("/");
  await fillBook(page);
  await page.getByRole("button", { name: "Analyze & save book" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  await expect(page.getByLabel(/^Book title/)).toHaveValue("The joyful journey");
  await expect(page.getByRole("heading", { name: "Book saved to the catalog" })).toHaveCount(0);
  await page.getByRole("button", { name: "Analyze & save book" }).click();
  await expect(page.getByRole("heading", { name: "Book saved to the catalog" })).toBeVisible();
  expect(state.submissions).toHaveLength(2);
  expect(state.submissions[0].key).toBe(state.submissions[1].key);
  expect(state.submissions[1].payload.classification_text).toBe("");
});

test("the standalone app excludes login and unrelated project routes", async ({ request }) => {
  for (const path of ["/login", "/signup", "/admin", "/emobooks", "/trendstock", "/inventory"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("edits and deletes saved books with failure recovery and confirmation", async ({ page }) => {
  const state = await mockBackend(page);
  await page.goto("/"); await fillBook(page);
  await page.getByRole("button", { name: "Analyze & save book" }).click();
  const original = page.getByRole("article", { name: "The joyful journey", exact: true });
  await expect(original).toBeVisible();
  await original.getByRole("button", { name: /^Edit/ }).click();
  await expect(page.getByRole("heading", { name: "Edit book", exact: true })).toBeVisible();
  await page.getByLabel(/^Book title/).fill("Unsaved change");
  await page.getByRole("button", { name: "Cancel editing" }).click();
  expect(state.mutations).toEqual([]);
  await expect(original).toBeVisible();
  await original.getByRole("button", { name: /^Edit/ }).click();
  await page.getByLabel(/^Book title/).fill("The sad farewell");
  await page.getByLabel(/^Short introduction/).fill("He wept alone in sorrow after losing his closest friend.");
  state.failures.PUT = 1;
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Edit failed");
  await expect(page.getByLabel(/^Book title/)).toHaveValue("The sad farewell");
  await expect(original).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Book updated in the catalog" })).toBeVisible();
  const edited = page.getByRole("article", { name: "The sad farewell", exact: true });
  await expect(edited).toContainText("Story emotion: Sad");
  await page.reload();
  await expect(edited).toBeVisible();
  await edited.getByRole("button", { name: /^Delete/ }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel", exact: true }).click();
  expect(state.mutations.filter((method) => method === "DELETE")).toHaveLength(0);
  await edited.getByRole("button", { name: /^Edit/ }).click();
  await edited.getByRole("button", { name: /^Delete/ }).click();
  state.failures.DELETE = 1;
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Delete failed");
  await expect(edited).toBeVisible();
  await page.getByRole("button", { name: "Confirm delete" }).click();
  await expect(edited).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Add a book", exact: true })).toBeVisible();
  await expect(page.getByText("No books saved yet. Add your first book above.")).toBeVisible();
  expect(state.mutations).toEqual(["PUT", "PUT", "DELETE", "DELETE"]);
});

test("Grammarly body attributes do not produce a hydration error", async ({ page }) => {
  await mockBackend(page);
  const errors: string[] = [];
  page.on("console", (message) => { if (/hydrat/i.test(message.text())) errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.body) {
        document.body.setAttribute("data-new-gr-c-s-check-loaded", "14.1158.0");
        document.body.setAttribute("data-gr-ext-installed", "");
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  await page.goto("/");
  await fillBook(page);
  await page.getByRole("button", { name: "Analyze & save book" }).click();
  await expect(page.getByRole("heading", { name: "Book saved to the catalog" })).toBeVisible();
  await expect(page.locator("body")).toHaveAttribute("data-gr-ext-installed", "");
  expect(errors).toEqual([]);
});
