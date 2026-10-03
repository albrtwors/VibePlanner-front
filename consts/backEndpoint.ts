/**
 * Cómo se llama al backend desde el front.
 *
 * Todas las páginas usan rutas RELATIVAS (`/api/...`) a propósito:
 * - El navegador siempre habla con el mismo origen, así que la cookie
 *   `vibe_token` (donde vive el JWT) se manda sola en cada fetch.
 * - En desarrollo Next.js las resuelve con el rewrite de `next.config.ts`
 *   contra el Flask local (http://localhost:5000). Nada pega a producción.
 * - En producción el mismo rewrite apunta al deploy configurado en BACKEND_URL.
 *
 * OJO: usar `fetch("api/songs")` a secas NO sirve. Contra `/songs/create` esa
 * ruta relativa resuelve a `/songs/api/songs` y da 404. Siempre con apiUrl().
 */
export function apiUrl(path: string): string {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return clean.startsWith("/api") ? clean : `/api${clean}`;
}