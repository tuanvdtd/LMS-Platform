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
| Bảo vệ video | Video HLS để trong bucket private, phát qua CloudFront bằng **signed cookies** có thời hạn: chỉ học viên đã mua mới xem được, một lần ký dùng cho mọi đoạn của video |

### 3.3. Bài kiểm tra & đánh giá năng lực

| Chức năng | Mô tả |
|---|---|
| Ngân hàng câu hỏi | Giảng viên tạo câu hỏi trắc nghiệm, **mỗi quiz gắn 1–3 topic** của khoá (vd `react`, `sql`), topic theo taxonomy Udemy |
| Bài tập lập trình | Đề bài, test case công khai và test ẩn, giới hạn thời gian và bộ nhớ, hỗ trợ nhiều ngôn ngữ |
| Chấm tự động | Trắc nghiệm chấm ngay. Bài code chạy trong sandbox cô lập, trả về kết quả Accepted / Wrong Answer / Time Limit / Runtime Error và điểm theo số test đạt |
| Hồ sơ năng lực | Tự động tính **độ thành thạo từng topic** của học viên từ kết quả các bài kiểm tra |
| Chứng chỉ | Hoàn thành khoá và đạt bài test cuối khoá thì được cấp chứng chỉ PDF có **mã QR để xác thực** |

### 3.4. Gợi ý cá nhân hoá (Recommendation)

Gợi ý dựa trên **năng lực thực tế** của học viên (lấy từ kết quả bài kiểm tra), không chỉ dựa trên lịch sử mua hàng.

| Tầng | Gợi ý | Dữ liệu sử dụng |
|---|---|---|
| 1. Theo mục tiêu | Khoá học phù hợp cho người mới | Mục tiêu (Backend, Frontend, Data…) và trình độ chọn lúc đăng ký. Dùng cho người mới chưa có dữ liệu (cold start) |
| 2. Theo lỗ hổng topic ⭐ | Bài học cần ôn lại trong khoá, và khoá học nên học tiếp | Độ thành thạo từng topic + **đồ thị topic tiên quyết** (vd JS → React → Next.js). Chỉ gợi ý khoá khi học viên đã vững topic tiên quyết |
| 3. Theo hành vi chung | "Học viên mua khoá này cũng mua…" | Tần suất các khoá được mua cùng nhau (item-based collaborative filtering) |
| 4. Theo nội dung (bổ sung) | Khoá có nội dung gần giống khoá vừa học | Embedding mô tả khoá học lưu bằng **pgvector**, tìm theo độ tương đồng cosine. Giúp cả khoá mới chưa ai mua (cold start phía khoá học) |

- **Gợi ý có giải thích lý do**, ví dụ: *"Gợi ý vì bạn đạt 35% ở topic React JS"*
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
| Topic yếu của lớp | Heatmap độ thành thạo theo topic của toàn bộ học viên trong khoá |

**d) Theo từng học viên**

