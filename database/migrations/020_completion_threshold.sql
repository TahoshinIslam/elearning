-- ============================================================
-- Leo Learning — per-course completion requirement (migration 020)
-- Each course can define the completion % required to earn its certificate.
--   mysql -u root e-learning < database/migrations/020_completion_threshold.sql
-- ============================================================

USE `e-learning`;

ALTER TABLE courses
  ADD COLUMN completion_threshold TINYINT UNSIGNED NOT NULL DEFAULT 80 AFTER featured;
