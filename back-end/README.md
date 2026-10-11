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

## Sửa schema

Có object viết tay mà Prisma không biết (danh sách đầy đủ ở đầu `prisma/sql/05_udemy_curriculum.sql`):

- **Luôn xuất hiện trong mọi `migrate dev --create-only`/`migrate diff`, phải xoá tay:**
  `DROP INDEX uq_sections_position`, `uq_items_position`, `uq_questions_position`.
- **Prisma không nhìn thấy (partial index, CHECK `chk_*`, MV `mv_*`) nên sẽ không sinh lệnh cho chúng —
  đừng viết SQL động vào chúng:** `idx_courses_embedding`, `uq_course_primary_topic`, `idx_qa_unanswered`,
  các partial index ở init (`idx_certificates_active`,
  `idx_submissions_inflight`, `idx_reports_open`, `idx_payment_events_unprocessed`), các CHECK `chk_*` và
  materialized view `mv_*`.

Migration `udemy_curriculum` chỉ an toàn khi các bảng curriculum/quiz/exercise/courses/order_items rỗng
(cột NOT NULL không default, map enum `CourseStatus` cũ không có) — môi trường có dữ liệu phải viết migration riêng.

**Không dùng `prisma migrate dev` (hay `pnpm db:migrate`) để áp dụng**: nó luôn thấy 3 unique DEFERRABLE
ở trên là lệch và sẽ tự sinh + áp `DROP INDEX` cho chúng, mất ràng buộc position mà không báo gì.
`migrate dev` cũng không chạy được trong môi trường không tương tác. Quy trình:

```bash
f=prisma/migrations/$(date -u +%Y%m%d%H%M%S)_<ten>/migration.sql; mkdir -p "$(dirname "$f")"
pnpm prisma migrate diff \
  --from-url "$(node --env-file=.env -e 'process.stdout.write(process.env.DIRECT_URL)')" \
  --to-schema-datamodel prisma/schema.prisma --script > "$f"
# mở $f, xoá 3 dòng DROP INDEX uq_*_position và mọi câu lệnh động tới các object trên
pnpm db:deploy                                     # = prisma migrate deploy
```

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
