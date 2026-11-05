// ============================================================
// Blog / articles (newspaper-style). Public reads only ever see published
// posts whose publish time has passed (so a future date = scheduled).
// Admins see everything. Bodies are lightweight Markdown (lib/markdown.js).
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';
import { cached } from '@/lib/cache';
import { publicThumbnailUrl } from '@/lib/publicUrl';

export const BLOG_PAGE_SIZE = 9;
const LIVE = "p.status = 'published' AND (p.published_at IS NULL OR p.published_at <= NOW())";
const LIST_COLS = `p.id, p.title, p.slug, p.excerpt, p.category, p.tags, p.cover, p.cover_key, p.author, p.status, p.featured,
  p.views, p.read_minutes, p.published_at, p.updated_at,
  DATE_FORMAT(p.published_at, '%Y-%m-%dT%H:%i') AS published_local, (p.published_at > NOW()) AS is_future`;

function mapPost(r) {
  if (!r) return null;
  return {
    id: r.id, title: r.title, slug: r.slug, excerpt: r.excerpt || '', category: r.category || null,
    tags: String(r.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    coverUrl: publicThumbnailUrl(r.cover_key), coverKey: r.cover_key || null, cover: r.cover || null,
    author: r.author || 'Leo', status: r.status, featured: !!r.featured, views: Number(r.views) || 0,
    readMinutes: Number(r.read_minutes) || 1,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : null,
    publishedLocal: r.published_local || '', scheduled: r.status === 'published' && !!Number(r.is_future),
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    ...(r.body !== undefined ? { body: r.body || '' } : {})
  };
}
const likeOf = (s) => `%${String(s).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
// ~200 words a minute; Bangla words are a little slower to read.
export const readingMinutes = (body) => Math.max(1, Math.round(String(body || '').split(/\s+/).filter(Boolean).length / 180));

// ---------- public ----------
function filters({ category, tag, q: text } = {}) {
  const where = [LIVE];
  const params = [];
  if (category) { where.push('p.category = ?'); params.push(String(category).slice(0, 64)); }
  if (tag) { where.push("FIND_IN_SET(?, REPLACE(p.tags, ', ', ',')) > 0"); params.push(String(tag).slice(0, 40)); }
  if (text) { where.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.body LIKE ?)'); params.push(likeOf(text), likeOf(text), likeOf(text)); }
  return { where: where.join(' AND '), params };
}

async function listPublishedUncached({ page = 1, pageSize = BLOG_PAGE_SIZE, category, tag, q: text, excludeIds = [] } = {}) {
  const f = filters({ category, tag, q: text });
  const ex = excludeIds.map(Number).filter(Boolean).slice(0, 20);
  const where = ex.length ? `${f.where} AND p.id NOT IN (${ex.map(() => '?').join(',')})` : f.where;
  const params = [...f.params, ...ex];
  const [{ total }] = await q(`SELECT COUNT(*) AS total FROM blog_posts p WHERE ${where}`, params);
  const pages = Math.max(1, Math.ceil(Number(total) / pageSize));
  const p = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = await q(`SELECT ${LIST_COLS} FROM blog_posts p WHERE ${where} ORDER BY p.published_at DESC, p.id DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (p - 1) * pageSize]);
  return { items: rows.map(mapPost), total: Number(total), page: p, pages, pageSize };
}
export const listPublished = cached(listPublishedUncached, 'blogListPublished');

