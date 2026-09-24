# ĐỀ XUẤT ĐỒ ÁN TỐT NGHIỆP

## Tên đề tài

**Xây dựng nền tảng thương mại khoá học IT tích hợp đánh giá năng lực tự động và gợi ý lộ trình học cá nhân hoá**

---

## 1. Tổng quan

- **Bối cảnh:** Nền tảng bán khoá học IT trực tuyến, trong đó mỗi khoá học có bài kiểm tra trắc nghiệm và bài tập lập trình được chấm tự động.
- **Về tính chính thống của nội dung:** Hệ thống **không tự cung cấp nội dung**. Hệ thống là nền tảng cho giảng viên đã được xác minh đăng khoá học của chính họ. Tính chính thống được đảm bảo bằng **quy trình xác minh giảng viên và kiểm duyệt khoá học** (mục 3.2).
- **Trọng tâm đề tài:** Các chức năng xử lý nghiệp vụ và dữ liệu: chấm bài tự động, gợi ý cá nhân hoá dựa trên năng lực, phân tích học tập cho giảng viên.

## 2. Tác nhân

| Tác nhân | Vai trò |
|---|---|
| Học viên | Mua khoá học, học, làm bài kiểm tra, nhận gợi ý và chứng chỉ |
| Giảng viên | Tạo khoá học và bài kiểm tra, theo dõi dashboard phân tích |
| Admin | Xác minh giảng viên, duyệt khoá học, xử lý báo cáo vi phạm |

---

## 3. Chức năng

### 3.1. Chức năng nền (đã có sẵn)

- Đăng ký, đăng nhập, phân quyền theo vai trò
- Quản lý khoá học (chương, bài học, video), học video và lưu tiến độ
- Giỏ hàng, thanh toán

### 3.2. Xác minh & kiểm duyệt nội dung

| Chức năng | Mô tả |
|---|---|
| Xác minh giảng viên | Giảng viên nộp hồ sơ (bằng cấp, kinh nghiệm, portfolio). Admin duyệt xong mới được tạo khoá học |
| Duyệt khoá học | Giảng viên cam kết bản quyền nội dung khi gửi duyệt. Admin duyệt hoặc từ chối kèm lý do. Chỉ khoá đã duyệt mới được bán |
| Báo cáo vi phạm | Học viên báo cáo nội dung sai hoặc vi phạm bản quyền. Admin xử lý: ẩn khoá, yêu cầu sửa |
| Bảo vệ video | Link video có thời hạn (signed URL), chỉ học viên đã mua mới xem được |

### 3.3. Bài kiểm tra & đánh giá năng lực

| Chức năng | Mô tả |
|---|---|
| Ngân hàng câu hỏi | Giảng viên tạo câu hỏi trắc nghiệm, **mỗi câu gắn tag kỹ năng** (vd `react-hooks`, `sql-join`) |
| Bài tập lập trình | Đề bài, test case công khai và test ẩn, giới hạn thời gian và bộ nhớ, hỗ trợ nhiều ngôn ngữ |
| Chấm tự động | Trắc nghiệm chấm ngay. Bài code chạy trong sandbox cô lập, trả về kết quả Accepted / Wrong Answer / Time Limit / Runtime Error và điểm theo số test đạt |
| Hồ sơ năng lực | Tự động tính **độ thành thạo từng kỹ năng** của học viên từ kết quả các bài kiểm tra |
| Chứng chỉ | Hoàn thành khoá và đạt bài test cuối khoá thì được cấp chứng chỉ PDF có **mã QR để xác thực** |

### 3.4. Gợi ý cá nhân hoá (Recommendation)

Gợi ý dựa trên **năng lực thực tế** của học viên (lấy từ kết quả bài kiểm tra), không chỉ dựa trên lịch sử mua hàng.

