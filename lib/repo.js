import { NextResponse } from 'next/server';
import { q, withTransaction } from '@/lib/mysql';
import { courseCompletion, CERT_THRESHOLD } from '@/lib/progress';
import { logger } from '@/lib/logger';
import { getPresignedUploadUrl, imageKey, publicThumbnailUrl, statObject, deleteObject, storageConfigured, ALLOWED_TYPES, MAX_UPLOAD_BYTES } from '@/lib/storage';
import { recordAudit } from '@/lib/auditLog';

// ---- error plumbing ---------------------------------------------------------
export class HttpError extends Error {
  constructor(status, body) { super(body?.error || 'error'); this.status = status; this.body = body; }
}
export function errResponse(e) {
  if (e instanceof HttpError) {
    const headers = e.status === 429 && e.body?.retryAfter ? { 'Retry-After': String(e.body.retryAfter) } : undefined;
    return NextResponse.json(e.body, { status: e.status, headers });
  }
  if (e instanceof SyntaxError) return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  logger.error('unhandled_route_error', { message: e?.message, stack: e?.stack });
  return NextResponse.json({ error: 'server_error' }, { status: 500 });
}

const rand = (n) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 34)]).join('');
async function batchIdByName(name) {
  if (!name) return null;
  const r = await q('SELECT id FROM batches WHERE name = ? LIMIT 1', [name]);
  return r[0]?.id ?? null;
}

// ============================ STUDENTS ======================================
export async function getStudents() {
  const rows = await q(
    `SELECT s.id, s.name, s.phone, COALESCE(b.name,'') AS batch, s.amount, s.paid
     FROM students s LEFT JOIN batches b ON s.batch_id=b.id ORDER BY s.id`
  );
  return rows.map((r) => ({ id: r.id, name: r.name, phone: r.phone, batch: r.batch, amount: r.amount, paid: !!r.paid }));
}
export async function addStudentOrImport(body) {
  if (Array.isArray(body.import)) {
    for (const s of body.import) {
      const bid = await batchIdByName(s.batch);
      await q('INSERT INTO students (name, phone, batch_id, amount, paid) VALUES (?,?,?,?,0)',
        [s.name || 'শিক্ষার্থী', s.phone || '—', bid, Number(s.amount) || 1500]);
    }
    return getStudents();
  }
  if (!body.name || !String(body.name).trim()) throw new HttpError(400, { error: 'Name is required' });
  const bid = await batchIdByName(body.batch || 'HSC ফিজিক্স — ব্যাচ ৩');
  await q('INSERT INTO students (name, phone, batch_id, amount, paid) VALUES (?,?,?,?,0)',
    [String(body.name).trim(), body.phone ? String(body.phone).trim() : '—', bid, Number(body.amount) || 1500]);
  return getStudents();
}
export async function setStudentPaid(body) {
  const r = await q('UPDATE students SET paid = ? WHERE id = ?', [body.paid ? 1 : 0, body.id]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'Student not found' });
  return getStudents();
}

// ============================ BATCHES =======================================
export async function getBatches() {
  const rows = await q('SELECT id, name, course_id AS courseId, students_count AS students, fee, schedule AS time FROM batches ORDER BY id');
  return rows;
}
export async function addBatch(body) {
  await q('INSERT INTO batches (name, course_id, students_count, fee, schedule) VALUES (?,?,0,?,?)', [
    body.name || 'HSC কেমিস্ট্রি — নতুন',
    body.courseId != null ? Number(body.courseId) : null,
    body.fee || '1,400',
    body.time || 'রবি-মঙ্গল · সন্ধ্যা ৬টা'
  ]);
  return getBatches();
}
export async function setBatchCourse(body) {
  const r = await q('UPDATE batches SET course_id = ? WHERE id = ?', [body.courseId != null ? Number(body.courseId) : null, body.id]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'Batch not found' });
  return getBatches();
}

// ============================ TEACHERS ======================================
export async function getTeachers() {
  const rows = await q('SELECT id, name, subject, phone, title, rating, rating_count, students_taught, bio FROM teachers ORDER BY id');
  const tb = await q('SELECT tb.teacher_id, b.name FROM teacher_batches tb JOIN batches b ON tb.batch_id=b.id');
  const ex = await q('SELECT teacher_id, skill FROM teacher_expertise ORDER BY id');
  const byT = (arr, key) => { const m = {}; arr.forEach((x) => { (m[x.teacher_id] = m[x.teacher_id] || []).push(x[key]); }); return m; };
  const batchMap = byT(tb, 'name'), exMap = byT(ex, 'skill');
  return rows.map((r) => ({
    id: r.id, name: r.name, subject: r.subject, phone: r.phone,
    batches: batchMap[r.id] || [], title: r.title, rating: Number(r.rating),
    ratingCount: r.rating_count, studentsTaught: r.students_taught, expertise: exMap[r.id] || [], bio: r.bio
  }));
}
export async function addTeacher(body) {
  await q('INSERT INTO teachers (name, subject, phone) VALUES (?,?,?)',
    [body.name || 'নতুন শিক্ষক', body.subject || 'বিষয়', body.phone || '—']);
  return getTeachers();
}
export async function patchTeacher(body) {
  const exists = await q('SELECT id FROM teachers WHERE id = ?', [body.id]);
  if (!exists.length) throw new HttpError(404, { error: 'Teacher not found' });
  if (body.assign) {
    const bid = await batchIdByName(body.assign);
    if (bid) await q('INSERT IGNORE INTO teacher_batches (teacher_id, batch_id) VALUES (?,?)', [body.id, bid]);
  } else if (body.remove) {
    const bid = await batchIdByName(body.remove);
    if (bid) await q('DELETE FROM teacher_batches WHERE teacher_id=? AND batch_id=?', [body.id, bid]);
  }
  return getTeachers();
}

// ============================ TENANTS =======================================
export async function getTenants() {
  return q('SELECT id, name, sub, plan, students, mrr, status FROM tenants ORDER BY id');
}
export async function toggleTenant(body) {
  const r = await q("UPDATE tenants SET status = IF(status='active','suspended','active') WHERE id = ?", [body.id]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'Tenant not found' });
  return getTenants();
}

