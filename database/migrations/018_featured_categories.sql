-- ============================================================
-- Leo Learning — featured courses + category management (migration 018)
--   mysql -u root e-learning < database/migrations/018_featured_categories.sql
-- ============================================================

USE `e-learning`;

-- featured flag for the marketplace
ALTER TABLE courses ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0 AFTER published;

UPDATE courses SET featured = 1 WHERE id IN (1, 2);

-- managed course categories
CREATE TABLE IF NOT EXISTS categories (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(64) NOT NULL,
  slug       VARCHAR(64) NOT NULL UNIQUE,
  icon       VARCHAR(16),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories (name, slug, icon) VALUES
  ('একাডেমিক', 'academic', '📚'),
  ('স্কিল', 'skills', '💡'),
  ('ভর্তি প্রস্তুতি', 'admission', '🎯'),
  ('ফ্রি কোর্স', 'free', '🎁')
ON DUPLICATE KEY UPDATE name=VALUES(name);
