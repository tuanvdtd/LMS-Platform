# Tích hợp Sentry (api + web) và cảnh báo Discord

- Ngày: 2026-09-29
- Phạm vi: `back-end/`, `it-course-platform/`, cấu hình trên sentry.io
- Liên quan: `de-xuat-do-an.md` §4.1 (Giám sát lỗi), §Giám sát
- Tài liệu: docs.sentry.io/platforms/javascript/guides/nestjs, …/guides/nextjs (manual setup), …/guides/node/install/esm — SDK v11

## 1. Mục tiêu

Gắn Sentry cho những gì **đang có**: NestJS api (auth, Prisma, Redis, mail) và Next.js FE. Bắt lỗi hai phía, trace nối FE → API, replay khi lỗi, cảnh báo qua Discord.

**Trong phạm vi**

- `@sentry/nestjs` cho api, `@sentry/nextjs` cho FE
- Gắn user (`id`, `role`) hai phía; chặn thu thập dữ liệu nhạy cảm
- Tracing FE → API (khác origin)
- Session Replay chỉ khi có lỗi
- 5 alert rule gửi Discord `#sentry-alerts`
- Quy ước để các module sau (worker, queue, cron, webhook, CI) tự gắn Sentry (§8)

**Ngoài phạm vi**

- Worker, RabbitMQ, cron, Stripe, Judge0 — chưa có code; làm theo §8 khi viết các module đó
- Dockerfile, GitHub Actions, release + upload source map cho api
- Profiling, Sentry Logs/Metrics, Feedback widget, Uptime monitor
- Email alert (chỉ dùng Discord)

## 2. Quyết định

| Quyết định | Lý do |
|---|---|
| 2 project: `skillpath-web`, `skillpath-api` | Issue/alert tách theo phía; trace vẫn nối vì cùng organization. Worker sau này dùng chung `skillpath-api`, phân biệt bằng tag `process` |
| Bật theo DSN: có `SENTRY_DSN` thì gửi, để trống thì SDK không gửi gì | Dev ở local vẫn xem được lỗi/trace; test và CI không cần Sentry |
| `environment` lấy từ env, mặc định `development` | Alert báo **cả dev lẫn prod** (sếp chọn); environment hiện trong tin Discord để phân biệt |
| Tự cấu hình theo manual setup, không dùng `@sentry/wizard` | Wizard sinh `sentry-example-page`, `.env.sentry-build-plugin` và ghi đè `next.config.ts` |
| Chỉ gửi `id` + `role`, khai báo `dataCollection` rõ ràng | SDK v11 mặc định thu thập body, cookie, header, biến trong stack, dữ liệu query DB; `sendDefaultPii` đã deprecated. Body `/api/auth/sign-in` chứa mật khẩu. `Sentry.setUser()` luôn được gửi, không phụ thuộc `dataCollection` |
| api nạp `instrument.js` bằng `node --import` | Dự án chạy ESM (`"type": "module"`). `import './instrument'` đầu `main.ts` như docs NestJS (viết cho CJS) sẽ không tự đo được Express/Prisma/ioredis |
| Lỗi Better Auth bắt qua `onAPIError.onError`, không dùng `setupExpressErrorHandler` | `/api/auth/*` mount ngoài pipeline Nest (`setup-app.ts`). Better Auth tự `catch` lỗi rồi trả response (`onAPIError.throw` mặc định `false`), nên Express error handler không bao giờ thấy lỗi |
| Không sửa CORS | `enableCors` không đặt `allowedHeaders` → gói `cors` phản chiếu `Access-Control-Request-Headers`, nên `sentry-trace`/`baggage` đã qua được. Plan kiểm lại bằng preflight thật |
| `tracesSampleRate` cố định: dev `1.0`, prod `0.2` | Chưa có route nào cần loại (chưa có heartbeat/health). Khi có thì đổi sang `tracesSampler` (§8). SDK v11 chạy chế độ stream: `ignoreTransactions`/`beforeSendTransaction` **không có tác dụng**, chỉ dùng được `tracesSampler` hoặc `ignoreSpans` |
| Replay: `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0`, che toàn bộ text/input/media | Chỉ cần replay lúc lỗi; giữ hạn mức; không lộ nội dung người dùng |
| `tunnelRoute: "/monitoring"` | Trình chặn quảng cáo hay chặn `*.ingest.sentry.io`. Không đụng `proxy.ts` (matcher chỉ gồm `/login`, `/register`, `/forgot-password`) |

## 3. Biến môi trường

**`back-end/.env.example`** (nhóm "Không bắt buộc")

```
# Để trống = tắt Sentry
SENTRY_DSN=
# development | production
SENTRY_ENVIRONMENT=development
```

**`it-course-platform/.env.example`**

