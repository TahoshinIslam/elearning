-- ============================================================
-- Leo Learning — homepage CMS (migration 012)
-- One row per editable landing section; `data` holds a JSON blob.
-- Empty/absent sections fall back to the built-in defaults in the landing page.
--   mysql -u root e-learning < database/migrations/012_homepage.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS homepage_content (
  section    VARCHAR(32) PRIMARY KEY,          -- 'hero' | 'testimonials' | 'partners' | 'stats'
  data       LONGTEXT,                         -- JSON (object or array) as text
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
