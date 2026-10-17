import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const introduction = "A happy family reunites after a long journey and celebrates their friendship together.";
const excerpt = "She smiled with joy as her wonderful friends arrived home. They laughed and celebrated their reunion together.";

type Input = { title: string; author: string; description: string; classification_text: string; genres: string[]; isbn: string; cover_url: string };
type StoredBook = Input & {
  id: string; created_by: string; created_at: string;
  classification: { category: string; probabilities: Record<string, number>; emotional_probability: number; threshold: number; model_name: string; model_version: string; chunks: number };
};

function book(id: string, title: string, category = "happy"): StoredBook {
  const labels = ["angry_disgusted", "fearful", "happy", "neutral", "sad", "surprised"];
  return {
    id, title, author: "Test Author", description: introduction, classification_text: excerpt,
    genres: ["Adventure"], isbn: "", cover_url: "", created_by: "admin@example.test", created_at: "2026-10-17T00:00:00Z",
    classification: { category, probabilities: Object.fromEntries(labels.map((label) => [label, label === category ? .8 : .04])), emotional_probability: .95, threshold: .68, model_name: "test-classifier", model_version: "test-emotion", chunks: 1 },
  };
}

// Browser tests exercise UI/API contracts without writing to the user's databases.
async function api(context: BrowserContext) {
  const state = { books: [] as StoredBook[], submissions: [] as { payload: Input; key: string }[], failures: 0 };
  const publicBook = (item: StoredBook) => ({ id: item.id, title: item.title, author: item.author, isbn: item.isbn, description: item.description, cover_url: item.cover_url, genres: item.genres, emotion: item.classification.category });
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type,authorization,idempotency-key", "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS" }, body: JSON.stringify(body) });
    if (method === "OPTIONS") return send({});
    if (path === "/api/auth/login") {
      const { username } = request.postDataJSON();
      return send({ success: true, username, role: username.startsWith("admin") ? "admin" : "user" });
    }
    if (path === "/api/admin/login") return send({ access_token: "test-admin-token", token_type: "bearer", username: "admin@example.test" });
    if (path === "/api/admin/me") return send({ username: "admin@example.test", role: "admin" });
    if (path === "/api/emobooks/status") return send({ database: "connected", model: { files_ready: true, loaded: true, missing_files: [] } });
    if (path === "/api/emobooks/books" && method === "POST") {
      const payload: Input = request.postDataJSON();
      state.submissions.push({ payload, key: request.headers()["idempotency-key"] });
      if (state.failures-- > 0) return send({ detail: "The catalog is temporarily unavailable. Retry this submission." }, 503);
      const stored = { ...book(`published-${state.books.length + 1}`, payload.title), ...payload };
      state.books.push(stored);
      return send(stored, 201);
    }
    if (path === "/api/emobooks/books" || path === "/api/emobooks/catalog") {
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const category = url.searchParams.get("category");
      const selected = state.books.filter((item) => (!category || item.classification.category === category) && item.title.toLowerCase().includes(q));
      return send({ books: path.endsWith("/catalog") ? selected.map(publicBook) : selected, genres: [...new Set(state.books.flatMap((item) => item.genres))], total: selected.length, page: 1, page_size: 100, category_counts: Object.fromEntries(["angry_disgusted", "fearful", "happy", "neutral", "sad", "surprised"].map((label) => [label, state.books.filter((item) => item.classification.category === label).length])) });
    }
    if (path === "/api/emobooks/recommendations") {
      const data = request.postDataJSON();
      const target = data.goal_mode === "change" ? data.target_emotion : data.current_emotion;
      return send({ target_emotion: target, books: state.books.filter((item) => item.classification.category === target).map((item) => ({ ...publicBook(item), relevance_score: 88, recommendation_reason: `This story matches your ${target} goal.` })) });
    }
    if (path.startsWith("/api/emobooks/catalog/")) {
      const stored = state.books.find((item) => item.id === path.split("/").at(-1));
      return stored ? send(publicBook(stored)) : send({ detail: "Book not found" }, 404);
    }
    return send({ detail: "Unexpected test request" }, 404);
  });
  return state;
}

async function login(page: Page, username = "admin@example.test") {
  await page.goto("/login");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Login", exact: true }).click();
}

async function details(page: Page, title: string) {
  await page.getByLabel(/^Book title/).fill(title);
  await page.getByLabel(/^Author/).fill("Test Author");
  await page.getByLabel(/^Short introduction for readers/).fill(introduction);
  await page.getByLabel(/^Genres/).fill("Adventure");
}

