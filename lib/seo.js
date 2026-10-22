// Public URL helpers for canonical links, sitemap and social previews.
export function siteUrl() {
  const raw = process.env.APP_BASE_URL || 'http://localhost:3100';
  try { return new URL(raw).origin; } catch { return 'http://localhost:3100'; }
}
export const abs = (path) => `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
