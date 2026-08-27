const FEDBOOK_API_URL = process.env.NEXT_PUBLIC_FEDBOOK_API_URL || "http://169-58-243-99.nip.io";

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
