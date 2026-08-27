const FEDBOOK_API_URL = process.env.NEXT_PUBLIC_FEDBOOK_API_URL || "https://api.169-58-243-99.nip.io";

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

export function getFedBookUrl(path = "") {
  return `${FEDBOOK_API_URL}${path}`;
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
