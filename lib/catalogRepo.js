// ============================================================
// Public catalog read model (server components + public API).
//
// Only published courses are sold/listed; upcoming courses (announced, not
// released) appear only as announcements without lessons or media. Nothing
// here exposes storage keys, video URLs, staff contact details or drafts.
//
// Statistics are computed from real records, one definition everywhere:
//   purchasers  = unique students with a PAID order line for the course at a
//                 price > 0 whose enrollment is still active (pending/failed,
//                 refunded/revoked and duplicate orders don't count; free
//                 enrollments are counted separately as `enrollmentCount`)
//   rating      = average of published (approved) reviews by real students
//   badges      = lib/badges.js rules; prices = lib/pricing.js offers
// ============================================================

import { q } from '@/lib/mysql';
import { publicThumbnailUrl } from '@/lib/storage';
import { getActiveOffers, priceWithOffers } from '@/lib/pricing';
import { getBadgeRules, badgesFor } from '@/lib/badges';

export const PAGE_SIZE = 12;
export const SORTS = ['relevance', 'popular', 'newest', 'rating', 'price-asc', 'price-desc'];
export const COLLECTIONS = ['featured', 'new', 'upcoming'];

const PUBLISHED_REVIEW = "r.status = 'approved' AND r.student_id IS NOT NULL";

const CARD_SELECT = `
  c.id, c.slug, c.title, c.tagline, c.instructor, c.instructor_id, c.category, c.level, c.language, c.mode,
  c.price, c.thumb, c.thumbnail_key, c.duration, c.featured, c.featured_order, c.created_at,
  c.published, c.is_upcoming, c.release_date, c.first_published_at,
  cat.name AS category_name, cl.slug AS class_slug, cl.name AS class_name,
  (SELECT COUNT(*) FROM modules m JOIN lessons l ON l.module_id = m.id WHERE m.course_id = c.id) AS lesson_count,
  (SELECT COALESCE(SUM(COALESCE(va.duration_seconds, l.duration_seconds)), 0)
     FROM modules m JOIN lessons l ON l.module_id = m.id LEFT JOIN video_assets va ON va.lesson_id = l.id AND va.status = 'ready'
     WHERE m.course_id = c.id) AS duration_seconds,
  (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') AS enrollment_count,
  (SELECT COUNT(DISTINCT o.student_id) FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN enrollments pe ON pe.student_id = o.student_id AND pe.course_id = oi.course_id AND pe.status = 'active'
     WHERE oi.course_id = c.id AND o.status = 'paid' AND oi.unit_price > 0) AS purchase_count,
  (SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id AND ${PUBLISHED_REVIEW}) AS review_count,
  (SELECT AVG(r.rating) FROM course_reviews r WHERE r.course_id = c.id AND ${PUBLISHED_REVIEW}) AS review_avg,
  (SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id AND ${PUBLISHED_REVIEW} AND r.verified_purchase = 1) AS verified_review_count,
  (SELECT AVG(r.rating) FROM course_reviews r WHERE r.course_id = c.id AND ${PUBLISHED_REVIEW} AND r.verified_purchase = 1) AS verified_avg`;

const FROM = 'FROM courses c LEFT JOIN categories cat ON cat.slug = c.category LEFT JOIN class_levels cl ON cl.id = c.class_id';

// Shared per-request context: active offers + badge rules.
export async function catalogContext() {
  const [offers, rules] = await Promise.all([getActiveOffers(), getBadgeRules()]);
  return { offers, rules };
}

export function mapCard(r, ctx) {
  const pricing = priceWithOffers({ id: r.id, price: r.price, category: r.category, classSlug: r.class_slug }, ctx?.offers || []);
  return {
    id: r.id, slug: r.slug, title: r.title, tagline: r.tagline || null,
    instructor: r.instructor || null, instructorId: r.instructor_id || null,
    category: r.category || null, categoryName: r.category_name || null,
    classSlug: r.class_slug || null, className: r.class_name || null,
    level: r.level || null, language: r.language || null, mode: r.mode || null,
    listPrice: pricing.listPrice, price: pricing.price, offer: pricing.offer, currency: 'BDT', free: pricing.listPrice === 0,
    thumb: r.thumb || null, thumbnailUrl: publicThumbnailUrl(r.thumbnail_key),
    durationLabel: r.duration || null,
    durationSeconds: Number(r.duration_seconds) || 0,
    lessonCount: Number(r.lesson_count) || 0,
    enrollmentCount: Number(r.enrollment_count) || 0,
    purchaseCount: Number(r.purchase_count) || 0,
    reviewCount: Number(r.review_count) || 0,
    rating: r.review_avg != null ? Math.round(Number(r.review_avg) * 10) / 10 : null,
    badges: badgesFor({ ...r, verified_review_count: Number(r.verified_review_count) || 0 }, ctx?.rules || { topRatedMin: 4.5, topRatedReviews: 10, newDays: 30 }),
    featured: !!r.featured,
    upcoming: !!r.is_upcoming && !r.published,
    releaseDate: r.release_date || null,
    createdAt: r.created_at
  };
}

