-- ============================================================
-- Leo Learning — affiliate attribution on orders (migration 024)
-- The old checkout passed an affiliateCode straight to the (now removed)
-- self-service payment-recording endpoint; the real order flow needs
-- somewhere to hold it from order-creation through to payment confirmation.
--   mysql -u root e-learning < database/migrations/024_order_affiliate_code.sql
-- ============================================================

USE `e-learning`;

ALTER TABLE orders
  ADD COLUMN affiliate_code VARCHAR(64) NULL AFTER coupon_code;
