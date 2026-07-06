import { NextResponse } from 'next/server';
import { q } from '@/lib/mysql';
import { courseCompletion, CERT_THRESHOLD } from '@/lib/progress';

// ---- error plumbing ---------------------------------------------------------
export class HttpError extends Error {
  constructor(status, body) { super(body?.error || 'error'); this.status = status; this.body = body; }
}
export function errResponse(e) {
  if (e instanceof HttpError) return NextResponse.json(e.body, { status: e.status });
  console.error('[repo]', e);
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
function mapCourseRow(r) {
  return {
    id: r.id, title: r.title, slug: r.slug, published: !!r.published, category: r.category, mode: r.mode,
    thumb: r.thumb, tagline: r.tagline, level: r.level, language: r.language, instructor: r.instructor,
    instructorId: r.instructor_id, price: r.price, oldPrice: r.old_price, rating: Number(r.rating),
    ratingCount: r.rating_count, duration: r.duration, description: r.description
  };
}
export async function getCourses() {
  const courses = await q('SELECT * FROM courses ORDER BY id');
  if (!courses.length) return [];
  const [lps, reqs, faqs, reviews, modules, lessons] = await Promise.all([
    q('SELECT course_id, text FROM course_learning_points ORDER BY id'),
    q('SELECT course_id, text FROM course_requirements ORDER BY id'),
    q('SELECT course_id, question, answer FROM course_faqs ORDER BY id'),
    q('SELECT course_id, name, rating, text FROM course_reviews ORDER BY id'),
    q('SELECT id, course_id, title FROM modules ORDER BY position, id'),
    q('SELECT id, module_id, title, type, duration, is_free FROM lessons ORDER BY position, id')
  ]);
  const group = (arr, key) => { const m = {}; arr.forEach((x) => { (m[x[key]] = m[x[key]] || []).push(x); }); return m; };
  const lp = group(lps, 'course_id'), rq = group(reqs, 'course_id'), fq = group(faqs, 'course_id'), rv = group(reviews, 'course_id');
  const modByCourse = group(modules, 'course_id'), lesByMod = group(lessons, 'module_id');
  return courses.map((c) => ({
    ...mapCourseRow(c),
    whatYouLearn: (lp[c.id] || []).map((x) => x.text),
    requirements: (rq[c.id] || []).map((x) => x.text),
    faqs: (fq[c.id] || []).map((x) => ({ q: x.question, a: x.answer })),
    reviews: (rv[c.id] || []).map((x) => ({ name: x.name, rating: x.rating, text: x.text })),
    modules: (modByCourse[c.id] || []).map((m) => ({
      id: m.id, title: m.title,
      lessons: (lesByMod[m.id] || []).map((l) => ({ id: l.id, title: l.title, type: l.type, duration: l.duration || undefined, free: !!l.is_free }))
    }))
  }));
}
export async function addCourse(body) {
  const title = body.title && String(body.title).trim() ? String(body.title).trim() : 'নতুন কোর্স';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `course-${Date.now()}`;
  await q('INSERT INTO courses (title, slug, published, price, old_price, rating, rating_count, language) VALUES (?,?,0,0,0,0,0,?)',
    [title, slug, 'বাংলা']);
  return getCourses();
}
export async function courseOp(body) {
  const c = await q('SELECT id FROM courses WHERE id = ?', [body.courseId]);
  if (!c.length) throw new HttpError(404, { error: 'Course not found' });
  switch (body.op) {
    case 'publish':
      await q('UPDATE courses SET published = NOT published WHERE id = ?', [body.courseId]);
      break;
    case 'addModule': {
      const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM modules WHERE course_id = ?', [body.courseId]);
      await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,?)',
        [body.courseId, body.title && String(body.title).trim() ? String(body.title).trim() : 'নতুন মডিউল', p]);
      break;
    }
    case 'deleteModule':
      await q('DELETE FROM modules WHERE id = ? AND course_id = ?', [body.moduleId, body.courseId]);
      break;
    case 'addLesson': {
      const mod = await q('SELECT id FROM modules WHERE id = ? AND course_id = ?', [body.moduleId, body.courseId]);
      if (!mod.length) throw new HttpError(404, { error: 'Module not found' });
      const type = ['video', 'pdf', 'quiz', 'assignment'].includes(body.type) ? body.type : 'video';
      const [{ p }] = await q('SELECT COALESCE(MAX(position),0)+1 AS p FROM lessons WHERE module_id = ?', [body.moduleId]);
      await q('INSERT INTO lessons (module_id, title, type, duration, is_free, position) VALUES (?,?,?,?,0,?)',
        [body.moduleId, body.title && String(body.title).trim() ? String(body.title).trim() : 'নতুন লেসন', type, type === 'video' ? '—' : null, p]);
      break;
    }
    case 'deleteLesson':
      await q('DELETE FROM lessons WHERE id = ? AND module_id = ?', [body.lessonId, body.moduleId]);
      break;
    default:
      throw new HttpError(400, { error: 'Unknown op' });
  }
  return getCourses();
}
async function courseById(id) {
  const list = await getCourses();
  return list.find((c) => c.id === id);
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
  const dup = await q('SELECT id FROM enrollments WHERE student_id=? AND batch_id=?', [studentId, batchId]);
  if (dup.length) throw new HttpError(409, { error: 'Already enrolled' });
  await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,?,?,CURDATE(),?)',
    [studentId, batchId, b[0].course_id, 'active']);
  return getEnrollments();
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
  const [enrollments, submissions, attendance] = await Promise.all([getEnrollments(), getSubmissions(), getAttendance()]);
  const { completion } = courseCompletion(studentId, course, { enrollments, submissions, attendance });
  if (completion < CERT_THRESHOLD) throw new HttpError(400, { error: 'Completion below threshold', completion, threshold: CERT_THRESHOLD });
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
export async function refundPayment(body) {
  const found = await q('SELECT id FROM payments WHERE id = ?', [body.id]);
  if (!found.length) throw new HttpError(404, { error: 'Payment not found' });
  if (body.action === 'refund') await q("UPDATE payments SET status='refunded' WHERE id=?", [body.id]);
  return getPayments();
}
