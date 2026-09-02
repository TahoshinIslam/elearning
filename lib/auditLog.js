// ============================================================
// Persisted, queryable security/audit log — distinct from lib/logger.js
// (which only writes to the process's own console/stdout and isn't visible
// in any dashboard). Recording is always best-effort: a logging failure must
// never break the action being logged.
// ============================================================

import { q } from '@/lib/mysql';

export async function recordAudit({ session, action, targetType, targetId, detail }) {
  try {
    await q(
      'INSERT INTO audit_log (actor_user_id, actor_role, action, target_type, target_id, detail) VALUES (?,?,?,?,?,?)',
      [session?.id ?? null, session?.role ?? null, action, targetType ?? null, targetId != null ? String(targetId) : null, detail ?? null]
    );
  } catch {
    // best-effort — never let audit logging break the actual request
  }
}

export async function getAuditLog({ limit = 200, action } = {}) {
  const where = [];
  const params = [];
  if (action) { where.push('action = ?'); params.push(action); }
  const rows = await q(
    `SELECT a.id, a.actor_user_id AS actorUserId, u.name AS actorName, a.actor_role AS actorRole,
            a.action, a.target_type AS targetType, a.target_id AS targetId, a.detail, a.created_at AS createdAt
     FROM audit_log a LEFT JOIN users u ON u.id = a.actor_user_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY a.id DESC LIMIT ?`,
    [...params, Math.min(Math.max(Number(limit) || 200, 1), 1000)]
  );
  return rows;
}