| Chỉ số | Mô tả |
|---|---|
| Hồ sơ chi tiết | Tiến độ, lịch sử điểm, radar chart topic, lần hoạt động gần nhất |
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
| Frontend | Next.js 16 (React 19, Tailwind CSS 4), deploy trên **Vercel** (Hobby) | Giao diện học viên, giảng viên, admin; biểu đồ dashboard (Recharts). Chỉ làm UI, gọi NestJS |
| Backend | **NestJS 12** (ESM, Express adapter, Vitest, oxlint) | REST API, xử lý nghiệp vụ, tính gợi ý. Cùng codebase chạy 2 process: `api` (HTTP) và `worker` (consumer + cron) |
| Xác thực | **Better Auth** (mount trong NestJS) | Email + mật khẩu, OAuth Google/GitHub, quên mật khẩu, plugin admin (khoá user, gán role) |
| Cơ sở dữ liệu | **PostgreSQL trên Supabase** + **pgvector** | Dữ liệu nghiệp vụ, bảng thống kê tổng hợp cho dashboard, embedding khoá học. Chỉ dùng như Postgres (không dùng Supabase Auth/RLS) |
| Message Queue | **RabbitMQ trên CloudAMQP** (gói free) | Hai vai trò: **(1) hàng đợi tác vụ**: điều phối gửi bài sang Judge0, gửi email, sinh chứng chỉ PDF, có ack, retry, dead-letter queue; **(2) event bus**: topic exchange `events` phát sự kiện học tập (xem video, nộp bài, mua hàng, duyệt khoá) tới nhiều queue, mỗi consumer (analytics, topic mastery, embedding) một queue riêng |
| Cache | **Redis trên Upstash** (gói free) | Cache gợi ý và số liệu dashboard, rate limit API nộp bài |
| Thanh toán | Stripe (test mode) | Checkout, webhook xác nhận thanh toán và hoàn tiền |
| Chấm code | **Judge0 CE tự host** (Docker, cùng EC2 với backend) | Sandbox chạy code cô lập. Dùng `callback_url` để Judge0 tự gọi về khi chấm xong. Không dùng bản cloud trên RapidAPI vì tính phí theo từng lượt nộp (mỗi test case là một lượt) |
| Lưu trữ file | **Cloudflare R2** (S3-compatible, 10GB free, không tính phí egress) | Hai bucket: **public** (avatar, ảnh bìa khoá, ảnh trong bài; URL cố định qua `cdn-skillpath.`) và **private** (tài liệu, chứng chỉ PDF; presigned GET có thời hạn). Upload thẳng từ trình duyệt bằng presigned PUT, ký kèm `ContentLength` + `ContentType` để giới hạn dung lượng và loại file |
| Video | **AWS S3** (private) + **CloudFront** (Always Free 1TB/tháng) | HLS 360p/720p, worker chuyển mã bằng `ffmpeg`. Phát qua `video.` bằng CloudFront signed cookies (policy `videos/{id}/*`). S3 → CloudFront không tính phí truyền |
| Email | **Brevo** (gói free, 300 mail/ngày) | Email xác minh, nhắc nhở, thông báo. Gửi từ subdomain `mail.` |
| Giám sát lỗi | Sentry (gói Student) | `@sentry/nextjs` + `@sentry/nestjs` cho api và worker; tracing FE → API; session replay |
| Triển khai | Phát triển trên **local**; cuối đồ án lên Vercel (FE) + Docker Compose + Caddy trên **AWS EC2** (BE + Judge0) | Caddy làm reverse proxy + HTTPS tự động cho `api.` |

> **Vì sao không dùng Kafka:** RabbitMQ với topic exchange đã cho nhiều consumer đọc độc lập cùng một sự kiện, đủ cho dashboard và recommendation. Kafka mạnh ở lưu log sự kiện để đọc lại (replay) và thông lượng rất lớn, nhưng ở quy mô đồ án thì không cần, trong khi phải vận hành thêm một hệ thống (tự host tốn ~1GB RAM, bản cloud không có gói free lâu dài). Nguồn sự kiện lớn nhất là heartbeat video được gom phía client trước khi gửi (mục 4.5), nên vẫn nằm trong hạn mức CloudAMQP.

> **Vì sao dùng dịch vụ free:** chỉ backend và Judge0 cần máy chủ riêng (Judge0 cần quyền cgroup, không chạy được trên PaaS). Các thành phần còn lại dùng gói free để chi phí AWS chỉ nằm ở một EC2.

> **Vì sao video dùng S3 + CloudFront mà file khác dùng R2:** HLS chia một video thành hàng trăm đoạn nhỏ. Presigned URL (của cả S3 lẫn R2) chỉ ký cho từng file, nên phải ký lại từng đoạn và sửa playlist. CloudFront có sẵn **signed cookies**: ký một lần cho cả thư mục của video. CloudFront miễn phí 1TB băng thông/tháng (khoảng 900 giờ xem 720p), S3 chỉ tính tiền lưu trữ (~1 USD/tháng cho 20 giờ nội dung). Ảnh và tài liệu không cần cơ chế này nên để trên R2, không tốn phí egress và không trừ vào credit AWS. Cả hai đều dùng chung `@aws-sdk/client-s3`, chỉ khác `endpoint`.

> **Vì sao tách NestJS thay vì dùng API của Next.js:** hệ thống có ~10 module nghiệp vụ, 3 vai trò, 2 hệ thống queue và cron. NestJS có sẵn DI, module, guard, pipe, `@nestjs/microservices`, `@nestjs/schedule`, nên route, consumer và cron dùng chung service. Next.js chỉ lo giao diện.

> **Vì sao không dùng Elasticsearch:** quy mô vài trăm khoá học thì PostgreSQL full-text (`tsvector`, `unaccent`, `pg_trgm`) và pgvector là đủ, không phải vận hành và đồng bộ thêm một service.

