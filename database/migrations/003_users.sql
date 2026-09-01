-- ============================================================
-- Leo Learning — auth users (migration 003)
-- Adds the accounts table backing real login / register / reset + RBAC.
-- Run after 001_init_schema.sql. Import via phpMyAdmin or:
--   mysql -u root e-learning < database/migrations/003_users.sql
-- Seed demo accounts with:  node database/seed_users.mjs
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(191) NOT NULL,
  email         VARCHAR(191) NOT NULL UNIQUE,
  phone         VARCHAR(32),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student','teacher','parent','owner','superadmin') NOT NULL DEFAULT 'student',
  tenant_id     INT UNSIGNED NULL,      -- coaching center this user belongs to (NULL for superadmin)
  student_id    INT UNSIGNED NULL,      -- link to students row (student / parent accounts)
  teacher_id    INT UNSIGNED NULL,      -- link to teachers row (teacher accounts)
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  reset_token   VARCHAR(128) NULL,      -- forgot-password flow
  reset_expires DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE SET NULL,
  CONSTRAINT fk_user_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  CONSTRAINT fk_user_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
