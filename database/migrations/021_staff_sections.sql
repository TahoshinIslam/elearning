-- ============================================================
-- Leo Learning — merge owner/teacher/mentor + per-staff sections (migration 021)
--   mysql -u root e-learning < database/migrations/021_staff_sections.sql
-- Drops the parent + mentor roles and adds granular dashboard-section access
-- for teacher (staff) accounts. Owner/superadmin implicitly see every section.
-- ============================================================

USE `e-learning`;

-- comma-separated list of dashboard sections a teacher/staff account may open
ALTER TABLE users ADD COLUMN IF NOT EXISTS sections TEXT NULL AFTER status;

-- collapse removed roles before tightening the enum
UPDATE users SET role = 'student' WHERE role = 'parent';
UPDATE users SET role = 'teacher' WHERE role = 'mentor';

-- role enum without parent/mentor
ALTER TABLE users
  MODIFY COLUMN role ENUM('student','teacher','owner','superadmin') NOT NULL DEFAULT 'student';

-- give every existing teacher the full staff section set by default
UPDATE users SET sections = 'dash,students,classes,attendance,submissions,quizzes,announce'
  WHERE role = 'teacher' AND (sections IS NULL OR sections = '');