### 4.2. Kiến trúc tổng quan

```
                              Trình duyệt
            skillpath.tuandt.me │ api.skillpath.tuandt.me
              ┌───────────────────────┴───────────────┐
              ▼                                       ▼
      ┌───────────────┐        ┌──────────────── AWS EC2 ──────────────────┐
      │    Vercel     │        │  Caddy (HTTPS)                            │
      │  Next.js (UI) │        │    │                                      │
      └───────────────┘        │  ┌─▼──────────────┐  callback  ┌────────┐ │
                               │  │ NestJS api     │◄───────────│ Judge0 │ │
   Stripe webhook ────────────────►│ REST/auth/SSE  │            │ CE     │ │
                               │  └─┬──────────────┘            └───▲────┘ │
                               │    │   ┌────────────────┐  submit  │      │
                               │    │   │ NestJS worker  │──────────┘      │
                               │    │   │ consumer + cron│                 │
                               │    │   └───────┬────────┘                 │
                               └────┼───────────┼──────────────────────────┘
                                    └─────┬─────┘
          ┌─────────────────┬─────────────┼──────────────┬────────────────┐
          ▼                 ▼             ▼              ▼                ▼
  ┌───────────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐
  │ Supabase PG   │ │ RabbitMQ     │ │ Upstash  │ │ Cloudflare  │ │ Brevo    │
  │ + pgvector    │ │ (CloudAMQP)  │ │ Redis    │ │ R2          │ │ (email)  │
  │               │ │ jobs + events│ │ cache/RL │ │ file, ảnh   │ │          │
  └───────────────┘ └──────────────┘ └──────────┘ └─────────────┘ └──────────┘

  Video:  Trình duyệt ──(signed cookies)──► CloudFront (video.) ──► S3 private (HLS)
                                                                     ▲
                                      NestJS worker (ffmpeg) ────────┘ upload segment
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
    │   ├── infra/               # client singleton: redis, rabbitmq, prisma, storage
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
- **CI/CD:** workflow đặt ở gốc repo. Mỗi job dùng `working-directory` trỏ vào thư mục của mình, và `paths` filter để chỉ chạy job khi thư mục đó có thay đổi. FE deploy tự động bởi Vercel Git integration (Root Directory `it-course-platform`). BE build image rồi đẩy lên GHCR. File compose và Caddyfile để deploy nằm trong `back-end/deploy/`.
- Logic nghiệp vụ nằm trong service, controller và consumer chỉ là lớp vỏ mỏng. Nếu sau này đổi nền tảng deploy (ví dụ Lambda) thì chỉ thay lớp vỏ.
- `payment/providers/stripe.provider.ts` tách riêng. Muốn thêm VNPay thì thêm một provider, không phải sửa logic đơn hàng.

### 4.4. Xác thực & phân quyền

- **Session Redis + DB**: Better Auth lưu session trong bảng `session` của Postgres (nguồn chính) và Redis (`secondaryStorage`, đọc nhanh mỗi request). Trình duyệt giữ cookie `httpOnly`, `secure`, `sameSite=lax`.
- FE (`skillpath.tuandt.me`, Vercel) và BE (`api.skillpath.tuandt.me`, EC2) khác origin nhưng **cùng site**, nên cookie `sameSite=lax` vẫn được gửi kèm. Cookie đặt `Domain=.skillpath.tuandt.me` (tuỳ chọn `crossSubDomainCookies` của Better Auth). NestJS bật CORS với `credentials: true`, chỉ cho phép origin của FE.
- NestJS kiểm tra session bằng guard, phân quyền bằng decorator `@Roles('student' | 'instructor' | 'admin')`.
- Admin khoá user hoặc đổi role: revoke session (xoá cả ở DB và Redis) là có hiệu lực ngay. Đây là lý do chọn session phía server thay vì JWT.
- Worker không dùng session, `userId` đi kèm trong payload job. Stripe webhook xác thực bằng chữ ký, Judge0 callback xác thực bằng HMAC trong query.
- Không dùng Clerk vì phải đồng bộ user về Postgres qua webhook, trong khi hầu hết các bảng đều tham chiếu tới user.

### 4.5. Các luồng xử lý chính

**Nộp bài code**
1. Học viên nộp bài. API lưu bài nộp với trạng thái `pending` rồi đẩy job vào RabbitMQ. RabbitMQ giúp điều tiết số bài chấm đồng thời cho vừa sức máy chủ
2. Worker lấy job, gửi từng test case sang Judge0 (mạng nội bộ Docker) kèm `callback_url=http://api:4000/api/judge0/callback?sub=…&test=…&sig=<HMAC>`. Judge0 không mở ra Internet
3. Judge0 chấm xong thì gọi `PUT` về callback. API kiểm tra chữ ký rồi lưu kết quả từng test
4. Khi đủ kết quả các test: tính điểm, publish `submission.graded` lên exchange `events`
5. Frontend nhận kết quả qua SSE (server chỉ đẩy một chiều nên không cần WebSocket)

