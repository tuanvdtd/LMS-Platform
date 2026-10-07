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
