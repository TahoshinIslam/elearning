-- ============================================================
-- Leo Learning — course commerce + learning hardening (migration 028)
--
-- Purely additive and idempotent (MariaDB 10.4+/MySQL 8 `IF NOT EXISTS`
-- forms). Nothing is dropped, renamed or reset; existing rows are only
-- backfilled where a new column needs a value derived from data that is
-- already there.
--
--   node database/migrate.mjs 028_commerce_learning.sql
--   (or: mysql -u root e-learning < database/migrations/028_commerce_learning.sql)
-- ============================================================

USE `e-learning`;

-- ---------- lesson_progress: real watch tracking ----------
-- `watched_seconds` used to be the playback position, so seeking to the end
-- of a video marked it complete. Completion is now derived from the union of
-- ranges the player actually played (`watched_ranges`, browser `played`
-- TimeRanges), capped server-side by elapsed wall time. `position_seconds`
-- is the resume point; `position_client_ms` lets the server drop a stale
-- save that arrives after a newer one.
ALTER TABLE lesson_progress
  ADD COLUMN IF NOT EXISTS position_seconds INT UNSIGNED NOT NULL DEFAULT 0 AFTER watched_seconds,
  ADD COLUMN IF NOT EXISTS covered_seconds INT UNSIGNED NOT NULL DEFAULT 0 AFTER position_seconds,
  ADD COLUMN IF NOT EXISTS watched_ranges TEXT NULL AFTER covered_seconds,
  ADD COLUMN IF NOT EXISTS position_client_ms BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER watched_ranges,
  ADD COLUMN IF NOT EXISTS completion_source ENUM('watch','manual','quiz','assignment') NULL AFTER completed_at;

UPDATE lesson_progress SET position_seconds = watched_seconds WHERE position_seconds = 0 AND watched_seconds > 0;
UPDATE lesson_progress SET completion_source = 'watch' WHERE completed = 1 AND completion_source IS NULL;

-- Quiz attempts and assignment submissions already prove those lessons were
-- done; record them as completed lessons so course completion is one rule:
-- unique completed lessons / lessons in the course.
INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at, completion_source)
  SELECT a.student_id, a.lesson_id, 1, a.submitted_at, 'quiz' FROM quiz_attempts a
ON DUPLICATE KEY UPDATE completed = 1, completed_at = COALESCE(lesson_progress.completed_at, VALUES(completed_at)),
  completion_source = COALESCE(lesson_progress.completion_source, 'quiz');

INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at, completion_source)
  SELECT s.student_id, s.lesson_id, 1, COALESCE(s.submitted_at, NOW()), 'assignment' FROM submissions s
ON DUPLICATE KEY UPDATE completed = 1, completed_at = COALESCE(lesson_progress.completed_at, VALUES(completed_at)),
  completion_source = COALESCE(lesson_progress.completion_source, 'assignment');

-- ---------- lessons: description + machine-readable duration ----------
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS summary TEXT NULL AFTER title,
  ADD COLUMN IF NOT EXISTS duration_seconds INT UNSIGNED NULL AFTER duration;

-- ---------- lesson resources (downloadable files / links, access-controlled) ----------
CREATE TABLE IF NOT EXISTS lesson_resources (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id    INT UNSIGNED NOT NULL,
  title        VARCHAR(191) NOT NULL,
  kind         ENUM('file','link') NOT NULL DEFAULT 'file',
  storage_key  VARCHAR(255) NULL,       -- private object key (kind=file)
  url          VARCHAR(512) NULL,       -- external http(s) URL (kind=link)
  content_type VARCHAR(128) NULL,
  size_bytes   BIGINT UNSIGNED NULL,
  status       ENUM('pending','ready') NOT NULL DEFAULT 'ready',
  position     INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resource_lesson (lesson_id),
  CONSTRAINT fk_resource_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- captions (WebVTT tracks per video lesson) ----------
CREATE TABLE IF NOT EXISTS lesson_captions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lesson_id   INT UNSIGNED NOT NULL,
  lang        VARCHAR(16) NOT NULL,
  label       VARCHAR(64) NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_caption_lang (lesson_id, lang),
  CONSTRAINT fk_caption_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- video_assets: local private storage + failure detail ----------
ALTER TABLE video_assets
  MODIFY COLUMN provider ENUM('s3','r2','local') NOT NULL,
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(128) NULL AFTER storage_key,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT UNSIGNED NULL AFTER content_type,
  ADD COLUMN IF NOT EXISTS error_message VARCHAR(255) NULL AFTER status;

-- ---------- courses: intended audience ----------
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS audience TEXT NULL AFTER description;

-- ---------- enrollments: provenance + last accessed lesson ----------
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS order_id INT UNSIGNED NULL AFTER course_id,
  ADD COLUMN IF NOT EXISTS last_lesson_id INT UNSIGNED NULL AFTER status,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP NULL AFTER last_lesson_id;

-- ---------- orders: idempotency, totals breakdown, lifecycle timestamps ----------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64) NULL AFTER student_id,
  ADD COLUMN IF NOT EXISTS subtotal INT UNSIGNED NULL AFTER status,
  ADD COLUMN IF NOT EXISTS discount INT UNSIGNED NOT NULL DEFAULT 0 AFTER subtotal,
  ADD COLUMN IF NOT EXISTS gateway_url VARCHAR(1024) NULL AFTER gateway_trx_id,
  ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(64) NULL AFTER gateway_url,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP NULL AFTER failure_reason,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL AFTER paid_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_idempotency ON orders (student_id, idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_student_status ON orders (student_id, status);

-- paid_at first: every later backfill would bump updated_at (ON UPDATE),
-- and updated_at is the closest record of when a historic order was paid.
UPDATE orders SET paid_at = updated_at, updated_at = updated_at WHERE status = 'paid' AND paid_at IS NULL;
UPDATE orders o
  SET o.updated_at = o.updated_at, o.subtotal = (SELECT COALESCE(SUM(oi.unit_price), o.amount) FROM order_items oi WHERE oi.order_id = o.id)
  WHERE o.subtotal IS NULL;
UPDATE orders SET updated_at = updated_at, discount = GREATEST(CAST(subtotal AS SIGNED) - CAST(amount AS SIGNED), 0) WHERE discount = 0 AND subtotal > amount;

-- order_items: keep the title the buyer actually purchased, alongside the price snapshot
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS title_snapshot VARCHAR(191) NULL AFTER unit_price;
UPDATE order_items oi JOIN courses c ON c.id = oi.course_id
  SET oi.title_snapshot = c.title WHERE oi.title_snapshot IS NULL;

-- payment_events: also log status queries, reconciliation and refunds
ALTER TABLE payment_events
  MODIFY COLUMN event_type ENUM('create','execute','callback_failed','query','reconcile','refund') NOT NULL;

-- link existing order-created enrollments to their order where unambiguous
UPDATE enrollments e
  JOIN order_items oi ON oi.course_id = e.course_id
  JOIN orders o ON o.id = oi.order_id AND o.student_id = e.student_id AND o.status = 'paid'
  SET e.order_id = o.id
  WHERE e.order_id IS NULL AND e.batch_id IS NULL;
