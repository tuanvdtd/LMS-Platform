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

## OAuth Google / GitHub

Provider thiếu key thì back-end bỏ hẳn provider đó (FE hiện "tạm thời chưa khả dụng").

- Google Cloud Console → Credentials → OAuth client (Web application)
  - Authorized JavaScript origins: `FE_URL` (dev `http://localhost:3000`)
  - Authorized redirect URIs: `{BETTER_AUTH_URL}/api/auth/callback/google` (dev `http://localhost:4000/api/auth/callback/google`)
- GitHub → Settings → Developer settings → OAuth Apps
  - Homepage URL: `FE_URL`
  - Authorization callback URL: `{BETTER_AUTH_URL}/api/auth/callback/github`
- Điền `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` vào `.env`, restart.

Prod: bắt buộc `COOKIE_DOMAIN` (vd `.skillpath.tuandt.me`) — FE (`proxy.ts`) phải đọc được cookie session do back-end set.

## Test

```bash
pnpm test        # unit
pnpm test:e2e    # cần .env trỏ tới DB + Redis dev; mail được mock
```
