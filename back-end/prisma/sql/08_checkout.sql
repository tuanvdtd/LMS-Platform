-- ============================================================================
--  Bổ sung cho migration checkout.
--  Cách áp dụng: dán vào cuối migration.sql do `migrate diff` sinh ra.
-- ============================================================================

-- Mã coupon nhận thêm dấu chấm như Udemy.
ALTER TABLE coupons DROP CONSTRAINT chk_coupon_code,
  ADD CONSTRAINT chk_coupon_code CHECK (code ~ '^[A-Z0-9._-]{6,20}$');
