-- ============================================================
-- Leo Learning — review moderation (migration 007)
-- Adds moderation state to course_reviews. Existing seed rows default to
-- 'approved' so the public course pages are unchanged; new student-submitted
-- reviews come in as 'pending' and must be approved by an admin.
--   mysql -u root e-learning < database/migrations/007_reviews_moderation.sql
-- ============================================================

USE `e-learning`;

ALTER TABLE course_reviews
  ADD COLUMN status     ENUM('pending','approved','hidden') NOT NULL DEFAULT 'approved' AFTER text,
  ADD COLUMN featured   TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN student_id INT UNSIGNED NULL AFTER featured,
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER student_id;
