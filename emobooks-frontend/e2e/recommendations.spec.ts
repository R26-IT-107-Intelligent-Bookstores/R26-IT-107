import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const books = [
  { id: "happy-book", title: "A joyful reunion", author: "A Writer", isbn: "", genres: ["Drama"], description: "A family celebrates their joyful reunion after an exciting journey.", cover_url: "", emotion: "happy" },
  { id: "angry-book", title: "The restless storm", author: "Another Writer", isbn: "", genres: ["Adventure"], description: "An angry hero confronts betrayal and struggles with deep frustration.", cover_url: "", emotion: "angry_disgusted" },
];

async function backend(page: Page, failures = 0) {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/emobooks/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const send = (body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: {
      "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    } });
    if (request.method() === "OPTIONS") return send({});
    if (path === "/api/emobooks/catalog") return send({ books, genres: ["Drama", "Adventure"], total: 2, page: 1, page_size: 100 });
    if (path === "/api/emobooks/catalog/lookup") return send(books.filter((book) => request.postDataJSON().ids.includes(book.id)));
    if (path.startsWith("/api/emobooks/catalog/")) {
      const book = books.find((item) => path.endsWith(`/${item.id}`));
      return send(book || { detail: "Book not found" }, book ? 200 : 404);
    }
    if (path === "/api/emobooks/recommendations") {
      const payload = request.postDataJSON(); requests.push(payload);
      if (failures-- > 0) return send({ detail: "Suggestions are temporarily unavailable." }, 503);
      const target = payload.goal_mode === "continue" ? payload.current_emotion : payload.target_emotion;
      return send({ target_emotion: target, model_version: "trained-model", books: books.filter((book) => book.emotion === target).map((book) => ({ ...book, relevance_score: 84.3, recommendation_reason: `A ${target} story matching your preferences.` })) });
    }
    return send({ detail: "Unexpected request" }, 404);
  });
  return requests;
}

test("Angry to Happy follows the original three steps and supports book details and bookshelf", async ({ page }) => {
  const requests = await backend(page);
  await page.goto("/discover");
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: /^Angry \/ Disgusted/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /^Change emotion/ }).click();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await expect(page.getByRole("group", { name: "Emotion options" }).getByRole("button", { name: /^Angry/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Happy/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What do you love to read?" })).toBeVisible();
  await page.getByRole("button", { name: "Drama", exact: true }).click();
  await page.getByRole("checkbox", { name: /A joyful reunion/ }).check();
  await page.getByLabel(/Any other reading interests/).fill("Friendship and family");
  await page.getByRole("button", { name: "Find books", exact: true }).click();
  await expect(page.getByRole("link", { name: "A joyful reunion", exact: true })).toBeVisible();
  expect(requests[0]).toMatchObject({ current_emotion: "angry_disgusted", goal_mode: "change", target_emotion: "happy", genres: ["Drama"], favourite_book_ids: ["happy-book"], interests: "Friendship and family" });
  await expect(page.getByRole("link", { name: "The restless storm", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Save A joyful reunion to saved books" }).click();
  await page.getByRole("link", { name: "My bookshelf (1)" }).click();
  await expect(page.getByRole("link", { name: "A joyful reunion", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Explore this story" }).click();
  await expect(page.getByRole("heading", { name: "A joyful reunion", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "A joyful reunion", exact: true })).toBeVisible();
});

test("Continue keeps Angry as the target and retries an API failure", async ({ page }) => {
  const requests = await backend(page, 1);
  await page.goto("/discover");
  await page.getByRole("button", { name: /^Angry \/ Disgusted/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /^Continue current emotion/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip preferences" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("temporarily unavailable");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("link", { name: "The restless storm", exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[0]).toEqual(requests[1]);
  expect(requests[1]).toMatchObject({ current_emotion: "angry_disgusted", goal_mode: "continue", target_emotion: null, genres: [], favourite_book_ids: [], interests: "" });
});

test("changing the current emotion invalidates an identical target and handles an empty result", async ({ page }) => {
  const requests = await backend(page);
  await page.goto("/discover");
  await page.getByRole("button", { name: /^Angry \/ Disgusted/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /^Change emotion/ }).click();
  await page.getByRole("button", { name: /^Happy/ }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: /^Happy/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("button", { name: "Continue", exact: true })).toBeDisabled();
  await expect(page.getByRole("group", { name: "Emotion options" }).getByRole("button", { name: /^Happy/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^Sad/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Skip preferences" }).click();
  await expect(page.getByText("There are no available books for this emotional goal yet.", { exact: false })).toBeVisible();
  expect(requests[0]).toMatchObject({ current_emotion: "happy", target_emotion: "sad" });
  await expect(page.getByRole("link", { name: "Adjust my choices" })).toBeVisible();
});

test("direct results links require an emotion choice and lead to mood discovery", async ({ page }) => {
  await backend(page);
  await page.goto("/recommendations");
  await expect(page.getByRole("heading", { name: "Start with a little check-in." })).toBeVisible();
  await page.getByRole("link", { name: "Choose my mood" }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole("heading", { name: "How are you feeling today?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /login|sign in|TrendStock|PhonoLex/i })).toHaveCount(0);
});
