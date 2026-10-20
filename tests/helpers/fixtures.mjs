// Test fixtures against the real database, tracked for cleanup. Every row
// is created with a unique RUN tag and removed in cleanup().
import { q } from '@/lib/mysql';
import { createUser } from '@/lib/authRepo';
import { sessionFromUser } from '@/lib/auth';

export function fixtures(tag) {
  const RUN = `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const users = [], students = [], courses = [];
  let n = 0;

  async function student(name = 'Test Student') {
    const user = await createUser({ name, email: `${RUN}-${++n}@example.test`, password: 'testpass123' });
    users.push(user.id); students.push(user.student_id);
    return { user, studentId: user.student_id, session: sessionFromUser(user) };
  }

  // lessons: [{ type='video', free=false, ready=true, duration=600 }]
  async function course({ price = 1000, published = true, lessons = [{}], title, extra = {} } = {}) {
    const idx = ++n;
    const c = await q(
      `INSERT INTO courses (title, slug, published, review_status, price, old_price, rating, rating_count, language, level, description, instructor_id)
       VALUES (?,?,?,?,?,NULL,0,0,'English','Beginner','A real description.',?)`,
      [title || `Course ${RUN} ${idx}`, `c-${RUN}-${idx}`, published ? 1 : 0, published ? 'published' : 'draft', price, extra.instructorId ?? null]
    );
    courses.push(c.insertId);
    const m = await q('INSERT INTO modules (course_id, title, position) VALUES (?,?,0)', [c.insertId, 'Section 1']);
    const lessonIds = [];
    let pos = 0;
    for (const l of lessons) {
      const type = l.type || 'video';
      const r = await q('INSERT INTO lessons (module_id, title, type, is_free, position) VALUES (?,?,?,?,?)',
        [m.insertId, l.title || `Lesson ${pos + 1}`, type, l.free ? 1 : 0, pos++]);
      lessonIds.push(r.insertId);
      if (type === 'video' && l.ready !== false) {
        await q("INSERT INTO video_assets (lesson_id, provider, storage_key, content_type, duration_seconds, status) VALUES (?,'local',?,'video/mp4',?,'ready')",
          [r.insertId, `videos/${c.insertId}/${r.insertId}/fixture.mp4`, l.duration ?? 600]);
      }
    }
    const [row] = await q('SELECT slug FROM courses WHERE id = ?', [c.insertId]);
    return { courseId: c.insertId, slug: row.slug, moduleId: m.insertId, lessonIds };
  }

  async function enroll(studentId, courseId, status = 'active') {
    await q('INSERT INTO enrollments (student_id, batch_id, course_id, enrolled_at, status) VALUES (?,NULL,?,CURDATE(),?)', [studentId, courseId, status]);
  }

  async function cleanup() {
    if (students.length) {
      const ph = students.map(() => '?').join(',');
      const orderIds = (await q(`SELECT id FROM orders WHERE student_id IN (${ph})`, students)).map((r) => r.id);
      if (orderIds.length) {
        const oph = orderIds.map(() => '?').join(',');
        await q(`DELETE FROM audit_log WHERE target_type = 'order' AND target_id IN (${oph})`, orderIds.map(String));
        await q(`DELETE FROM payment_events WHERE order_id IN (${oph})`, orderIds);
        await q(`DELETE FROM order_items WHERE order_id IN (${oph})`, orderIds);
        await q(`DELETE FROM orders WHERE id IN (${oph})`, orderIds);
      }
      await q(`DELETE FROM lesson_progress WHERE student_id IN (${ph})`, students);
      await q(`DELETE FROM enrollments WHERE student_id IN (${ph})`, students);
      await q(`DELETE FROM course_reviews WHERE student_id IN (${ph})`, students);
    }
    if (courses.length) {
      const cph = courses.map(() => '?').join(',');
      await q(`DELETE FROM audit_log WHERE target_type = 'course' AND target_id IN (${cph})`, courses.map(String));
      await q(`DELETE FROM order_items WHERE course_id IN (${cph})`, courses);
      await q(`DELETE FROM enrollments WHERE course_id IN (${cph})`, courses);
      await q(`DELETE FROM courses WHERE id IN (${cph})`, courses);
    }
    if (users.length) await q(`DELETE FROM users WHERE id IN (${users.map(() => '?').join(',')})`, users);
    if (students.length) await q(`DELETE FROM students WHERE id IN (${students.map(() => '?').join(',')})`, students);
  }

  return { RUN, student, course, enroll, cleanup, trackCourse: (id) => courses.push(id) };
}