// Parse + clamp catalog search params (shared by page + API).
export function parseCatalogQuery(sp = {}) {
  const get = (k) => {
    const v = typeof sp.get === 'function' ? sp.get(k) : sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const str = (v, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const sort = SORTS.includes(get('sort')) ? get('sort') : 'relevance';
  const price = ['free', 'paid'].includes(get('price')) ? get('price') : '';
  const collection = COLLECTIONS.includes(get('collection')) ? get('collection') : '';
  const page = Math.max(1, Math.min(500, parseInt(get('page'), 10) || 1));
  return { q: str(get('q'), 100), category: str(get('category'), 64), class: str(get('class'), 64), level: str(get('level'), 128), language: str(get('language'), 64), price, collection, sort, page };
}

const likeOf = (s) => `%${s.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

export async function listPublishedCourses(query, { pageSize = PAGE_SIZE, ctx } = {}) {
  const context = ctx || await catalogContext();
  const upcoming = query.collection === 'upcoming';
  const where = [upcoming ? 'c.published = 0 AND c.is_upcoming = 1' : 'c.published = 1'];
  const params = [];
  if (query.q) {
    where.push('(c.title LIKE ? OR c.tagline LIKE ? OR c.instructor LIKE ? OR c.description LIKE ?)');
    params.push(likeOf(query.q), likeOf(query.q), likeOf(query.q), likeOf(query.q));
  }
  if (query.category) { where.push('c.category = ?'); params.push(query.category); }
  // 'other' = courses without a class (skills, university, general) so they stay discoverable
  if (query.class === 'other') where.push('c.class_id IS NULL');
  else if (query.class) { where.push('cl.slug = ?'); params.push(query.class); }
  if (query.level) { where.push('c.level = ?'); params.push(query.level); }
  if (query.language) { where.push('c.language = ?'); params.push(query.language); }
  if (query.price === 'free') where.push('c.price = 0');
  if (query.price === 'paid') where.push('c.price > 0');
  if (query.collection === 'featured') where.push('c.featured = 1');
  // 'new' = newest published first (the "New" badge keeps its own window)

  const order = query.collection === 'featured' && query.sort === 'relevance' ? 'COALESCE(c.featured_order, 999999), c.id'
    : query.collection === 'new' && query.sort === 'relevance' ? 'COALESCE(c.first_published_at, c.created_at) DESC, c.id DESC'
    : upcoming ? 'c.release_date IS NULL, c.release_date, c.id'
    : {
      relevance: query.q ? '(c.title LIKE ?) DESC, c.featured DESC, purchase_count DESC, c.id DESC' : 'c.featured DESC, purchase_count DESC, enrollment_count DESC, c.id DESC',
      popular: 'purchase_count DESC, enrollment_count DESC, c.id DESC',
      newest: 'COALESCE(c.first_published_at, c.created_at) DESC, c.id DESC',
      rating: 'review_avg IS NULL, review_avg DESC, review_count DESC, c.id DESC',
      'price-asc': 'c.price ASC, c.id DESC',
      'price-desc': 'c.price DESC, c.id DESC'
    }[query.sort];
  const orderParams = !upcoming && query.sort === 'relevance' && query.q && !query.collection ? [likeOf(query.q)] : [];

  const whereSql = where.join(' AND ');
  const [{ total }] = await q(`SELECT COUNT(*) AS total ${FROM} WHERE ${whereSql}`, params);
  const pages = Math.max(1, Math.ceil(Number(total) / pageSize));
  const page = Math.min(query.page || 1, pages);
  const rows = await q(`SELECT ${CARD_SELECT} ${FROM} WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, ...orderParams, pageSize, (page - 1) * pageSize]);
  return { items: rows.map((r) => mapCard(r, context)), total: Number(total), page, pages, pageSize };
}

