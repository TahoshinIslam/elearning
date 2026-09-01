-- ============================================================
-- Leo Learning — affiliate program (migration 016)
-- Marketing partners earn commission when a purchase uses their code.
--   mysql -u root e-learning < database/migrations/016_affiliates.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS affiliates (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(191) NOT NULL,
  code           VARCHAR(32) NOT NULL UNIQUE,
  commission_pct INT UNSIGNED NOT NULL DEFAULT 10,
  earnings       INT UNSIGNED NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS affiliate_sales (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  affiliate_id INT UNSIGNED NOT NULL,
  amount       INT UNSIGNED NOT NULL,
  commission   INT UNSIGNED NOT NULL,
  course_id    INT UNSIGNED,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_as_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO affiliates (name, code, commission_pct) VALUES
  ('এডুকেশন ব্লগার', 'BLOG15', 15),
  ('ইউটিউব পার্টনার', 'YT10', 10)
ON DUPLICATE KEY UPDATE name=VALUES(name);
