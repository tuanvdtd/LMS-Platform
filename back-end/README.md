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
  `idx_submissions_inflight`, `uq_submissions_inflight_user`, `idx_reports_open`, `idx_payment_events_unprocessed`), các CHECK `chk_*` và
  materialized view `mv_*`.

Migration `udemy_curriculum` chỉ an toàn khi các bảng curriculum/quiz/exercise/courses/order_items rỗng
(cột NOT NULL không default, map enum `CourseStatus` cũ không có) — môi trường có dữ liệu phải viết migration riêng.

Migration `exercise_grading` cũng chỉ an toàn khi các bảng `exercises`, `exercise_starter_codes`, `submissions`, `submission_results`
rỗng — đếm trước khi deploy prod (`SELECT count(*)` từng bảng); có dữ liệu thì phải viết migration riêng.

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

## RabbitMQ (CloudAMQP)

Mail đi qua queue `mail.send` → `MailConsumer` (cùng process) → Brevo. Lỗi tạm (429/5xx/mạng) chờ 60s ở
`mail.retry` rồi thử lại, tối đa 4 lần; hỏng hẳn vào `mail.dead` (giữ 3 ngày) + Sentry. Không publish được thì
gửi thẳng Brevo. Thiết kế: `../docs/superpowers/specs/2026-10-16-rabbitmq-mail-queue-design.md`.

- `RABBITMQ_URL` bắt buộc ở mọi môi trường boot `AppModule` (kể cả e2e/CI). Dev dùng instance CloudAMQP riêng.
- Xem mail hỏng: CloudAMQP → RabbitMQ Manager → Queues → `mail.dead` → Get messages.
- Arguments của queue (TTL, DLX) bất biến: sửa `MAIL_QUEUES` trong `src/infra/rabbit.module.ts` thì phải
  **xoá queue đó trên RabbitMQ Manager** rồi khởi động lại, nếu không consumer lỗi `PRECONDITION_FAILED`.
- `RABBITMQ_CONSUMERS=off` tắt consumer (vitest e2e đặt sẵn); publish vẫn chạy → e2e nào không mock
  `MailService` sẽ để job nằm trong `mail.send` của instance dev (dev server đang chạy sẽ gửi chúng).

## Chạy Piston (chấm bài code)

Bài tập code chạy trong [Piston](https://github.com/engineer-man/piston) (tự host, không mạng, giới hạn CPU/RAM/số tiến trình). Thiết kế: `../docs/superpowers/specs/2026-10-19-coding-exercise-design.md`.

```bash
docker compose -f piston/docker-compose.yml up -d   # image pin theo digest, bind 127.0.0.1:2000
bash piston/install-runtimes.sh                     # cài node 20.11.1, python 3.12.0, gcc 10.2.0; chạy lại được (đã có thì bỏ qua)
curl -s http://127.0.0.1:2000/api/v2/runtimes       # phải thấy javascript 20.11.1, python 3.12.0, c++ 10.2.0
```

- Cài lần đầu mất ~6 phút (tải package, nằm trong volume `piston_packages` — tạo lại container không mất).
- `PISTON_URL` mặc định `http://127.0.0.1:2000`. Version runtime phải khớp `LANGUAGES` ở `src/exercise/code-runner.ts`.
- Chưa chạy Piston: chạy thử / kiểm lời giải báo lỗi; bài nộp vẫn vào hàng đợi, consumer thử lại rồi báo `internal_error`.
- Nâng Piston: đổi digest trong `piston/docker-compose.yml` (hành vi response có thể đổi — chạy lại e2e chấm bài).

## Triển khai Piston trên EC2

**Chung máy với API** (giai đoạn đầu): không mở cổng 2000 trong security group; map `127.0.0.1:2000:2000`, hoặc cho API
vào cùng network Docker rồi bỏ `ports` và đặt `PISTON_URL=http://piston:2000`. Ước lượng: t3.small tối thiểu, t3.medium thoải mái
(Piston trần 1 CPU / 1 GB) — theo dõi CPU credit, bật unlimited nếu cạn.

**Tách máy khi có người dùng thật**: `privileged: true` là bắt buộc của Piston, sandbox thủng = root trên host, nên máy chạy code học viên phải riêng.
Cùng VPC, subnet private, security group chỉ cho API vào cổng 2000; máy Piston không gắn IAM role, không để secret — API chỉ đổi `PISTON_URL`.

`RABBITMQ_CONSUMERS=off` tắt cả consumer chấm bài lẫn `MailConsumer` (không tắt riêng được); tách worker ra instance riêng thì feature notification realtime
(socket.io) sau này cần Redis adapter để thông báo từ worker tới đúng API instance.

## Test

```bash
pnpm test        # unit
pnpm test:e2e    # cần .env trỏ tới DB + Redis + RabbitMQ dev; mail được mock
```
