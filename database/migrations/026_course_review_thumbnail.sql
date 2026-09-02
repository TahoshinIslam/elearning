-- ============================================================
-- Leo Learning — course review workflow + real thumbnail upload (migration 026)
-- `published` remains the authoritative "is this live on the marketplace"
-- flag (unchanged everywhere it's already read) — `review_status` adds the
-- draft/pending_review/published workflow state on top of it, kept in sync
-- by application code (lib/repo.js courseOp 'publish', lib/courseReviewRepo.js).
--   mysql -u root e-learning < database/migrations/026_course_review_thumbnail.sql
-- ============================================================

USE `e-learning`;

ALTER TABLE courses
  ADD COLUMN review_status ENUM('draft','pending_review','published') NOT NULL DEFAULT 'draft' AFTER published,
  ADD COLUMN review_note TEXT NULL AFTER review_status,
  ADD COLUMN thumbnail_key VARCHAR(255) NULL AFTER thumb,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- backfill: whatever is already live stays "published"; everything else
-- starts as a plain draft (not mid-review — there's no history to infer that from).
UPDATE courses SET review_status = 'published' WHERE published = 1;
