# AuthModule — Better Auth trong NestJS

- Ngày: 2026-09-28
- Phạm vi: `back-end/`
- Liên quan: `de-xuat-do-an.md` §3.1, §4.4 · `schema-database.md` mục 1 (Auth), mục 5 (SQL bổ sung)

## 1. Mục tiêu

Đăng ký / đăng nhập / phân quyền cho học viên, giảng viên, admin bằng Better Auth mount trong NestJS 12.

**Trong phạm vi**

- Setup Prisma 6 với **toàn bộ** schema trong `schema-database.md`, migration `init` kèm SQL bổ sung mục 1–7. pg_cron chạy riêng, xem mục 8
- Email + mật khẩu, **bắt buộc xác minh email** trước khi đăng nhập
- OAuth Google, GitHub (user OAuth coi như đã xác minh)
- Quên / đặt lại mật khẩu
- Plugin `admin`: role (`student` | `instructor` | `admin`), ban, revoke session
- Rate limit các route auth
- Dọn user chưa xác minh sau 7 ngày
- Guard + decorator phân quyền cho các module sau dùng
- `GET /api/me`

**Ngoài phạm vi**

- Duyệt hồ sơ giảng viên → gán role `instructor` (module §3.2)
- RabbitMQ / worker gửi mail (module riêng; lúc đó chỉ đổi ruột `MailService`)
- UI frontend

## 2. Quyết định

| Quyết định | Lý do |
|---|---|
| Better Auth thay vì tự viết | Auth là chức năng nền (§3.1), không phải trọng tâm chấm. Có sẵn verify email, reset, OAuth, admin, rate limit |
| **Tự mount** (`toNodeHandler` + guard tự viết), không dùng `@thallesp/nestjs-better-auth` | Không thêm dependency cộng đồng; tránh vênh peer deps với NestJS 12; toàn bộ code nằm trong repo để giải thích khi bảo vệ |
| **Session: Redis + DB** (`secondaryStorage` = Redis, `storeSessionInDatabase: true`) | Đọc session nhanh từ Redis; bảng `session` là nguồn chính nên admin liệt kê / revoke được và không mất session khi Redis restart. Thay cho "chỉ Redis" (schema-database.md cũ) và "chỉ Postgres" (§4.4 cũ) |
| Bắt buộc xác minh email | Chặn tài khoản rác; chứng chỉ và đơn hàng gắn email thật |
| Rate limit trong Better Auth, storage ở Redis | Chặn spam đăng ký từ đầu vào, không cần middleware riêng |
| Dọn user chưa xác minh bằng `pg_cron` | 1 câu SQL chạy trong Supabase, không cần `@nestjs/schedule` hay worker. User chưa xác minh không đăng nhập được nên không có dữ liệu khác để mất |
| Gửi mail gọi Brevo REST API trực tiếp (`fetch`, không SDK), không `await` | Chưa có RabbitMQ. `MailService` là ranh giới: sau này đổi sang publish job, auth không đổi |
| Env qua `process.loadEnvFile()` trong `env.ts` | Có sẵn trong Node, không cần `@nestjs/config`. Chỉ nuốt lỗi `ENOENT` (prod Docker không có file `.env`, biến đến từ môi trường); lỗi khác ném lại. Đọc `.env` theo cwd → luôn chạy từ `back-end/`. Vì `main.ts` và e2e đều import `env.ts` nên dev, test, prod dùng chung một cơ chế |
| Pin **Prisma 6** | Schema trong `schema-database.md` viết kiểu Prisma 6 (`url`/`directUrl` trong `datasource`, generator `prisma-client-js`). Prisma 7+ bắt buộc `prisma.config.ts` và driver adapter, sẽ vỡ ngay bước đầu |

## 3. Cấu trúc

