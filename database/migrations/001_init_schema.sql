-- ============================================================
-- Leo Learning — initial schema (migration 001)
-- Target: MySQL / MariaDB (XAMPP)  ·  DB name: e-learning
-- Mirrors the in-memory entities in lib/db.js.
-- utf8mb4 throughout so Bengali (বাংলা) text stores correctly.
-- Import via phpMyAdmin  →  Import tab  →  choose this file.
-- Or CLI:  mysql -u root < database/migrations/001_init_schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `e-learning`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `e-learning`;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------- tenants (multi-tenant coaching centers) ----------
CREATE TABLE tenants (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(191) NOT NULL,
  sub          VARCHAR(64)  NOT NULL UNIQUE,
  plan         ENUM('Trial','Basic','Pro') NOT NULL DEFAULT 'Trial',
  students     INT UNSIGNED NOT NULL DEFAULT 0,
  mrr          INT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('active','trial','suspended') NOT NULL DEFAULT 'trial',
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- teachers / instructors ----------
CREATE TABLE teachers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(191) NOT NULL,
  subject         VARCHAR(191),
  phone           VARCHAR(32),
  title           VARCHAR(191),
  rating          DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  rating_count    INT UNSIGNED NOT NULL DEFAULT 0,
  students_taught INT UNSIGNED NOT NULL DEFAULT 0,
  bio             TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_expertise (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT UNSIGNED NOT NULL,
  skill      VARCHAR(191) NOT NULL,
  CONSTRAINT fk_expertise_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- courses ----------
CREATE TABLE courses (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(191) NOT NULL,
  slug          VARCHAR(191) NOT NULL UNIQUE,
  published     TINYINT(1) NOT NULL DEFAULT 0,
  category      VARCHAR(64),
  mode          ENUM('live','recorded','hybrid','free','workshop','webinar') DEFAULT 'live',
  thumb         VARCHAR(64),
  tagline       VARCHAR(255),
  level         VARCHAR(128),
  language      VARCHAR(64) DEFAULT 'বাংলা',
  instructor    VARCHAR(191),
  instructor_id INT UNSIGNED,
  price         INT UNSIGNED NOT NULL DEFAULT 0,
  old_price     INT UNSIGNED,
  rating        DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  rating_count  INT UNSIGNED NOT NULL DEFAULT 0,
  duration      VARCHAR(128),
  description   TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_course_instructor FOREIGN KEY (instructor_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_learning_points (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  text      VARCHAR(255) NOT NULL,
  CONSTRAINT fk_lp_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_requirements (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  text      VARCHAR(255) NOT NULL,
  CONSTRAINT fk_req_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_faqs (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  question  VARCHAR(255) NOT NULL,
  answer    TEXT NOT NULL,
  CONSTRAINT fk_faq_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_reviews (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  name      VARCHAR(191) NOT NULL,
  rating    TINYINT UNSIGNED NOT NULL DEFAULT 5,
  text      TEXT NOT NULL,
  CONSTRAINT fk_review_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- modules → lessons ----------
CREATE TABLE modules (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id INT UNSIGNED NOT NULL,
  title     VARCHAR(191) NOT NULL,
  position  INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_module_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE lessons (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id INT UNSIGNED NOT NULL,
  title     VARCHAR(191) NOT NULL,
  type      ENUM('video','pdf','quiz','assignment') NOT NULL DEFAULT 'video',
  duration  VARCHAR(64),
  is_free   TINYINT(1) NOT NULL DEFAULT 0,
  position  INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_lesson_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- batches (a course runs as one or more batches) ----------
CREATE TABLE batches (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(191) NOT NULL,
  course_id      INT UNSIGNED,
  students_count INT UNSIGNED NOT NULL DEFAULT 0,
  fee            VARCHAR(32),
  schedule       VARCHAR(191),
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_batch_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE teacher_batches (
  teacher_id INT UNSIGNED NOT NULL,
  batch_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (teacher_id, batch_id),
  CONSTRAINT fk_tb_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  CONSTRAINT fk_tb_batch   FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- students ----------
CREATE TABLE students (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(191) NOT NULL,
  phone     VARCHAR(32),
  batch_id  INT UNSIGNED,
  amount    INT UNSIGNED NOT NULL DEFAULT 0,
  paid      TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_batch FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- enrollments (student ↔ batch, grants the batch's course) ----------
CREATE TABLE enrollments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED NOT NULL,
  batch_id    INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED,
  enrolled_at DATE,
  status      ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  UNIQUE KEY uq_enrollment (student_id, batch_id),
  CONSTRAINT fk_enr_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enr_batch   FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE,
  CONSTRAINT fk_enr_course  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- submissions (assignment work → grading) ----------
CREATE TABLE submissions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL,
  course_id    INT UNSIGNED,
  student_id   INT UNSIGNED NOT NULL,
  student_name VARCHAR(191),
  content      TEXT,
  submitted_at DATE,
  status       ENUM('submitted','graded') NOT NULL DEFAULT 'submitted',
  marks        INT UNSIGNED NULL,
  max_marks    INT UNSIGNED NOT NULL DEFAULT 20,
  feedback     TEXT,
  UNIQUE KEY uq_submission (lesson_id, student_id),
  CONSTRAINT fk_sub_lesson  FOREIGN KEY (lesson_id)  REFERENCES lessons(id)  ON DELETE CASCADE,
  CONSTRAINT fk_sub_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- attendance ----------
CREATE TABLE attendance (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  batch_id   INT UNSIGNED NOT NULL,
  class_date DATE NOT NULL,
  title      VARCHAR(191),
  present    TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_attendance (student_id, batch_id, class_date),
  CONSTRAINT fk_att_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_batch   FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- certificates ----------
CREATE TABLE certificates (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id   INT UNSIGNED NOT NULL,
  student_name VARCHAR(191),
  course_id    INT UNSIGNED NOT NULL,
  course_title VARCHAR(191),
  issued_at    DATE,
  completion   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  cert_no      VARCHAR(64) NOT NULL UNIQUE,
  UNIQUE KEY uq_certificate (student_id, course_id),
  CONSTRAINT fk_cert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_cert_course  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- career portal: jobs → applications ----------
CREATE TABLE jobs (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title     VARCHAR(191) NOT NULL,
  company   VARCHAR(191),
  location  VARCHAR(128),
  type      ENUM('full-time','part-time','internship') NOT NULL DEFAULT 'full-time',
  salary    VARCHAR(64),
  posted_at DATE,
  is_open   TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE job_skills (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id INT UNSIGNED NOT NULL,
  skill  VARCHAR(128) NOT NULL,
  CONSTRAINT fk_skill_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  job_id       INT UNSIGNED NOT NULL,
  student_id   INT UNSIGNED NOT NULL,
  student_name VARCHAR(191),
  status       ENUM('applied','shortlisted','interview','hired','rejected') NOT NULL DEFAULT 'applied',
  applied_at   DATE,
  UNIQUE KEY uq_application (job_id, student_id),
  CONSTRAINT fk_app_job     FOREIGN KEY (job_id)     REFERENCES jobs(id)     ON DELETE CASCADE,
  CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- live classes ----------
CREATE TABLE live_classes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id     INT UNSIGNED,
  batch_id      INT UNSIGNED,
  instructor_id INT UNSIGNED,
  title         VARCHAR(191) NOT NULL,
  class_date    DATE,
  start_time    VARCHAR(64),
  end_time      VARCHAR(64),
  zoom_url      VARCHAR(255),
  status        ENUM('scheduled','live','ended') NOT NULL DEFAULT 'scheduled',
  recording_url VARCHAR(255),
  CONSTRAINT fk_lc_course     FOREIGN KEY (course_id)     REFERENCES courses(id)  ON DELETE SET NULL,
  CONSTRAINT fk_lc_batch      FOREIGN KEY (batch_id)      REFERENCES batches(id)  ON DELETE SET NULL,
  CONSTRAINT fk_lc_instructor FOREIGN KEY (instructor_id) REFERENCES teachers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- payments (transactions / invoices) ----------
CREATE TABLE payments (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id   INT UNSIGNED,
  student_name VARCHAR(191),
  course_id    INT UNSIGNED,
  batch_id     INT UNSIGNED,
  amount       INT UNSIGNED NOT NULL,
  method       ENUM('bkash','nagad','card') NOT NULL DEFAULT 'bkash',
  type         ENUM('enrollment','fee') NOT NULL DEFAULT 'enrollment',
  status       ENUM('success','refunded') NOT NULL DEFAULT 'success',
  trx_id       VARCHAR(64) NOT NULL,
  invoice_no   VARCHAR(64) NOT NULL UNIQUE,
  created_at   DATE,
  CONSTRAINT fk_pay_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  CONSTRAINT fk_pay_course  FOREIGN KEY (course_id)  REFERENCES courses(id)  ON DELETE SET NULL,
  CONSTRAINT fk_pay_batch   FOREIGN KEY (batch_id)   REFERENCES batches(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Done. 22 tables created in `e-learning`.
