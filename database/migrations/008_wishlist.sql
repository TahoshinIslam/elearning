-- ============================================================
-- Leo Learning — student wishlist (migration 008)
--   mysql -u root e-learning < database/migrations/008_wishlist.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS wishlist (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  course_id  INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wishlist (student_id, course_id),
  CONSTRAINT fk_wish_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_wish_course  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
