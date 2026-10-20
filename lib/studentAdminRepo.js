// Staff-facing student directory + per-student record (real data only).
import { q } from '@/lib/mysql';
import { HttpError } from '@/lib/repo';

export async function getStudentDirectory() {
  const rows = await q(
    `SELECT s.id, s.name, s.phone, s.created_at, u.email, u.status AS account_status,
            (SELECT COUNT(*) FROM enrollments e WHERE e.student_id = s.id AND e.status = 'active') AS active_courses,
            (SELECT COALESCE(SUM(o.amount), 0) FROM orders o WHERE o.student_id = s.id AND o.status = 'paid') AS paid_total,
            (SELECT COUNT(*) FROM orders o WHERE o.student_id = s.id AND o.status = 'paid') AS paid_orders,
            (SELECT MAX(lp.last_activity_at) FROM lesson_progress lp WHERE lp.student_id = s.id) AS last_activity
     FROM students s LEFT JOIN users u ON u.id = (SELECT MIN(x.id) FROM users x WHERE x.student_id = s.id AND x.role = 'student')
     ORDER BY s.id DESC`
  );
  return rows.map((r) => ({
    id: r.id, name: r.name, phone: r.phone && r.phone !== '—' ? r.phone : null, email: r.email || null,
    accountStatus: r.account_status || null, joinedAt: r.created_at,
    activeCourses: Number(r.active_courses) || 0, paidTotal: Number(r.paid_total) || 0, paidOrders: Number(r.paid_orders) || 0,
    lastActivity: r.last_activity || null
  }));
}

export async function getStudentRecord(id) {
  const [s] = await q(
    `SELECT s.id, s.name, s.phone, s.created_at, u.email FROM students s LEFT JOIN users u ON u.id = (SELECT MIN(x.id) FROM users x WHERE x.student_id = s.id AND x.role = 'student') WHERE s.id = ?`, [Number(id)]);
  if (!s) throw new HttpError(404, { error: 'not_found' });
  const [enrollments, orders] = await Promise.all([
    q(`SELECT e.id, e.course_id, e.status, e.enrolled_at, e.batch_id, e.order_id, c.title, c.slug,
              (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = e.course_id) AS lessons,
              (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
                 WHERE m.course_id = e.course_id AND lp.student_id = e.student_id AND lp.completed = 1) AS done
       FROM enrollments e LEFT JOIN courses c ON c.id = e.course_id WHERE e.student_id = ? ORDER BY e.id DESC`, [s.id]),
    q(`SELECT o.id, o.status, o.amount, o.created_at, o.gateway_trx_id,
              (SELECT GROUP_CONCAT(COALESCE(oi.title_snapshot, '') SEPARATOR ', ') FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.student_id = ? ORDER BY o.id DESC LIMIT 50`, [s.id])
  ]);
  return {
    id: s.id, name: s.name, phone: s.phone && s.phone !== '—' ? s.phone : null, email: s.email || null, joinedAt: s.created_at,
    enrollments: enrollments.map((e) => ({ id: e.id, courseId: e.course_id, title: e.title, slug: e.slug, status: e.status, enrolledAt: e.enrolled_at,
      source: e.order_id ? 'order' : e.batch_id ? 'batch' : 'manual', lessons: Number(e.lessons) || 0, done: Number(e.done) || 0 })),
    orders: orders.map((o) => ({ id: o.id, status: o.status, amount: o.amount, createdAt: o.created_at, trx: o.gateway_trx_id, items: o.items || '' }))
  };
}

// All enrollments with names/titles for the Enrollments view.
export async function getEnrollmentDirectory() {
  const rows = await q(
    `SELECT e.id, e.student_id, e.course_id, e.batch_id, e.order_id, e.status, e.enrolled_at, e.last_accessed_at,
            s.name AS student_name, c.title AS course_title, b.name AS batch_name
     FROM enrollments e LEFT JOIN students s ON s.id = e.student_id LEFT JOIN courses c ON c.id = e.course_id LEFT JOIN batches b ON b.id = e.batch_id
     ORDER BY e.id DESC LIMIT 2000`
  );
  return rows.map((r) => ({
    id: r.id, studentId: r.student_id, studentName: r.student_name, courseId: r.course_id, courseTitle: r.course_title,
    batchName: r.batch_name, source: r.order_id ? 'order' : r.batch_id ? 'batch' : 'manual', status: r.status,
    enrolledAt: r.enrolled_at, lastAccessedAt: r.last_accessed_at
  }));
}
