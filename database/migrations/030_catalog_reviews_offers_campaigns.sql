-- ============================================================
-- Leo Learning — catalog taxonomy, badges, reviews, offers, campaigns (migration 030)
-- Additive only. Backfills derive from data already in the database.
--   node database/migrate.mjs 030_catalog_reviews_offers_campaigns.sql
-- ============================================================

USE `e-learning`;

-- ---------- subjects (categories) ----------
-- Courses already reference these slugs; give them real subject rows so the
-- homepage/catalog subject lists are complete and counts accurate.
INSERT IGNORE INTO categories (name, slug, icon) VALUES ('ফিজিক্স', 'physics', '⚛'), ('গণিত', 'math', '∑');
ALTER TABLE categories ADD COLUMN IF NOT EXISTS position INT UNSIGNED NOT NULL DEFAULT 0;

-- ---------- class / academic level ----------
CREATE TABLE IF NOT EXISTS class_levels (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(64) NOT NULL UNIQUE,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS class_id INT UNSIGNED NULL AFTER category,
  ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMP NULL AFTER published,
  ADD COLUMN IF NOT EXISTS featured_order INT UNSIGNED NULL AFTER featured,
  ADD COLUMN IF NOT EXISTS is_upcoming TINYINT(1) NOT NULL DEFAULT 0 AFTER review_note,
  ADD COLUMN IF NOT EXISTS release_date DATE NULL AFTER is_upcoming;

ALTER TABLE courses ADD CONSTRAINT fk_course_class FOREIGN KEY (class_id) REFERENCES class_levels(id) ON DELETE SET NULL;

-- Classes that existing courses already declare in their level text.
INSERT IGNORE INTO class_levels (name, slug, position)
  SELECT 'SSC (নবম–দশম)', 'ssc', 1 FROM DUAL WHERE EXISTS (SELECT 1 FROM courses WHERE level LIKE 'SSC%');
INSERT IGNORE INTO class_levels (name, slug, position)
  SELECT 'HSC (একাদশ–দ্বাদশ)', 'hsc', 2 FROM DUAL WHERE EXISTS (SELECT 1 FROM courses WHERE level LIKE 'HSC%');
UPDATE courses SET class_id = (SELECT id FROM class_levels WHERE slug = 'ssc') WHERE class_id IS NULL AND level LIKE 'SSC%';
UPDATE courses SET class_id = (SELECT id FROM class_levels WHERE slug = 'hsc') WHERE class_id IS NULL AND level LIKE 'HSC%';

-- "New" badge eligibility starts at the FIRST publication and is never reset.
UPDATE courses SET first_published_at = created_at, updated_at = updated_at WHERE published = 1 AND first_published_at IS NULL;
-- Existing featured courses keep a deterministic order.
UPDATE courses SET featured_order = id, updated_at = updated_at WHERE featured = 1 AND featured_order IS NULL;

-- ---------- reviews ----------
ALTER TABLE course_reviews
  MODIFY COLUMN text TEXT NULL,
  ADD COLUMN IF NOT EXISTS verified_purchase TINYINT(1) NOT NULL DEFAULT 0 AFTER student_id,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL AFTER created_at;
CREATE UNIQUE INDEX IF NOT EXISTS uq_review_student_course ON course_reviews (course_id, student_id);
UPDATE course_reviews r
  SET r.verified_purchase = 1
  WHERE r.student_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM orders o JOIN order_items oi ON oi.order_id = o.id
    WHERE o.student_id = r.student_id AND oi.course_id = r.course_id AND o.status = 'paid' AND oi.unit_price > 0);

-- ---------- upcoming-course waitlist (real opt-in "Notify me") ----------
CREATE TABLE IF NOT EXISTS course_waitlist (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id  INT UNSIGNED NOT NULL,
  email      VARCHAR(191) NOT NULL,
  user_id    INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_waitlist (course_id, email),
  CONSTRAINT fk_waitlist_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- automatic discount offers ----------
-- Applied by server pricing (course page, catalog, checkout, order) — one rule set.
CREATE TABLE IF NOT EXISTS offers (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(191) NOT NULL,
  type        ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  value       INT UNSIGNED NOT NULL,
  scope       ENUM('course','subject','class','all') NOT NULL DEFAULT 'course',
  scope_value VARCHAR(191) NULL,          -- course id, subject slug or class slug
  starts_at   DATETIME NOT NULL,
  ends_at     DATETIME NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_offer_window (is_active, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS list_price INT UNSIGNED NULL AFTER unit_price,
  ADD COLUMN IF NOT EXISTS offer_id INT UNSIGNED NULL AFTER list_price;
UPDATE order_items SET list_price = unit_price WHERE list_price IS NULL;

-- ---------- promotional campaigns (popups + homepage carousel slides) ----------
CREATE TABLE IF NOT EXISTS campaigns (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kind            ENUM('popup','slide') NOT NULL,
  status          ENUM('draft','published') NOT NULL DEFAULT 'draft',
  enabled         TINYINT(1) NOT NULL DEFAULT 1,
  slug            VARCHAR(120) NOT NULL UNIQUE,
  title           VARCHAR(191) NOT NULL,
  body            VARCHAR(600) NULL,
  image_key       VARCHAR(255) NULL,
  image_alt       VARCHAR(255) NULL,
  cta_label       VARCHAR(80) NOT NULL,
  target_type     ENUM('course','subject','class','collection','campaign','upcoming') NOT NULL,
  target_value    VARCHAR(191) NULL,
  offer_id        INT UNSIGNED NULL,
  starts_at       DATETIME NULL,
  ends_at         DATETIME NULL,
  audience        ENUM('all','guests','students') NOT NULL DEFAULT 'all',
  pages           VARCHAR(191) NOT NULL DEFAULT 'home',
  frequency_hours INT UNSIGNED NOT NULL DEFAULT 24,
  position        INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campaign_live (kind, status, enabled),
  CONSTRAINT fk_campaign_offer FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
