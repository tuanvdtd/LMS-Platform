# Tích hợp Sentry (api + web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gắn Sentry cho NestJS api và Next.js FE: bắt lỗi hai phía, trace FE → API, replay khi lỗi, chỉ gửi `id` + `role` của user, cảnh báo qua Discord.

**Architecture:** api nạp `dist/instrument.js` bằng `node --import` (ESM) trước app; `SentryGlobalFilter` bắt lỗi Nest, `onAPIError.onError` bắt lỗi Better Auth (mount ngoài pipeline Nest). FE làm theo manual setup của `@sentry/nextjs` (3 file init dùng chung một object option), bọc `withSentryConfig`. DSN trống → SDK tắt.

**Tech Stack:** `@sentry/nestjs` 11.x, `@sentry/nextjs` 11.x, NestJS 12 (ESM, vitest), Next.js 16.3.6 App Router, better-auth 1.7.6, pnpm, Node 24.

**Spec:** `docs/superpowers/specs/2026-09-29-sentry-integration-design.md`

**Quy định repo:** KHÔNG `git commit` / `git push` ở bất kỳ bước nào. Sếp tự commit. Cuối plan chỉ đề xuất commit message.

Lệnh BE chạy từ `/Users/bssgroup/Personal/Project/back-end`, lệnh FE từ `/Users/bssgroup/Personal/Project/it-course-platform`.

---

## File Structure

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `back-end/package.json` | Sửa | `@sentry/nestjs`; script `dev`, `start:prod` nạp `instrument.js` |
| `back-end/.env.example` | Sửa | `SENTRY_DSN`, `SENTRY_ENVIRONMENT` |
| `back-end/src/instrument.ts` | Tạo | `Sentry.init` (DSN, environment, sampling, `dataCollection`) |
| `back-end/src/debug.controller.ts` | Tạo | `GET /api/debug-sentry` ném lỗi (không có ở prod) |
| `back-end/src/app.module.ts` | Sửa | `SentryModule.forRoot()`, `SentryGlobalFilter`, `DebugController` có điều kiện |
| `back-end/test/app.e2e-spec.ts` | Sửa | Test debug route trả 500 đúng định dạng |
| `back-end/src/auth/auth.ts` | Sửa | `isServerError` + `onAPIError.onError` |
| `back-end/src/auth/auth.spec.ts` | Tạo | Unit test `isServerError` |
| `back-end/src/auth/auth.guard.ts` | Sửa | `Sentry.setUser({ id, role })` |
| `it-course-platform/package.json` | Sửa | `@sentry/nextjs` |
| `it-course-platform/.env.example` | Sửa | Biến Sentry |
| `src/lib/sentry-options.ts` | Tạo | Option dùng chung cho 3 runtime |
| `src/instrumentation-client.ts` | Tạo | Init trình duyệt: trace propagation, replay |
| `src/sentry.server.config.ts`, `src/sentry.edge.config.ts` | Tạo | Init Node / Edge |
| `src/instrumentation.ts` | Tạo | `register()` + `onRequestError` |
| `src/app/global-error.tsx` | Tạo | Error boundary gốc |
| `src/components/sentry-user.tsx` | Tạo | Đồng bộ session → `Sentry.setUser` |
| `src/lib/auth-client.ts` | Sửa | `adminClient()` để có kiểu `user.role` |
| `src/app/layout.tsx` | Sửa | Gắn `<SentryUser />` |
| `next.config.ts` | Sửa | `withSentryConfig` |

---

### Task 1: Cài SDK back-end và chốt kiểu `dataCollection`

**Files:**
- Modify: `back-end/package.json`

- [ ] **Step 1: Cài package**

Run: `pnpm add @sentry/nestjs`
Expected: `package.json` có `"@sentry/nestjs": "^11.x"`.

- [ ] **Step 2: Đọc kiểu `dataCollection` của bản đã cài**

pnpm không hoist `@sentry/core` → tìm trong `.pnpm`. Trước tiên `ls node_modules/.pnpm | grep sentry` để thấy tên thư mục (glob không khớp thì zsh báo "no matches found").

Run: `f=$(grep -rln "dataCollection" node_modules/.pnpm/@sentry+core*/node_modules/@sentry/core/build/types | head -1); echo $f; grep -n "dataCollection" -A60 $f | head -120`

