-- ============================================================
-- Leo Learning — contact messages (migration 011)
-- Backs the public /contact form; owners read them in a Messages inbox.
--   mysql -u root e-learning < database/migrations/011_contact.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(191) NOT NULL,
  email      VARCHAR(191),
  subject    VARCHAR(191),
  message    TEXT NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
