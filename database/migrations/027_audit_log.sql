-- ============================================================
-- Leo Learning — security/audit log (migration 027)
-- Nothing in the schema persisted a queryable record of security-relevant
-- events (failed logins, role/status changes, refunds, course approvals) —
-- lib/logger.js only ever writes to the process's own console/stdout.
--   mysql -u root e-learning < database/migrations/027_audit_log.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE audit_log (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT UNSIGNED NULL,      -- NULL for an unauthenticated actor (e.g. a failed login)
  actor_role   VARCHAR(32) NULL,
  action       VARCHAR(64) NOT NULL,    -- e.g. 'login_failed', 'role_changed', 'order_refunded', 'course_approved'
  target_type  VARCHAR(32) NULL,        -- e.g. 'user', 'order', 'course'
  target_id    VARCHAR(64) NULL,
  detail       TEXT NULL,
  ip           VARCHAR(64) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_action (action),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
