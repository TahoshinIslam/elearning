-- ============================================================
-- Leo Learning — site settings (migration 019)
-- Simple key/value store for site-wide settings incl. maintenance mode.
--   mysql -u root e-learning < database/migrations/019_settings.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS site_settings (
  skey       VARCHAR(64) PRIMARY KEY,
  svalue     TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (skey, svalue) VALUES
  ('siteTitle', 'Leo Learning'),
  ('supportPhone', '01712-334455'),
  ('supportEmail', 'support@leolearning.app'),
  ('seoDescription', 'Bangladeshi coaching center — live classes, recorded courses, exams and more.'),
  ('maintenance', '0'),
  ('maintenanceMsg', 'সাইটটি সাময়িকভাবে রক্ষণাবেক্ষণের জন্য বন্ধ আছে। শীঘ্রই ফিরে আসছি!')
ON DUPLICATE KEY UPDATE svalue = svalue;
