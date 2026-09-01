// ============================================================
// Course category management (admin CRUD; public read).
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

function slugify(name) {
  const base = String(name || '').toLowerCase().trim().replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `cat-${Date.now()}`;
}

export async function getCategories() {
  return q('SELECT id, name, slug, icon FROM categories ORDER BY id');
}

export async function createCategory(body) {
  const name = String(body.name || '').trim();
  if (!name) throw new HttpError(400, { error: 'name_required' });
  let slug = body.slug ? slugify(body.slug) : slugify(name);
  if (await q('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]).then((r) => r[0])) slug = `${slug}-${Date.now() % 1000}`;
  await q('INSERT INTO categories (name, slug, icon) VALUES (?,?,?)', [name, slug, body.icon || '📗']);
  return getCategories();
}

export async function deleteCategory(body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  await q('DELETE FROM categories WHERE id = ?', [body.id]);
  return getCategories();
}
