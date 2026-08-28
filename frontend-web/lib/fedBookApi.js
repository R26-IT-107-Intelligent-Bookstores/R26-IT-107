// API base — the Express backend (Neo4j, auth, reviews, etc.)
const FEDBOOK_API_URL = process.env.NEXT_PUBLIC_FEDBOOK_API_URL || "https://api.169-58-243-99.nip.io";

// Frontend base — the React app (login page, /sso handshake, book pages, etc.).
// Separate from FEDBOOK_API_URL because they run on different hosts in production.
const FEDBOOK_FRONTEND_URL = process.env.NEXT_PUBLIC_FEDBOOK_FRONTEND_URL || "http://169-58-243-99.nip.io";

export async function connectToFedBook(username, displayName = username) {
  const response = await fetch(`${FEDBOOK_API_URL}/api/auth/sso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, displayName }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Unable to connect to FedBook.");
  }

  return response.json();
}

// URL of the FedBook backend (API). Use for fetch() calls to Express.
export function getFedBookUrl(path = "") {
  return `${FEDBOOK_API_URL}${path}`;
}

// URL of the FedBook React frontend. Use for browser navigation
// (SSO handshake, /books, /login pages served by the React app, NOT Express).
export function getFedBookFrontendUrl(path = "") {
  return `${FEDBOOK_FRONTEND_URL}${path}`;
}

// Fetch on-site FedBook reviews for a given ISBN.
// Returns [{ id, content, rating, published, likeCount, author: {username, displayName, avatarUrl} }].
// Returns [] on network / 4xx / 5xx so the UI can render an empty state gracefully.
export async function fetchFedBookReviews(isbn) {
  if (!isbn) return [];
  try {
    const response = await fetch(`${FEDBOOK_API_URL}/api/books/${encodeURIComponent(isbn)}/reviews`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// Fetch full FedBook book detail: title, description, reception (per-platform
// sentiment aggregated from YouTube/Bluesky/Mastodon), hardcover rating, etc.
// Returns null on any failure so the UI falls back to placeholders.
export async function fetchFedBookDetails(isbn) {
  if (!isbn) return null;
  try {
    const response = await fetch(`${FEDBOOK_API_URL}/api/books/${encodeURIComponent(isbn)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Post a review to FedBook. Auto-provisions the FedBook user via /api/auth/sso
// on the first review of the session (no password needed). The returned JWT
// is cached in localStorage so subsequent reviews reuse it without hitting SSO.
//
// Returns the created review object on success. Throws on any failure so the
// caller can show an error toast.
const FEDBOOK_TOKEN_KEY = "fedbook_token";
const FEDBOOK_USERNAME_KEY = "fedbook_username";

async function ensureFedBookToken(username, displayName) {
  const cachedToken = typeof window !== "undefined" ? localStorage.getItem(FEDBOOK_TOKEN_KEY) : null;
  const cachedUsername = typeof window !== "undefined" ? localStorage.getItem(FEDBOOK_USERNAME_KEY) : null;
  if (cachedToken && cachedUsername === username) return cachedToken;

  const data = await connectToFedBook(username, displayName || username);
  const token = data?.token;
  if (!token) throw new Error("FedBook did not return an auth token.");
  if (typeof window !== "undefined") {
    localStorage.setItem(FEDBOOK_TOKEN_KEY, token);
    localStorage.setItem(FEDBOOK_USERNAME_KEY, username);
  }
  return token;
}

export async function postFedBookReview({ isbn, content, rating, username, displayName }) {
  if (!isbn) throw new Error("Missing ISBN.");
  if (!content?.trim()) throw new Error("Please write a review before submitting.");
  if (!username?.trim()) throw new Error("A username is required to post a review.");
  const cleanUsername = username.trim().toLowerCase();
  const token = await ensureFedBookToken(cleanUsername, displayName);
  const response = await fetch(`${FEDBOOK_API_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isbn, content: content.trim(), rating: Number(rating) || 0 }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Could not submit review (HTTP ${response.status}).`);
  }
  return response.json();
}