```
# Để trống = tắt Sentry
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
# Chỉ cần lúc build để upload source map (Vercel). Không commit token.
SENTRY_ORG=
SENTRY_PROJECT=skillpath-web
SENTRY_AUTH_TOKEN=
```

## 4. Back-end (`skillpath-api`)

```
back-end/
├── package.json                  + @sentry/nestjs
│                                 dev:        nest start --watch --exec "node --import ./dist/instrument.js"
│                                 start:prod: node --enable-source-maps --import ./dist/instrument.js dist/main
└── src/
    ├── instrument.ts             MỚI — import './env.js' trước, rồi Sentry.init
    ├── app.module.ts             + SentryModule.forRoot() (đứng đầu imports), APP_FILTER: SentryGlobalFilter
    ├── auth/auth.ts              + onAPIError.onError → captureException (xem dưới)
    ├── auth/auth.guard.ts        + Sentry.setUser({ id, role }) sau khi có session
    └── debug.controller.ts       MỚI — GET /api/debug-sentry; AppModule chỉ thêm vào `controllers` khi SENTRY_ENVIRONMENT !== 'production'
```

**`instrument.ts`**

- `import './env.js'` đầu file — không có thì `SENTRY_DSN` trong `.env` chưa được nạp
- `Sentry.init({ dsn: optionalEnv('SENTRY_DSN'), environment, tracesSampleRate, dataCollection })`
- `dataCollection`: `userInfo: false`, `cookies: false`, `httpHeaders: false`, `httpBodies: []`, `urlQueryParams: false` (token reset mật khẩu nằm trên query), `databaseQueryData: false`, `stackFrameVariables: false`. Bước đầu tiên của plan sau `pnpm add`: xác nhận tên và kiểu từng trường theo type của `@sentry/nestjs`/`@sentry/nextjs` đã cài

**Stack trace**: dev đã map về `.ts` vì Nest CLI tự thêm `--enable-source-maps`; `start:prod` phải thêm flag này (source map nằm cạnh `dist/*.js`), vì upload source map cho api nằm ngoài phạm vi.

**`SentryGlobalFilter`**: chỉ gửi lỗi không phải `HttpException` (5xx thật). 401/403 của `AuthGuard` không lên Sentry. Response trả client giữ nguyên như hiện tại.

**Better Auth `onAPIError.onError(e, ctx)`**

- Gửi `captureException(e)` khi `!isAPIError(e)` hoặc `e.status === 'INTERNAL_SERVER_ERROR'`. Lỗi 4xx (sai mật khẩu, email chưa xác minh) không gửi
- Khai báo `onError` là Better Auth bỏ qua bước log mặc định, nên handler phải tự log bằng `ctx.logger.error(...)` để terminal vẫn thấy lỗi

**Debug route**: `DebugController` với `@Public() GET /api/debug-sentry` ném `Error`. `AppModule` chỉ đưa controller này vào `controllers` khi `SENTRY_ENVIRONMENT !== 'production'`, nên ở prod route không tồn tại (404). Dùng để kiểm tra issue, trace, alert và để demo khi bảo vệ.

## 5. Front-end (`skillpath-web`)

```
it-course-platform/
├── next.config.ts                     bọc withSentryConfig
└── src/
    ├── instrumentation-client.ts      MỚI — init trình duyệt + export onRouterTransitionStart
    ├── sentry.server.config.ts        MỚI — init Node runtime
    ├── sentry.edge.config.ts          MỚI — init Edge runtime (chưa có code Edge, proxy.ts ở Next 16 chạy Node; giữ theo docs)
    ├── instrumentation.ts             MỚI — register() theo NEXT_RUNTIME; export onRequestError = Sentry.captureRequestError
    ├── app/global-error.tsx           MỚI — captureException + trang lỗi đơn giản
    ├── app/layout.tsx                 + <SentryUser />
    └── components/sentry-user.tsx     MỚI — 'use client'; authClient.useSession() → Sentry.setUser({ id, role }) / setUser(null)
```

- Ba file init dùng chung `dsn`, `environment`, `tracesSampleRate` (dev `1.0`, prod `0.2`) và `dataCollection` như §4
- Chỉ phía client: `tracePropagationTargets: [process.env.NEXT_PUBLIC_API_URL]` (không có thì trình duyệt không gắn header trace cho request khác origin → trace đứt đôi), `replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true })`
- `<SentryUser />` đặt ở root layout vì các trang auth, `learn` và `onboarding` không có `Header`. `useSession` dùng chung store với header nên không phát sinh thêm request ở trang đã có header
- `withSentryConfig(nextConfig, { org, project, authToken, tunnelRoute: '/monitoring', widenClientFileUpload: true, silent: !process.env.CI })`. Thiếu `SENTRY_AUTH_TOKEN` thì chỉ bỏ qua upload source map, `pnpm build` vẫn thành công