// Subjects / classes with accurate counts of courses currently on sale.
export async function getSubjects() {
  const rows = await q(
    `SELECT cat.slug AS value, cat.name, cat.icon, COUNT(c.id) AS n
     FROM categories cat LEFT JOIN courses c ON c.category = cat.slug AND c.published = 1
     GROUP BY cat.id, cat.slug, cat.name, cat.icon, cat.position ORDER BY cat.position, cat.name`
  );
  return rows.map((r) => ({ value: r.value, name: r.name, icon: r.icon, count: Number(r.n) }));
}

export async function getClassLevels() {
  const rows = await q(
    `SELECT cl.slug AS value, cl.name, COUNT(c.id) AS n
     FROM class_levels cl LEFT JOIN courses c ON c.class_id = cl.id AND c.published = 1
     GROUP BY cl.id, cl.slug, cl.name, cl.position ORDER BY cl.position, cl.name`
  );
  return rows.map((r) => ({ value: r.value, name: r.name, count: Number(r.n) }));
}

export async function getCatalogFacets() {
  const [subjects, classes, levels, langs, prices, [{ n: otherCount }]] = await Promise.all([
    getSubjects(),
    getClassLevels(),
    q(`SELECT level AS value, COUNT(*) AS n FROM courses WHERE published = 1 AND level IS NOT NULL AND level <> '' GROUP BY level ORDER BY n DESC, value`),
    q(`SELECT language AS value, COUNT(*) AS n FROM courses WHERE published = 1 AND language IS NOT NULL AND language <> '' GROUP BY language ORDER BY n DESC, value`),
    q(`SELECT SUM(price = 0) AS free, SUM(price > 0) AS paid FROM courses WHERE published = 1`),
    q(`SELECT COUNT(*) AS n FROM courses WHERE published = 1 AND class_id IS NULL`)
  ]);
  return {
    categories: subjects.filter((x) => x.count > 0),
    classes: classes.filter((x) => x.count > 0),
    nonClassCount: Number(otherCount) || 0,
    levels: levels.map((r) => ({ value: r.value, count: Number(r.n) })),
    languages: langs.map((r) => ({ value: r.value, count: Number(r.n) })),
    price: { free: Number(prices[0]?.free) || 0, paid: Number(prices[0]?.paid) || 0 }
  };
}

async function listBy(whereSql, orderSql, limit, params = [], ctx) {
  const context = ctx || await catalogContext();
  const rows = await q(`SELECT ${CARD_SELECT} ${FROM} WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ?`, [...params, limit]);
  return rows.map((r) => mapCard(r, context));
}

// Admin-selected, in the configured order.
export const getFeaturedCourses = (limit = 8, ctx) => listBy('c.published = 1 AND c.featured = 1', 'COALESCE(c.featured_order, 999999), c.id', limit, [], ctx);
// Most recently published courses (by FIRST publication), newest first. The
// "New" badge is separate and only applies inside its configured window.
export const getNewArrivals = (limit = 8, ctx) => listBy('c.published = 1', 'COALESCE(c.first_published_at, c.created_at) DESC, c.id DESC', limit, [], ctx);

// Top courses for each of several subjects, for the homepage subject rows.
export async function getCoursesBySubjects(slugs, perSubject = 8, ctx) {
  if (!slugs.length) return {};
  const context = ctx || await catalogContext();
  const rows = await q(`SELECT ${CARD_SELECT} ${FROM} WHERE c.published = 1 AND c.category IN (${slugs.map(() => '?').join(',')})
                        ORDER BY c.featured DESC, purchase_count DESC, c.id DESC`, slugs);
  const out = {};
  for (const r of rows) {
    const list = (out[r.category] ||= []);
    if (list.length < perSubject) list.push(mapCard(r, context));
  }
  return out;
}
// Publicly announced, not yet released; dated ones first.
export const getUpcomingCourses = (limit = 8, ctx) => listBy('c.published = 0 AND c.is_upcoming = 1', 'c.release_date IS NULL, c.release_date, c.id', limit, [], ctx);
// Fallback when nothing is featured: best sellers.
export const getPopularCourses = (limit = 8, ctx) => listBy('c.published = 1', 'purchase_count DESC, enrollment_count DESC, c.id DESC', limit, [], ctx);

export async function getPlatformStats() {
  const [[courses], [lessons], [learners], [instructors]] = await Promise.all([
    q('SELECT COUNT(*) AS n FROM courses WHERE published = 1'),
    q('SELECT COUNT(*) AS n FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id WHERE c.published = 1'),
    q("SELECT COUNT(DISTINCT e.student_id) AS n FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.status = 'active' AND c.published = 1"),
    q('SELECT COUNT(DISTINCT instructor_id) AS n FROM courses WHERE published = 1 AND instructor_id IS NOT NULL')
  ]);
  return { courses: Number(courses.n), lessons: Number(lessons.n), learners: Number(learners.n), instructors: Number(instructors.n) };
}

