-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid');

-- AlterTable
ALTER TABLE "instructor_profiles" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankBin" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "payoutId" UUID;

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" UUID,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" UUID NOT NULL,
    "instructorId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "bankBin" TEXT NOT NULL,
    "bankAccountNo" TEXT NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "bankTxnRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "paidById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payouts_status_period_idx" ON "payouts"("status", "period");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_instructorId_period_key" ON "payouts"("instructorId", "period");

-- CreateIndex
CREATE INDEX "order_items_instructorId_payoutId_idx" ON "order_items"("instructorId", "payoutId");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================================
--  Bổ sung cho migration revenue_payout (spec 2026-10-05-revenue-share-payout §3.1).
--  Cách áp dụng: dán vào cuối migration.sql do `migrate diff` sinh ra.
--  Không thêm object mới vào danh sách drift của README (chỉ CHECK chk_* + 1 dòng seed).
-- ============================================================================

ALTER TABLE instructor_profiles ADD CONSTRAINT chk_bank_account CHECK (
     ("bankBin" IS NULL AND "bankAccountNo" IS NULL AND "bankAccountName" IS NULL)
  OR ("bankBin" ~ '^[0-9]{6}$' AND "bankAccountNo" ~ '^[0-9]{6,19}$'
      AND "bankAccountName" ~ '^[A-Z ]{2,50}$')
);

ALTER TABLE payouts
  ADD CONSTRAINT chk_payout_period CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  ADD CONSTRAINT chk_payout_amount CHECK (amount > 0),
  ADD CONSTRAINT chk_payout_paid CHECK ((status = 'paid') = ("paidAt" IS NOT NULL)),
  ADD CONSTRAINT chk_payout_txn_ref CHECK ("bankTxnRef" IS NULL OR length("bankTxnRef") <= 64);

-- updatedAt là @updatedAt của Prisma (không có default ở DB) → ghi tay.
INSERT INTO platform_settings (key, value, "updatedAt")
VALUES ('revenue_share_pct', '70'::jsonb, now())
ON CONFLICT (key) DO NOTHING;