**Sự kiện học → dashboard & gợi ý**
1. Video player ghi lại các đoạn đã xem (mỗi mốc 15 giây) và **gom lại gửi 60 giây một lần**, hoặc khi pause/rời trang (`navigator.sendBeacon`). API publish một sự kiện `video.progress` lên exchange `events`. RabbitMQ lỗi thì bỏ qua, không trả lỗi cho người dùng. Gom phía client giúp giảm ~4 lần số message, vừa hạn mức CloudAMQP free
2. Analytics worker gom sự kiện theo batch vào các bảng thống kê (giữ chân video, tiến độ, phân tích câu hỏi). **Không lưu heartbeat thô vào Postgres**, vì gói Supabase free giới hạn 500MB
3. Khi có sự kiện `quiz.submitted` hoặc `submission.graded`, cập nhật độ thành thạo topic và xoá cache gợi ý trong Redis
4. Chỉ số nặng (độ phân biệt câu hỏi, điểm rủi ro bỏ học, refresh materialized view) được tính lại bằng cron hằng đêm trong worker

**Upload & phát video**
1. Giảng viên xin presigned PUT, upload file gốc thẳng lên S3 (`raw/{videoId}.mp4`), rồi báo API. API đẩy job `video.transcode` vào RabbitMQ
2. Worker tải file gốc, chạy `ffmpeg` ra HLS 360p + 720p (đoạn 6 giây), upload lên `videos/{videoId}/`, xoá file gốc, cập nhật trạng thái bài học thành `ready`
3. Học viên mở bài: API kiểm tra đã mua khoá, set 3 cookie CloudFront (`Policy`, `Signature`, `Key-Pair-Id`) cho `videos/{videoId}/*`, hết hạn sau 2 giờ, `Domain=.skillpath.tuandt.me`
4. Player (`hls.js`) tải `index.m3u8` và các đoạn từ `video.`, trình duyệt tự gửi kèm cookie. Private key ký cookie chỉ nằm ở API

**Duyệt khoá học → embedding**
1. Admin duyệt khoá, API publish `course.approved`
2. Worker gọi API embedding cho tiêu đề và mô tả khoá, rồi ghi vào cột `courses.embedding`

**Thanh toán**
1. Tạo Stripe Checkout Session, chuyển học viên sang trang thanh toán của Stripe
2. Stripe gọi webhook `checkout.session.completed`. API kiểm tra chữ ký, tạo quyền học (enrollment) theo cách idempotent
3. Publish sự kiện `order.paid` lên exchange `events` để cập nhật dashboard doanh thu

> Stripe chưa hỗ trợ tài khoản nhận tiền thật tại Việt Nam, nên đồ án dùng **test mode**. Nếu triển khai thật thì thay bằng VNPay / MoMo / PayOS qua một provider mới.

### 4.6. Recommendation triển khai bằng PostgreSQL

Không dùng mô hình học máy. Đây là hệ gợi ý **dựa trên tri thức và luật** (knowledge-based / rule-based) kết hợp **item-based collaborative filtering** dạng thống kê và **độ tương đồng nội dung** bằng pgvector. Tất cả đều là thao tác lọc, đếm, kết bảng và tìm vector trong PostgreSQL, không cần thêm service.

| Tầng | Dữ liệu | Cách tính trong PostgreSQL |
|---|---|---|
| 1. Theo mục tiêu | `courses(track, level, rating)`, mục tiêu học viên chọn lúc đăng ký | Lọc theo `track` và `level`, sắp xếp theo `rating` |
| 2. Theo lỗ hổng topic | `user_topic_mastery(user_id, topic_id, score)`, `course_topics(course_id, topic_id)`, `_TopicPrereq(A, B)` | Lấy các topic có `score < 0.6`, tìm khoá dạy topic đó, loại khoá đã mua. Duyệt đồ thị tiên quyết bằng `WITH RECURSIVE` để loại khoá mà học viên chưa đạt topic tiên quyết |
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