const splitLines = (t) => String(t || '').split('\n').map((s) => s.trim()).filter(Boolean);

// Full public course page payload. Published → full page; upcoming →
// announcement only (no curriculum, no media); anything else → null.
export async function getPublicCourse(slug) {
  const ctx = await catalogContext();
  const [row] = await q(
    `SELECT ${CARD_SELECT}, c.description, c.audience, c.updated_at
     ${FROM} WHERE c.slug = ? AND (c.published = 1 OR c.is_upcoming = 1)`,
    [String(slug || '').slice(0, 191)]
  );
  if (!row) return null;
  const card = mapCard(row, ctx);
  const id = row.id;
  const [points, reqs, faqs, reviews, lessons, instructor] = await Promise.all([
    q('SELECT text FROM course_learning_points WHERE course_id = ? ORDER BY id', [id]),
    q('SELECT text FROM course_requirements WHERE course_id = ? ORDER BY id', [id]),
    q('SELECT question, answer FROM course_faqs WHERE course_id = ? ORDER BY id', [id]),
    q(`SELECT r.id, r.name, r.rating, r.text, r.verified_purchase, r.created_at, r.updated_at FROM course_reviews r
       WHERE r.course_id = ? AND ${PUBLISHED_REVIEW} ORDER BY r.featured DESC, COALESCE(r.updated_at, r.created_at) DESC LIMIT 30`, [id]),
    card.upcoming ? [] : q(`SELECT l.id, l.title, l.summary, l.type, l.is_free, l.duration, l.duration_seconds, m.id AS module_id, m.title AS module_title,
              va.status AS video_status, va.duration_seconds AS video_duration,
              (SELECT COUNT(*) FROM lesson_resources lr WHERE lr.lesson_id = l.id AND lr.status = 'ready') AS resource_count
       FROM modules m LEFT JOIN lessons l ON l.module_id = m.id LEFT JOIN video_assets va ON va.lesson_id = l.id
       WHERE m.course_id = ? ORDER BY m.position, m.id, l.position, l.id`, [id]),
    row.instructor_id ? getPublicInstructor(row.instructor_id, { withCourses: false }) : null
  ]);

  const modules = [];
  for (const l of lessons) {
    let m = modules[modules.length - 1];
    if (!m || m.id !== l.module_id) { m = { id: l.module_id, title: l.module_title, lessons: [], durationSeconds: 0 }; modules.push(m); }
    if (!l.id) continue;
    const dur = l.video_duration || l.duration_seconds || null;
    const previewable = !!l.is_free && l.type === 'video' && l.video_status === 'ready';
    m.lessons.push({
      id: l.id, title: l.title, summary: l.summary || null, type: l.type, free: !!l.is_free, previewable,
      durationSeconds: dur, durationLabel: dur ? null : (l.duration && l.duration !== '—' ? l.duration : null),
      resources: Number(l.resource_count) || 0
    });
    m.durationSeconds += dur || 0;
  }
  const previews = modules.flatMap((m) => m.lessons.filter((l) => l.previewable));

  return {
    ...card,
    description: row.description || '',
    audience: splitLines(row.audience),
    whatYouLearn: points.map((p) => p.text),
    requirements: reqs.map((r) => r.text),
    faqs: faqs.map((f) => ({ q: f.question, a: f.answer })),
    reviews: reviews.map((r) => ({ id: r.id, name: r.name, rating: Number(r.rating), text: r.text || '', verifiedPurchase: !!r.verified_purchase, createdAt: r.updated_at || r.created_at })),
    ratingBreakdown: [5, 4, 3, 2, 1].map((n) => ({ stars: n, count: reviews.filter((r) => Number(r.rating) === n).length })),
    modules,
    previewLessons: previews.map((p) => ({ id: p.id, title: p.title, durationSeconds: p.durationSeconds })),
    instructorProfile: instructor,
    updatedAt: row.updated_at
  };
}

export async function getRelatedCourses(course, limit = 4) {
  const ctx = await catalogContext();
  return listBy('c.published = 1 AND c.id <> ?', '(c.category <=> ?) DESC, purchase_count DESC, c.id DESC', limit, [course.id, course.category], ctx);
}

