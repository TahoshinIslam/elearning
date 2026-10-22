// Class / academic levels (admin-managed). Subjects remain lib/categoryRepo.js.
import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

export async function listClassLevels() {
  const rows = await q(
    `SELECT cl.id, cl.name, cl.slug, cl.position, COUNT(c.id) AS courses, SUM(c.published = 1) AS published
     FROM class_levels cl LEFT JOIN courses c ON c.class_id = cl.id
     GROUP BY cl.id, cl.name, cl.slug, cl.position ORDER BY cl.position, cl.name`
  );
  return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, position: r.position, courseCount: Number(r.courses) || 0, publishedCount: Number(r.published) || 0 }));
}

export async function createClassLevel({ name, slug }) {
  const n = String(name || '').trim().slice(0, 120);
  if (!n) throw new HttpError(400, { error: 'name_required' });
  const s = slugify(slug || name) || `class-${Date.now().toString(36)}`;
  if ((await q('SELECT id FROM class_levels WHERE slug = ?', [s]))[0]) throw new HttpError(409, { error: 'slug_taken' });
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM class_levels');
  await q('INSERT INTO class_levels (name, slug, position) VALUES (?,?,?)', [n, s, p]);
  return listClassLevels();
}

export async function updateClassLevel({ id, name, dir }) {
  const [row] = await q('SELECT id FROM class_levels WHERE id = ?', [Number(id)]);
  if (!row) throw new HttpError(404, { error: 'not_found' });
  if (name != null) {
    const n = String(name).trim().slice(0, 120);
    if (!n) throw new HttpError(400, { error: 'name_required' });
    await q('UPDATE class_levels SET name = ? WHERE id = ?', [n, row.id]);
  }
  if (dir) {
    const ids = (await q('SELECT id FROM class_levels ORDER BY position, name')).map((r) => r.id);
    const i = ids.indexOf(row.id), j = dir === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < ids.length) { [ids[i], ids[j]] = [ids[j], ids[i]]; let p = 1; for (const x of ids) await q('UPDATE class_levels SET position = ? WHERE id = ?', [p++, x]); }
  }
  return listClassLevels();
}

// Courses keep working without a class (ON DELETE SET NULL).
export async function deleteClassLevel({ id }) {
  await q('DELETE FROM class_levels WHERE id = ?', [Number(id)]);
  return listClassLevels();
}
