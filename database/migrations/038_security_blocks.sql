-- Security shield (lib/shield.js): temporary or permanent blocks for abusive
-- IP addresses or user accounts. Expired rows are ignored; unblocking sets
-- lifted_at so the history stays for review.
CREATE TABLE IF NOT EXISTS security_blocks (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip         VARCHAR(64) NULL,
  user_id    INT UNSIGNED NULL,
  reason     VARCHAR(255) NOT NULL,
  source     ENUM('auto','manual') NOT NULL DEFAULT 'auto',
  strikes    INT UNSIGNED NOT NULL DEFAULT 1,
  until      DATETIME NULL,                 -- NULL = until lifted
  created_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lifted_at  DATETIME NULL,
  lifted_by  INT UNSIGNED NULL,
  KEY idx_sb_ip (ip), KEY idx_sb_user (user_id), KEY idx_sb_active (lifted_at, until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
