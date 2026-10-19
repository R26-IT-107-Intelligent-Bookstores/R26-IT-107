import type { Book, Emotion } from "./types";

import { API_URL } from "./api";
type ModelEmotion = Exclude<Emotion, "angry"> | "angry_disgusted";
export type CatalogBook = {
  id: string; title: string; author: string; isbn: string; description: string;
  genres: string[]; cover_url: string; emotion: ModelEmotion;
};
export type Catalog = { books: Book[]; genres: string[]; total: number; page: number; page_size: number };

export const toModelEmotion = (emotion: Emotion): ModelEmotion => emotion === "angry" ? "angry_disgusted" : emotion;
export const toBook = (book: CatalogBook): Book => ({
  id: book.id, title: book.title, author: book.author, description: book.description,
  genres: book.genres, coverUrl: book.cover_url,
  emotions: [book.emotion === "angry_disgusted" ? "angry" : book.emotion],
});

export class CatalogError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function publicRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options, cache: "no-store",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal,
    });
    const data = await response.json();
    if (!response.ok) throw new CatalogError(typeof data.detail === "string" ? data.detail : "Please check your choices and try again.", response.status);
    return data as T;
  } catch (error) {
    if (options.signal?.aborted || error instanceof CatalogError) throw error;
    throw new CatalogError(controller.signal.aborted ? "Finding your books took too long. Please try again."
      : "Cannot reach the book catalog. Please try again shortly.", 0);
  } finally { clearTimeout(timeout); }
}

export async function getCatalog(query = "", page = 1, signal?: AbortSignal): Promise<Catalog> {
  const params = new URLSearchParams({ q: query, page: String(page), page_size: "100" });
  const data = await publicRequest<Omit<Catalog, "books"> & { books: CatalogBook[] }>(`/api/emobooks/catalog?${params}`, { signal });
  return { ...data, books: data.books.map(toBook) };
}

export async function lookupBooks(ids: string[], signal?: AbortSignal): Promise<Book[]> {
  const books: Book[] = [];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const data = await publicRequest<CatalogBook[]>("/api/emobooks/catalog/lookup", {
      method: "POST", body: JSON.stringify({ ids: ids.slice(offset, offset + 100) }), signal,
    });
    books.push(...data.map(toBook));
  }
  return books;
}

export async function getBook(id: string, signal?: AbortSignal): Promise<Book> {
  return toBook(await publicRequest<CatalogBook>(`/api/emobooks/catalog/${encodeURIComponent(id)}`, { signal }));
}

export function notifyCatalogChanged() {
  window.dispatchEvent(new Event("emobooks:catalog-updated"));
  try { localStorage.setItem("emobooks:catalog-updated", String(Date.now())); }
  catch { /* Other tabs can still refresh when they regain focus. */ }
}
