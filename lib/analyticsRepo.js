// ============================================================
// Admin analytics — every figure is a query over real records (orders,
// enrollments, lesson progress, quiz attempts, reviews). Nothing is sampled
// or estimated. Owner/superadmin only (enforced by the route).
// ============================================================

import { q } from '@/lib/mysql';

export const RANGES = [7, 30, 90, 365];
const n = (v) => Number(v) || 0;
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

// Change vs the previous period of the same length, in percent (null when the
// previous period had nothing, so "∞%" is never shown).
function delta(cur, prev) {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

// Fill missing days with zeros so charts have one point per day.
function fillDays(rows, days, keys) {
  const byDate = new Map(rows.map((r) => [String(r.d).slice(0, 10), r]));
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const r = byDate.get(key) || {};
    const point = { date: key };
    for (const k of keys) point[k] = n(r[k]);
    out.push(point);
  }
  return out;
}

export async function getAnalytics({ days = 30 } = {}) {
  const D = RANGES.includes(Number(days)) ? Number(days) : 30;
  // [start of current window, start of previous window]
  const cur = `NOW() - INTERVAL ${D} DAY`;
  const prev = `NOW() - INTERVAL ${D * 2} DAY`;

  const [
    [kpi], [kpiPrev], revenueDaily, enrollDaily, studentsDaily, activityDaily,
    topRevenue, topEnroll, funnelRows, quizRows, ratingRows, sourceRows
  ] = await Promise.all([
    q(`SELECT
         COALESCE(SUM(CASE WHEN status = 'paid' AND paid_at >= ${cur} THEN amount END), 0) AS revenue,
         SUM(status = 'paid' AND amount > 0 AND paid_at >= ${cur}) AS orders,
         SUM(status IN ('pending', 'failed', 'cancelled') AND created_at >= ${cur}) AS unpaid,
         SUM(status = 'refunded' AND refunded_at >= ${cur}) AS refunds
       FROM orders`),
    q(`SELECT
         COALESCE(SUM(CASE WHEN status = 'paid' AND paid_at >= ${prev} AND paid_at < ${cur} THEN amount END), 0) AS revenue,
         SUM(status = 'paid' AND amount > 0 AND paid_at >= ${prev} AND paid_at < ${cur}) AS orders,
         (SELECT COUNT(*) FROM enrollments WHERE enrolled_at >= ${prev} AND enrolled_at < ${cur}) AS enrollments,
         (SELECT COUNT(*) FROM students WHERE created_at >= ${prev} AND created_at < ${cur}) AS students,
         (SELECT COUNT(DISTINCT student_id) FROM lesson_progress WHERE last_activity_at >= ${prev} AND last_activity_at < ${cur}) AS active
       FROM orders`),
    q(`SELECT DATE(paid_at) AS d, SUM(amount) AS revenue, COUNT(*) AS orders FROM orders
       WHERE status = 'paid' AND amount > 0 AND paid_at >= CURDATE() - INTERVAL ${D - 1} DAY GROUP BY DATE(paid_at)`),
    q(`SELECT DATE(enrolled_at) AS d, COUNT(*) AS enrollments FROM enrollments
       WHERE enrolled_at >= CURDATE() - INTERVAL ${D - 1} DAY GROUP BY DATE(enrolled_at)`),
    q(`SELECT DATE(created_at) AS d, COUNT(*) AS students FROM students
       WHERE created_at >= CURDATE() - INTERVAL ${D - 1} DAY GROUP BY DATE(created_at)`),
    q(`SELECT DATE(last_activity_at) AS d, COUNT(DISTINCT student_id) AS active, SUM(completed = 1 AND DATE(completed_at) = DATE(last_activity_at)) AS completions
       FROM lesson_progress WHERE last_activity_at >= CURDATE() - INTERVAL ${D - 1} DAY GROUP BY DATE(last_activity_at)`),
    q(`SELECT c.id, c.title, c.slug, COALESCE(SUM(oi.unit_price), 0) AS revenue, COUNT(DISTINCT o.student_id) AS buyers
       FROM order_items oi JOIN orders o ON o.id = oi.order_id AND o.status = 'paid' AND o.paid_at >= ${cur}
       JOIN courses c ON c.id = oi.course_id
       GROUP BY c.id, c.title, c.slug HAVING revenue > 0 ORDER BY revenue DESC LIMIT 6`),
    q(`SELECT c.id, c.title, c.slug, COUNT(*) AS enrollments
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.enrolled_at >= ${cur} AND e.course_id IS NOT NULL
       GROUP BY c.id, c.title, c.slug ORDER BY enrollments DESC LIMIT 6`),
    // Learning funnel per course: enrolled → started → halfway → completed
    q(`SELECT c.id, c.title, c.slug,
              (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = c.id) AS lessons,
              COUNT(DISTINCT e.student_id) AS enrolled,
              COUNT(DISTINCT CASE WHEN p.done > 0 OR p.touched > 0 THEN e.student_id END) AS started,
              COUNT(DISTINCT CASE WHEN p.done * 2 >= p.total AND p.total > 0 THEN e.student_id END) AS halfway,
              COUNT(DISTINCT CASE WHEN p.done >= p.total AND p.total > 0 THEN e.student_id END) AS completed
       FROM courses c
       JOIN enrollments e ON e.course_id = c.id AND e.status = 'active'
       LEFT JOIN (
         SELECT lp.student_id, m.course_id, SUM(lp.completed = 1) AS done, COUNT(*) AS touched,
                (SELECT COUNT(*) FROM lessons l2 JOIN modules m2 ON m2.id = l2.module_id WHERE m2.course_id = m.course_id) AS total
         FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN modules m ON m.id = l.module_id
         GROUP BY lp.student_id, m.course_id
       ) p ON p.student_id = e.student_id AND p.course_id = c.id
       GROUP BY c.id, c.title, c.slug HAVING enrolled > 0 ORDER BY enrolled DESC LIMIT 8`),
    // Quiz performance per quiz (latest attempt per student)
    q(`SELECT l.id, l.title, c.title AS course, COUNT(a.id) AS attempts,
              AVG(CASE WHEN a.max_score > 0 THEN a.score / a.max_score END) AS avgRatio,
              SUM(a.passed = 1) AS passed, SUM(a.passed IS NOT NULL) AS graded
       FROM quiz_attempts a JOIN lessons l ON l.id = a.lesson_id JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id
       GROUP BY l.id, l.title, c.title ORDER BY attempts DESC LIMIT 8`),
    q(`SELECT rating, COUNT(*) AS n FROM course_reviews WHERE status = 'approved' GROUP BY rating`),
    q(`SELECT CASE WHEN coupon_code IS NOT NULL AND coupon_code <> '' THEN 'coupon'
                   WHEN affiliate_code IS NOT NULL AND affiliate_code <> '' THEN 'affiliate'
                   WHEN amount = 0 THEN 'free' ELSE 'direct' END AS source,
              COUNT(*) AS orders, COALESCE(SUM(amount), 0) AS revenue
       FROM orders WHERE status = 'paid' AND paid_at >= ${cur} GROUP BY source`)
  ]);

  const [[enrollNow], [studentsNow], [activeNow]] = await Promise.all([
    q(`SELECT COUNT(*) AS v FROM enrollments WHERE enrolled_at >= ${cur}`),
    q(`SELECT COUNT(*) AS v FROM students WHERE created_at >= ${cur}`),
    q(`SELECT COUNT(DISTINCT student_id) AS v FROM lesson_progress WHERE last_activity_at >= ${cur}`)
  ]);

  const revenue = n(kpi.revenue);
  const orders = n(kpi.orders);
  const kpis = {
    revenue: { value: revenue, delta: delta(revenue, n(kpiPrev.revenue)) },
    orders: { value: orders, delta: delta(orders, n(kpiPrev.orders)) },
    aov: { value: orders ? Math.round(revenue / orders) : 0, delta: delta(orders ? revenue / orders : 0, n(kpiPrev.orders) ? n(kpiPrev.revenue) / n(kpiPrev.orders) : 0) },
    enrollments: { value: n(enrollNow.v), delta: delta(n(enrollNow.v), n(kpiPrev.enrollments)) },
    newStudents: { value: n(studentsNow.v), delta: delta(n(studentsNow.v), n(kpiPrev.students)) },
    activeLearners: { value: n(activeNow.v), delta: delta(n(activeNow.v), n(kpiPrev.active)) },
    conversion: { value: pct(orders, orders + n(kpi.unpaid)), delta: null },
    refunds: { value: n(kpi.refunds), delta: null }
  };

  const series = fillDays(
    [...new Set([...revenueDaily, ...enrollDaily, ...studentsDaily, ...activityDaily].map((r) => String(r.d).slice(0, 10)))].map((d) => ({
      d,
      ...(revenueDaily.find((r) => String(r.d).slice(0, 10) === d) || {}),
      ...(enrollDaily.find((r) => String(r.d).slice(0, 10) === d) || {}),
      ...(studentsDaily.find((r) => String(r.d).slice(0, 10) === d) || {}),
      ...(activityDaily.find((r) => String(r.d).slice(0, 10) === d) || {})
    })),
    D,
    ['revenue', 'orders', 'enrollments', 'students', 'active', 'completions']
  );

  const ratings = [5, 4, 3, 2, 1].map((r) => ({ rating: r, count: n(ratingRows.find((x) => Number(x.rating) === r)?.n) }));
  const ratingTotal = ratings.reduce((a, r) => a + r.count, 0);

  return {
    days: D,
    kpis,
    series,
    topRevenue: topRevenue.map((r) => ({ id: r.id, title: r.title, slug: r.slug, revenue: n(r.revenue), buyers: n(r.buyers) })),
    topEnrollments: topEnroll.map((r) => ({ id: r.id, title: r.title, slug: r.slug, enrollments: n(r.enrollments) })),
    funnel: funnelRows.map((r) => ({
      id: r.id, title: r.title, slug: r.slug, lessons: n(r.lessons),
      enrolled: n(r.enrolled), started: n(r.started), halfway: n(r.halfway), completed: n(r.completed),
      completionRate: pct(n(r.completed), n(r.enrolled))
    })),
    quizzes: quizRows.map((r) => ({
      id: r.id, title: r.title, course: r.course, attempts: n(r.attempts),
      avgPercent: Math.round(n(r.avgRatio) * 100), passRate: n(r.graded) ? pct(n(r.passed), n(r.graded)) : null
    })),
    ratings: { distribution: ratings, total: ratingTotal, average: ratingTotal ? Math.round((ratings.reduce((a, r) => a + r.rating * r.count, 0) / ratingTotal) * 10) / 10 : null },
    sources: ['direct', 'coupon', 'affiliate', 'free'].map((s) => ({ source: s, orders: n(sourceRows.find((x) => x.source === s)?.orders), revenue: n(sourceRows.find((x) => x.source === s)?.revenue) }))
  };
}

// CSV of the daily series, for spreadsheets.
export function analyticsCsv(data) {
  const head = 'date,revenue,orders,enrollments,new_students,active_learners,lesson_completions';
  const rows = data.series.map((p) => [p.date, p.revenue, p.orders, p.enrollments, p.students, p.active, p.completions].join(','));
  return [head, ...rows].join('\n');
}
