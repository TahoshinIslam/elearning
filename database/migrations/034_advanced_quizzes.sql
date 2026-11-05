-- Advanced quiz builder: question types, points, explanations, accepted
-- short answers, per-quiz settings (timer, pass mark, attempts, shuffling,
-- answer reveal) and attempt bookkeeping.
CREATE TABLE IF NOT EXISTS quiz_settings (
  lesson_id         INT UNSIGNED PRIMARY KEY,
  time_limit_sec    INT UNSIGNED NULL,
  pass_percent      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts      TINYINT UNSIGNED NOT NULL DEFAULT 0,      -- 0 = unlimited
  shuffle_questions TINYINT(1) NOT NULL DEFAULT 0,
  shuffle_options   TINYINT(1) NOT NULL DEFAULT 0,
  show_answers      ENUM('after_submit','after_pass','never') NOT NULL DEFAULT 'after_submit',
  instructions      TEXT NULL,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_qs_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE quiz_questions
  MODIFY question TEXT NOT NULL,
  ADD COLUMN type ENUM('single','multiple','true_false','short') NOT NULL DEFAULT 'single',
  ADD COLUMN points TINYINT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN explanation TEXT NULL,
  ADD COLUMN accepted_answers TEXT NULL;

ALTER TABLE quiz_answers
  ADD COLUMN selected VARCHAR(500) NULL,
  ADD COLUMN text_answer VARCHAR(500) NULL,
  ADD COLUMN is_correct TINYINT(1) NULL;

ALTER TABLE quiz_attempts
  ADD COLUMN attempts_used INT UNSIGNED NOT NULL DEFAULT 1,
  ADD COLUMN passed TINYINT(1) NULL,
  ADD COLUMN best_score INT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN time_spent_sec INT UNSIGNED NULL;
UPDATE quiz_attempts SET best_score = score;

-- a timed attempt starts here; the server checks the deadline on submit
CREATE TABLE IF NOT EXISTS quiz_starts (
  lesson_id  INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lesson_id, student_id),
  CONSTRAINT fk_qst_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT fk_qst_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