Ghi lại tên + kiểu các trường: `userInfo`, `cookies`, `httpHeaders`, `httpBodies`, `urlQueryParams`, `databaseQueryData`, `stackFrameVariables`. Code ở Task 2 và Task 6 giả định: các trường `CollectBehavior` nhận `false`, `httpBodies` nhận `[]`. Nếu kiểu khác (ví dụ `CollectBehavior` là union chuỗi) → dùng giá trị tương ứng nghĩa "không thu thập" và sửa luôn đoạn code trong Task 2 + Task 6 trước khi làm.

- [ ] **Step 3: Kiểm tra subpath `@sentry/nestjs/setup` (Task 3 import từ đây)**

Run: `node --input-type=module -e "import('@sentry/nestjs/setup').then(m=>console.log(typeof m.SentryModule, typeof m.SentryGlobalFilter))"`
Expected: `function function`. Nếu lỗi → tìm export mới bằng `grep -n '"./' node_modules/@sentry/nestjs/package.json` và sửa import ở Task 3.

### Task 2: `instrument.ts` + script

**Files:**
- Create: `back-end/src/instrument.ts`
- Modify: `back-end/package.json` (scripts)
- Modify: `back-end/.env.example`

- [ ] **Step 1: Tạo `src/instrument.ts`**

```ts
// Nạp bằng `node --import ./dist/instrument.js` (ESM): phải chạy trước mọi module
// khác thì SDK mới tự đo được Express/Prisma/ioredis. import env.js để có .env.
import * as Sentry from '@sentry/nestjs';
import { optionalEnv } from './env.js';

const environment = optionalEnv('SENTRY_ENVIRONMENT') ?? 'development';

// DSN trống → SDK không gửi gì (dev chưa cấu hình, test, CI).
Sentry.init({
  dsn: optionalEnv('SENTRY_DSN'),
  environment,
  tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  // v11 mặc định gửi body/cookie/header/biến trong stack/query DB → tắt hết.
  // Body sign-in có mật khẩu, query reset có token. User chỉ gắn tay (id, role).
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});
```

- [ ] **Step 2: Sửa script trong `package.json`**

```json
"dev": "nest start --watch --exec \"node --import ./dist/instrument.js\"",
"start:prod": "node --enable-source-maps --import ./dist/instrument.js dist/main",
```

- [ ] **Step 3: Thêm vào `.env.example`, nhóm "Không bắt buộc"**

```
# Sentry project skillpath-api. Để trống = tắt
SENTRY_DSN=
# development | production
SENTRY_ENVIRONMENT=development
```

- [ ] **Step 4: Kiểm tra build + chạy**

Run: `pnpm build && ls dist/instrument.js`
Expected: file tồn tại.

Run: `pnpm dev` (để trống `SENTRY_DSN`), chờ log `Nest application successfully started`, rồi `curl -s localhost:4000/api`
Expected: `Hello World!`. Dừng server.

### Task 3: `SentryModule`, `SentryGlobalFilter`, debug route

**Files:**
- Create: `back-end/src/debug.controller.ts`
- Modify: `back-end/src/app.module.ts`
- Test: `back-end/test/app.e2e-spec.ts`

- [ ] **Step 1: Viết test e2e (thêm vào `describe` trong `test/app.e2e-spec.ts`)**

```ts
  // Filter của Sentry không được đổi response trả client.
  it('/api/debug-sentry (GET) → 500 mặc định của Nest', () => {
    return request(app.getHttpServer())
      .get('/api/debug-sentry')
      .expect(500)
      .expect({ statusCode: 500, message: 'Internal server error' });
  });
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Lưu ý: `app.module.ts` đọc `.env` qua `env.js` → `back-end/.env` không được đặt `SENTRY_ENVIRONMENT=production`, nếu không route bị bỏ và test nhận 404.

Run: `pnpm test:e2e test/app.e2e-spec.ts`
Expected: FAIL, nhận 404 thay vì 500.

- [ ] **Step 3: Tạo `src/debug.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators.js';

// Kiểm tra Sentry (issue, trace, alert Discord). AppModule không nạp ở production.
@Controller('debug-sentry')
export class DebugController {
  @Public()
  @Get()
  fail(): never {
    throw new Error('Sentry debug error');
  }

  // Cần đăng nhập → AuthGuard chạy Sentry.setUser, kiểm tra issue có id + role.
  @Get('authed')
  failAuthed(): never {
    throw new Error('Sentry debug error (authed)');
  }
}
```

- [ ] **Step 4: Sửa `src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DebugController } from './debug.controller.js';
import { optionalEnv } from './env.js';
import { InfraModule } from './infra/infra.module.js';

const isProd = optionalEnv('SENTRY_ENVIRONMENT') === 'production';

