export const API_URL = "https://sami201-emobooks-backend.hf.space";

export const emotions = [
  { id: "angry_disgusted", label: "Angry / Disgusted" },
  { id: "fearful", label: "Fearful" },
  { id: "happy", label: "Happy" },
  { id: "neutral", label: "Neutral" },
  { id: "sad", label: "Sad" },
  { id: "surprised", label: "Surprised" },
] as const;

export type Emotion = typeof emotions[number]["id"];
export type BookInput = {
  title: string; author: string; isbn: string; genres: string[];
  description: string; classification_text: string; cover_url: string;
};
export type SavedBook = BookInput & {
  id: string; created_at: string;
  classification: {
    category: Emotion; probabilities: Record<Emotion, number>;
    emotional_probability: number; threshold: number; chunks: number;
    model_name: string; model_version: string;
  };
};
export type ServiceStatus = {
  database: string;
  model: { files_ready: boolean; loaded: boolean; missing_files: string[] };
};
export type BookPage = { books: SavedBook[]; total: number; page: number; page_size: number };

async function request<T>(path: string, options: RequestInit = {}, timeout = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options, headers, cache: "no-store", signal: options.signal
        ? AbortSignal.any([controller.signal, options.signal]) : controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      const message = typeof data.detail === "string" ? data.detail : Array.isArray(data.detail)
        ? data.detail.map((item: { msg: string }) => item.msg).join(" ") : "The request could not be completed.";
      throw new Error(message);
    }
    return data as T;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("The request timed out. Refresh the catalog to check the result before retrying.");
    if (error instanceof TypeError) throw new Error("Cannot reach EmoBooks. Check the backend connection and try again.");
    throw error;
  } finally { clearTimeout(timer); }
}

export const getStatus = (signal?: AbortSignal) => request<ServiceStatus>("/api/emobooks/status", { signal });
export const addBook = (book: BookInput, key: string) => request<SavedBook>("/api/emobooks/books", {
  method: "POST", body: JSON.stringify(book), headers: { "Idempotency-Key": key },
}, 300000);

export const listBooks = (page = 1, query = "", signal?: AbortSignal) => request<BookPage>(
  `/api/emobooks/books?${new URLSearchParams({ page: String(page), page_size: "8", q: query })}`, { signal }, 45000,
);
export const updateBook = (id: string, book: BookInput) => request<SavedBook>(`/api/emobooks/books/${encodeURIComponent(id)}`, {
  method: "PUT", body: JSON.stringify(book),
}, 300000);
export const deleteBook = (id: string) => request<{ deleted: string }>(`/api/emobooks/books/${encodeURIComponent(id)}`, {
  method: "DELETE",
}, 45000);
