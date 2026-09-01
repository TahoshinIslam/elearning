// ============================================================
// Blog / articles data-access.
// Public reads surface 'published' posts only; admins see everything.
// ============================================================

import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

const LIST_COLS = 'id, title, slug, excerpt, category, cover, author, status, published_at AS publishedAt';

export async function getPublishedPosts() {
  return q(`SELECT ${LIST_COLS} FROM blog_posts WHERE status='published' ORDER BY published_at DESC, id DESC`);
}

export async function getAllPosts() {
  return q(`SELECT ${LIST_COLS} FROM blog_posts ORDER BY (status='draft') DESC, id DESC`);
}

export async function getPostBySlug(slug, { includeDrafts } = {}) {
  const rows = await q(
    `SELECT id, title, slug, excerpt, body, category, cover, author, status, published_at AS publishedAt
     FROM blog_posts WHERE slug = ? LIMIT 1`, [slug]);
  const post = rows[0];
  if (!post || (!includeDrafts && post.status !== 'published')) return null;
  return post;
}

function slugify(title) {
  const base = String(title || '').toLowerCase().trim()
    .replace(/[^a-z0-9ঀ-৿]+/g, '-').replace(/^-+|-+$/g, '');
  return base || `post-${Date.now()}`;
}

export async function createPost(body) {
  const title = String(body.title || '').trim();
  if (!title) throw new HttpError(400, { error: 'title_required' });
  let slug = body.slug ? slugify(body.slug) : slugify(title);
  if (await q('SELECT id FROM blog_posts WHERE slug = ? LIMIT 1', [slug]).then((r) => r[0])) slug = `${slug}-${Date.now() % 10000}`;
  const status = body.status === 'draft' ? 'draft' : 'published';
  await q(
    `INSERT INTO blog_posts (title, slug, excerpt, body, category, cover, author, status, published_at)
     VALUES (?,?,?,?,?,?,?,?, CURDATE())`,
    [title, slug, body.excerpt || null, body.body || null, body.category || null, body.cover || 'blog', body.author || 'Leo', status]
  );
  return getAllPosts();
}

export async function updatePost(body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  const fields = [], params = [];
  for (const k of ['title', 'excerpt', 'body', 'category', 'cover', 'author']) {
    if (body[k] !== undefined) { fields.push(`${k} = ?`); params.push(body[k]); }
  }
  if (body.status !== undefined) { fields.push('status = ?'); params.push(body.status === 'draft' ? 'draft' : 'published'); }
  if (!fields.length) return getAllPosts();
  params.push(body.id);
  await q(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, params);
  return getAllPosts();
}

export async function deletePost(body) {
  if (!body.id) throw new HttpError(400, { error: 'id_required' });
  await q('DELETE FROM blog_posts WHERE id = ?', [body.id]);
  return getAllPosts();
}
