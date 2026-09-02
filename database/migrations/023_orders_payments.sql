-- ============================================================
-- Leo Learning — real checkout: orders, order_items, payment_events (migration 023)
-- Replaces the old "record a payment, then separately call enroll" flow
-- (client-controlled amount, no payment/enrollment link) with an
-- authoritative, server-priced order that a payment gateway (bKash) settles,
-- and that alone is allowed to create an enrollment.
--
-- Also fixes enrollments to support a course-level (not just batch-level)
-- purchase: a marketplace enrollment created from an order has no batch
-- (self-paced recorded course, not a live cohort), so batch_id must be
-- nullable; a new unique constraint enforces one enrollment per student per
-- course regardless of batch.
--   mysql -u root e-learning < database/migrations/023_orders_payments.sql
-- ============================================================

USE `e-learning`;

-- ---------- enrollments: allow a course-only (no batch) enrollment ----------
ALTER TABLE enrollments
  MODIFY COLUMN batch_id INT UNSIGNED NULL;

ALTER TABLE enrollments
  ADD CONSTRAINT uq_enrollment_course UNIQUE (student_id, course_id);

-- ---------- orders (one per checkout attempt) ----------
CREATE TABLE orders (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id         INT UNSIGNED NOT NULL,
  status             ENUM('pending','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  amount             INT UNSIGNED NOT NULL,      -- authoritative total, server-computed, after coupon
  currency           VARCHAR(8) NOT NULL DEFAULT 'BDT',
  coupon_code        VARCHAR(64) NULL,
  gateway            ENUM('bkash','none') NOT NULL DEFAULT 'bkash', -- 'none' = free order, no gateway round trip
  gateway_payment_id VARCHAR(64) NULL,           -- bKash paymentID once createPayment succeeds
  gateway_trx_id     VARCHAR(64) NULL,           -- bKash trxID once executePayment confirms success
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_gateway_payment (gateway_payment_id),
  CONSTRAINT fk_order_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- order_items (one row per course in the order) ----------
CREATE TABLE order_items (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id   INT UNSIGNED NOT NULL,
  course_id  INT UNSIGNED NOT NULL,
  unit_price INT UNSIGNED NOT NULL,   -- price snapshot at order time — never re-read from courses later
  UNIQUE KEY uq_order_item (order_id, course_id),
  CONSTRAINT fk_item_order  FOREIGN KEY (order_id)  REFERENCES orders(id)   ON DELETE CASCADE,
  -- RESTRICT (not CASCADE): a course with real purchase history should never
  -- be hard-deletable out from under its financial records.
  CONSTRAINT fk_item_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------- payment_events (append-only gateway interaction log + idempotency) ----------
CREATE TABLE payment_events (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id           INT UNSIGNED NOT NULL,
  gateway            VARCHAR(16) NOT NULL,
  event_type         ENUM('create','execute','callback_failed') NOT NULL,
  gateway_payment_id VARCHAR(64) NULL,
  gateway_trx_id     VARCHAR(64) NULL,
  status             VARCHAR(32) NULL,
  raw_payload        TEXT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- THE idempotency guard: a duplicate callback for the same paymentID's
  -- 'execute' event hits this constraint instead of re-processing.
  UNIQUE KEY uq_payment_event (gateway_payment_id, event_type),
  CONSTRAINT fk_event_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
