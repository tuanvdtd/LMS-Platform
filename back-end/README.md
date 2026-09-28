# SkillPath — back-end

NestJS 12 + Prisma 6 + Better Auth. Thiết kế auth: `../docs/superpowers/specs/2026-09-28-auth-better-auth-design.md`.

## Chạy lần đầu

```bash
pnpm install
cp .env.example .env        # điền giá trị (dịch vụ dev)
pnpm db:deploy              # áp dụng migration
pnpm prisma db execute --schema prisma/schema.prisma --file prisma/sql/02_pg_cron.sql   # một lần mỗi môi trường, xem dưới
pnpm start:dev              # http://localhost:4000/api
```

## pg_cron — dọn user chưa xác minh

`prisma/sql/02_pg_cron.sql` xoá user chưa xác minh email sau 7 ngày (3h sáng giờ VN hằng ngày; pg_cron chạy theo UTC nên lịch là 20:00 UTC).
Bật extension `pg_cron` trong Supabase Dashboard trước. **Không** đưa vào migration:
shadow DB của `prisma migrate dev` không tạo được pg_cron.

## Admin đầu tiên

Không có endpoint tự nâng quyền. Đăng ký, xác minh email, rồi chạy:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

## Test

```bash
pnpm test        # unit
pnpm test:e2e    # cần .env trỏ tới DB + Redis dev; mail được mock
```