| Tầng | Gợi ý | Dữ liệu sử dụng |
|---|---|---|
| 1. Theo mục tiêu | Khoá học phù hợp cho người mới | Mục tiêu (Backend, Frontend, Data…) và trình độ chọn lúc đăng ký. Dùng cho người mới chưa có dữ liệu (cold start) |
| 2. Theo lỗ hổng kỹ năng ⭐ | Bài học cần ôn lại trong khoá, và khoá học nên học tiếp | Độ thành thạo từng kỹ năng + **đồ thị kỹ năng tiên quyết** (vd JS → React → Next.js). Chỉ gợi ý khoá khi học viên đã vững kỹ năng tiên quyết |
| 3. Theo hành vi chung | "Học viên mua khoá này cũng mua…" | Tần suất các khoá được mua cùng nhau (item-based collaborative filtering) |
| 4. Theo nội dung (bổ sung) | Khoá có nội dung gần giống khoá vừa học | Embedding mô tả khoá học lưu bằng **pgvector**, tìm theo độ tương đồng cosine. Giúp cả khoá mới chưa ai mua (cold start phía khoá học) |

- **Gợi ý có giải thích lý do**, ví dụ: *"Gợi ý vì bạn đạt 35% ở kỹ năng React Hooks"*
- **Đánh giá:** Dùng dữ liệu học viên giả lập với các điểm yếu biết trước, đo mức gợi ý trúng điểm yếu bằng Precision@K

### 3.5. Dashboard giảng viên

Có bộ lọc theo khoá học và khoảng thời gian, hỗ trợ xuất CSV.

**a) Doanh thu & bán hàng**

| Chỉ số | Mô tả |
|---|---|
| Doanh thu | Tổng, theo ngày/tuần/tháng, theo từng khoá; doanh thu thực nhận sau phí |
| Đơn hàng | Số đơn, giá trị đơn trung bình, số lượt hoàn tiền và tỉ lệ hoàn tiền |
| Phễu chuyển đổi | Xem trang khoá → thêm giỏ → thanh toán → thành công; tỉ lệ rớt ở từng bước |
| So sánh khoá học | Xếp hạng khoá theo doanh thu, số học viên, điểm đánh giá |

**b) Hành vi học**

| Chỉ số | Mô tả |
|---|---|
| Tổng quan | Học viên đang hoạt động (7/30 ngày), tỉ lệ hoàn thành khoá, thời gian học trung bình |
| Đường giữ chân video | Với mỗi video: % người xem còn lại theo từng mốc thời gian, **điểm rơi bỏ** (phút người xem hay bỏ ngang) |
| Điểm tua lại nhiều | Đoạn video bị xem lại nhiều lần, thường là đoạn khó hiểu cần giải thích thêm |
| Tiến độ theo bài | Bài học nào nhiều người dừng lại không học tiếp |

**c) Chất lượng bài kiểm tra**

| Chỉ số | Mô tả |
|---|---|
| Phân bố điểm | Histogram điểm, điểm trung bình, tỉ lệ đạt |
| Độ khó câu hỏi | % học viên trả lời đúng từng câu (difficulty index) |
| Độ phân biệt câu hỏi | Chênh lệch tỉ lệ đúng giữa nhóm 27% điểm cao và 27% điểm thấp (discrimination index), dùng để phát hiện câu hỏi kém chất lượng |
| Phân tích đáp án nhiễu | Tỉ lệ chọn từng đáp án sai; đáp án không ai chọn thì cần thay |
| Bài code | Tỉ lệ Accepted, lỗi phổ biến (WA/TLE/RE), số lần nộp trung bình đến khi đạt |
| Kỹ năng yếu của lớp | Heatmap độ thành thạo theo kỹ năng của toàn bộ học viên trong khoá |

**d) Theo từng học viên**

| Chỉ số | Mô tả |
|---|---|
| Hồ sơ chi tiết | Tiến độ, lịch sử điểm, radar chart kỹ năng, lần hoạt động gần nhất |
| Cảnh báo nguy cơ bỏ học | Điểm rủi ro tính từ: số ngày không hoạt động, tiến độ chậm hơn trung vị lớp, điểm test thấp. Có danh sách học viên cần chú ý |
| Hành động | Gửi email nhắc nhở hoặc động viên cho học viên có nguy cơ |

### 3.6. Mức ưu tiên thực hiện

| Mức | Chức năng |
|---|---|
| Bắt buộc | 3.2, 3.3 (trắc nghiệm + bài code + hồ sơ năng lực), 3.4 tầng 1–2, 3.5 a–c |
| Nên có | 3.4 tầng 3–4, 3.5 d, chứng chỉ QR |
| Mở rộng | Phát hiện đạo văn bài code, tìm kiếm ngữ nghĩa bằng pgvector, cổng thanh toán nội địa (VNPay sandbox) |