test("admin login opens publishing; text upload reaches readers in another tab", async ({ context, page }, testInfo) => {
  const state = await api(context);
  const reader = await context.newPage();
  await reader.addInitScript(() => sessionStorage.setItem("emobooks:request:v1", JSON.stringify({ currentEmotion: "happy", goalMode: "continue", targetEmotion: null, genres: [], favouriteBookIds: [], interests: "" })));
  await reader.goto("/emobooks/recommendations");
  await expect(reader.getByText("There are no available books", { exact: false })).toBeVisible();
  await login(page);
  await expect(page).toHaveURL(/\/admin\/emobooks$/);
  await expect(page.getByRole("heading", { name: "EmoBooks admin dashboard" })).toBeVisible();
  await details(page, "The joyful journey");
  await page.getByRole("radio", { name: "Use separate English text or a .txt file" }).check();
  await page.getByLabel("Upload English text (.txt)").setInputFiles({ name: "journey.txt", mimeType: "text/plain", buffer: Buffer.from(excerpt) });
  await expect(page.getByLabel("English synopsis or story excerpt *")).toHaveValue(excerpt);
  await expect(page.getByRole("region", { name: "Reader card preview" })).toContainText(introduction);
  await page.getByRole("button", { name: "Analyze & publish book" }).click();
  await expect(page.getByRole("heading", { name: "Published to the reader catalog" })).toBeVisible();
  expect(state.submissions[0].payload.classification_text).toBe(excerpt);
  expect(state.submissions[0].payload.description).toBe(introduction);
  expect(state.submissions[0].key).toBeTruthy();
  await expect(reader.getByRole("link", { name: "The joyful journey", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("admin-dashboard.png"), fullPage: true });
  await page.getByRole("link", { name: "View book as a reader" }).click();
  await expect(page.getByRole("heading", { name: "The joyful journey" })).toBeVisible();
  await expect(page.getByText(introduction, { exact: true })).toBeVisible();
});

test("a failed save keeps the form; retry uses the same key and selected introduction", async ({ context, page }) => {
  const state = await api(context);
  state.failures = 1;
  await login(page);
  await details(page, "A reunion to remember");
  await page.getByRole("radio", { name: "Use separate English text or a .txt file" }).check();
  await page.getByLabel("English synopsis or story excerpt *").fill(excerpt);
  await page.getByRole("radio", { name: "Use the introduction (English)" }).check();
  await page.getByRole("button", { name: "Analyze & publish book" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  await expect(page.getByLabel(/^Book title/)).toHaveValue("A reunion to remember");
  await expect(page.getByRole("heading", { name: "Published to the reader catalog" })).toHaveCount(0);
  expect(state.books).toHaveLength(0);
  await page.getByRole("button", { name: "Analyze & publish book" }).click();
  await expect(page.getByRole("heading", { name: "Published to the reader catalog" })).toBeVisible();
  expect(state.submissions[0].key).toBe(state.submissions[1].key);
  expect(state.submissions[1].payload.classification_text).toBe("");
  expect(state.books).toHaveLength(1);
});

test("reader dashboard changes the target emotion and continues the current one", async ({ context, page }) => {
  const state = await api(context);
  state.books.push(book("happy-book", "A happy reunion"), book("sad-book", "A farewell", "sad"));
  await page.goto("/emobooks/discover");
  await page.getByRole("button", { name: /^Sad/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /^Change emotion/ }).click();
  await page.getByRole("button", { name: /^Happy/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip preferences" }).click();
  await expect(page.getByRole("link", { name: "A happy reunion", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "A farewell", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Edit my choices" }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /^Continue current emotion/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip preferences" }).click();
  await expect(page.getByRole("link", { name: "A farewell", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "A happy reunion", exact: true })).toHaveCount(0);
});

test("regular login opens the reader dashboard", async ({ context, page }) => {
  await api(context);
  await login(page, "reader@example.test");
  await expect(page).toHaveURL(/\/emobooks$/);
  await expect(page.getByRole("main").getByRole("link", { name: "Find my next read", exact: true })).toBeVisible();
});

test("direct admin entry still requires an EmoBooks session", async ({ context, page }) => {
  await api(context);
  await page.addInitScript(() => localStorage.setItem("userRole", "admin"));
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/emobooks$/);
  await expect(page.getByRole("heading", { name: "Sign in to manage books" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze & publish book" })).toHaveCount(0);
});
