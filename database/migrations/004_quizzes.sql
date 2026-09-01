-- ============================================================
-- Leo Learning — quiz engine (migration 004)
-- MCQ quizzes attached to lessons of type 'quiz'.
-- Run after 001. Seed sample questions with database/seed_quizzes.mjs
--   mysql -u root e-learning < database/migrations/004_quizzes.sql
-- ============================================================

USE `e-learning`;

-- A question belongs to a quiz-type lesson.
CREATE TABLE IF NOT EXISTS quiz_questions (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT UNSIGNED NOT NULL,
  question  VARCHAR(500) NOT NULL,
  position  INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_qq_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_options (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL,
  text        VARCHAR(500) NOT NULL,
  is_correct  TINYINT(1) NOT NULL DEFAULT 0,
  position    INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_qo_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One attempt per student per quiz (re-submitting overwrites the score).
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL,
  student_id   INT UNSIGNED NOT NULL,
  student_name VARCHAR(191),
  score        INT UNSIGNED NOT NULL DEFAULT 0,
  max_score    INT UNSIGNED NOT NULL DEFAULT 0,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attempt (lesson_id, student_id),
  CONSTRAINT fk_qa_lesson  FOREIGN KEY (lesson_id)  REFERENCES lessons(id)  ON DELETE CASCADE,
  CONSTRAINT fk_qa_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The option the student chose for each question in an attempt.
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id  INT UNSIGNED NOT NULL,
  question_id INT UNSIGNED NOT NULL,
  option_id   INT UNSIGNED,
  UNIQUE KEY uq_answer (attempt_id, question_id),
  CONSTRAINT fk_ans_attempt  FOREIGN KEY (attempt_id)  REFERENCES quiz_attempts(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ans_question FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