```
back-end/
├── prisma/
│   ├── schema.prisma                 toàn bộ schema từ schema-database.md
│   ├── sql/01_post_migrate.sql       mục 5 "SQL bổ sung" mục 1–7 — dán vào migration init
│   ├── sql/02_pg_cron.sql            mục 5 mục 8 — chạy tay, KHÔNG nằm trong migration
│   └── migrations/<ts>_init/
├── src/
│   ├── env.ts                        loadEnvFile + requireEnv(name) / optionalEnv(name)
│   ├── infra/
│   │   ├── infra.module.ts           @Global: export PrismaService, RedisService cho mọi module
│   │   ├── prisma.service.ts         PrismaClient + onModuleInit/onModuleDestroy
│   │   └── redis.ts                  RedisService (ioredis) + redisStorage(): SecondaryStorage {get,getAndDelete,increment,set,delete}
│   ├── mail/mail.service.ts          Brevo (fetch): sendVerification(), sendResetPassword()
│   ├── auth/
│   │   ├── auth.ts                   createAuth(prisma, redis, mail) → betterAuth({...})
│   │   ├── auth.guard.ts             global guard
│   │   ├── decorators.ts             @Public() @Roles(...) @CurrentUser()
│   │   ├── me.controller.ts          GET /api/me
│   │   └── auth.module.ts            provide AUTH token, APP_GUARD
│   ├── app.controller.ts             GET /api health, gắn @Public()
│   ├── setup-app.ts                  CORS → auth handler → json → prefix; main.ts và e2e dùng chung
│   ├── app.module.ts
│   └── main.ts
├── test/auth.e2e-spec.ts
└── .env.example
```

`AuthModule` export token `AUTH` (instance Better Auth) để module khác gọi `auth.api.*` (vd module duyệt giảng viên gọi `setRole`).

## 4. Cấu hình Better Auth (`auth.ts`)

```ts
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements, adminAc } from 'better-auth/plugins/admin/access';

// Better Auth mặc định chỉ biết role 'admin' | 'user' → setRole('instructor') sẽ lỗi
// YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE nếu không khai báo.
const ac = createAccessControl(defaultStatements);
const roles = {
  student: ac.newRole({}),
  instructor: ac.newRole({}),
  admin: ac.newRole({ ...adminAc.statements }),
};

betterAuth({
  baseURL: env BETTER_AUTH_URL,          // https://api.skillpath.dotattuan.id.vn
  basePath: '/api/auth',
  secret: env BETTER_AUTH_SECRET,
  trustedOrigins: [env FE_URL],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secondaryStorage: redisStorage,
  session: { storeSessionInDatabase: true },
  advanced: {
    database: { generateId: () => uuidv7() },
    crossSubDomainCookies: { enabled: !!COOKIE_DOMAIN, domain: COOKIE_DOMAIN }, // prod: .skillpath.dotattuan.id.vn
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: ({ user, url }) => void mail.sendResetPassword(user.email, url),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: ({ user, url }) => void mail.sendVerification(user.email, url),
  },
  socialProviders: {                     // provider nào thiếu key thì bỏ khỏi object (dev có thể không có OAuth)
    google: { clientId, clientSecret },
    github: { clientId, clientSecret },
  },
  user: {
    additionalFields: {
      targetTrack: { type: 'string', required: false },
      level: { type: 'string', required: false },
    },
  },
  rateLimit: {
    enabled: true,                       // mặc định Better Auth chỉ bật ở production
    storage: 'secondary-storage',
    customRules: { '/sign-up/email': { window: 600, max: 3 } },
  },
  plugins: [admin({ ac, roles, defaultRole: 'student', adminRoles: ['admin'] })],
});
```

`targetTrack` / `level` là enum trong Prisma; Better Auth coi là string. Giá trị không hợp lệ bị Prisma Client từ chối (lỗi 500 từ Better Auth); validate trên form FE là đủ cho đồ án.

**Cookie khi dev:** `COOKIE_DOMAIN` để trống → `crossSubDomainCookies` tắt. Dev chạy `localhost:3000` → `localhost:4000` là cùng site nên cookie `sameSite=lax` vẫn được gửi.

## 5. `main.ts`

