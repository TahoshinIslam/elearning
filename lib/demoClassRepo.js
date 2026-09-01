// ============================================================
// Free demo classes (upcoming live + previous recorded) data-access.
// Public reads; logged-in users can register interest in an upcoming class.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const map = (r) => ({
  id: r.id, title: r.title, slug: r.slug, category: r.category, instructor: r.instructor,
  description: r.description, schedule: r.schedule, status: r.status, videoUrl: r.video_url, learners: r.learners
});

export async function getDemoClasses(status) {
  const rows = status
    ? await q('SELECT * FROM demo_classes WHERE status = ? ORDER BY id', [status])
    : await q('SELECT * FROM demo_classes ORDER BY id');
  return rows.map(map);
}

export async function getDemoClassBySlug(slug, userId) {
  const rows = await q('SELECT * FROM demo_classes WHERE slug = ? LIMIT 1', [slug]);
  if (!rows[0]) return null;
  const dc = map(rows[0]);
  // registration count + whether the current user has registered
  const [{ n }] = await q('SELECT COUNT(*) AS n FROM demo_class_registrations WHERE demo_class_id = ?', [dc.id]);
  dc.registrations = Number(n);
  dc.registered = false;
  if (userId) {
    const mine = await q('SELECT 1 FROM demo_class_registrations WHERE demo_class_id = ? AND user_id = ? LIMIT 1', [dc.id, userId]);
    dc.registered = !!mine[0];
  }
  return dc;
}

export async function registerForDemo(slug, userId) {
  const rows = await q('SELECT id, status FROM demo_classes WHERE slug = ? LIMIT 1', [slug]);
  if (!rows[0]) throw new HttpError(404, { error: 'not_found' });
  await q('INSERT IGNORE INTO demo_class_registrations (demo_class_id, user_id) VALUES (?,?)', [rows[0].id, userId]);
  return getDemoClassBySlug(slug, userId);
}
