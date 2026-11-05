// ============================================================
// Course sections (School, College, University, Admission, Upcoming…).
// Admin-defined groups of courses: each can be switched off (it then
// disappears everywhere), chosen for the home page (at most HOME_LIMIT are
// shown, in order) and filled with courses from the course editor.
// ============================================================

import { q, withTransaction } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { cached } from '@/lib/cache';
import { catalogContext, mapCard, CARD_SELECT_SQL, CARD_FROM_SQL } from '@/lib/catalogRepo';

export const HOME_LIMIT = 4;
export const TONES = ['yellow', 'cyan', 'pink', 'lime', 'violet', 'orange', 'blue'];
export const ICONS = ['book', 'cap', 'flag', 'calendar', 'code', 'star', 'globe', 'video', 'broadcast', 'layers', 'compass'];

const COLS = `s.id, s.slug, s.name_bn AS nameBn, s.name_en AS nameEn, s.blurb_bn AS blurbBn, s.blurb_en AS blurbEn,
  s.badge_bn AS badgeBn, s.badge_en AS badgeEn, s.icon, s.tone, s.position, s.enabled, s.show_on_home AS showOnHome`;
const norm = (r) => ({ ...r, enabled: !!r.enabled, showOnHome: !!r.showOnHome, courseCount: r.courseCount != null ? Number(r.courseCount) : undefined });
const clean = (v, n) => (v == null ? null : String(v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n) || null);
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Admin list (all sections, with course counts).
export async function listSections() {
  const rows = await q(`SELECT ${COLS}, (SELECT COUNT(*) FROM course_section_courses csc WHERE csc.section_id = s.id) AS courseCount
                        FROM course_sections s ORDER BY s.position, s.id`);
  return rows.map(norm);
}

// Public list: enabled sections only (catalog chips, header, footer).
async function listPublicSectionsUncached() {
  const rows = await q(`SELECT ${COLS} FROM course_sections s WHERE s.enabled = 1 ORDER BY s.position, s.id`);
  return rows.map(norm);
}
export const listPublicSections = cached(listPublicSectionsUncached, 'listPublicSections');

function fields(body, partial) {
  const out = {};
  const take = (k, col, n) => { if (body[k] !== undefined) out[col] = clean(body[k], n); };
  take('nameBn', 'name_bn', 120); take('nameEn', 'name_en', 120);
  take('blurbBn', 'blurb_bn', 255); take('blurbEn', 'blurb_en', 255);
  take('badgeBn', 'badge_bn', 60); take('badgeEn', 'badge_en', 60);
  if (body.icon !== undefined) out.icon = ICONS.includes(body.icon) ? body.icon : 'book';
  if (body.tone !== undefined) out.tone = TONES.includes(body.tone) ? body.tone : 'yellow';
  if (body.enabled !== undefined) out.enabled = body.enabled ? 1 : 0;
  if (body.showOnHome !== undefined) out.show_on_home = body.showOnHome ? 1 : 0;
  if (!partial && (!out.name_bn || !out.name_en)) throw new HttpError(400, { error: 'name_required' });
  if (partial && (('name_bn' in out && !out.name_bn) || ('name_en' in out && !out.name_en))) throw new HttpError(400, { error: 'name_required' });
  return out;
}

export async function createSection(body) {
  const f = fields(body, false);
  let slug = slugify(body.slug || f.name_en);
  if (!slug) throw new HttpError(400, { error: 'slug_required' });
  if ((await q('SELECT id FROM course_sections WHERE slug = ?', [slug])).length) slug = `${slug}-${Date.now() % 10000}`;
  const [{ pos }] = await q('SELECT COALESCE(MAX(position), 0) + 1 AS pos FROM course_sections');
  const cols = Object.keys(f);
  await q(`INSERT INTO course_sections (slug, position, ${cols.join(', ')}) VALUES (?, ?, ${cols.map(() => '?').join(', ')})`, [slug, pos, ...cols.map((k) => f[k])]);
  return listSections();
}

export async function updateSection(body) {
  const id = Number(body.id);
  if (!id) throw new HttpError(400, { error: 'id_required' });
  const f = fields(body, true);
  const cols = Object.keys(f);
  if (cols.length) {
    const r = await q(`UPDATE course_sections SET ${cols.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...cols.map((k) => f[k]), id]);
    if (!r.affectedRows) throw new HttpError(404, { error: 'not_found' });
  }
  return listSections();
}

export async function deleteSection(id) {
  await q('DELETE FROM course_sections WHERE id = ?', [Number(id)]);
  return listSections();
}

// Move a section up/down (swap positions with its neighbour).
export async function moveSection(id, dir) {
  const list = await listSections();
  const i = list.findIndex((s) => s.id === Number(id));
  const j = dir === 'up' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const order = list.map((s) => s.id);
  [order[i], order[j]] = [order[j], order[i]];
  await withTransaction(async (tx) => { for (const [k, sid] of order.entries()) await tx('UPDATE course_sections SET position = ? WHERE id = ?', [k + 1, sid]); });
  return listSections();
}

// ---------- course membership ----------
export async function getCourseSectionIds(courseId) {
  const rows = await q('SELECT section_id FROM course_section_courses WHERE course_id = ? ORDER BY section_id', [Number(courseId)]);
  return rows.map((r) => r.section_id);
}

export async function setCourseSections(courseId, sectionIds) {
  const cid = Number(courseId);
  if (!cid || !(await q('SELECT id FROM courses WHERE id = ?', [cid])).length) throw new HttpError(404, { error: 'course_not_found' });
  const ids = [...new Set((sectionIds || []).map(Number).filter(Boolean))].slice(0, 20);
  const valid = ids.length ? (await q(`SELECT id FROM course_sections WHERE id IN (${ids.map(() => '?').join(',')})`, ids)).map((r) => r.id) : [];
  await withTransaction(async (tx) => {
    await tx('DELETE FROM course_section_courses WHERE course_id = ?', [cid]);
    for (const sid of valid) {
      await tx('INSERT INTO course_section_courses (section_id, course_id, position) SELECT ?, ?, COALESCE(MAX(position), 0) + 1 FROM course_section_courses WHERE section_id = ?', [sid, cid, sid]);
    }
  });
  return getCourseSectionIds(cid);
}

// ---------- home page ----------
// The first HOME_LIMIT enabled + on-home sections that have something to show,
// each with up to `perSection` course cards (published, or announced upcoming).
async function getHomeSectionsUncached(perSection = 8) {
  const sections = (await q(`SELECT ${COLS} FROM course_sections s WHERE s.enabled = 1 AND s.show_on_home = 1 ORDER BY s.position, s.id`)).map(norm);
  if (!sections.length) return [];
  const ctx = await catalogContext();
  const rows = await q(
    `SELECT csc.section_id AS _sid, ${CARD_SELECT_SQL} ${CARD_FROM_SQL}
     JOIN course_section_courses csc ON csc.course_id = c.id
     WHERE csc.section_id IN (${sections.map(() => '?').join(',')}) AND (c.published = 1 OR c.is_upcoming = 1)
     ORDER BY csc.position, c.featured DESC, c.id DESC`, sections.map((s) => s.id));
  const out = [];
  for (const s of sections) {
    const courses = rows.filter((r) => r._sid === s.id).slice(0, perSection).map((r) => mapCard(r, ctx));
    if (courses.length) out.push({ ...s, courses });
    if (out.length === HOME_LIMIT) break;
  }
  return out;
}
export const getHomeSections = cached(getHomeSectionsUncached, 'getHomeSections');
