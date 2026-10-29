-- ============================================================================
--  Bổ sung cho migration instructor_application_steps.
--  Cách áp dụng: dán vào cuối migration.sql (migration này viết tay, không sinh bằng `migrate diff`).
--  Không thêm object mới vào danh sách drift của README (chỉ CHECK chk_*).
-- ============================================================================

-- Tài khoản nhận tiền trong đơn: cùng luật với chk_bank_account của instructor_profiles.
ALTER TABLE instructor_applications ADD CONSTRAINT chk_application_bank CHECK (
     ("bankBin" IS NULL AND "bankAccountNo" IS NULL AND "bankAccountName" IS NULL)
  OR ("bankBin" ~ '^[0-9]{6}$' AND "bankAccountNo" ~ '^[0-9]{6,19}$'
      AND "bankAccountName" ~ '^[A-Z ]{2,50}$')
);
