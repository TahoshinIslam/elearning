-- ============================================================
-- Leo Learning — video assets + lesson progress (migration 025)
-- The two tables the audit found missing entirely: nothing in the schema
-- could reference a video file, and nothing tracked per-lesson watch
-- position or resume state.
--   mysql -u root e-learning < database/migrations/025_video_progress.sql
-- ============================================================

USE `e-learning`;

-- ---------- video_assets (one real video per video-type lesson) ----------
CREATE TABLE video_assets (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id        INT UNSIGNED NOT NULL,
  provider         ENUM('s3','r2') NOT NULL,
  storage_key      VARCHAR(255) NOT NULL,   -- object key in the bucket; playback URLs are always freshly signed, never public
  duration_seconds INT UNSIGNED NULL,
  status           ENUM('pending','ready','failed') NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_video_lesson (lesson_id),
  CONSTRAINT fk_video_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- lesson_progress (watch position + resume + completion) ----------
CREATE TABLE lesson_progress (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id        INT UNSIGNED NOT NULL,
  lesson_id         INT UNSIGNED NOT NULL,
  watched_seconds   INT UNSIGNED NOT NULL DEFAULT 0,
  duration_seconds  INT UNSIGNED NULL,
  completed         TINYINT(1) NOT NULL DEFAULT 0,
  completed_at      TIMESTAMP NULL,
  last_activity_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress_student_lesson (student_id, lesson_id),
  CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson  FOREIGN KEY (lesson_id)  REFERENCES lessons(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
