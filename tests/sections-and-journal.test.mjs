// Course sections (home + catalog facets) and the newspaper-style blog.
import { describe, it, expect, afterAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

const jar = { token: null };
vi.mock('next/headers', () => ({
  cookies: () => ({ get: (name) => (name === 'leo_session' && jar.token ? { value: jar.token } : undefined) }),
  headers: () => new Headers({ 'x-forwarded-for': '198.51.100.91' })
}));

const { q } = await import('@/lib/mysql');
const { signToken, sessionFromUser } = await import('@/lib/auth');
const sections = await import('@/lib/sectionRepo');
const { listPublishedCourses, getCatalogFacets, parseCatalogQuery } = await import('@/lib/catalogRepo');
const blog = await import('@/lib/blogRepo');
const { renderMarkdown } = await import('@/lib/markdown');
const secRoute = await import('@/app/api/course-sections/route.js');
const blogRoute = await import('@/app/api/blog/route.js');

const RUN = `t${Date.now().toString(36)}`;
const as = (s) => { jar.token = s ? signToken(s) : null; };
const call = async (fn, method, url, body) => {
  const res = await fn(new NextRequest(new URL(url, 'http://app.test'), body ? { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : { method }));
  return { status: res.status, body: await res.json().catch(() => null) };
};
const owner = sessionFromUser((await q("SELECT * FROM users WHERE role = 'owner' LIMIT 1"))[0]);
const student = sessionFromUser((await q("SELECT * FROM users WHERE role = 'student' LIMIT 1"))[0]);
let createdSection, createdPost;

afterAll(async () => {
  jar.token = null;
  if (createdSection) await q('DELETE FROM course_sections WHERE id = ?', [createdSection]);
  await q('DELETE FROM blog_posts WHERE slug LIKE ?', [`${RUN}%`]);
});

describe('course sections', () => {
  it('only staff with sections:manage can change them', async () => {
    as(student);
    expect((await call(secRoute.POST, 'POST', '/api/course-sections', { nameBn: 'ক', nameEn: 'x' })).status).toBe(403);
    as(owner);
    const r = await call(secRoute.POST, 'POST', '/api/course-sections', { nameBn: 'পরীক্ষা সেকশন', nameEn: `${RUN} Section`, tone: 'pink', icon: 'flag' });
    expect(r.status).toBe(201);
    createdSection = r.body.find((s) => s.nameEn === `${RUN} Section`).id;
    expect((await call(secRoute.POST, 'POST', '/api/course-sections', { nameBn: '', nameEn: '' })).body.error).toBe('name_required');
  });

  it('a course shows in its sections; switching a section off hides it', async () => {
    const [course] = await q('SELECT id FROM courses WHERE published = 1 ORDER BY id LIMIT 1');
    const before = await sections.getCourseSectionIds(course.id);
    await sections.setCourseSections(course.id, [...before, createdSection]);
    const slug = (await q('SELECT slug FROM course_sections WHERE id = ?', [createdSection]))[0].slug;
    const inSec = await listPublishedCourses(parseCatalogQuery({ section: slug }));
    expect(inSec.items.map((c) => c.id)).toContain(course.id);
    await sections.updateSection({ id: createdSection, enabled: false });
    expect((await listPublishedCourses(parseCatalogQuery({ section: slug }))).total).toBe(0);
    await sections.setCourseSections(course.id, before);
  });

  it('home shows at most 4 enabled sections that have courses', async () => {
    const home = await sections.getHomeSections();
    expect(home.length).toBeLessThanOrEqual(sections.HOME_LIMIT);
    expect(home.every((s) => s.enabled && s.showOnHome && s.courses.length > 0)).toBe(true);
  });

  it('facets narrow to the chosen section (college → college subjects only)', async () => {
    const all = await getCatalogFacets(parseCatalogQuery({}));
    const college = await getCatalogFacets(parseCatalogQuery({ section: 'college' }));
    expect(college.categories.length).toBeGreaterThan(0);
    expect(college.categories.length).toBeLessThan(all.categories.length);
    const collegeCourses = await listPublishedCourses(parseCatalogQuery({ section: 'college' }), { pageSize: 100 });
    const subjects = new Set(collegeCourses.items.map((c) => c.category));
    expect(college.categories.every((x) => subjects.has(x.value))).toBe(true);
    // live / recorded filter
    const live = await listPublishedCourses(parseCatalogQuery({ mode: 'live' }), { pageSize: 100 });
    expect(live.items.every((c) => c.mode === 'live')).toBe(true);
  });
});

describe('journal', () => {
  it('staff publish; drafts and scheduled posts stay private', async () => {
    as(student);
    expect((await call(blogRoute.POST, 'POST', '/api/blog', { title: 'x' })).status).toBe(403);
    as(owner);
    const draft = await call(blogRoute.POST, 'POST', '/api/blog', { title: `${RUN} draft`, slug: `${RUN}-draft`, body: '## A\n\ntext', status: 'draft', category: 'পরীক্ষা', tags: 'x, y' });
    expect(draft.status).toBe(201);
    createdPost = draft.body;
    expect(await blog.getPostBySlug(`${RUN}-draft`)).toBeNull();
    const future = await call(blogRoute.POST, 'POST', '/api/blog', { title: `${RUN} later`, slug: `${RUN}-later`, status: 'published', publishedAt: '2099-01-01T09:00' });
    expect(future.body.scheduled).toBe(true);
    expect(await blog.getPostBySlug(`${RUN}-later`)).toBeNull();
    const pub = await call(blogRoute.PATCH, 'PATCH', '/api/blog', { id: createdPost.id, status: 'published' });
    expect(pub.body.status).toBe('published');
    expect((await blog.getPostBySlug(`${RUN}-draft`)).live).toBe(true);
  });

  it('paginates and finds related articles', async () => {
    const p1 = await call(blogRoute.GET, 'GET', '/api/blog?page=1');
    expect(p1.body).toMatchObject({ page: 1, pageSize: blog.BLOG_PAGE_SIZE });
    expect(p1.body.items.length).toBeLessThanOrEqual(blog.BLOG_PAGE_SIZE);
    const related = await blog.getRelatedPosts(createdPost.id, 4);
    expect(related.find((r) => r.id === createdPost.id)).toBeUndefined();
    expect(related.length).toBeGreaterThan(0);
  });

  it('renders Markdown without letting HTML or scripts through', () => {
    const { html, headings } = renderMarkdown('## Hi <b>x</b>\n\n[bad](javascript:alert(1)) <img src=x onerror=1> ![i](data:x)');
    expect(html).not.toMatch(/<b>|<img src=x|javascript:|data:x/);
    expect(headings[0].text).toBe('Hi <b>x</b>');
  });
});
