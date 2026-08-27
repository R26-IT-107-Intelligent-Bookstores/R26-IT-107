// Returns the base URL for the PhonoLex Python (FastAPI) backend.
// Callers append their own path, e.g. `${getApiUrl()}/api/auth/login`.
export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_VITE_PHONOLEX_API || "https://phonolex-api.onrender.com";
  };