```ts
const app = await NestFactory.create(AppModule, { bodyParser: false });
const auth = app.get(AUTH);
app.enableCors({ origin: env FE_URL, credentials: true });          // 1. TRƯỚC auth handler, không thì /api/auth/* thiếu header CORS
app.getHttpAdapter().getInstance()
  .all('/api/auth/*splat', toNodeHandler(auth));                     // 2. .all, không .use (use cắt prefix khỏi req.url)
app.use(express.json());                                             // 3. SAU auth handler
app.setGlobalPrefix('api');
await app.listen(process.env.PORT ?? 4000);
```

Thứ tự là bắt buộc. Better Auth tự đọc body, nên nếu `express.json()` chạy trước thì stream đã bị đọc hết và handler bị treo. Middleware được đăng ký theo đúng thứ tự gọi.

**IP cho rate limit:** Better Auth lấy IP từ `x-forwarded-for` và chỉ tin header có **một** giá trị, trừ khi cấu hình `trustedProxies`. Ở prod, Caddy mặc định không tin `X-Forwarded-For` do client gửi lên và ghi đè bằng IP thật, nên header luôn chỉ có một giá trị. Ở dev và test, request không có header này sẽ bị tính là `127.0.0.1`, tức là mọi request dùng chung một bộ đếm.

## 6. Luồng request

```
Request ─► Express
   ├─ /api/auth/*  ──► toNodeHandler(auth)
   └─ còn lại ──► express.json() ──► Nest (/api) ──► AuthGuard (global)
                                         ├─ @Public()      → cho qua
                                         ├─ getSession()   → null → 401
                                         ├─ @Roles(...)    → role không khớp → 403
                                         └─ req.user, req.session → controller
```

- Guard: `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`.
- `@Public()` và `@Roles()` đọc bằng `Reflector.getAllAndOverride` (handler ưu tiên hơn class).
- **Ban:** plugin admin chặn tạo session và revoke session hiện có khi ban → guard không kiểm tra `banned`.
- **Đổi role:** session trong Redis chứa kèm user. Đã đọc mã nguồn Better Auth 1.7.6: `internalAdapter.updateUser` (mà `setRole` dùng) gọi `refreshUserSessions` để ghi lại user mới vào mọi session trong Redis. Vì vậy request kế tiếp thấy role mới ngay, không cần revoke session. Test (mục 10, bước 5) chốt lại điều này.
- `@CurrentUser()` trả `req.user`.

## 7. Xử lý lỗi

| Tình huống | Xử lý |
|---|---|
| Lỗi trong `/api/auth/*` | Better Auth trả JSON `{ code, message }` (vd 403 `EMAIL_NOT_VERIFIED`, 429 rate limit) |
| Guard từ chối | `UnauthorizedException` / `ForbiddenException` — format mặc định của Nest |
| Brevo lỗi (HTTP ≠ 2xx, timeout 10s) | Không chặn request; `Logger.error`. User dùng `/api/auth/send-verification-email` để gửi lại |
| Redis sập | Request có auth lỗi. `ponytail:` comment trong `redis.ts`: dựa vào Upstash; nâng cấp = adapter bắt lỗi và trả `null` để Better Auth rơi về DB |
| Thiếu env bắt buộc | `requireEnv()` ném lỗi lúc khởi động (biến nào bắt buộc: xem mục 10) |
| Mail lỗi | `MailService` tự `try/catch` bên trong. Nếu không, lời gọi không `await` sẽ gây unhandled rejection làm sập Node |

## 8. Dọn user chưa xác minh

