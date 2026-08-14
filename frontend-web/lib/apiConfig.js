// Returns the base URL for the PhonoLex Python (FastAPI) backend.
// Callers append their own path, e.g. `${getApiUrl()}/api/auth/login`.
export const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_PHONOLEX_API_URL || "http://127.0.0.1:8000";
  };