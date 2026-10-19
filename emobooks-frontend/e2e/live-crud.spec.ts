import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const api = "https://sami201-emobooks-backend.hf.space";

test("live frontend creates, edits, reloads and deletes a book in Neo4j", async ({ page, request }) => {
  test.skip(!process.env.EMOBOOKS_LIVE_TEST, "Explicitly enable this test to use the deployed backend and Neo4j.");
  test.setTimeout(240000);
  const title = `[CRUD check] ${randomUUID()}`;
  const editedTitle = `${title} edited`;
  let bookId: string | null = null;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/");
    await page.getByLabel(/^Book title/).fill(title);
    await page.getByLabel(/^Author/).fill("EmoBooks live browser check");
    await page.getByLabel(/^Genres/).fill("Deployment check");
    await page.getByLabel(/^Short introduction/).fill("She smiled with joy and laughed happily when her family returned home.");
    const created = page.waitForResponse((response) => response.url() === `${api}/api/emobooks/books` && response.request().method() === "POST");
    await page.getByRole("button", { name: "Analyze & save book" }).click();
    const createResponse = await created;
    expect(createResponse.status()).toBe(201);
    const saved = await createResponse.json();
    bookId = saved.id;
    expect(saved.classification.category).toBe("happy");
    await expect(page.getByRole("heading", { name: "Book saved to the catalog" })).toBeVisible();
    const card = page.getByRole("article", { name: title, exact: true });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /^Edit/ }).click();
    await page.getByLabel(/^Book title/).fill(editedTitle);
    await page.getByLabel(/^Short introduction/).fill("He wept alone in sorrow, grieving the death of his beloved friend.");
    const changed = page.waitForResponse((response) => response.url() === `${api}/api/emobooks/books/${bookId}` && response.request().method() === "PUT");
    await page.getByRole("button", { name: "Save changes" }).click();
    const editResponse = await changed;
    expect(editResponse.status()).toBe(200);
    const edited = await editResponse.json();
    expect(edited.id).toBe(bookId);
    expect(edited.classification.category).toBe("sad");
    expect(edited.created_at).toBe(saved.created_at);
    await page.reload();
    const editedCard = page.getByRole("article", { name: editedTitle, exact: true });
    await expect(editedCard).toContainText("Story emotion: Sad");
    const persisted = await request.get(`${api}/api/emobooks/books/${bookId}`);
    expect(persisted.status()).toBe(200);
    expect((await persisted.json()).title).toBe(editedTitle);

    // Check the actual Neo4j edge, beyond the API's book property projection.
    if (process.env.EMOBOOKS_AURA_PASSWORD) {
      const graph = await fetch("https://6f17679a.databases.neo4j.io/db/neo4j/query/v2", {
        method: "POST", signal: AbortSignal.timeout(30000),
        headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`neo4j:${process.env.EMOBOOKS_AURA_PASSWORD}`).toString("base64")}` },
        body: JSON.stringify({ statement: "MATCH (b:Book {id: $id}) OPTIONAL MATCH (b)-[:HAS_EMOTION]->(e:Emotion) RETURN b.title AS title, collect(e.name) AS emotions", parameters: { id: bookId } }),
      });
      const graphData = await graph.json();
      expect(graphData.errors || []).toEqual([]);
      expect(graphData.data.values).toEqual([[editedTitle, ["sad"]]]);
    }
    await page.screenshot({ path: "test-results/live-edited-book.png", fullPage: true });
    await editedCard.getByRole("button", { name: /^Delete/ }).click();
    const deleted = page.waitForResponse((response) => response.url() === `${api}/api/emobooks/books/${bookId}` && response.request().method() === "DELETE");
    await page.getByRole("button", { name: "Confirm delete" }).click();
    expect((await deleted).status()).toBe(200);
    await expect(editedCard).toHaveCount(0);
    expect((await request.get(`${api}/api/emobooks/books/${bookId}`)).status()).toBe(404);
    expect((await request.get(`${api}/api/emobooks/catalog/${bookId}`)).status()).toBe(404);
    if (process.env.EMOBOOKS_AURA_PASSWORD) {
      const graph = await fetch("https://6f17679a.databases.neo4j.io/db/neo4j/query/v2", {
        method: "POST", signal: AbortSignal.timeout(30000),
        headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`neo4j:${process.env.EMOBOOKS_AURA_PASSWORD}`).toString("base64")}` },
        body: JSON.stringify({ statement: "MATCH (b:Book {id: $id}) RETURN count(b) AS remaining", parameters: { id: bookId } }),
      });
      const graphData = await graph.json();
      expect(graphData.errors || []).toEqual([]);
      expect(graphData.data.values).toEqual([[0]]);
    }
    expect(errors).toEqual([]);
  } finally {
    // Limit cleanup to the exact UUID-tagged test book, including an ambiguous POST timeout.
    if (bookId) await request.delete(`${api}/api/emobooks/books/${bookId}`);
    const remaining = await request.get(`${api}/api/emobooks/books?q=${encodeURIComponent(title)}`);
    if (remaining.ok()) {
      for (const book of (await remaining.json()).books) {
        if (book.title === title || book.title === editedTitle) await request.delete(`${api}/api/emobooks/books/${book.id}`);
      }
    }
  }
});
