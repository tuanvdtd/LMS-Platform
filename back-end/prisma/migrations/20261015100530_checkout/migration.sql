-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "idempotencyKey" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "orders_userId_idempotencyKey_key" ON "orders"("userId", "idempotencyKey");

-- ============================================================================
--  Bổ sung cho migration checkout (spec 2026-10-15-stripe-checkout §4).
--  Cách áp dụng: dán vào cuối migration.sql do `migrate diff` sinh ra.
-- ============================================================================

-- Mã coupon nhận thêm dấu chấm như Udemy (P12).
ALTER TABLE coupons DROP CONSTRAINT chk_coupon_code,
  ADD CONSTRAINT chk_coupon_code CHECK (code ~ '^[A-Z0-9._-]{6,20}$');
