import { siteUrl } from '@/lib/seo';
import { getPublishedSlugs } from '@/lib/catalogRepo';

export const dynamic = 'force-dynamic';

// Public pages + every published course. Private areas are excluded (and
// also disallowed in robots.js / noindex via middleware).
export default async function sitemap() {
  const base = siteUrl();
  const staticPages = ['', '/courses', '/paths', '/blog', '/about', '/contact', '/terms', '/privacy'].map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.6 }));
  let courses = [];
  try {
    courses = (await getPublishedSlugs()).map((c) => ({ url: `${base}/course/${c.slug}`, lastModified: c.updated_at ? new Date(String(c.updated_at).replace(' ', 'T')) : undefined, changeFrequency: 'weekly', priority: 0.8 }));
  } catch { /* database unavailable: still serve the static pages */ }
  return [...staticPages, ...courses];
}