## 6. Alerts (cấu hình trên sentry.io)

Một kênh `#sentry-alerts` qua Discord integration (đã cài). Không đặt filter environment → báo cả `development` lẫn `production`.

| # | Loại | Điều kiện | Project | Action interval |
|---|---|---|---|---|
| 1 | Issue | Issue mới lần đầu xuất hiện | web, api | 30 phút |
| 2 | Issue | Issue đã resolve bị tái phát (regression) | web, api | 30 phút |
| 3 | Issue | Một issue có hơn 20 event trong 5 phút | web, api | 30 phút |
| 4 | Metric | p95 thời gian transaction HTTP, cửa sổ 10 phút: > 1,5s là warning, > 3s là critical | api | — |
| 5 | Metric | Tỉ lệ transaction lỗi > 5%, cửa sổ 10 phút | api | — |

SDK v11 gửi span theo chế độ stream: khi cấu hình, xác nhận trên sentry.io tên metric tương ứng (p95 duration / failure rate của transaction hoặc span `http.server`); nếu tên đã đổi thì chọn metric tương đương, giữ nguyên ngưỡng.

Rule 4–5 không áp dụng cho web: thời gian tải trang phụ thuộc mạng người dùng, dễ báo sai.

Các bước: Settings → Integrations → Discord (đã có) → mỗi project → Alerts → Create Alert → chọn điều kiện theo bảng → action "Send a Discord notification" → server/kênh `#sentry-alerts`.

## 7. Xử lý lỗi & kiểm tra

**Nguyên tắc**: Sentry không bao giờ làm hỏng app. DSN trống hoặc Sentry không truy cập được thì app chạy như cũ. Không có `captureException` nào đổi response trả client.

**Kiểm tra tự động**

- `pnpm test` và `pnpm test:e2e` (back-end) vẫn qua khi không đặt `SENTRY_DSN`
- `pnpm build` (FE) qua khi không có `SENTRY_AUTH_TOKEN`
- `pnpm lint` hai phía sạch

**Kiểm tra thủ công** (có DSN, local)

1. `GET /api/debug-sentry` → issue trong `skillpath-api` có stack trace trỏ về file `.ts`; tin Discord rule 1 hiện `environment: development`
2. Đăng nhập rồi gọi route cần auth ném lỗi (tạm thời) → issue có user `id` + `role`, **không** có email, cookie, body
3. Trang FE gọi API → Trace Explorer hiện **một** trace gồm span trình duyệt + span Nest + span Prisma/Redis. Preflight OPTIONS trả `Access-Control-Allow-Headers` chứa `sentry-trace, baggage`
4. Ném lỗi tạm trong một client component → issue `skillpath-web` có replay, text trong replay bị che
5. Sign-in sai mật khẩu → **không** có issue (4xx)
6. Network tab: request gửi tới `/monitoring`, không gọi thẳng `ingest.sentry.io`

## 8. Quy ước khi thêm module sau

| Khi làm | Việc cần làm với Sentry |
|---|---|
| Worker (process thứ 2) | `instrument` riêng hoặc dùng chung với `initialScope: { tags: { process: 'worker' } }`; api gắn `process: 'api'`. Chạy bằng `--import` như api |
| RabbitMQ (`amqplib`) | SDK tự đo publish/consume, trace nối từ api sang worker. Consumer lỗi mà `nack`/đẩy vào DLQ thì phải `captureException` trước, vì lỗi đã bị bắt nên SDK không tự thấy |
| Cron (`@nestjs/schedule`) | Decorator `@SentryCron(slug, config)` hoặc `Sentry.withMonitor()`; Sentry tự cảnh báo khi cron không chạy hoặc chạy quá lâu |
| Heartbeat video, health check | Đổi `tracesSampleRate` sang `tracesSampler` trả `0` cho các route này (dùng `samplingContext.normalizedRequest`) |
| Stripe webhook, Judge0 callback | Thêm issue alert riêng: mọi lỗi trên transaction này đều báo, action interval 0 |
| Dockerfile | `CMD ["node", "--enable-source-maps", "--import", "./dist/instrument.js", "dist/main.js"]`; truyền `SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`, `SENTRY_RELEASE` qua env |
| CI (tham khảo `example/.github/workflows/ci-cd.yml`) | Sau bước build: `sentry-cli releases new` + `sourcemaps inject` + `sourcemaps upload ./dist` cho `skillpath-api`; `SENTRY_AUTH_TOKEN` để trong GitHub Secrets |
| Filter lỗi tự viết | Không bắt lỗi trước `SentryGlobalFilter`; nếu cần định dạng lỗi riêng thì dùng `@SentryExceptionCaptured()` trên `catch()` |
