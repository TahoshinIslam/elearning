-- ============================================================
-- Leo Learning — per-lesson Q&A / discussion (migration 014)
--   mysql -u root e-learning < database/migrations/014_lesson_qa.sql
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS lesson_questions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id   INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED,
  author_name VARCHAR(191),
  role        VARCHAR(16),
  body        VARCHAR(1000) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_lq_lesson (lesson_id),
  CONSTRAINT fk_lq_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_lq_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_answers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED,
  author_name VARCHAR(191),
  role        VARCHAR(16),
  body        VARCHAR(1000) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_la_question (question_id),
  CONSTRAINT fk_la_question FOREIGN KEY (question_id) REFERENCES lesson_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_la_user     FOREIGN KEY (user_id)     REFERENCES users(id)            ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