Thêm vào mục 5 "SQL bổ sung" (mục 8 mới):

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('purge-unverified-users', '0 20 * * *', $$
  DELETE FROM "user"
  WHERE "emailVerified" = false AND "createdAt" < now() - interval '7 days'
$$);
```

`account` và `session` tự xoá theo nhờ `onDelete: Cascade`. Các dòng `verification` còn sót không có FK nên không xoá theo, nhưng chúng tự hết hạn nên không sao.

**Cách áp dụng:** lưu thành file riêng `prisma/sql/02_pg_cron.sql` và chạy tay một lần mỗi môi trường, sau khi đã `migrate deploy`: `pnpm prisma db execute --schema prisma/schema.prisma --file prisma/sql/02_pg_cron.sql`. **Không** đưa vào `migration.sql`, vì pg_cron chỉ tạo được trong database chính, còn shadow DB của `migrate dev` sẽ báo lỗi. Trước khi chạy, bật extension `pg_cron` trong Supabase Dashboard.

## 9. Admin đầu tiên

Không có endpoint nào tự nâng quyền. Cách tạo admin đầu tiên cho mỗi môi trường: đăng ký bình thường → xác minh email → chạy tay `UPDATE "user" SET role = 'admin' WHERE email = '...';`. Ghi lệnh này vào README của back-end.

## 10. Test

`test/auth.e2e-spec.ts` dùng vitest e2e và supertest có sẵn, chạy trên DB và Redis dev. `MailService` được override để giữ lại link xác minh.

- **Admin cho test:** `beforeAll` tạo một user thứ hai rồi dùng Prisma đặt `role = 'admin'` và `emailVerified = true`, sau đó sign-in để lấy cookie admin. Admin này là người gọi `setRole` và `banUser`.
- **Tránh 429 giả:** bộ đếm rate limit lưu ở Redis nên còn nguyên giữa các lần chạy test. Vì vậy mọi request gửi kèm một `X-Forwarded-For` ngẫu nhiên riêng, giúp các bước 2–6 không đụng rule mặc định của `/sign-in/email`. Riêng bước 7 dùng một IP cố định mới sinh cho lần chạy đó.

1. Sign-up → 200, mail mock nhận link xác minh
2. Sign-in khi chưa xác minh → 403 `EMAIL_NOT_VERIFIED`
3. Mở link xác minh → sign-in → có cookie
4. `GET /api/me`: có cookie → 200 kèm user; không cookie → 401
5. Route `@Roles('admin')`, khai báo ngay trong file test: student gọi thì 403. Admin gọi `POST /api/auth/admin/set-role` đổi student thành `instructor`, sau đó cho `@Roles('instructor')` thì 200. Test này kiểm tra luôn chuyện role lưu kèm session trong Redis, nêu ở mục 6
6. Admin gọi `POST /api/auth/admin/ban-user` → `GET /api/me` của student → 401
7. Cùng một IP gọi sign-up 4 lần: lần thứ 4 nhận 429

Mỗi lần chạy dùng email ngẫu nhiên; xoá user tạo ra ở `afterAll`. OAuth test tay trên môi trường dev.

## 11. Biến môi trường (`.env.example`)

Bắt buộc: `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `FE_URL`, `BREVO_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM_EMAIL`. Không bắt buộc: `COOKIE_DOMAIN`, các key `GOOGLE_*` và `GITHUB_*`.

```
# Supabase transaction pooler :6543 ?pgbouncer=true
DATABASE_URL=
# session pooler / direct, cho migrate
DIRECT_URL=
# Upstash rediss://
REDIS_URL=
# openssl rand -base64 32
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:4000
FE_URL=http://localhost:3000
# prod: .skillpath.dotattuan.id.vn — để trống khi dev
COOKIE_DOMAIN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
BREVO_API_KEY=
MAIL_FROM_NAME=SkillPath
# phải là sender/domain đã xác minh trong Brevo
MAIL_FROM_EMAIL=no-reply@mail.dotattuan.id.vn
```

## 12. Dependency mới

`better-auth@^1.7.6`, `@prisma/client@^6`, `prisma@^6` (dev), `ioredis`, `uuid`, `express` (đã là dependency gián tiếp của `@nestjs/platform-express`, khai báo trực tiếp để import `express.json`).

## 13. Cập nhật tài liệu đi kèm

- `schema-database.md`: dòng quyết định "Bảng `session`", comment cấu hình ở mục 1, comment model `Session`, thêm pg_cron vào mục 5
- `de-xuat-do-an.md` §4.4: session Redis + DB
