// Development: Vite proxies /api to the Express server.
// Production: set VITE_API_URL, for example https://api.example.com/api
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
