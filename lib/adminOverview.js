// Admin dashboard metrics — every number is a query over real records.
import { q } from '@/lib/mysql';

export async function getAdminOverview() {
  const [[students], [courses], [orders], [learning], [reviews], recent, top, daily] = await Promise.all([
    q(`SELECT COUNT(*) AS total, SUM(created_at >= NOW() - INTERVAL 30 DAY) AS new30 FROM students`),
    q(`SELECT SUM(published = 1) AS published, SUM(published = 0 AND is_upcoming = 1) AS upcoming, SUM(published = 0 AND is_upcoming = 0) AS drafts,
              SUM(review_status = 'pending_review') AS inReview FROM courses`),
    q(`SELECT COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) AS revenue,
              COALESCE(SUM(CASE WHEN status = 'paid' AND paid_at >= NOW() - INTERVAL 30 DAY THEN amount END), 0) AS revenue30,
              SUM(status = 'paid' AND amount > 0) AS paid, SUM(status = 'paid' AND amount > 0 AND paid_at >= NOW() - INTERVAL 30 DAY) AS paid30,
              SUM(status = 'pending' AND gateway = 'bkash') AS pending, SUM(failure_reason = 'duplicate_purchase_refund_due') AS duplicates
       FROM orders`),
    q(`SELECT COUNT(DISTINCT student_id) AS active7, SUM(completed = 1 AND completed_at >= NOW() - INTERVAL 7 DAY) AS completed7
       FROM lesson_progress WHERE last_activity_at >= NOW() - INTERVAL 7 DAY`),
    q(`SELECT SUM(status = 'pending') AS pending FROM course_reviews`),
    q(`SELECT o.id, o.amount, o.status, o.paid_at, o.created_at, s.name AS student,
              (SELECT GROUP_CONCAT(c.title SEPARATOR ', ') FROM order_items oi JOIN courses c ON c.id = oi.course_id WHERE oi.order_id = o.id) AS courses
       FROM orders o LEFT JOIN students s ON s.id = o.student_id
       WHERE o.status = 'paid' ORDER BY o.paid_at DESC, o.id DESC LIMIT 8`),
    q(`SELECT c.id, c.title, c.slug, COUNT(DISTINCT o.student_id) AS buyers, COALESCE(SUM(oi.unit_price), 0) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status = 'paid' AND oi.unit_price > 0
       JOIN courses c ON c.id = oi.course_id
       WHERE o.paid_at >= NOW() - INTERVAL 30 DAY GROUP BY c.id, c.title, c.slug ORDER BY revenue DESC LIMIT 5`),
    q(`SELECT DATE(paid_at) AS d, SUM(amount) AS amount, COUNT(*) AS n FROM orders
       WHERE status = 'paid' AND amount > 0 AND paid_at >= CURDATE() - INTERVAL 13 DAY GROUP BY DATE(paid_at) ORDER BY d`)
  ]);
  const n = (v) => Number(v) || 0;
  return {
    students: { total: n(students.total), new30: n(students.new30), active7: n(learning.active7) },
    courses: { published: n(courses.published), upcoming: n(courses.upcoming), drafts: n(courses.drafts), inReview: n(courses.inReview) },
    sales: { revenue: n(orders.revenue), revenue30: n(orders.revenue30), paid: n(orders.paid), paid30: n(orders.paid30), pending: n(orders.pending), duplicates: n(orders.duplicates) },
    lessonsCompleted7: n(learning.completed7),
    pendingReviews: n(reviews.pending),
    recentOrders: recent.map((r) => ({ id: r.id, amount: n(r.amount), student: r.student, courses: r.courses || '', paidAt: r.paid_at || r.created_at })),
    topCourses: top.map((r) => ({ id: r.id, title: r.title, slug: r.slug, buyers: n(r.buyers), revenue: n(r.revenue) })),
    daily: daily.map((r) => ({ date: String(r.d).slice(0, 10), amount: n(r.amount), orders: n(r.n) }))
  };
}