---

## 4. Phác thảo công nghệ

### 4.1. Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Frontend | Next.js 16 (React 19, Tailwind CSS 4) | Giao diện học viên, giảng viên, admin; biểu đồ dashboard (Recharts). Chỉ làm UI, gọi NestJS |
| Backend | **NestJS 12** (ESM, Express adapter, Vitest, oxlint) | REST API, xử lý nghiệp vụ, tính gợi ý. Cùng codebase chạy 2 process: `api` (HTTP) và `worker` (consumer + cron) |
| Xác thực | **Better Auth** (mount trong NestJS) | Email + mật khẩu, OAuth Google/GitHub, quên mật khẩu, plugin admin (khoá user, gán role) |
| Cơ sở dữ liệu | **PostgreSQL trên Supabase** + **pgvector** | Dữ liệu nghiệp vụ, bảng thống kê tổng hợp cho dashboard, embedding khoá học. Chỉ dùng như Postgres (không dùng Supabase Auth/RLS) |
| Message Queue | RabbitMQ (CloudAMQP hoặc tự host) | **Hàng đợi tác vụ**: điều phối gửi bài sang Judge0, gửi email, sinh chứng chỉ PDF. Có ack, retry, dead-letter queue |
| Event streaming | Kafka (Confluent Cloud hoặc tự host chế độ KRaft) | **Luồng sự kiện học tập**: heartbeat xem video, nộp bài, mua hàng, duyệt khoá. Consumer tổng hợp số liệu dashboard và cập nhật hồ sơ năng lực |
| Cache | Redis | **Session đăng nhập**, cache gợi ý và số liệu dashboard, rate limit API nộp bài |
| Thanh toán | Stripe (test mode) | Checkout, webhook xác nhận thanh toán và hoàn tiền |
| Chấm code | **Judge0 cloud** | Sandbox chạy code cô lập. Dùng `callback_url` để Judge0 tự gọi về khi chấm xong |
| Lưu trữ file | Supabase Storage / Cloudflare R2 (S3-compatible) | Tài liệu, chứng chỉ PDF. Video có thể dùng Bunny Stream / Cloudflare Stream (HLS + signed URL) |
| Email | Resend / Amazon SES | Email xác minh, nhắc nhở, thông báo. Gửi từ subdomain `mail.` |
| Giám sát lỗi | Sentry (gói Student) | `@sentry/nextjs` + `@sentry/nestjs` cho api và worker; tracing FE → API; session replay |
| Triển khai | Docker Compose + Caddy | Local (phát triển) và VPS (demo public). Caddy làm reverse proxy + HTTPS tự động |

> **Vì sao dùng cả RabbitMQ và Kafka:** RabbitMQ dành cho *tác vụ cần làm đúng một lần* (chấm một bài nộp, gửi một email). Kafka dành cho *luồng sự kiện số lượng lớn*, cần lưu lại và cho nhiều consumer đọc độc lập (dashboard, recommendation). Riêng heartbeat video là nguồn sự kiện lớn nhất.

> **Vì sao tách NestJS thay vì dùng API của Next.js:** hệ thống có ~10 module nghiệp vụ, 3 vai trò, 2 hệ thống queue và cron. NestJS có sẵn DI, module, guard, pipe, `@nestjs/microservices`, `@nestjs/schedule`, nên route, consumer và cron dùng chung service. Next.js chỉ lo giao diện.

> **Vì sao không dùng Elasticsearch:** quy mô vài trăm khoá học thì PostgreSQL full-text (`tsvector`, `unaccent`, `pg_trgm`) và pgvector là đủ, không phải vận hành và đồng bộ thêm một service.

### 4.2. Kiến trúc tổng quan