@Module({
  // SentryModule đứng đầu theo docs.
  imports: [SentryModule.forRoot(), InfraModule, AuthModule],
  controllers: [AppController, ...(isProd ? [] : [DebugController])],
  // Chỉ gửi lỗi không phải HttpException; response giữ như BaseExceptionFilter.
  providers: [AppService, { provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
```

- [ ] **Step 5: Chạy test, xác nhận PASS**

Run: `pnpm test:e2e test/app.e2e-spec.ts`
Expected: PASS cả 2 test.

- [ ] **Step 6: Chạy toàn bộ e2e (401/403 của guard không đổi)**

Run: `pnpm test:e2e`
Expected: PASS hết.

### Task 4: Bắt lỗi Better Auth

**Files:**
- Modify: `back-end/src/auth/auth.ts`
- Test: `back-end/src/auth/auth.spec.ts`

- [ ] **Step 1: Viết test `src/auth/auth.spec.ts`**

```ts
import { APIError } from 'better-auth/api';
import { isServerError } from './auth.js';

describe('isServerError', () => {
  it('lỗi không phải APIError → gửi Sentry', () => {
    expect(isServerError(new Error('db down'))).toBe(true);
  });
  it('APIError 500 → gửi Sentry', () => {
    expect(isServerError(new APIError('INTERNAL_SERVER_ERROR'))).toBe(true);
  });
  it('APIError 4xx (sai mật khẩu, chưa xác minh) → bỏ qua', () => {
    expect(isServerError(new APIError('BAD_REQUEST'))).toBe(false);
    expect(isServerError(new APIError('UNAUTHORIZED'))).toBe(false);
    expect(isServerError(new APIError('FORBIDDEN'))).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL**

Run: `pnpm test src/auth/auth.spec.ts`
Expected: FAIL, `isServerError` is not a function / không export.

- [ ] **Step 3: Sửa `src/auth/auth.ts`**

Thêm import:

```ts
import * as Sentry from '@sentry/nestjs';
import { isAPIError } from 'better-auth/api';
```

Thêm hàm (trên `createAuth`):

```ts
// Chỉ lỗi thật của server lên Sentry; 4xx là lỗi của người dùng.
export function isServerError(e: unknown): boolean {
  return !isAPIError(e) || e.status === 'INTERNAL_SERVER_ERROR';
}
```

Thêm vào object `betterAuth({...})`, ngay sau `plugins: [...]`:

```ts
    // /api/auth/* mount ngoài pipeline Nest và Better Auth tự catch lỗi →
    // SentryGlobalFilter không thấy. Khai báo onError thì Better Auth bỏ log
    // mặc định → tự log lại.
    onAPIError: {
      onError: (e, ctx) => {
        if (!isServerError(e)) return;
        Sentry.captureException(e);
        ctx.logger.error('Better Auth error', e);
      },
    },
```

- [ ] **Step 4: Chạy, xác nhận PASS**

Run: `pnpm test src/auth/auth.spec.ts`
Expected: PASS 3 test.

- [ ] **Step 5: Chạy e2e auth (hành vi 4xx không đổi)**

Run: `pnpm test:e2e test/auth.e2e-spec.ts`
Expected: PASS hết.

### Task 5: Gắn user trong `AuthGuard`

**Files:**
- Modify: `back-end/src/auth/auth.guard.ts`

- [ ] **Step 1: Thêm import và `setUser`**

```ts
import * as Sentry from '@sentry/nestjs';
```

Ngay sau `req.session = session.session;`:

```ts
    // Chỉ id + role (spec §2); email/tên không rời khỏi hệ thống.
    Sentry.setUser({ id: session.user.id, role: session.user.role });
```

(Mỗi request có isolation scope riêng nên user không lẫn giữa các request.)

- [ ] **Step 2: Kiểm tra**

Run: `pnpm lint && pnpm test && pnpm test:e2e`
Expected: sạch lint, PASS hết. Nếu `pnpm lint` báo kiểu `role` (`string | null | undefined`) không hợp với `User`, đổi thành `role: session.user.role ?? undefined`.

### Task 6: Cài SDK FE + file init

**Files:**
- Modify: `it-course-platform/package.json`
- Create: `src/lib/sentry-options.ts`, `src/instrumentation-client.ts`, `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, `src/instrumentation.ts`

- [ ] **Step 1: Cài package và kiểm tra export của `withSentryConfig`**

Run: `pnpm add @sentry/nextjs`
Run: `node -e "import('@sentry/nextjs/config').then(m=>console.log('config:', typeof m.withSentryConfig)).catch(()=>console.log('config: none'))"`
Expected: `config: function` → Task 8 import từ `@sentry/nextjs/config`. Nếu `none` → import từ `@sentry/nextjs`.

Kiểm tra lại `dataCollection` như Task 1 Step 2 (cùng `@sentry/core`).

- [ ] **Step 2: Tạo `src/lib/sentry-options.ts`**

```ts
// Option chung cho 3 runtime (client, server, edge). Xem back-end/src/instrument.ts.
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development';

export const sentryOptions = {
  // Trống → SDK không gửi gì.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  environment,
  tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
  // v11 mặc định gửi body/cookie/header… → tắt hết; user chỉ gắn tay (id, role).
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
  },
};
```

Nếu TS báo `httpBodies: never[]` không khớp kiểu → thêm `as const` sau object hoặc khai báo kiểu `Parameters<typeof import('@sentry/nextjs').init>[0]`.

- [ ] **Step 3: Tạo `src/instrumentation-client.ts`**

```ts
import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from '@/lib/sentry-options';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

Sentry.init({
  ...sentryOptions,
  // API khác origin: không khai báo thì trình duyệt không gắn sentry-trace/baggage,
  // trace FE → API đứt đôi. Không dùng '' (khớp mọi URL, lộ header cho bên thứ ba).
  tracePropagationTargets: apiUrl ? [apiUrl] : [],
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, maskAllInputs: true, blockAllMedia: true }),
  ],
  // Chỉ ghi replay khi có lỗi.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

- [ ] **Step 4: Tạo `src/sentry.server.config.ts` và `src/sentry.edge.config.ts` (cùng nội dung)**

```ts
import * as Sentry from '@sentry/nextjs';
import { sentryOptions } from '@/lib/sentry-options';

Sentry.init(sentryOptions);
```

- [ ] **Step 5: Tạo `src/instrumentation.ts`**

```ts
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') await import('./sentry.server.config');
  // Hiện chưa có code Edge (proxy.ts ở Next 16 chạy Node); giữ theo docs cho route Edge sau này.
  if (process.env.NEXT_RUNTIME === 'edge') await import('./sentry.edge.config');
}

// Lỗi Server Component / Route Handler.
export const onRequestError = Sentry.captureRequestError;
```

### Task 7: Error boundary + user phía FE

**Files:**
- Create: `src/app/global-error.tsx`, `src/components/sentry-user.tsx`
- Modify: `src/lib/auth-client.ts`, `src/app/layout.tsx`

- [ ] **Step 1: Tạo `src/app/global-error.tsx`**

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Lỗi render ở cấp root layout. Thay cả layout nên phải tự có <html>/<body>.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Thêm `adminClient()` vào `src/lib/auth-client.ts` để có kiểu `user.role`**

```ts
import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
```

```ts
  plugins: [
    // Khớp plugin admin ở back-end → session.user có `role`.
    adminClient(),
    // Khớp user.additionalFields ở back-end/src/auth/auth.ts
    inferAdditionalFields({
```

- [ ] **Step 3: Tạo `src/components/sentry-user.tsx`**

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

// Đặt ở root layout: trang auth, learn, onboarding không có Header.
// Dùng chung store useSession với Header → không thêm request get-session.
export function SentryUser() {
  const { data } = authClient.useSession();
  const id = data?.user.id;
  const role = data?.user.role ?? undefined;

  useEffect(() => {
    Sentry.setUser(id ? { id, role } : null);
  }, [id, role]);

  return null;
}
```

- [ ] **Step 4: Gắn vào `src/app/layout.tsx`**

Lưu ý: từ đây mọi trang đều import `auth-client.ts` → thiếu `NEXT_PUBLIC_API_URL` thì mọi trang lỗi ngay khi tải (trước chỉ trang có Header). Local đã có trong `.env.local`; Vercel phải đặt biến này.

```tsx
import { SentryUser } from "@/components/sentry-user";
```

Trong `<body>`, trước `<ThemeProvider>`:

```tsx
        <SentryUser />
```

### Task 8: `withSentryConfig` + env

**Files:**
- Modify: `it-course-platform/next.config.ts`, `it-course-platform/.env.example`

- [ ] **Step 1: Sửa `next.config.ts`** (đường import theo kết quả Task 6 Step 1)

```ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async redirects() {
    return [{ source: "/instructor/dashboard", destination: "/instructor", permanent: false }];
  },
};

// Không có SENTRY_AUTH_TOKEN (dev local) → chỉ bỏ qua upload source map.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Đi qua domain của mình, trình chặn quảng cáo không chặn được.
  tunnelRoute: "/monitoring",
  widenClientFileUpload: true,
  silent: !process.env.CI,
});
```

- [ ] **Step 2: Thêm vào `.env.example`**

```
# Sentry project skillpath-web. Để trống = tắt
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
# Chỉ cần lúc build để upload source map (đặt trên Vercel). Không commit token.
SENTRY_ORG=
SENTRY_PROJECT=skillpath-web
SENTRY_AUTH_TOKEN=
```

- [ ] **Step 3: Build + lint không có token**

Run: `pnpm lint && pnpm build`
Expected: sạch lint; build thành công (có thể có cảnh báo bỏ qua upload source map, không phải lỗi).

- [ ] **Step 4: Chạy test schema hiện có**

Run: `node --test "src/**/*.test.ts"`
Expected: PASS hết (không đổi).

### Task 9: Cấu hình sentry.io + Alerts (sếp làm trên UI, em hướng dẫn)

- [ ] **Step 1:** Tạo 2 project: `skillpath-api` (platform NestJS), `skillpath-web` (platform Next.js). Copy DSN vào `back-end/.env` (`SENTRY_DSN`) và `it-course-platform/.env.local` (`NEXT_PUBLIC_SENTRY_DSN`)
- [ ] **Step 2:** Tạo 3 issue alert cho **mỗi** project, action "Send a Discord notification" → kênh `#sentry-alerts`, action interval 30 phút, không lọc environment:
  1. "A new issue is created"
  2. "The issue changes state from resolved to unresolved"
  3. "The issue is seen more than 20 times in 5 minutes"
- [ ] **Step 3:** Tạo 2 metric alert cho `skillpath-api`, cửa sổ 10 phút, gửi Discord `#sentry-alerts`:
  4. p95 thời gian của transaction/span `http.server`: warning > 1500ms, critical > 3000ms
  5. Failure rate > 5%

  SDK v11 gửi span theo stream: nếu UI không còn tên "transaction duration"/"failure rate", chọn metric tương đương trên span `http.server`, giữ ngưỡng.

### Task 10: Kiểm tra thủ công end-to-end (spec §7)

Chạy `pnpm dev` ở cả hai repo, đã có DSN.

- [ ] **Step 1:** `curl -s localhost:4000/api/debug-sentry` → issue `Sentry debug error` trong `skillpath-api`, frame trỏ về `src/debug.controller.ts`; Discord nhận tin rule 1 có `development`
- [ ] **Step 2:** Đăng nhập trên FE, trong DevTools gọi `fetch('http://localhost:4000/api/debug-sentry/authed', { credentials: 'include' })` → issue mới có user `id` + `role`; mở event, xác nhận **không** có email, cookie, header, body
- [ ] **Step 3:** Preflight: `curl -si -X OPTIONS localhost:4000/api/me -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: sentry-trace,baggage'` → `Access-Control-Allow-Headers` chứa `sentry-trace,baggage`
- [ ] **Step 4:** Tải một trang FE có gọi `get-session` → Trace Explorer: một trace gồm span trình duyệt + span `http.server` của Nest (+ Prisma/Redis nếu có)
- [ ] **Step 5:** Tạm thêm `throw new Error('FE test')` trong onClick một nút ở client component → issue `skillpath-web` có replay, text bị che. **Xoá dòng tạm** sau khi xong
- [ ] **Step 6:** Đăng nhập sai mật khẩu → **không** có issue mới
- [ ] **Step 7:** Network tab: event gửi tới `/monitoring?...`, không gọi thẳng `*.ingest.sentry.io`

### Task 11: Tổng kiểm + đề xuất commit (KHÔNG tự commit)

- [ ] **Step 1:** BE: `pnpm lint && pnpm test && pnpm test:e2e && pnpm build` → PASS hết
- [ ] **Step 2:** FE: `pnpm lint && pnpm build && node --test "src/**/*.test.ts"` → PASS hết
- [ ] **Step 3:** `git status` — xác nhận không có `.env`, `.env.local`, `.env.sentry-build-plugin` trong danh sách thay đổi
- [ ] **Step 4:** Đề xuất commit cho sếp:

```
feat: tích hợp Sentry cho api (NestJS) và web (Next.js)

- api: instrument.ts nạp bằng --import (ESM), SentryGlobalFilter, bắt lỗi Better Auth qua onAPIError, gắn user id + role, route /api/debug-sentry (không có ở prod)
- web: init client/server/edge, global-error, replay khi lỗi, trace FE → API, tunnel /monitoring
- tắt dataCollection mặc định của SDK v11 (body, cookie, header, biến stack, query DB)
```
