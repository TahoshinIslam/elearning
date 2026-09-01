-- ============================================================
-- Leo Learning — in-app notifications (migration 005)
-- One row per recipient user. Announcements fan out to many rows.
--   mysql -u root e-learning < database/migrations/005_notifications.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  title      VARCHAR(191) NOT NULL,
  body       VARCHAR(500),
  kind       ENUM('announcement','grade','class','payment','system') NOT NULL DEFAULT 'announcement',
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_user (user_id, is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
