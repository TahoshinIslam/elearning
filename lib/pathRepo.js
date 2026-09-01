// ============================================================
// Learning paths (career tracks) data-access.
// A path groups an ordered list of courses.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

function slugify(title) {
  const base = String(title || '').toLowerCase().trim().replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `path-${Date.now()}`;
}

// All paths with their ordered course ids (+ minimal course info for display).
export async function getPaths() {
  const paths = await q('SELECT id, title, slug, description, thumb FROM learning_paths ORDER BY id');
  if (!paths.length) return [];
  const links = await q(
    `SELECT pc.path_id AS pathId, pc.position, c.id, c.title, c.slug, c.thumb, c.price, c.instructor
     FROM path_courses pc JOIN courses c ON pc.course_id = c.id ORDER BY pc.position, pc.course_id`);
  return paths.map((p) => ({
    ...p,
    courses: links.filter((l) => l.pathId === p.id).map((l) => ({ id: l.id, title: l.title, slug: l.slug, thumb: l.thumb, price: l.price, instructor: l.instructor }))
  }));
}

export async function getPathBySlug(slug) {
  const paths = await getPaths();
  return paths.find((p) => p.slug === slug) || null;
}

export async function createPath(body) {
  const title = String(body.title || '').trim();
  if (!title) throw new HttpError(400, { error: 'title_required' });
  let slug = slugify(title);
  if (await q('SELECT id FROM learning_paths WHERE slug = ? LIMIT 1', [slug]).then((r) => r[0])) slug = `${slug}-${Date.now() % 10000}`;
  await q('INSERT INTO learning_paths (title, slug, description, thumb) VALUES (?,?,?,?)',
    [title, slug, body.description || null, body.thumb || 'track']);
  return getPaths();
}

export async function deletePath(body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  await q('DELETE FROM learning_paths WHERE id = ?', [body.id]);
  return getPaths();
}

// Add/remove a course to/from a path.
export async function setPathCourse(body) {
  const pathId = Number(body.pathId), courseId = Number(body.courseId);
  if (!pathId || !courseId) throw new HttpError(400, { error: 'invalid_request' });
  if (body.remove) {
    await q('DELETE FROM path_courses WHERE path_id = ? AND course_id = ?', [pathId, courseId]);
  } else {
    const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM path_courses WHERE path_id = ?', [pathId]);
    await q('INSERT IGNORE INTO path_courses (path_id, course_id, position) VALUES (?,?,?)', [pathId, courseId, p]);
  }
  return getPaths();
}
