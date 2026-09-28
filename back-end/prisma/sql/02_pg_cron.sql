-- ---------------------------------------------------------------------------
--  8. Dọn user chưa xác minh email sau 7 ngày (pg_cron, 3h sáng giờ VN hằng ngày; pg_cron chạy theo UTC nên lịch là 20:00 UTC)
--  KHÔNG dán vào migration (shadow DB của migrate dev không tạo được pg_cron).
--  Tách ra prisma/sql/02_pg_cron.sql, chạy tay sau migrate deploy:
--    psql "$DIRECT_URL" -f prisma/sql/02_pg_cron.sql
--  Bật extension pg_cron trong Supabase Dashboard trước. account/session xoá
--  theo nhờ onDelete: Cascade. User chưa xác minh không đăng nhập được nên
--  không có đơn hàng / ghi danh nào để mất.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('purge-unverified-users', '0 20 * * *', $$
  DELETE FROM "user"
  WHERE "emailVerified" = false AND "createdAt" < now() - interval '7 days'
$$);