// Front page: lead story + 4 top stories (featured first), most read, sections.
async function getFrontPageUncached() {
  const [top, mostRead, categories, tags] = await Promise.all([
    q(`SELECT ${LIST_COLS} FROM blog_posts p WHERE ${LIVE} ORDER BY p.featured DESC, p.published_at DESC, p.id DESC LIMIT 5`),
    q(`SELECT ${LIST_COLS} FROM blog_posts p WHERE ${LIVE} ORDER BY p.views DESC, p.published_at DESC LIMIT 5`),
    q(`SELECT p.category AS name, COUNT(*) AS n FROM blog_posts p WHERE ${LIVE} AND p.category IS NOT NULL AND p.category <> '' GROUP BY p.category ORDER BY n DESC, name`),
    q(`SELECT p.tags FROM blog_posts p WHERE ${LIVE} AND p.tags IS NOT NULL AND p.tags <> ''`)
  ]);
  const tagCount = {};
  for (const r of tags) for (const t of String(r.tags).split(',').map((x) => x.trim()).filter(Boolean)) tagCount[t] = (tagCount[t] || 0) + 1;
  return {
    lead: mapPost(top[0]) || null,
    top: top.slice(1).map(mapPost),
    topIds: top.map((r) => r.id),
    mostRead: mostRead.map(mapPost),
    categories: categories.map((r) => ({ name: r.name, count: Number(r.n) })),
    tags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, count]) => ({ name, count }))
  };
}
export const getFrontPage = cached(getFrontPageUncached, 'blogFrontPage');

export async function getPostBySlug(slug, { includeDrafts } = {}) {
  const [row] = await q(`SELECT ${LIST_COLS}, p.body FROM blog_posts p WHERE p.slug = ? LIMIT 1`, [String(slug || '').slice(0, 191)]);
  if (!row) return null;
  const live = row.status === 'published' && (!row.published_at || new Date(row.published_at) <= new Date());
  if (!live && !includeDrafts) return null;
  return { ...mapPost(row), live };
}

// Related: same category or shared tags, best overlap first, then newest.
async function getRelatedPostsUncached(id, limit = 4) {
  const [me] = await q('SELECT id, category, tags FROM blog_posts WHERE id = ?', [Number(id)]);
  if (!me) return [];
  const tags = String(me.tags || '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8);
  const tagScore = tags.length ? tags.map(() => "(FIND_IN_SET(?, REPLACE(p.tags, ', ', ',')) > 0)").join(' + ') : '0';
  const rows = await q(
    `SELECT ${LIST_COLS}, ((p.category <=> ?) * 2 + ${tagScore}) AS score FROM blog_posts p
     WHERE ${LIVE} AND p.id <> ? ORDER BY score DESC, p.published_at DESC LIMIT ?`,
    [me.category, ...tags, me.id, limit]);
  return rows.map(mapPost);
}
export const getRelatedPosts = cached(getRelatedPostsUncached, 'blogRelated');

export async function countView(slug) {
  await q(`UPDATE blog_posts p SET p.views = p.views + 1 WHERE p.slug = ? AND ${LIVE}`, [String(slug || '').slice(0, 191)]);
}

export async function getPublishedSlugs() {
  return (await q(`SELECT p.slug, p.updated_at FROM blog_posts p WHERE ${LIVE}`)).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
}

// Old API shape (array) kept for existing callers.
export async function getPublishedPosts() { return (await listPublishedUncached({ pageSize: 100 })).items; }

// ---------- admin ----------
export async function adminListPosts({ page = 1, pageSize = 10, status, q: text } = {}) {
  const where = ['1=1'];
  const params = [];
  if (status === 'draft') where.push("p.status = 'draft'");
  if (status === 'published') where.push(`(${LIVE})`);
  if (status === 'scheduled') where.push("p.status = 'published' AND p.published_at > NOW()");
  if (text) { where.push('(p.title LIKE ? OR p.category LIKE ? OR p.tags LIKE ?)'); params.push(likeOf(text), likeOf(text), likeOf(text)); }
  const w = where.join(' AND ');
  const [{ total }] = await q(`SELECT COUNT(*) AS total FROM blog_posts p WHERE ${w}`, params);
  const pages = Math.max(1, Math.ceil(Number(total) / pageSize));
  const pg = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = await q(`SELECT ${LIST_COLS} FROM blog_posts p WHERE ${w} ORDER BY (p.status = 'draft') DESC, p.published_at DESC, p.id DESC LIMIT ? OFFSET ?`, [...params, pageSize, (pg - 1) * pageSize]);
  return { items: rows.map(mapPost), total: Number(total), page: pg, pages };
}
export async function getAllPosts() { return (await adminListPosts({ pageSize: 500 })).items; }
export async function adminGetPost(id) {
  const [row] = await q(`SELECT ${LIST_COLS}, p.body FROM blog_posts p WHERE p.id = ?`, [Number(id)]);
  if (!row) throw new HttpError(404, { error: 'not_found' });
  return mapPost(row);
}

const dbNow = async () => (await q("SELECT DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS n"))[0].n;

function slugify(title) {
  const base = String(title || '').toLowerCase().trim().replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
  return base || `post-${Date.now()}`;
}
function toRow(body, partial) {
  const out = {};
  if (body.title !== undefined || !partial) { out.title = clean(body.title, 191); if (!out.title) throw new HttpError(400, { error: 'title_required' }); }
  for (const [k, col, n] of [['excerpt', 'excerpt', 500], ['category', 'category', 64], ['author', 'author', 191]]) if (body[k] !== undefined) out[col] = clean(body[k], n) || null;
  if (body.body !== undefined) { out.body = clean(body.body, 200000); out.read_minutes = readingMinutes(out.body); }
  if (body.tags !== undefined) out.tags = (Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',')).map((t) => clean(t, 40)).filter(Boolean).slice(0, 12).join(', ') || null;
  if (body.coverKey !== undefined) {
    if (body.coverKey && !String(body.coverKey).startsWith('thumbnails/blog/')) throw new HttpError(400, { error: 'invalid_cover' });
    out.cover_key = body.coverKey || null;
  }
  if (body.featured !== undefined) out.featured = body.featured ? 1 : 0;
  if (body.status !== undefined) out.status = body.status === 'draft' ? 'draft' : 'published';
  if (body.publishedAt !== undefined) {
    // datetime-local value ("2026-11-05T09:30"), kept in the server's clock like NOW()
    const m = body.publishedAt ? /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?/.exec(String(body.publishedAt)) : null;
    if (body.publishedAt && !m) throw new HttpError(400, { error: 'invalid_date' });
    out.published_at = m ? `${m[1]} ${m[2]}:00` : null;
  }
  return out;
}