```
                     Trình duyệt
                          │ HTTPS
                  ┌───────▼────────┐
                  │     Caddy      │  skillpath.dotattuan.id.vn
                  └───┬────────┬───┘
               /*     │        │  /api/*
             ┌────────▼──┐  ┌──▼──────────────┐       ┌─────────┐
             │  Next.js  │─►│  NestJS api     │◄─────►│  Redis  │
             │   (UI)    │  │ (REST, auth,    │       │ session │
             └───────────┘  │  SSE kết quả)   │       │ cache   │
   Stripe webhook ─────────►│                 │       └─────────┘
   Judge0 callback ────────►│                 │
                            └──┬──────┬────┬──┘
                               │      │    │
           ┌───────────────────┘      │    └───────────────┐
           ▼                          ▼                    ▼
  ┌──────────────────┐        ┌──────────────┐      ┌────────────┐
  │ Supabase Postgres│        │   RabbitMQ   │      │   Kafka    │
  │   + pgvector     │        └──────┬───────┘      └─────┬──────┘
  └────────▲─────────┘               └────────┬───────────┘
           │                          ┌───────▼────────────────────┐
           │                          │ NestJS worker              │
           └──────────────────────────│ grading dispatch ↔ Judge0  │
                                      │ email / PDF / embedding    │
                                      │ analytics, skill mastery   │
                                      │ cron hằng đêm              │
                                      └────────────────────────────┘
```

### 4.3. Cấu trúc mã nguồn

Một repo git chung chứa 2 thư mục độc lập. Mỗi thư mục có `package.json` và `pnpm-lock.yaml` riêng:

```
Project/                         # git root
├── .github/workflows/           # CI/CD chung cho FE + BE
├── it-course-platform/          # Frontend: Next.js 16 (App Router)
│   └── src/app/                 # routes, layout, page
│
└── back-end/                    # Backend: NestJS 12 (ESM, "type": "module")
    ├── src/
    │   ├── auth/ course/ enrollment/ payment/
    │   ├── grading/ recommendation/ analytics/
    │   ├── infra/               # client singleton: redis, kafka, rabbitmq, prisma, storage
    │   ├── app.module.ts
    │   ├── main.ts              # process HTTP (PORT=4000, global prefix 'api')
    │   └── worker.ts            # process consumer + cron (dùng chung module)
    ├── test/                    # e2e (vitest.config.e2e.ts)
    └── deploy/                  # docker-compose.prod.yml, Caddyfile
```

- **Cổng khi phát triển:** Next.js dùng `3000`, NestJS đặt `PORT=4000` để không trùng.
- **Một commit sửa được cả FE và BE**, ví dụ thêm một trường mới cho khoá học. Cài đặt và chạy riêng trong từng thư mục (`pnpm install`, `pnpm dev`).
- **Type dùng chung FE và BE:** sinh type từ OpenAPI. NestJS xuất spec bằng `@nestjs/swagger`, FE chạy `openapi-typescript` để tạo type. Sửa DTO ở BE, chạy lại lệnh sinh type là FE báo lỗi type ngay. Chưa cần package `shared-types` riêng.
- **ESM:** import tương đối trong BE phải có đuôi `.js` (`./course.service.js`), đây là quy tắc của `moduleResolution: nodenext`.
- **CI/CD:** workflow đặt ở gốc repo. Mỗi job dùng `working-directory` trỏ vào thư mục của mình, và `paths` filter để chỉ build image nào có thay đổi (FE hoặc BE), rồi đẩy lên GHCR. File compose và Caddyfile để deploy nằm trong `back-end/deploy/`.
- Logic nghiệp vụ nằm trong service, controller và consumer chỉ là lớp vỏ mỏng. Nếu sau này đổi nền tảng deploy (ví dụ Lambda) thì chỉ thay lớp vỏ.
- `payment/providers/stripe.provider.ts` tách riêng. Muốn thêm VNPay thì thêm một provider, không phải sửa logic đơn hàng.

### 4.4. Xác thực & phân quyền

- **Database session**: đăng nhập tạo session trong Redis, trình duyệt giữ cookie `httpOnly`, `secure`, `sameSite=lax`.
- FE và BE **cùng origin** (`/api/*` do Caddy chuyển sang NestJS), nên không cần CORS và cookie không cần đặt `Domain`.
- NestJS kiểm tra session bằng guard, phân quyền bằng decorator `@Roles('student' | 'instructor' | 'admin')`.
- Admin khoá user hoặc đổi role: xoá session trong Redis là có hiệu lực ngay. Đây là lý do chọn database session thay vì JWT.
- Worker không dùng session, `userId` đi kèm trong payload job. Stripe webhook xác thực bằng chữ ký, Judge0 callback xác thực bằng HMAC trong query.
- Không dùng Clerk vì phải đồng bộ user về Postgres qua webhook, trong khi hầu hết các bảng đều tham chiếu tới user.

