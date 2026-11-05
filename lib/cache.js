// Shared data cache for public, non-personal reads (catalog, settings,
// homepage copy). Inside the Next.js server the result is kept in Next's data
// cache under a tag; any write to a catalog table (see lib/mysql.js) drops the
// tag, so admins see their edits immediately and visitors get cached pages.
// Outside Next (tests, scripts) functions run uncached.
import { unstable_cache, revalidateTag } from 'next/cache';

export const CATALOG_TAG = 'catalog';
const inNext = () => !!process.env.NEXT_RUNTIME;

export function cached(fn, key, { tags = [CATALOG_TAG], revalidate = 300 } = {}) {
  let wrapped = null;
  return (...args) => {
    if (!inNext()) return fn(...args);
    if (!wrapped) wrapped = unstable_cache(fn, [`leo:${key}`], { tags, revalidate });
    return wrapped(...args);
  };
}

// Tables whose changes affect anything cached above.
const CATALOG_TABLES = /\b(?:INSERT\s+(?:IGNORE\s+)?INTO|UPDATE|DELETE\s+FROM|REPLACE\s+INTO)\s+`?(courses|modules|lessons|categories|class_levels|offers|learning_paths|path_courses|course_reviews|site_settings|campaigns|teachers|teacher_expertise|course_faqs|course_learning_points|course_requirements|video_assets|users|homepage_content|enrollments|orders|order_items)\b/i;

let pending = false;
export function invalidateIfCatalogWrite(sql) {
  if (!inNext() || pending || !CATALOG_TABLES.test(sql)) return;
  pending = true;
  queueMicrotask(() => {
    pending = false;
    try { revalidateTag(CATALOG_TAG, { expire: 0 }); } catch { /* outside a request scope: TTL covers it */ }
  });
}