// ============================ COURSES =======================================
// Staff-side course model (drafts included). The public catalog has its own
// read model in lib/catalogRepo.js that only ever returns published data.
const MODES = ['live', 'recorded', 'hybrid', 'free', 'workshop', 'webinar'];
const LESSON_TYPES = ['video', 'pdf', 'quiz', 'assignment'];
const MAX_PRICE = 1_000_000;

const text = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);
const lines = (arr, maxItems = 30, maxLen = 250) =>
  (Array.isArray(arr) ? arr : String(arr || '').split('\n')).map((s) => text(s, maxLen)).filter(Boolean).slice(0, maxItems);

function mapCourseRow(r) {
  return {
    id: r.id, title: r.title, slug: r.slug, published: !!r.published, featured: !!r.featured, completionThreshold: r.completion_threshold ?? 80, category: r.category, mode: r.mode,
    thumb: r.thumb, thumbnailUrl: publicThumbnailUrl(r.thumbnail_key), tagline: r.tagline, level: r.level, language: r.language, instructor: r.instructor,
    instructorId: r.instructor_id, price: r.price, oldPrice: r.old_price, classId: r.class_id || null,
    firstPublishedAt: r.first_published_at || null, featuredOrder: r.featured_order ?? null,
    isUpcoming: !!r.is_upcoming, releaseDate: r.release_date || null,
    duration: r.duration, description: r.description, audience: lines(r.audience),
    reviewStatus: r.review_status, reviewNote: r.review_note, updatedAt: r.updated_at, createdAt: r.created_at
  };
}
export async function getCourses() {
  const courses = await q('SELECT * FROM courses ORDER BY id');
  if (!courses.length) return [];
  const [lps, reqs, faqs, modules, lessons, stats] = await Promise.all([
    q('SELECT course_id, text FROM course_learning_points ORDER BY id'),
    q('SELECT course_id, text FROM course_requirements ORDER BY id'),
    q('SELECT course_id, question, answer FROM course_faqs ORDER BY id'),
    q('SELECT id, course_id, title FROM modules ORDER BY position, id'),
    q(`SELECT l.id, l.module_id, l.title, l.summary, l.type, l.duration, l.duration_seconds, l.is_free,
              va.status AS video_status, va.duration_seconds AS video_duration, va.error_message AS video_error,
              (SELECT COUNT(*) FROM lesson_resources r WHERE r.lesson_id = l.id AND r.status = 'ready') AS resource_count
       FROM lessons l LEFT JOIN video_assets va ON va.lesson_id = l.id ORDER BY l.position, l.id`),
    q(`SELECT c.id AS course_id,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') AS enrollments,
              (SELECT COUNT(*) FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.course_id = c.id AND o.status = 'paid') AS paid_orders,
              (SELECT COUNT(DISTINCT o.student_id) FROM orders o JOIN order_items oi ON oi.order_id = o.id
                 JOIN enrollments pe ON pe.student_id = o.student_id AND pe.course_id = oi.course_id AND pe.status = 'active'
                 WHERE oi.course_id = c.id AND o.status = 'paid' AND oi.unit_price > 0) AS purchasers,
              (SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id AND r.status = 'approved' AND r.student_id IS NOT NULL) AS reviews,
              (SELECT AVG(r.rating) FROM course_reviews r WHERE r.course_id = c.id AND r.status = 'approved' AND r.student_id IS NOT NULL) AS rating_avg,
              (SELECT COUNT(*) FROM course_reviews r WHERE r.course_id = c.id AND r.status = 'pending') AS reviews_pending,
              (SELECT COUNT(*) FROM course_waitlist w WHERE w.course_id = c.id) AS waitlist
       FROM courses c`)
  ]);
  const group = (arr, key) => { const m = {}; arr.forEach((x) => { (m[x[key]] = m[x[key]] || []).push(x); }); return m; };
  const lp = group(lps, 'course_id'), rq = group(reqs, 'course_id'), fq = group(faqs, 'course_id');
  const modByCourse = group(modules, 'course_id'), lesByMod = group(lessons, 'module_id');
  const statBy = Object.fromEntries(stats.map((s) => [s.course_id, s]));
  return courses.map((c) => ({
    ...mapCourseRow(c),
    whatYouLearn: (lp[c.id] || []).map((x) => x.text),
    requirements: (rq[c.id] || []).map((x) => x.text),
    faqs: (fq[c.id] || []).map((x) => ({ q: x.question, a: x.answer })),
    enrollmentCount: Number(statBy[c.id]?.enrollments) || 0,
    paidOrderCount: Number(statBy[c.id]?.paid_orders) || 0,
    purchaseCount: Number(statBy[c.id]?.purchasers) || 0,
    reviewCount: Number(statBy[c.id]?.reviews) || 0,
    pendingReviewCount: Number(statBy[c.id]?.reviews_pending) || 0,
    rating: statBy[c.id]?.rating_avg != null ? Math.round(Number(statBy[c.id].rating_avg) * 10) / 10 : null,
    waitlistCount: Number(statBy[c.id]?.waitlist) || 0,
    modules: (modByCourse[c.id] || []).map((m) => ({
      id: m.id, title: m.title,
      lessons: (lesByMod[m.id] || []).map((l) => ({
        id: l.id, title: l.title, summary: l.summary || '', type: l.type, free: !!l.is_free,
        duration: l.duration || undefined,
        durationSeconds: l.video_duration || l.duration_seconds || null,
        videoStatus: l.type === 'video' ? (l.video_status || 'missing') : null,
        videoError: l.video_error || null,
        resourceCount: Number(l.resource_count) || 0
      }))
    }))
  }));
}