### 4.5. Các luồng xử lý chính

**Nộp bài code**
1. Học viên nộp bài. API lưu bài nộp với trạng thái `pending` rồi đẩy job vào RabbitMQ. RabbitMQ giúp điều tiết số request gửi sang Judge0 cloud cho vừa hạn mức
2. Worker lấy job, gửi từng test case sang Judge0 kèm `callback_url=/api/judge0/callback?sub=…&test=…&sig=<HMAC>`
3. Judge0 chấm xong thì gọi `PUT` về callback. API kiểm tra chữ ký rồi lưu kết quả từng test
4. Khi đủ kết quả các test: tính điểm, publish `submission.graded` lên Kafka
5. Frontend nhận kết quả qua SSE (server chỉ đẩy một chiều nên không cần WebSocket)

**Sự kiện học → dashboard & gợi ý**
1. Video player gửi heartbeat mỗi 15 giây. API publish sự kiện lên Kafka (`learning.events`). Kafka lỗi thì bỏ qua, không trả lỗi cho người dùng
2. Analytics worker gom sự kiện theo batch vào các bảng thống kê (giữ chân video, tiến độ, phân tích câu hỏi). **Không lưu heartbeat thô vào Postgres**, vì gói Supabase free giới hạn 500MB
3. Khi có sự kiện `submission.graded`, cập nhật độ thành thạo kỹ năng và xoá cache gợi ý trong Redis
4. Chỉ số nặng (độ phân biệt câu hỏi, điểm rủi ro bỏ học, refresh materialized view) được tính lại bằng cron hằng đêm trong worker

**Duyệt khoá học → embedding**
1. Admin duyệt khoá, API publish `course.approved`
2. Worker gọi API embedding cho tiêu đề và mô tả khoá, rồi ghi vào cột `courses.embedding`

**Thanh toán**
1. Tạo Stripe Checkout Session, chuyển học viên sang trang thanh toán của Stripe
2. Stripe gọi webhook `checkout.session.completed`. API kiểm tra chữ ký, tạo quyền học (enrollment) theo cách idempotent
3. Publish sự kiện `order.paid` lên Kafka để cập nhật dashboard doanh thu

> Stripe chưa hỗ trợ tài khoản nhận tiền thật tại Việt Nam, nên đồ án dùng **test mode**. Nếu triển khai thật thì thay bằng VNPay / MoMo / PayOS qua một provider mới.

### 4.6. Recommendation triển khai bằng PostgreSQL

Không dùng mô hình học máy. Đây là hệ gợi ý **dựa trên tri thức và luật** (knowledge-based / rule-based) kết hợp **item-based collaborative filtering** dạng thống kê và **độ tương đồng nội dung** bằng pgvector. Tất cả đều là thao tác lọc, đếm, kết bảng và tìm vector trong PostgreSQL, không cần thêm service.

| Tầng | Dữ liệu | Cách tính trong PostgreSQL |
|---|---|---|
| 1. Theo mục tiêu | `courses(track, level, rating)`, mục tiêu học viên chọn lúc đăng ký | Lọc theo `track` và `level`, sắp xếp theo `rating` |
| 2. Theo lỗ hổng kỹ năng | `user_skill_mastery(user_id, skill_id, score)`, `course_skills(course_id, skill_id)`, `skill_prerequisites(skill_id, requires_skill_id)` | Lấy các kỹ năng có `score < 0.6`, tìm khoá dạy kỹ năng đó, loại khoá đã mua. Duyệt đồ thị tiên quyết bằng `WITH RECURSIVE` để loại khoá mà học viên chưa đạt kỹ năng tiên quyết |
| 3. Theo hành vi chung | `enrollments(user_id, course_id)` | Self-join `enrollments` để đếm số lần hai khoá được mua cùng nhau. Lưu kết quả vào **materialized view**, `REFRESH` hằng đêm bằng cron |
| 4. Theo nội dung | `courses.embedding vector(N)` + index HNSW | `ORDER BY embedding <=> $1` kết hợp bộ lọc `status`, `level` |

