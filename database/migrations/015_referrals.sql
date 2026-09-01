-- ============================================================
-- Leo Learning — referral system (migration 015)
-- Every user gets a referral code; new signups can credit a referrer.
--   mysql -u root e-learning < database/migrations/015_referrals.sql
-- ============================================================

USE `e-learning`;

ALTER TABLE users
  ADD COLUMN referral_code VARCHAR(16) NULL UNIQUE AFTER status;

CREATE TABLE IF NOT EXISTS referrals (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referrer_user_id  INT UNSIGNED NOT NULL,
  referred_user_id  INT UNSIGNED NOT NULL UNIQUE,   -- a user can only be referred once
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ref_referrer FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ref_referred FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
