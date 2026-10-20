// ============================================================
// Course subject (category) management (admin CRUD; public read).
// Courses reference a subject by slug (courses.category), so slugs never
// change once created and a subject still in use can't be deleted.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

function slugify(name) {
  const base = String(name || '').toLowerCase().trim().replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `cat-${Date.now()}`;
}

export async function getCategories() {
  const rows = await q(
    `SELECT c.id, c.name, c.slug, c.icon, c.position, COUNT(co.id) AS courses, SUM(co.published = 1) AS published
     FROM categories c LEFT JOIN courses co ON co.category = c.slug
     GROUP BY c.id, c.name, c.slug, c.icon, c.position ORDER BY c.position, c.id`
  );
  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, icon: r.icon, position: r.position, courseCount: Number(r.courses) || 0, publishedCount: Number(r.published) || 0 }));
}

export async function createCategory(body) {
  const name = String(body.name || '').trim().slice(0, 120);
  if (!name) throw new HttpError(400, { error: 'name_required' });
  let slug = body.slug ? slugify(body.slug) : slugify(name);
  if (await q('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]).then((r) => r[0])) slug = `${slug}-${Date.now() % 1000}`;
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM categories');
  await q('INSERT INTO categories (name, slug, icon, position) VALUES (?,?,?,?)', [name, slug, String(body.icon || '📗').slice(0, 16), p]);
  return getCategories();
}

// { id, name?, icon?, dir?: 'up'|'down' }
export async function updateCategory(body) {
  const [row] = await q('SELECT id FROM categories WHERE id = ?', [Number(body.id)]);
  if (!row) throw new HttpError(404, { error: 'not_found' });
  if (body.name != null) {
    const name = String(body.name).trim().slice(0, 120);
    if (!name) throw new HttpError(400, { error: 'name_required' });
    await q('UPDATE categories SET name = ? WHERE id = ?', [name, row.id]);
  }
  if (body.icon != null) await q('UPDATE categories SET icon = ? WHERE id = ?', [String(body.icon).slice(0, 16) || '📗', row.id]);
  if (body.dir) {
    const ids = (await q('SELECT id FROM categories ORDER BY position, id')).map((r) => r.id);
    const i = ids.indexOf(row.id), j = body.dir === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < ids.length) { [ids[i], ids[j]] = [ids[j], ids[i]]; let p = 1; for (const x of ids) await q('UPDATE categories SET position = ? WHERE id = ?', [p++, x]); }
  }
  return getCategories();
}

export async function deleteCategory(body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  const [row] = await q('SELECT c.slug, (SELECT COUNT(*) FROM courses WHERE category = c.slug) AS n FROM categories c WHERE c.id = ?', [Number(body.id)]);
  if (row && Number(row.n) > 0) throw new HttpError(409, { error: 'category_in_use', courses: Number(row.n) });
  await q('DELETE FROM categories WHERE id = ?', [Number(body.id)]);
  return getCategories();
}