```sql
-- Tầng 3: "Học viên mua khoá này cũng mua…"
SELECT b.course_id, COUNT(*) AS co_count
FROM enrollments a
JOIN enrollments b ON a.user_id = b.user_id AND a.course_id <> b.course_id
WHERE a.course_id = $1
GROUP BY b.course_id
ORDER BY co_count DESC
LIMIT 5;

-- Tầng 4: khoá có nội dung gần nhất (N = số chiều của model embedding đã chọn)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON courses USING hnsw (embedding vector_cosine_ops);

SELECT id, title, 1 - (embedding <=> $1) AS score
FROM courses
WHERE status = 'approved' AND id <> $2
ORDER BY embedding <=> $1
LIMIT 5;
```

- `user_skill_mastery` được cập nhật mỗi khi chấm xong một bài test (qua sự kiện `submission.graded`)
- Kết quả gợi ý của từng học viên được cache trong Redis và xoá khi độ thành thạo kỹ năng thay đổi
- Với quy mô đồ án (vài nghìn user, vài trăm nghìn bản ghi), mỗi query chạy tính bằng mili giây nếu có index trên `user_id`, `course_id`, `skill_id`

### 4.7. Triển khai

**Môi trường local (phát triển)**
- `docker-compose` chạy Redis (cùng Kafka và RabbitMQ nếu tự host). DB dùng Supabase, Judge0 dùng bản cloud
- Địa chỉ các dịch vụ lấy từ biến môi trường (`DATABASE_URL`, `JUDGE0_URL`, `KAFKA_BROKERS`…), nên chuyển môi trường chỉ cần đổi config

**Môi trường VPS (demo public)**

| Hạng mục | Lựa chọn |
|---|---|
| VPS | **2 vCPU / 4GB RAM**, Ubuntu 24.04, region Singapore, thêm 2GB swap. Nếu Kafka và RabbitMQ đều dùng cloud thì 2GB RAM là đủ |
| Nhà cung cấp | **Azure for Students** (100 USD credit trong GitHub Student Pack, không cần thẻ, VM B2s chạy được khoảng 3 tháng). Phương án khác: Hetzner Singapore (~8–10 USD/tháng), Oracle Cloud Free Tier |
| Chạy trên VPS | Caddy, web, api, worker, Redis (cộng Kafka/RabbitMQ nếu tự host) |
| Build | GitHub Actions build image `it-course-platform` và `back-end` rồi đẩy lên GHCR. VPS chỉ `docker compose pull && up -d`, **không build trên VPS** vì dễ hết RAM |
| Bảo mật | Chỉ mở cổng 22, 80, 443. SSH bằng key. Redis không mở ra ngoài |

**Tên miền (`dotattuan.id.vn`)**

```
A    skillpath.dotattuan.id.vn   → IP VPS   (/ → Next.js, /api/* → NestJS)
     mail.dotattuan.id.vn        → bản ghi SPF/DKIM theo Resend/SES
     dotattuan.id.vn             → giữ nguyên
```

- Cần HTTPS cho cookie `secure`, Stripe webhook và link QR trên chứng chỉ. Caddy tự xin chứng chỉ Let's Encrypt
- Gửi mail từ subdomain `mail.` để không đụng SPF của domain gốc và tách uy tín gửi mail

**Lưu ý với Supabase**
- Api và worker dùng **transaction pooler** (cổng `6543`, Prisma thêm `?pgbouncer=true`). Migration dùng session pooler hoặc direct. Kết nối direct chỉ có IPv6 trên gói free
- Chọn region **cùng vùng với VPS** (Singapore) để giảm độ trễ truy vấn
- Gói free: 500MB và tự tạm dừng sau 1 tuần không truy cập. Kiểm tra trước buổi bảo vệ

**Giám sát**
- Sentry gói Student (50K errors, 100K transactions/tháng, 1 năm, gia hạn được, không tính phí vượt hạn mức)
- Loại route heartbeat khỏi tracing (`tracesSampler` trả `0`) để không hết hạn mức transaction

**Dữ liệu demo**
- Stripe dùng test mode (thẻ `4242 4242 4242 4242`)
- Chuẩn bị script sinh dữ liệu giả lập (học viên, lượt học, bài nộp) để demo dashboard và đánh giá recommendation
