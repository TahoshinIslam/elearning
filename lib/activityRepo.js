// ============================================================
// Recent activity — one timeline merged from the records the platform
// already keeps: orders, enrollments, sign-ups, assignment submissions,
// quiz attempts, reviews, contact messages and the audit log (staff
// actions, logins, access changes). Owner/superadmin only (route-enforced).
// ============================================================

import { q } from '@/lib/mysql';

export const ACTIVITY_TYPES = ['order', 'refund', 'enrollment', 'signup', 'submission', 'quiz', 'review', 'message', 'admin', 'security'];

// Audit actions that are about access/security rather than content edits.
const SECURITY_ACTIONS = ['login_failed', 'login_blocked_disabled', 'role_changed', 'user_disabled', 'user_enabled', 'sections_changed', 'sessions_revoked', 'password_reset', 'staff_created'];

const clampLimit = (v) => Math.min(Math.max(Number(v) || 30, 1), 100);

// Each source returns rows shaped { type, at, actor, title, detail, ref, link }.
const SOURCES = {
  order: (since, lim) => q(
    `SELECT 'order' AS type, o.paid_at AS at, COALESCE(s.name, 'Student') AS actor, o.amount, o.id AS ref,
            (SELECT GROUP_CONCAT(oi.title_snapshot SEPARATOR ', ') FROM order_items oi WHERE oi.order_id = o.id) AS detail
     FROM orders o LEFT JOIN students s ON s.id = o.student_id
     WHERE o.status IN ('paid', 'refunded') AND o.paid_at IS NOT NULL AND o.paid_at >= ? ORDER BY o.paid_at DESC LIMIT ?`, [since, lim]),
  refund: (since, lim) => q(
    `SELECT 'refund' AS type, o.refunded_at AS at, COALESCE(s.name, 'Student') AS actor, o.amount, o.id AS ref, NULL AS detail
     FROM orders o LEFT JOIN students s ON s.id = o.student_id
     WHERE o.status = 'refunded' AND o.refunded_at >= ? ORDER BY o.refunded_at DESC LIMIT ?`, [since, lim]),
  enrollment: (since, lim) => q(
    `SELECT 'enrollment' AS type, e.enrolled_at AS at, s.name AS actor, NULL AS amount, e.course_id AS ref,
            COALESCE(c.title, b.name) AS detail, c.slug
     FROM enrollments e JOIN students s ON s.id = e.student_id
     LEFT JOIN courses c ON c.id = e.course_id LEFT JOIN batches b ON b.id = e.batch_id
     WHERE e.enrolled_at >= ? ORDER BY e.enrolled_at DESC LIMIT ?`, [since, lim]),
  signup: (since, lim) => q(
    `SELECT 'signup' AS type, u.created_at AS at, u.name AS actor, NULL AS amount, u.id AS ref, u.role AS detail
     FROM users u WHERE u.created_at >= ? ORDER BY u.created_at DESC LIMIT ?`, [since, lim]),
  submission: (since, lim) => q(
    `SELECT 'submission' AS type, sb.submitted_at AS at, sb.student_name AS actor, NULL AS amount, sb.id AS ref,
            l.title AS detail, sb.status AS extra
     FROM submissions sb LEFT JOIN lessons l ON l.id = sb.lesson_id
     WHERE sb.submitted_at >= ? ORDER BY sb.submitted_at DESC LIMIT ?`, [since, lim]),
  quiz: (since, lim) => q(
    `SELECT 'quiz' AS type, a.submitted_at AS at, a.student_name AS actor, NULL AS amount, a.lesson_id AS ref,
            l.title AS detail, CONCAT(a.score, '/', a.max_score) AS extra
     FROM quiz_attempts a LEFT JOIN lessons l ON l.id = a.lesson_id
     WHERE a.submitted_at >= ? ORDER BY a.submitted_at DESC LIMIT ?`, [since, lim]),
  review: (since, lim) => q(
    `SELECT 'review' AS type, r.created_at AS at, r.name AS actor, NULL AS amount, r.id AS ref,
            c.title AS detail, CONCAT(r.rating, '★ · ', r.status) AS extra
     FROM course_reviews r LEFT JOIN courses c ON c.id = r.course_id
     WHERE r.created_at >= ? ORDER BY r.created_at DESC LIMIT ?`, [since, lim]),
  message: (since, lim) => q(
    `SELECT 'message' AS type, m.created_at AS at, m.name AS actor, NULL AS amount, m.id AS ref, m.subject AS detail
     FROM contact_messages m WHERE m.created_at >= ? ORDER BY m.created_at DESC LIMIT ?`, [since, lim]),
  admin: (since, lim) => q(
    `SELECT 'admin' AS type, a.created_at AS at, COALESCE(u.name, a.actor_role, 'system') AS actor, NULL AS amount, a.id AS ref,
            a.action AS detail, CONCAT_WS(' ', a.target_type, a.target_id) AS extra
     FROM audit_log a LEFT JOIN users u ON u.id = a.actor_user_id
     WHERE a.created_at >= ? AND a.action NOT IN (${SECURITY_ACTIONS.map(() => '?').join(',')})
     ORDER BY a.created_at DESC LIMIT ?`, [since, ...SECURITY_ACTIONS, lim]),
  security: (since, lim) => q(
    `SELECT 'security' AS type, a.created_at AS at, COALESCE(u.name, a.actor_role, 'anonymous') AS actor, NULL AS amount, a.id AS ref,
            a.action AS detail, CONCAT_WS(' ', a.target_type, a.target_id) AS extra
     FROM audit_log a LEFT JOIN users u ON u.id = a.actor_user_id
     WHERE a.created_at >= ? AND a.action IN (${SECURITY_ACTIONS.map(() => '?').join(',')})
     ORDER BY a.created_at DESC LIMIT ?`, [since, ...SECURITY_ACTIONS, lim])
};

function linkFor(r) {
  switch (r.type) {
    case 'order': case 'refund': return '/owner?section=payments';
    case 'enrollment': return r.slug ? `/course/${r.slug}` : '/owner?section=enroll';
    case 'signup': return '/owner?section=users';
    case 'submission': return '/owner?section=submissions';
    case 'quiz': return '/owner?section=quizzes';
    case 'review': return '/owner?section=reviews';
    case 'message': return '/owner?section=messages';
    default: return '/owner?section=access';
  }
}

// types: subset of ACTIVITY_TYPES (default all); days: look-back window.
export async function getRecentActivity({ types, limit, days = 30 } = {}) {
  const lim = clampLimit(limit);
  const wanted = (Array.isArray(types) && types.length ? types : ACTIVITY_TYPES).filter((t) => SOURCES[t]);
  const since = new Date(Date.now() - Math.min(Math.max(Number(days) || 30, 1), 365) * 86400000);
  const lists = await Promise.all(wanted.map((t) => SOURCES[t](since, lim)));
  const all = lists.flat()
    .filter((r) => r.at)
    .map((r) => ({
      id: `${r.type}-${r.ref}-${new Date(r.at).getTime()}`,
      type: r.type,
      at: new Date(r.at).toISOString(),
      actor: r.actor || '',
      detail: r.detail || '',
      extra: r.extra || null,
      amount: r.amount != null ? Number(r.amount) : null,
      link: linkFor(r)
    }))
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, lim);
  return all;
}

// Counts per type for the filter chips.
export async function getActivityCounts({ days = 30 } = {}) {
  const items = await getRecentActivity({ limit: 100, days });
  const counts = Object.fromEntries(ACTIVITY_TYPES.map((t) => [t, 0]));
  for (const i of items) counts[i.type] += 1;
  return counts;
}