export function slugify(title) {
  return String(title || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
async function uniqueSlug(base) {
  const root = base || `course-${Date.now().toString(36)}`;
  let slug = root;
  for (let i = 2; i < 50; i++) {
    const [hit] = await q('SELECT id FROM courses WHERE slug = ? LIMIT 1', [slug]);
    if (!hit) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function addCourse(body, session) {
  const title = text(body.title, 191) || 'নতুন কোর্স';
  const slug = await uniqueSlug(slugify(body.slug || title));
  const res = await q(
    "INSERT INTO courses (title, slug, published, review_status, price, old_price, rating, rating_count, language, mode) VALUES (?,?,0,'draft',0,NULL,0,0,?,?)",
    [title, slug, 'বাংলা', 'recorded']
  );
  if (session) await recordAudit({ session, action: 'course_created', targetType: 'course', targetId: res.insertId });
  return getCourses();
}

// Same presigned-direct-to-bucket pattern as lesson video (lib/videoRepo.js).
export async function requestThumbnailUploadUrl(courseId, { fileName, contentType, size }) {
  const exists = await q('SELECT id FROM courses WHERE id = ?', [courseId]);
  if (!exists.length) throw new HttpError(404, { error: 'Course not found' });
  if (!storageConfigured()) throw new HttpError(503, { error: 'storage_not_configured' });
  const type = String(contentType || '').toLowerCase();
  if (!ALLOWED_TYPES.image.includes(type)) throw new HttpError(415, { error: 'unsupported_image_type' });
  if (Number(size) > MAX_UPLOAD_BYTES.image) throw new HttpError(413, { error: 'file_too_large' });
  const key = imageKey({ courseId, fileName });
  const { url, expiresIn, method } = await getPresignedUploadUrl({ key, contentType: type, maxBytes: MAX_UPLOAD_BYTES.image });
  return { uploadUrl: url, method, expiresIn, key };
}

export async function confirmThumbnail(courseId, key) {
  if (typeof key !== 'string' || !key.startsWith(`thumbnails/${Number(courseId)}/`)) throw new HttpError(409, { error: 'upload_mismatch' });
  const stat = await statObject({ key });
  if (!stat.exists) throw new HttpError(409, { error: 'upload_not_found' });
  const [old] = await q('SELECT thumbnail_key FROM courses WHERE id = ?', [courseId]);
  const r = await q('UPDATE courses SET thumbnail_key = ? WHERE id = ?', [key, courseId]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'Course not found' });
  if (old?.thumbnail_key && old.thumbnail_key !== key) await deleteObject({ key: old.thumbnail_key }).catch(() => {});
  return getCourses();
}

// Does a lesson carry learner records that a delete would destroy?
async function lessonLearnerData(lessonIds) {
  if (!lessonIds.length) return 0;
  const ph = lessonIds.map(() => '?').join(',');
  const [[a], [b], [c]] = await Promise.all([
    q(`SELECT COUNT(*) AS n FROM lesson_progress WHERE lesson_id IN (${ph}) AND (completed = 1 OR covered_seconds > 0)`, lessonIds),
    q(`SELECT COUNT(*) AS n FROM submissions WHERE lesson_id IN (${ph})`, lessonIds),
    q(`SELECT COUNT(*) AS n FROM quiz_attempts WHERE lesson_id IN (${ph})`, lessonIds)
  ]);
  return Number(a.n) + Number(b.n) + Number(c.n);
}

async function resequence(table, parentCol, parentId, orderedIds) {
  let pos = 0;
  for (const id of orderedIds) await q(`UPDATE ${table} SET position = ? WHERE id = ? AND ${parentCol} = ?`, [pos++, id, parentId]);
}

async function setList(table, courseId, items) {
  await withTransaction(async (tx) => {
    await tx(`DELETE FROM ${table} WHERE course_id = ?`, [courseId]);
    for (const t of items) await tx(`INSERT INTO ${table} (course_id, text) VALUES (?,?)`, [courseId, t]);
  });
}

export async function courseOp(body, session) {
  const courseId = Number(body.courseId);
  const [course] = await q('SELECT * FROM courses WHERE id = ?', [courseId]);
  if (!course) throw new HttpError(404, { error: 'Course not found' });
  const moduleId = Number(body.moduleId) || null;
  const lessonId = Number(body.lessonId) || null;
  const ownModule = async () => {
    const [m] = await q('SELECT id FROM modules WHERE id = ? AND course_id = ?', [moduleId, courseId]);
    if (!m) throw new HttpError(404, { error: 'Module not found' });
  };
  const ownLesson = async () => {
    const [l] = await q('SELECT l.id, l.type, l.module_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = ? AND m.course_id = ?', [lessonId, courseId]);
    if (!l) throw new HttpError(404, { error: 'Lesson not found' });
    return l;
  };

  switch (body.op) {
    case 'publish': {
      const turningOn = !course.published;
      // Only validate when going live — unpublishing is always allowed and
      // never removes access for students who already own the course.
      if (turningOn) await assertCourseComplete(courseId);
      // first_published_at is set once and never reset (drives the "New" badge).
      await q(`UPDATE courses SET published = ?, review_status = ?,
                 first_published_at = IF(? = 1 AND first_published_at IS NULL, NOW(), first_published_at),
                 is_upcoming = IF(? = 1, 0, is_upcoming) WHERE id = ?`,
        [turningOn ? 1 : 0, turningOn ? 'published' : 'draft', turningOn ? 1 : 0, turningOn ? 1 : 0, courseId]);
      if (session) await recordAudit({ session, action: turningOn ? 'course_published' : 'course_unpublished', targetType: 'course', targetId: courseId });
      break;
    }
    case 'toggleFeatured': {
      // Featured courses keep an explicit order; new ones go to the end.
      const [{ p }] = await q('SELECT COALESCE(MAX(featured_order),0)+1 AS p FROM courses WHERE featured = 1');
      await q('UPDATE courses SET featured = NOT featured, featured_order = IF(featured = 1, ?, NULL) WHERE id = ?', [p, courseId]);
      break;
    }
    case 'moveFeatured': {
      if (!course.featured) throw new HttpError(400, { error: 'not_featured' });
      const ids = (await q('SELECT id FROM courses WHERE featured = 1 ORDER BY COALESCE(featured_order, 999999), id')).map((r) => r.id);
      const i = ids.indexOf(courseId), j = body.dir === 'up' ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && j < ids.length) {
        [ids[i], ids[j]] = [ids[j], ids[i]];
        let pos = 1;
        for (const id of ids) await q('UPDATE courses SET featured_order = ? WHERE id = ?', [pos++, id]);
      }
      break;
    }
    case 'setUpcoming': {
      // Public announcement of a course that isn't released yet. Never
      // exposes lessons or media; buying stays disabled until published.
      if (course.published && body.isUpcoming) throw new HttpError(409, { error: 'already_published' });
      const date = body.releaseDate ? String(body.releaseDate).slice(0, 10) : null;
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, { error: 'invalid_date' });
      if (body.isUpcoming && (!text(course.title, 191) || !text(course.tagline || course.description, 20000))) throw new HttpError(400, { error: 'announcement_needs_summary' });
      await q('UPDATE courses SET is_upcoming = ?, release_date = ? WHERE id = ?', [body.isUpcoming ? 1 : 0, date, courseId]);
      if (session) await recordAudit({ session, action: body.isUpcoming ? 'course_announced' : 'course_unannounced', targetType: 'course', targetId: courseId });
      break;
    }
    case 'addModule': {
      const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM modules WHERE course_id = ?', [courseId]);
      await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,?)', [courseId, text(body.title, 191) || 'নতুন সেকশন', p]);
      break;
    }
    case 'renameModule':
      await ownModule();
      if (text(body.title, 191)) await q('UPDATE modules SET title = ? WHERE id = ?', [text(body.title, 191), moduleId]);
      break;
    case 'deleteModule': {
      await ownModule();
      const ids = (await q('SELECT id FROM lessons WHERE module_id = ?', [moduleId])).map((r) => r.id);
      if (await lessonLearnerData(ids)) throw new HttpError(409, { error: 'has_learner_data' });
      if (course.published && ids.length) throw new HttpError(409, { error: 'unpublish_first' });
      await q('DELETE FROM modules WHERE id = ? AND course_id = ?', [moduleId, courseId]);
      break;
    }
    case 'moveModule': {
      await ownModule();
      const mods = (await q('SELECT id FROM modules WHERE course_id = ? ORDER BY position, id', [courseId])).map((r) => r.id);
      const i = mods.indexOf(moduleId), j = body.dir === 'up' ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && j < mods.length) { [mods[i], mods[j]] = [mods[j], mods[i]]; await resequence('modules', 'course_id', courseId, mods); }
      break;
    }
    case 'reorderModules': {
      const current = (await q('SELECT id FROM modules WHERE course_id = ? ORDER BY position, id', [courseId])).map((r) => r.id);
      const wanted = (Array.isArray(body.order) ? body.order.map(Number) : []).filter((id) => current.includes(id));
      await resequence('modules', 'course_id', courseId, [...wanted, ...current.filter((id) => !wanted.includes(id))]);
      break;
    }
    case 'addLesson': {
      await ownModule();
      const type = LESSON_TYPES.includes(body.type) ? body.type : 'video';
      const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lessons WHERE module_id = ?', [moduleId]);
      await q('INSERT INTO lessons (module_id, title, summary, type, duration, is_free, position) VALUES (?,?,?,?,?,0,?)',
        [moduleId, text(body.title, 191) || 'নতুন লেসন', text(body.summary, 2000) || null, type, null, p]);
      break;
    }
    case 'updateLesson': {
      const l = await ownLesson();
      const fields = [], vals = [];
      if (body.title != null && text(body.title, 191)) { fields.push('title = ?'); vals.push(text(body.title, 191)); }
      if (body.summary != null) { fields.push('summary = ?'); vals.push(text(body.summary, 2000) || null); }
      if (body.free != null) { fields.push('is_free = ?'); vals.push(body.free ? 1 : 0); }
      if (body.type != null && body.type !== l.type) {
        if (!LESSON_TYPES.includes(body.type)) throw new HttpError(400, { error: 'invalid_type' });
        if (await lessonLearnerData([l.id])) throw new HttpError(409, { error: 'has_learner_data' });
        fields.push('type = ?'); vals.push(body.type);
      }
      if (body.durationSeconds != null && l.type !== 'video') {
        const d = Math.round(Number(body.durationSeconds));
        fields.push('duration_seconds = ?'); vals.push(Number.isFinite(d) && d > 0 && d < 86400 ? d : null);
      }
      if (fields.length) { vals.push(l.id); await q(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`, vals); }
      break;
    }
    case 'renameLesson':
      await ownLesson();
      if (text(body.title, 191)) await q('UPDATE lessons SET title = ? WHERE id = ?', [text(body.title, 191), lessonId]);
      break;
    case 'deleteLesson': {
      await ownLesson();
      if (await lessonLearnerData([lessonId])) throw new HttpError(409, { error: 'has_learner_data' });
      if (course.published) {
        const [{ n }] = await q('SELECT COUNT(*) AS n FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?', [courseId]);
        if (Number(n) <= 1) throw new HttpError(409, { error: 'unpublish_first' });
      }
      await q('DELETE FROM lessons WHERE id = ?', [lessonId]);
      break;
    }
    case 'toggleFree':
      // free lesson = public preview; anything else stays locked until enrolled
      await ownLesson();
      await q('UPDATE lessons SET is_free = NOT is_free WHERE id = ?', [lessonId]);
      break;
    case 'moveLesson': {
      const l = await ownLesson();
      const ids = (await q('SELECT id FROM lessons WHERE module_id = ? ORDER BY position, id', [l.module_id])).map((r) => r.id);
      const i = ids.indexOf(lessonId), j = body.dir === 'up' ? i - 1 : i + 1;
      if (i >= 0 && j >= 0 && j < ids.length) { [ids[i], ids[j]] = [ids[j], ids[i]]; await resequence('lessons', 'module_id', l.module_id, ids); }
      break;
    }
    case 'moveLessonToModule': {
      const l = await ownLesson();
      const [target] = await q('SELECT id FROM modules WHERE id = ? AND course_id = ?', [Number(body.targetModuleId), courseId]);
      if (!target) throw new HttpError(404, { error: 'Module not found' });
      const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lessons WHERE module_id = ?', [target.id]);
      await q('UPDATE lessons SET module_id = ?, position = ? WHERE id = ?', [target.id, p, l.id]);
      break;
    }
    case 'reorderLessons': {
      // drag-drop / keyboard reorder: persist an explicit order for one module
      await ownModule();
      const current = (await q('SELECT id FROM lessons WHERE module_id = ? ORDER BY position, id', [moduleId])).map((r) => r.id);
      const wanted = (Array.isArray(body.order) ? body.order.map(Number) : []).filter((id) => current.includes(id));
      await resequence('lessons', 'module_id', moduleId, [...wanted, ...current.filter((id) => !wanted.includes(id))]);
      break;
    }
    case 'updateCourse': {
      const fields = [], vals = [];
      const set = (col, v) => { fields.push(`${col} = ?`); vals.push(v); };
      if (body.title != null && text(body.title, 191)) set('title', text(body.title, 191));
      if (body.price != null) {
        const p = Number(body.price);
        if (!Number.isInteger(p) || p < 0 || p > MAX_PRICE) throw new HttpError(400, { error: 'invalid_price' });
        set('price', p);
      }
      if (body.oldPrice !== undefined) {
        const op = body.oldPrice === '' || body.oldPrice == null ? null : Number(body.oldPrice);
        if (op != null && (!Number.isInteger(op) || op < 0 || op > MAX_PRICE)) throw new HttpError(400, { error: 'invalid_price' });
        set('old_price', op);
      }
      if (body.category != null) set('category', text(body.category, 64) || null);
      if (body.tagline != null) set('tagline', text(body.tagline, 255) || null);
      if (body.level != null) set('level', text(body.level, 128) || null);
      if (body.language != null) set('language', text(body.language, 64) || null);
      if (body.duration != null) set('duration', text(body.duration, 128) || null);
      if (body.thumb != null) set('thumb', text(body.thumb, 64) || null);
      if (body.instructor != null) set('instructor', text(body.instructor, 191) || null);
      if (body.classId !== undefined) {
        const cid = body.classId === '' || body.classId == null ? null : Number(body.classId);
        if (cid != null && !(await q('SELECT id FROM class_levels WHERE id = ?', [cid]))[0]) throw new HttpError(400, { error: 'invalid_class' });
        set('class_id', cid);
      }
      if (body.instructorId !== undefined) {
        const tid = body.instructorId === '' || body.instructorId == null ? null : Number(body.instructorId);
        if (tid != null) {
          const [t] = await q('SELECT id, name FROM teachers WHERE id = ?', [tid]);
          if (!t) throw new HttpError(400, { error: 'invalid_instructor' });
          if (body.instructor == null) set('instructor', t.name);
        }
        set('instructor_id', tid);
      }
      if (body.description != null) {
        // A live course can't lose the description it was published with.
        if (course.published && !text(body.description, 20000)) throw new HttpError(400, { error: 'description_required' });
        set('description', text(body.description, 20000) || null);
      }
      if (body.audience != null) set('audience', lines(body.audience).join('\n') || null);
      if (body.mode != null && MODES.includes(body.mode)) set('mode', body.mode);
      if (body.completionThreshold != null && !Number.isNaN(Number(body.completionThreshold))) set('completion_threshold', Math.max(1, Math.min(100, Math.round(Number(body.completionThreshold)))));
      if (body.slug != null) {
        if (course.published) throw new HttpError(409, { error: 'slug_locked_when_published' });
        const s = slugify(body.slug);
        if (!s) throw new HttpError(400, { error: 'invalid_slug' });
        if (s !== course.slug) set('slug', await uniqueSlug(s));
      }
      if (fields.length) { vals.push(courseId); await q(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, vals); }
      if (body.whatYouLearn != null) await setList('course_learning_points', courseId, lines(body.whatYouLearn));
      if (body.requirements != null) await setList('course_requirements', courseId, lines(body.requirements));
      if (Array.isArray(body.faqs)) {
        const faqs = body.faqs.map((f) => ({ q: text(f?.q, 255), a: text(f?.a, 4000) })).filter((f) => f.q && f.a).slice(0, 30);
        await withTransaction(async (tx) => {
          await tx('DELETE FROM course_faqs WHERE course_id = ?', [courseId]);
          for (const f of faqs) await tx('INSERT INTO course_faqs (course_id, question, answer) VALUES (?,?,?)', [courseId, f.q, f.a]);
        });
      }
      break;
    }
    case 'deleteCourse': {
      const [[enr], [orders]] = await Promise.all([
        q('SELECT COUNT(*) AS n FROM enrollments WHERE course_id = ?', [courseId]),
        q('SELECT COUNT(*) AS n FROM order_items WHERE course_id = ?', [courseId])
      ]);
      if (Number(enr.n) || Number(orders.n)) throw new HttpError(409, { error: 'course_has_students' });
      if (course.published) throw new HttpError(409, { error: 'unpublish_first' });
      await q('DELETE FROM courses WHERE id = ?', [courseId]);
      if (session) await recordAudit({ session, action: 'course_deleted', targetType: 'course', targetId: courseId, detail: course.title });
      break;
    }
    default:
      throw new HttpError(400, { error: 'Unknown op' });
  }
  return getCourses();
}
async function courseById(id) {
  const list = await getCourses();
  return list.find((c) => c.id === id);
}

// Publication bar — shared by direct publish and the review workflow
// (lib/courseReviewRepo.js). Lists every reason a course can't go live.
export async function assertCourseComplete(courseId) {
  const course = await courseById(Number(courseId));
  if (!course) throw new HttpError(404, { error: 'Course not found' });
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const missing = [];
  if (!course.title || !String(course.title).trim()) missing.push('title');
  if (allLessons.length === 0) missing.push('lessons');
  if (!course.description || !String(course.description).trim()) missing.push('description');
  if (course.price == null || Number(course.price) < 0) missing.push('price');
  if (!course.level) missing.push('level');
  if (!course.language) missing.push('language');
  if (course.modules.some((m) => m.lessons.length === 0)) missing.push('empty_sections');
  const videosNotReady = allLessons.filter((l) => l.type === 'video' && l.videoStatus !== 'ready').map((l) => l.id);
  if (videosNotReady.length) missing.push('videos_not_ready');
  if (missing.length) throw new HttpError(400, { error: 'incomplete_course', missing, lessonIds: videosNotReady });
  return course;
}

// ============================ ENROLLMENTS ===================================
export async function getEnrollments(sp) {
  const sid = sp?.get?.('studentId');
  const rows = await q(
    `SELECT id, student_id AS studentId, batch_id AS batchId, course_id AS courseId, enrolled_at AS enrolledAt, status FROM enrollments${sid ? ' WHERE student_id = ?' : ''} ORDER BY id`,
    sid ? [Number(sid)] : []
  );
  return rows;
}
export async function enroll(body) {
  const studentId = Number(body.studentId), batchId = Number(body.batchId);
  const b = await q('SELECT course_id FROM batches WHERE id = ?', [batchId]);
  if (!b.length) throw new HttpError(404, { error: 'Batch not found' });
  // A student may already hold a course-level (batch-less) marketplace
  // enrollment for this same course — check both, not just the batch match.
  const dup = await q(
    'SELECT id FROM enrollments WHERE student_id = ? AND (batch_id = ? OR course_id = ?)',
    [studentId, batchId, b[0].course_id]
  );
  if (dup.length) throw new HttpError(409, { error: 'Already enrolled' });
  await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,?,?,CURDATE(),?)',
    [studentId, batchId, b[0].course_id, 'active']);
  return getEnrollments();
}

// Marketplace enrollment: created only as a side effect of a paid order (see
// lib/orderRepo.js), never directly client-callable. No batch — a self-paced
// recorded-course purchase isn't a live cohort. Runs inside the caller's
// transaction and is idempotent: a retried webhook/callback that tries to
// enroll twice is a silent no-op, never a duplicate row or a thrown error.
// A prior *cancelled* enrollment (refunded, then legitimately re-purchased)
// is reactivated rather than silently ignored — otherwise a refund would
// permanently block ever buying the course again.
export async function enrollCourseFromOrder(tx, { studentId, courseId, orderId = null }) {
  try {
    await tx(
      'INSERT INTO enrollments (student_id, batch_id, course_id, order_id, enrolled_at, status) VALUES (?,NULL,?,?,CURDATE(),?)',
      [studentId, courseId, orderId, 'active']
    );
  } catch (e) {
    if (e.code !== 'ER_DUP_ENTRY') throw e;
    // Reactivate a refunded (cancelled) enrollment for a genuine re-purchase;
    // an already-active one is left untouched (keeps its original order_id).
    await tx(
      "UPDATE enrollments SET status = 'active', enrolled_at = CURDATE(), order_id = ? WHERE student_id = ? AND course_id = ? AND status = 'cancelled'",
      [orderId, studentId, courseId]
    );
  }
}
export async function unenroll(body) {
  const r = await q('DELETE FROM enrollments WHERE id = ?', [body.id]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'Enrollment not found' });
  return getEnrollments();
}

// ============================ SUBMISSIONS ===================================
export async function getSubmissions(sp) {
  const sid = sp?.get?.('studentId'); const status = sp?.get?.('status');
  const where = []; const params = [];
  if (sid) { where.push('student_id = ?'); params.push(Number(sid)); }
  if (status) { where.push('status = ?'); params.push(status); }
  const rows = await q(
    `SELECT id, lesson_id AS lessonId, course_id AS courseId, student_id AS studentId, student_name AS studentName,
            content, submitted_at AS submittedAt, status, marks, max_marks AS maxMarks, feedback
     FROM submissions ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`, params);
  return rows;
}
export async function submitAssignment(body) {
  const lessonId = Number(body.lessonId), studentId = Number(body.studentId);
  if (!lessonId || !studentId) throw new HttpError(400, { error: 'lessonId and studentId are required' });
  const dup = await q('SELECT id FROM submissions WHERE lesson_id=? AND student_id=?', [lessonId, studentId]);
  if (dup.length) throw new HttpError(409, { error: 'Already submitted' });
  await q(`INSERT INTO submissions (lesson_id, course_id, student_id, student_name, content, submitted_at, status, marks, max_marks, feedback)
           VALUES (?,?,?,?,?,CURDATE(),'submitted',NULL,?,NULL)`,
    [lessonId, body.courseId != null ? Number(body.courseId) : null, studentId, body.studentName || 'শিক্ষার্থী', body.content ? String(body.content) : '', Number(body.maxMarks) || 20]);
  return getSubmissions();
}
export async function gradeSubmission(body) {
  const found = await q('SELECT id FROM submissions WHERE id = ?', [body.id]);
  if (!found.length) throw new HttpError(404, { error: 'Submission not found' });
  await q("UPDATE submissions SET status='graded', marks=?, feedback=? WHERE id=?",
    [body.marks != null ? Number(body.marks) : null, body.feedback ? String(body.feedback) : '', body.id]);
  return getSubmissions();
}

// ============================ ATTENDANCE ====================================
export async function getAttendance(sp) {
  const sid = sp?.get?.('studentId'); const bid = sp?.get?.('batchId'); const date = sp?.get?.('date');
  const where = []; const params = [];
  if (sid) { where.push('student_id = ?'); params.push(Number(sid)); }
  if (bid) { where.push('batch_id = ?'); params.push(Number(bid)); }
  if (date) { where.push('class_date = ?'); params.push(date); }
  const rows = await q(
    `SELECT id, student_id AS studentId, batch_id AS batchId, class_date AS date, title, present
     FROM attendance ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`, params);
  return rows.map((r) => ({ ...r, present: !!r.present }));
}
export async function saveAttendance(body) {
  const batchId = Number(body.batchId); const date = body.date;
  if (!batchId || !date || !Array.isArray(body.records)) throw new HttpError(400, { error: 'batchId, date and records are required' });
  await q('DELETE FROM attendance WHERE batch_id=? AND class_date=?', [batchId, date]);
  const title = body.title ? String(body.title) : `ক্লাস · ${date}`;
  for (const r of body.records) {
    await q('INSERT INTO attendance (student_id, batch_id, class_date, title, present) VALUES (?,?,?,?,?)',
      [Number(r.studentId), batchId, date, title, r.present ? 1 : 0]);
  }
  return getAttendance();
}

// ============================ CERTIFICATES ==================================
// Teacher/owner: create an assignment (an assignment-type lesson in a module).
export async function createAssignment(body) {
  const moduleId = Number(body.moduleId);
  const mod = await q('SELECT id FROM modules WHERE id = ? LIMIT 1', [moduleId]);
  if (!mod.length) throw new HttpError(404, { error: 'module_not_found' });
  const title = body.title && String(body.title).trim() ? String(body.title).trim() : 'নতুন অ্যাসাইনমেন্ট';
  const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lessons WHERE module_id = ?', [moduleId]);
  await q('INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,?,?,0,?)',
    [moduleId, title, 'assignment', null, p]);
  return getCourses();
}

// Public certificate lookup by its printed number (for /verify/{certNo}).
export async function getCertificateByNo(certNo) {
  const rows = await q(
    `SELECT student_name AS studentName, course_title AS courseTitle, issued_at AS issuedAt, completion, cert_no AS certNo
     FROM certificates WHERE cert_no = ? LIMIT 1`, [String(certNo || '').trim()]);
  return rows[0] || null;
}

export async function getCertificates(sp) {
  const sid = sp?.get?.('studentId'); const cid = sp?.get?.('courseId');
  const where = []; const params = [];
  if (sid) { where.push('student_id = ?'); params.push(Number(sid)); }
  if (cid) { where.push('course_id = ?'); params.push(Number(cid)); }
  return q(
    `SELECT id, student_id AS studentId, student_name AS studentName, course_id AS courseId, course_title AS courseTitle,
            issued_at AS issuedAt, completion, cert_no AS certNo
     FROM certificates ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`, params);
}
export async function issueCertificate(body) {
  const studentId = Number(body.studentId);
  const course = await courseById(Number(body.courseId));
  if (!course) throw new HttpError(404, { error: 'Course not found' });
  const dup = await q('SELECT id FROM certificates WHERE student_id=? AND course_id=?', [studentId, course.id]);
  if (dup.length) throw new HttpError(409, { error: 'Certificate already issued' });
  const [enr] = await q("SELECT batch_id FROM enrollments WHERE student_id = ? AND course_id = ? AND status = 'active' LIMIT 1", [studentId, course.id]);
  if (!enr) throw new HttpError(403, { error: 'not_enrolled' });
  // Lesson completion (unique completed lessons / lessons) is the rule for
  // self-paced courses; a live cohort (batch enrollment) can also qualify
  // through its attendance + assignment record — whichever is higher.
  const [lc] = await q(
    `SELECT COUNT(*) AS total, SUM(COALESCE(lp.completed,0)) AS done FROM lessons l JOIN modules m ON m.id = l.module_id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = ? WHERE m.course_id = ?`, [studentId, course.id]);
  const parts = [];
  if (Number(lc.total)) parts.push(Math.round((Number(lc.done) / Number(lc.total)) * 100));
  if (enr.batch_id != null) {
    const [submissions, attendance] = await Promise.all([getSubmissions(new URLSearchParams({ studentId: String(studentId) })), getAttendance(new URLSearchParams({ studentId: String(studentId) }))]);
    parts.push(courseCompletion(studentId, course, { enrollments: [{ studentId, courseId: course.id, batchId: enr.batch_id }], submissions, attendance }).completion);
  }
  const completion = parts.length ? Math.max(...parts) : 0;
  const threshold = course.completionThreshold ?? CERT_THRESHOLD;
  if (completion < threshold) throw new HttpError(400, { error: 'Completion below threshold', completion, threshold });
  const res = await q(
    'INSERT INTO certificates (student_id, student_name, course_id, course_title, issued_at, completion, cert_no) VALUES (?,?,?,?,CURDATE(),?,?)',
    [studentId, body.studentName || 'শিক্ষার্থী', course.id, course.title, completion, `TMP-${rand(8)}`]);
  await q('UPDATE certificates SET cert_no=? WHERE id=?', [`LEO-2026-${String(res.insertId).padStart(4, '0')}`, res.insertId]);
  return getCertificates();
}

// ============================ JOBS ==========================================
export async function getJobs(sp) {
  const open = sp?.get?.('open');
  const rows = await q(`SELECT id, title, company, location, type, salary, posted_at AS postedAt, is_open FROM jobs${open === 'true' ? ' WHERE is_open=1' : ''} ORDER BY id`);
  const skills = await q('SELECT job_id, skill FROM job_skills ORDER BY id');
  const byJob = {}; skills.forEach((s) => { (byJob[s.job_id] = byJob[s.job_id] || []).push(s.skill); });
  return rows.map((r) => ({ id: r.id, title: r.title, company: r.company, location: r.location, type: r.type, salary: r.salary, skills: byJob[r.id] || [], postedAt: r.postedAt, open: !!r.is_open }));
}
export async function postJob(body) {
  if (!body.title || !String(body.title).trim()) throw new HttpError(400, { error: 'Title is required' });
  const skills = Array.isArray(body.skills) ? body.skills : String(body.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const res = await q('INSERT INTO jobs (title, company, location, type, salary, posted_at, is_open) VALUES (?,?,?,?,?,CURDATE(),1)', [
    String(body.title).trim(), body.company ? String(body.company).trim() : '—', body.location ? String(body.location).trim() : '—',
    ['full-time', 'part-time', 'internship'].includes(body.type) ? body.type : 'full-time', body.salary ? String(body.salary).trim() : '—'
  ]);
  for (const sk of skills) await q('INSERT INTO job_skills (job_id, skill) VALUES (?,?)', [res.insertId, sk]);
  return getJobs();
}
export async function toggleJob(body) {
  const r = await q('UPDATE jobs SET is_open = NOT is_open WHERE id = ?', [body.id]);
  if (!r.affectedRows) throw new HttpError(404, { error: 'Job not found' });
  return getJobs();
}

// ============================ APPLICATIONS ==================================
const APP_STATUSES = ['applied', 'shortlisted', 'interview', 'hired', 'rejected'];
export async function getApplications(sp) {
  const sid = sp?.get?.('studentId'); const jid = sp?.get?.('jobId'); const status = sp?.get?.('status');
  const where = []; const params = [];
  if (sid) { where.push('student_id = ?'); params.push(Number(sid)); }
  if (jid) { where.push('job_id = ?'); params.push(Number(jid)); }
  if (status) { where.push('status = ?'); params.push(status); }
  return q(`SELECT id, job_id AS jobId, student_id AS studentId, student_name AS studentName, status, applied_at AS appliedAt
            FROM applications ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`, params);
}
export async function applyJob(body) {
  const jobId = Number(body.jobId), studentId = Number(body.studentId);
  const job = await q('SELECT is_open FROM jobs WHERE id = ?', [jobId]);
  if (!job.length) throw new HttpError(404, { error: 'Job not found' });
  if (!job[0].is_open) throw new HttpError(400, { error: 'Job is closed' });
  const dup = await q('SELECT id FROM applications WHERE job_id=? AND student_id=?', [jobId, studentId]);
  if (dup.length) throw new HttpError(409, { error: 'Already applied' });
  await q("INSERT INTO applications (job_id, student_id, student_name, status, applied_at) VALUES (?,?,?,'applied',CURDATE())",
    [jobId, studentId, body.studentName || 'শিক্ষার্থী']);
  return getApplications();
}
export async function setApplicationStatus(body) {
  const found = await q('SELECT id FROM applications WHERE id = ?', [body.id]);
  if (!found.length) throw new HttpError(404, { error: 'Application not found' });
  if (!APP_STATUSES.includes(body.status)) throw new HttpError(400, { error: 'Invalid status' });
  await q('UPDATE applications SET status=? WHERE id=?', [body.status, body.id]);
  return getApplications();
}

// ============================ LIVE CLASSES ==================================
export async function getLiveClasses(sp) {
  const bid = sp?.get?.('batchId'); const status = sp?.get?.('status');
  const where = []; const params = [];
  if (bid) { where.push('batch_id = ?'); params.push(Number(bid)); }
  if (status) { where.push('status = ?'); params.push(status); }
  return q(`SELECT id, course_id AS courseId, batch_id AS batchId, instructor_id AS instructorId, title,
                   class_date AS classDate, start_time AS startTime, end_time AS endTime, zoom_url AS zoomUrl, status, recording_url AS recordingUrl
            FROM live_classes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`, params);
}
export async function scheduleClass(body) {
  if (!body.title || !String(body.title).trim()) throw new HttpError(400, { error: 'Title is required' });
  await q(`INSERT INTO live_classes (course_id, batch_id, instructor_id, title, class_date, start_time, end_time, zoom_url, status, recording_url)
           VALUES (?,?,?,?,?,?,?,?, 'scheduled', NULL)`, [
    body.courseId != null ? Number(body.courseId) : null, body.batchId != null ? Number(body.batchId) : null,
    body.instructorId != null ? Number(body.instructorId) : null, String(body.title).trim(),
    body.classDate || null, body.startTime || '', body.endTime || '', body.zoomUrl ? String(body.zoomUrl).trim() : ''
  ]);
  return getLiveClasses();
}
export async function updateLiveClass(body) {
  const found = await q('SELECT id FROM live_classes WHERE id = ?', [body.id]);
  if (!found.length) throw new HttpError(404, { error: 'Class not found' });
  if (body.action === 'start') await q("UPDATE live_classes SET status='live' WHERE id=?", [body.id]);
  else if (body.action === 'end') await q("UPDATE live_classes SET status='ended' WHERE id=?", [body.id]);
  else if (body.recordingUrl != null) await q('UPDATE live_classes SET recording_url=? WHERE id=?', [String(body.recordingUrl), body.id]);
  return getLiveClasses();
}
export async function joinLiveClass(id, studentId) {
  if (!studentId) throw new HttpError(401, { error: 'not_authenticated' });
  const cls = await q('SELECT batch_id, zoom_url, status, recording_url FROM live_classes WHERE id = ?', [id]);
  if (!cls.length) throw new HttpError(404, { error: 'not_found' });
  const c = cls[0];
  const enr = await q('SELECT id FROM enrollments WHERE student_id=? AND batch_id=?', [studentId, c.batch_id]);
  if (!enr.length) throw new HttpError(403, { error: 'not_enrolled' });
  if (c.status !== 'live') throw new HttpError(409, { error: c.status === 'ended' ? 'ended' : 'not_started', recordingUrl: c.recording_url || null });
  return { url: c.zoom_url };
}

// ============================ PAYMENTS ======================================
export async function getPayments(sp) {
  const sid = sp?.get?.('studentId'); const status = sp?.get?.('status');
  const where = []; const params = [];
  if (sid) { where.push('student_id = ?'); params.push(Number(sid)); }
  if (status) { where.push('status = ?'); params.push(status); }
  return q(`SELECT id, student_id AS studentId, student_name AS studentName, course_id AS courseId, batch_id AS batchId,
                   amount, method, type, status, trx_id AS trxId, invoice_no AS invoiceNo, created_at AS createdAt
            FROM payments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC`, params);
}
export async function recordPayment(body) {
  const amount = Number(body.amount) || 0;
  if (amount <= 0) throw new HttpError(400, { error: 'amount must be > 0' });
  const method = ['bkash', 'nagad', 'card'].includes(body.method) ? body.method : 'bkash';
  const type = body.type === 'fee' ? 'fee' : 'enrollment';
  const trx = `TRX${rand(8)}`;
  const res = await q(
    `INSERT INTO payments (student_id, student_name, course_id, batch_id, amount, method, type, status, trx_id, invoice_no, created_at)
     VALUES (?,?,?,?,?,?,?,'success',?,?,CURDATE())`,
    [body.studentId != null ? Number(body.studentId) : null, body.studentName || 'শিক্ষার্থী',
     body.courseId != null ? Number(body.courseId) : null, body.batchId != null ? Number(body.batchId) : null,
     amount, method, type, trx, `TMP-${trx}`]);
  await q('UPDATE payments SET invoice_no=? WHERE id=?', [`INV-2026-${String(res.insertId).padStart(4, '0')}`, res.insertId]);
  return getPayments();
}
export async function refundPayment(session, body) {
  const found = await q('SELECT id FROM payments WHERE id = ?', [body.id]);
  if (!found.length) throw new HttpError(404, { error: 'Payment not found' });
  if (body.action === 'refund') {
    await q("UPDATE payments SET status='refunded' WHERE id=?", [body.id]);
    await recordAudit({ session, action: 'payment_refunded', targetType: 'payment', targetId: body.id });
  }
  return getPayments();
}
