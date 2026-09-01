-- ============================================================
-- Leo Learning — mentor role (migration 010)
-- Adds 'mentor' to the users role enum and a mentor↔student assignment table.
--   mysql -u root e-learning < database/migrations/010_mentors.sql
-- Seed the demo mentor + assignments with:  node database/seed_users.mjs
-- ============================================================

USE `e-learning`;

ALTER TABLE users
  MODIFY COLUMN role ENUM('student','teacher','mentor','parent','owner','superadmin') NOT NULL DEFAULT 'student';

CREATE TABLE IF NOT EXISTS mentor_students (
  mentor_user_id INT UNSIGNED NOT NULL,   -- users.id of a role='mentor' account
  student_id     INT UNSIGNED NOT NULL,   -- students.id
  PRIMARY KEY (mentor_user_id, student_id),
  CONSTRAINT fk_ms_mentor  FOREIGN KEY (mentor_user_id) REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_ms_student FOREIGN KEY (student_id)      REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
