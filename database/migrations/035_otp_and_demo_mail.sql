-- One-time codes for passwordless login and password recovery. Only a
-- SHA-256 of the code is stored; codes expire and lock after 5 wrong tries.
CREATE TABLE IF NOT EXISTS otp_codes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(191) NOT NULL,
  purpose    ENUM('login','reset') NOT NULL,
  code_hash  CHAR(64) NOT NULL,
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_otp_email (email, purpose, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo mail transport: outgoing mail is stored here and shown in the demo
-- inbox (/dev/mailbox) instead of being sent. Replace with a real provider.
CREATE TABLE IF NOT EXISTS demo_mail (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  to_email   VARCHAR(191) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  body_text  TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_mail_to (to_email, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
