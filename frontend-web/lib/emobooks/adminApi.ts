import { notifyCatalogChanged } from "./catalogApi";

export const EMOBOOKS_API_URL = (process.env.NEXT_PUBLIC_EMOBOOKS_API_URL || "http://localhost:8010").replace(/\/$/, "");
const SESSION_KEY = "emobooks:admin-session:v1";

export const emotionCategories = [
  { id: "angry_disgusted", label: "Angry / Disgusted", color: "bg-rose-100 text-rose-800" },
  { id: "fearful", label: "Fearful", color: "bg-violet-100 text-violet-800" },
  { id: "happy", label: "Happy", color: "bg-amber-100 text-amber-900" },
  { id: "neutral", label: "Neutral", color: "bg-emerald-100 text-emerald-800" },
  { id: "sad", label: "Sad", color: "bg-blue-100 text-blue-800" },
  { id: "surprised", label: "Surprised", color: "bg-orange-100 text-orange-800" },
] as const;
export type EmotionCategory = (typeof emotionCategories)[number]["id"];
export type AdminBookInput = {
  title: string; author: string; isbn: string; genres: string[];
  description: string; classification_text: string; cover_url: string;
};
export type AdminBook = AdminBookInput & {
  id: string; created_at: string; created_by: string;
  classification: {
    category: EmotionCategory; probabilities: Record<EmotionCategory, number>;
    emotional_probability: number; threshold: number; chunks: number;
    model_name: string; model_version: string;
  };
};
export type AdminCatalog = {
  books: AdminBook[]; total: number; page: number; page_size: number;
  category_counts: Record<EmotionCategory, number>;
};
export type ServiceStatus = {
  database: string; model: { files_ready: boolean; loaded: boolean; missing_files: string[] };
};

export class EmoBooksApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function adminToken() {
  try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
}
export function clearAdminSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Already unavailable. */ }
}

async function request<T>(path: string, options: RequestInit = {}, timeout = 15000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  const token = adminToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    const response = await fetch(`${EMOBOOKS_API_URL}${path}`, {
      ...options, headers, cache: "no-store", signal: options.signal
        ? AbortSignal.any([controller.signal, options.signal]) : controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json();
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : Array.isArray(data.detail)
        ? data.detail.map((item: { msg: string }) => item.msg).join(" ") : "The request could not be completed.";
      throw new EmoBooksApiError(detail, response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof EmoBooksApiError) throw error;
    if (options.signal?.aborted) throw error;
    throw new EmoBooksApiError(controller.signal.aborted
      ? "This request is taking longer than expected. Retry to check whether the book was saved."
      : "Cannot reach the EmoBooks service. Check that it is running and try again.", 0);
  } finally { clearTimeout(timer); }
}

export async function loginEmoBooksAdmin(username: string, password: string) {
  const session = await request<{ access_token: string; username: string }>("/api/admin/login", {
    method: "POST", body: JSON.stringify({ username, password }),
  });
  try { sessionStorage.setItem(SESSION_KEY, session.access_token); }
  catch { throw new EmoBooksApiError("Allow browser session storage to use EmoBooks administration.", 0); }
  return session;
}
export const checkAdminSession = () => request<{ username: string }>("/api/admin/me");
export const getEmoBooksStatus = (signal?: AbortSignal) => request<ServiceStatus>("/api/emobooks/status", { signal });
export const getAdminCatalog = (query: URLSearchParams, signal?: AbortSignal) => request<AdminCatalog>(`/api/emobooks/books?${query}`, { signal });
export async function addClassifiedBook(book: AdminBookInput, key: string) {
  const result = await request<AdminBook>("/api/emobooks/books", {
    method: "POST", body: JSON.stringify(book), headers: { "Idempotency-Key": key },
  }, 300000);
  notifyCatalogChanged();
  return result;
}
export async function logoutEmoBooksAdmin() {
  try { if (adminToken()) await request<void>("/api/admin/session", { method: "DELETE" }, 3000); }
  finally { clearAdminSession(); }
}