export async function createPost(body) {
  const row = toRow(body, false);
  let slug = slugify(body.slug || row.title);
  if ((await q('SELECT id FROM blog_posts WHERE slug = ? LIMIT 1', [slug])).length) slug = `${slug}-${Date.now() % 100000}`;
  if (row.status !== 'draft' && !row.published_at) row.published_at = await dbNow();
  row.author ||= 'Leo';
  const cols = Object.keys(row);
  const r = await q(`INSERT INTO blog_posts (slug, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`, [slug, ...cols.map((k) => row[k])]);
  return adminGetPost(r.insertId);
}

export async function updatePost(body) {
  const id = Number(body.id);
  if (!id) throw new HttpError(400, { error: 'id_required' });
  const row = toRow(body, true);
  if (body.slug) {
    const slug = slugify(body.slug);
    if ((await q('SELECT id FROM blog_posts WHERE slug = ? AND id <> ? LIMIT 1', [slug, id])).length) throw new HttpError(409, { error: 'slug_taken' });
    row.slug = slug;
  }
  // publishing a draft without a date publishes it now
  if (row.status === 'published' && body.publishedAt === undefined) {
    const [cur] = await q('SELECT published_at FROM blog_posts WHERE id = ?', [id]);
    if (cur && !cur.published_at) row.published_at = await dbNow();
  }
  const cols = Object.keys(row);
  if (cols.length) {
    const r = await q(`UPDATE blog_posts SET ${cols.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, [...cols.map((k) => row[k]), id]);
    if (!r.affectedRows) throw new HttpError(404, { error: 'not_found' });
  }
  return adminGetPost(id);
}

export async function deletePost(body) {
  if (!body?.id) throw new HttpError(400, { error: 'id_required' });
  await q('DELETE FROM blog_posts WHERE id = ?', [Number(body.id)]);
  return { ok: true };
}