- `user_topic_mastery` được cập nhật mỗi khi chấm xong một bài test (qua sự kiện `quiz.submitted` hoặc `submission.graded`)
- Kết quả gợi ý của từng học viên được cache trong Redis và xoá khi độ thành thạo topic thay đổi
- Với quy mô đồ án (vài nghìn user, vài trăm nghìn bản ghi), mỗi query chạy tính bằng mili giây nếu có index trên `user_id`, `course_id`, `topic_id`

### 4.7. Triển khai

**Lộ trình:** toàn bộ quá trình phát triển chạy trên **local**. Chỉ khoảng 1–2 tháng cuối (trước buổi bảo vệ) mới dựng EC2 để demo public, nhằm không tốn tiền máy chủ khi chưa cần.

**Môi trường local (phát triển)**

| Thành phần | Cách chạy |
|---|---|
| FE | `pnpm dev` trong `it-course-platform/`, cổng `3000` |
| BE | `pnpm start:dev` trong `back-end/`, cổng `4000` (`api`); `worker` chạy process riêng |
| DB, Redis, RabbitMQ, R2, Brevo | Dùng luôn dịch vụ cloud free, **tạo instance riêng cho dev** (không dùng chung với production) |
| Video (S3 + CloudFront) | Bucket + distribution riêng cho dev. `ffmpeg` cài thẳng trên máy dev (`brew install ffmpeg`), worker gọi được luôn |
| Judge0 | Máy dev là Mac chip Apple Silicon (ARM). Judge0 chỉ có image amd64 và cần cgroup v1, trong khi Docker Desktop trên Mac chạy ARM + cgroup v2, nên **không chạy Judge0 trên máy dev**. Khi làm module chấm bài: bật tạm một EC2 `t3.small` chỉ chạy Judge0 (dừng instance khi không dùng), trỏ `JUDGE0_URL` sang đó. Test tự động của module chấm bài dùng Judge0 giả (trả verdict cố định) |

- Địa chỉ các dịch vụ lấy từ biến môi trường (`DATABASE_URL`, `JUDGE0_URL`, `RABBITMQ_URL`, `REDIS_URL`…), nên chuyển môi trường chỉ cần đổi config
- Khi dev không có Caddy phía trước nên Better Auth không lấy được IP client: mọi request dùng chung một bộ đếm rate limit. Bình thường vì chỉ có một người dùng

**Môi trường EC2 (demo public, cuối đồ án)**

| Hạng mục | Lựa chọn |
|---|---|
| Instance | **`t3.medium` (2 vCPU / 4GB RAM)**, region **ap-southeast-1 (Singapore)**, cùng vùng với Supabase. Tiết kiệm hơn: `t3.small` (2GB) + 2GB swap, chấm bài chậm hơn. **Bắt buộc dòng x86 (`t3`/`t3a`)**: Judge0 chỉ có image amd64, không chạy trên Graviton (`t4g`, ARM) |
| Hệ điều hành | Ubuntu 24.04 LTS. Judge0 cần **cgroup v1**: thêm `systemd.unified_cgroup_hierarchy=0` vào `GRUB_CMDLINE_LINUX` trong `/etc/default/grub`, chạy `update-grub` rồi reboot |
| Ổ đĩa | EBS **gp3 30GB** (mặc định 8GB không đủ cho image Judge0 và các layer Docker) + 2GB swap |
| IP | **Elastic IP** gắn vào instance, để bản ghi A của `api.` không đổi khi stop/start |
| Chi phí | Ước tính ~40 USD/tháng cho `t3.medium` chạy liên tục (~20 USD với `t3.small`), cộng EBS và IPv4 công khai vài USD. S3 video ~1 USD/tháng, CloudFront 0 USD trong hạn mức Always Free. Tổng ~46 USD/tháng → credit 200 USD đủ ~4 tháng; chạy 2 tháng cuối còn dư ~100 USD. Tài khoản AWS mới có credit dùng trong 6 tháng đầu, kiểm tra hạn mức trên trang Billing. **Stop instance khi không dùng** (chỉ còn tính EBS + Elastic IP). Tạo **AWS Budgets** 20 USD/tháng, cảnh báo email ở 80% |
| CPU credit | Đặt instance ở chế độ **Standard** (không phải Unlimited): `ffmpeg` chạy 100% CPU lâu, chế độ Unlimited sẽ tính thêm 0,05 USD/vCPU-giờ khi hết credit. Standard thì chỉ chậm lại |
| Chạy trên EC2 | Caddy, api, worker, Judge0 (server + workers + Postgres/Redis nội bộ của Judge0) |
| Build | GitHub Actions (runner x86) build image `back-end` rồi đẩy lên GHCR. EC2 chỉ `docker compose pull && up -d`, **không build trên EC2** vì dễ hết RAM. Nếu phải build tay trên Mac ARM thì thêm `--platform linux/amd64`, nếu không image sẽ báo `exec format error` trên EC2. FE do Vercel build |
| Bảo mật | Security Group chỉ mở 22 (**giới hạn theo IP của người quản trị**), 80, 443. SSH bằng key pair. Judge0 chỉ nằm trong mạng Docker nội bộ, không mở ra ngoài |

