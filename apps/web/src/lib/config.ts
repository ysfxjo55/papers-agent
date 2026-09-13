// Default matches the hostname `next dev` itself serves on (localhost) rather than
// 127.0.0.1 — the /auth session cookie is SameSite=Lax in dev, and localhost vs
// 127.0.0.1 count as different sites, so a mismatch here silently drops the cookie.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
