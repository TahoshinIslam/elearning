-- ============================================================
-- Leo Learning — discount coupons (migration 006)
--   mysql -u root e-learning < database/migrations/006_coupons.sql
-- percent: value = %, fixed: value = ৳ off. tenant_id NULL = global.
-- ============================================================

USE `e-learning`;

CREATE TABLE IF NOT EXISTS coupons (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(64) NOT NULL UNIQUE,
  type        ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  value       INT UNSIGNED NOT NULL,
  expires_at  DATE NULL,
  usage_limit INT UNSIGNED NULL,           -- NULL = unlimited
  used_count  INT UNSIGNED NOT NULL DEFAULT 0,
  tenant_id   INT UNSIGNED NULL,           -- NULL = valid across all centers
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_coupon_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- demo coupons (idempotent)
INSERT INTO coupons (code, type, value, expires_at, usage_limit, tenant_id) VALUES
  ('SAVE20',    'percent', 20, '2026-12-31', NULL, 1),
  ('FLAT500',   'fixed',   500, '2026-12-31', 100, 1),
  ('WELCOME10', 'percent', 10, NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE type=VALUES(type), value=VALUES(value), expires_at=VALUES(expires_at),
  usage_limit=VALUES(usage_limit), tenant_id=VALUES(tenant_id), is_active=1;