// Public instructor profile — no phone, no seed rating numbers.
export async function getPublicInstructor(id, { withCourses = true } = {}) {
  const [t] = await q('SELECT id, name, title, bio FROM teachers WHERE id = ?', [Number(id)]);
  if (!t) return null;
  const [expertise, [stats]] = await Promise.all([
    q('SELECT skill FROM teacher_expertise WHERE teacher_id = ? ORDER BY id', [t.id]),
    q(`SELECT COUNT(DISTINCT c.id) AS courses, COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.student_id END) AS learners
       FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id WHERE c.published = 1 AND c.instructor_id = ?`, [t.id])
  ]);
  const profile = {
    id: t.id, name: t.name, title: t.title || null, bio: t.bio || null,
    expertise: expertise.map((e) => e.skill),
    courseCount: Number(stats?.courses) || 0, learnerCount: Number(stats?.learners) || 0
  };
  if (withCourses) profile.courses = await listBy('c.published = 1 AND c.instructor_id = ?', 'c.id DESC', 50, [t.id]);
  return profile;
}

export async function getPublishedSlugs() {
  return q('SELECT slug, updated_at FROM courses WHERE published = 1 OR is_upcoming = 1 ORDER BY id');
}

// What the purchase card should offer this viewer. Server-derived.
export async function getViewerCourseState(session, courseId) {
  const [course] = await q('SELECT published, is_upcoming, instructor_id FROM courses WHERE id = ?', [courseId]);
  if (course && !course.published && course.is_upcoming) return { status: 'upcoming' };
  if (!session) return { status: 'guest' };
  if (session.role === 'owner' || session.role === 'superadmin') return { status: 'staff' };
  if (session.role === 'teacher') {
    if (course && Number(course.instructor_id) === Number(session.teacherId)) return { status: 'staff' };
    return { status: 'not_student' };
  }
  if (!session.studentId) return { status: 'not_student' };
  const [enr] = await q(
    "SELECT id, last_lesson_id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active' LIMIT 1",
    [session.studentId, courseId]
  );
  if (enr) {
    const [{ done, total }] = await q(
      `SELECT SUM(COALESCE(lp.completed,0)) AS done, COUNT(*) AS total FROM lessons l JOIN modules m ON m.id = l.module_id
       LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = ? WHERE m.course_id = ?`,
      [session.studentId, courseId]
    );
    return {
      status: 'enrolled', started: !!enr.last_lesson_id || Number(done) > 0,
      completedCount: Number(done) || 0, lessonCount: Number(total) || 0,
      completionPct: Number(total) ? Math.round((Number(done) / Number(total)) * 100) : null
    };
  }
  const [pending] = await q(
    `SELECT o.id FROM orders o JOIN order_items oi ON oi.order_id = o.id
     WHERE o.student_id = ? AND oi.course_id = ? AND o.status = 'pending' AND o.gateway = 'bkash'
       AND o.created_at > NOW() - INTERVAL 1 DAY ORDER BY o.id DESC LIMIT 1`,
    [session.studentId, courseId]
  );
  if (pending) return { status: 'pending', orderId: pending.id };
  return { status: 'available' };
}

// Course ids this viewer actively owns (to mark catalog cards "Enrolled").
export async function getOwnedCourseIds(session) {
  if (!session?.studentId) return new Set();
  const rows = await q("SELECT DISTINCT course_id FROM enrollments WHERE student_id = ? AND status = 'active' AND course_id IS NOT NULL", [session.studentId]);
  return new Set(rows.map((r) => r.course_id));
}

// Instructors with at least one published course (public fields only).
export async function getFeaturedInstructors(limit = 4) {
  const rows = await q(
    `SELECT t.id, t.name, t.title, t.bio, COUNT(DISTINCT c.id) AS courses
     FROM teachers t JOIN courses c ON c.instructor_id = t.id AND c.published = 1
     GROUP BY t.id, t.name, t.title, t.bio ORDER BY courses DESC, t.id LIMIT ?`, [limit]
  );
  return rows.map((r) => ({ id: r.id, name: r.name, title: r.title || null, bio: r.bio || null, courseCount: Number(r.courses) }));
}

// Lesson ids an enrolled student has completed in one course (course page
// curriculum ticks). Empty for anyone else.
export async function getCompletedLessonIds(session, courseId) {
  if (!session?.studentId) return [];
  const rows = await q(
    `SELECT lp.lesson_id FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
     WHERE lp.student_id = ? AND m.course_id = ? AND lp.completed = 1`, [session.studentId, Number(courseId)]);
  return rows.map((r) => r.lesson_id);
}