**Tên miền (`tuandt.me`)**

Domain `.me` miễn phí năm đầu qua GitHub Student Pack (Namecheap), **DNS quản lý trên Cloudflare** (bắt buộc để gắn custom domain cho R2). Gia hạn trước ngày bảo vệ nếu quá 12 tháng.

```
CNAME tuandt.me, www            → tuanvdtd.github.io     (trang cá nhân, giữ nguyên)
CNAME skillpath.tuandt.me       → cname.vercel-dns.com   (Next.js)
A     api.skillpath.tuandt.me   → Elastic IP của EC2     (Caddy → NestJS)
CNAME video.skillpath.tuandt.me → dxxxx.cloudfront.net   (video HLS, chứng chỉ ACM ở us-east-1)
      cdn-skillpath.tuandt.me   → R2 public bucket       (Cloudflare tự tạo khi Connect Domain)
TXT   mail.tuandt.me            → bản ghi SPF/DKIM theo Brevo
```

- Mọi bản ghi để **DNS only (xám)**, trừ `cdn-skillpath` do R2 tự bật proxy. Vercel, Caddy, CloudFront, GitHub Pages đều tự cấp HTTPS; bật proxy Cloudflare phía trước sẽ cản cấp chứng chỉ, và `api.` còn cần IP thật của client (qua `X-Forwarded-For` của Caddy) cho rate limit
- `cdn-skillpath` dùng dấu gạch ngang thay vì `cdn.skillpath`: Universal SSL miễn phí của Cloudflare chỉ phủ subdomain một cấp (`*.tuandt.me`), mà bản ghi này bắt buộc proxied
- Cookie session `Domain=.skillpath.tuandt.me` (`COOKIE_DOMAIN`), bao cả `skillpath.`, `api.skillpath.`, `video.skillpath.`
- Cần HTTPS cho cookie `secure`, Stripe webhook và link QR trên chứng chỉ. Vercel tự cấp chứng chỉ cho FE, Caddy tự xin chứng chỉ Let's Encrypt cho `api.`
- Gửi mail từ subdomain `mail.` để không đụng SPF của domain gốc và tách uy tín gửi mail

**Lưu ý với Supabase**
- Api và worker dùng **transaction pooler** (cổng `6543`, Prisma thêm `?pgbouncer=true`). Migration dùng session pooler hoặc direct. Kết nối direct chỉ có IPv6 trên gói free
- Chọn region **cùng vùng với EC2** (Singapore) để giảm độ trễ truy vấn
- Gói free: 500MB và tự tạm dừng sau 1 tuần không truy cập. Kiểm tra trước buổi bảo vệ

**Giám sát**
- Sentry gói Student (50K errors, 100K transactions/tháng, 1 năm, gia hạn được, không tính phí vượt hạn mức)
- Loại route heartbeat khỏi tracing (`tracesSampler` trả `0`) để không hết hạn mức transaction

**Dữ liệu demo**
- Stripe dùng test mode (thẻ `4242 4242 4242 4242`)
- Chuẩn bị script sinh dữ liệu giả lập (học viên, lượt học, bài nộp) để demo dashboard và đánh giá recommendation
