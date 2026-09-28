# AuthModule (Better Auth) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đăng ký / đăng nhập / phân quyền (student, instructor, admin) cho back-end NestJS bằng Better Auth, session Redis + Postgres.

**Architecture:** Better Auth được mount thẳng vào Express bên dưới Nest (`toNodeHandler`) tại `/api/auth/*`. Các route Nest còn lại đi qua một global `AuthGuard` tự viết, guard này gọi `auth.api.getSession()`. Prisma 6 giữ toàn bộ schema của đồ án, Redis (Upstash) làm `secondaryStorage` cho session và rate limit, còn Brevo (REST API qua `fetch`) lo gửi mail.

**Tech Stack:** NestJS 12 (ESM, Express 5), better-auth 1.7.6, Prisma 6, ioredis 5, Brevo (REST qua fetch), uuid (v7), vitest 4 + supertest.

**Spec:** `docs/superpowers/specs/2026-09-28-auth-better-auth-design.md`. Đọc spec trước khi làm.

---

## Quy ước khi thực hiện

- **KHÔNG `git commit`** ở bất kỳ bước nào. Người dùng tự commit.
- Mọi lệnh chạy từ thư mục `back-end/`, trừ khi có ghi khác.
- Project là ESM (`"type": "module"`, `module: nodenext`), nên import nội bộ **phải có đuôi `.js`**, ví dụ `import { AppModule } from './app.module.js'`.
- Lint: `pnpm lint` (oxlint, bật `no-floating-promises`). Promise nào cố ý không await phải viết `void promise`.
- Đã kiểm chứng trên mã nguồn better-auth 1.7.6 (đừng "sửa" lại theo trí nhớ):
  - `SecondaryStorage` bắt buộc đủ 5 hàm: `get`, `getAndDelete`, `increment`, `set`, `delete`.
  - `toNodeHandler` và `fromNodeHeaders` import từ `better-auth/node`.
  - `createAccessControl` import từ `better-auth/plugins/access`. `defaultStatements` và `adminAc` import từ `better-auth/plugins/admin/access`.
  - `setRole` gọi `updateUser`, hàm này tự làm mới user trong mọi session ở Redis.
  - Origin check chỉ áp dụng cho request có cookie. Test luôn gửi `Origin: FE_URL`.
  - Nếu không có `X-Forwarded-For`, IP được coi là `127.0.0.1` ở dev/test.

## Sơ đồ file

| File | Trạng thái | Trách nhiệm |
|---|---|---|
| `back-end/package.json` | sửa | dependency mới, script `db:*` |
| `back-end/pnpm-workspace.yaml` | tạo | `allowBuilds` cho Prisma |
| `back-end/tsconfig.json` | sửa | `declaration: false` |
| `back-end/.env.example` | tạo | danh sách biến môi trường |
| `back-end/prisma/schema.prisma` | tạo | trích nguyên văn từ `schema-database.md` |
| `back-end/prisma/sql/01_post_migrate.sql` | tạo | SQL bổ sung mục 1–7, dán vào migration init |
| `back-end/prisma/sql/02_pg_cron.sql` | tạo | SQL bổ sung mục 8, chạy tay |
| `back-end/prisma/migrations/<ts>_init/migration.sql` | sinh ra | migration đầu tiên |
| `back-end/src/env.ts` | tạo | `loadEnvFile`, `requireEnv`, `optionalEnv` |
| `back-end/src/infra/prisma.service.ts` | tạo | PrismaClient trong vòng đời Nest |
| `back-end/src/infra/redis.ts` | tạo | `RedisService` + `redisStorage()` |
| `back-end/src/infra/infra.module.ts` | tạo | `@Global` export Prisma, Redis |
| `back-end/src/mail/mail.service.ts` | tạo | gửi mail qua Brevo REST API, không bao giờ throw |
| `back-end/src/auth/auth.ts` | tạo | `createAuth()`, `AUTH` token, `roles`, type `Auth` |
| `back-end/src/auth/decorators.ts` | tạo | `@Public` `@Roles` `@CurrentUser` |
| `back-end/src/auth/auth.guard.ts` | tạo | global guard |
| `back-end/src/auth/me.controller.ts` | tạo | `GET /api/me` |
| `back-end/src/auth/auth.module.ts` | tạo | wiring |
| `back-end/src/setup-app.ts` | tạo | thứ tự middleware, dùng chung cho main và e2e |
| `back-end/src/main.ts` | sửa | dùng `setupApp`, cổng 4000 |
| `back-end/src/app.module.ts` | sửa | import `InfraModule`, `AuthModule` |
| `back-end/src/app.controller.ts` | sửa | `@Public()` |
| `back-end/test/app.e2e-spec.ts` | sửa | dùng `setupApp`, path `/api` |
| `back-end/test/auth.e2e-spec.ts` | tạo | 7 kịch bản trong spec §10 |
| `back-end/vitest.config.e2e.ts` | sửa | timeout 30s (DB và Redis ở cloud) |
| `back-end/README.md` | thay | hướng dẫn setup, admin đầu tiên, pg_cron |

---

### Task 0: Điều kiện tiên quyết (người dùng làm)

Cần dịch vụ thật (instance **dev**, theo `de-xuat-do-an.md` mục triển khai). Agent **không tự tạo** được bước này.

- [ ] **Step 1: Kiểm tra file `back-end/.env` đã tồn tại và có đủ các biến bắt buộc**

Run:
```bash
for v in DATABASE_URL DIRECT_URL REDIS_URL BETTER_AUTH_SECRET BETTER_AUTH_URL FE_URL BREVO_API_KEY MAIL_FROM_NAME MAIL_FROM_EMAIL; do grep -q "^$v=." .env || echo "THIẾU $v"; done
```
Expected: không in dòng nào. Nếu có dòng `THIẾU ...`: **dừng lại và nhờ người dùng** bổ sung (xem Task 2 `.env.example`). `BETTER_AUTH_URL=http://localhost:4000`, `FE_URL=http://localhost:3000`, `BETTER_AUTH_SECRET` tạo bằng `openssl rand -base64 32`. `BREVO_API_KEY` lấy ở Brevo → SMTP & API → API Keys (`xkeysib-...`); `MAIL_FROM_EMAIL` phải là sender đã xác minh trong Brevo. Test e2e mock mail nên không gửi mail thật.

- [ ] **Step 2: Nhắc người dùng bật extension `pg_cron` trong Supabase Dashboard (Database → Extensions)** của project dev, cần cho Task 3 Step 6. **Không** bật tay `vector`/`pg_trgm`/`unaccent`: migration tự tạo, bật tay sẽ đặt vào schema `extensions` và gây drift.

---

### Task 1: Cài dependency

**Files:**
- Modify: `back-end/package.json`
- Create: `back-end/pnpm-workspace.yaml`

- [ ] **Step 1: Cho phép build script của Prisma (làm TRƯỚC khi cài)**

pnpm 12 chặn postinstall mặc định và `pnpm add` sẽ thoát lỗi `ERR_PNPM_IGNORED_BUILDS` nếu chưa khai báo. Tạo `back-end/pnpm-workspace.yaml` (cùng quy ước với `it-course-platform/pnpm-workspace.yaml`):

```yaml
allowBuilds:
  prisma: true
  '@prisma/client': true
  '@prisma/engines': true
```

- [ ] **Step 2: Cài package**

```bash
pnpm add better-auth@^1.7.6 @prisma/client@^6 ioredis@^5 uuid express@^5
pnpm add -D prisma@^6
```

Nếu vẫn báo `ERR_PNPM_IGNORED_BUILDS` cho package khác (không phải Prisma): thêm package đó vào `allowBuilds` với giá trị `false`, chạy `pnpm install`.
Expected: exit 0, không cảnh báo build script liên quan Prisma.

- [ ] **Step 3: Thêm script DB vào `package.json`** (trong `"scripts"`, sau `"test:e2e"`):

```json
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy"
```

- [ ] **Step 4: Tắt `declaration` trong `tsconfig.json`**

Đổi `"declaration": true` thành `"declaration": false`. App không phát hành `.d.ts`; để `true` thì `nest build` lỗi TS2883 ở `createAuth` (kiểu suy ra tham chiếu `zod` nội bộ mà pnpm không cho đặt tên).

- [ ] **Step 5: Kiểm tra**

Run: `pnpm ls better-auth @prisma/client prisma ioredis uuid express --depth 0`
Expected: có đủ 6 package; `@prisma/client` và `prisma` là `6.x`; `better-auth` là `1.7.x`.

---

### Task 2: `env.ts` và `.env.example`

**Files:**
- Create: `back-end/src/env.ts`
- Create: `back-end/.env.example`

- [ ] **Step 1: Tạo `src/env.ts`**

```ts
// Nạp .env theo cwd (luôn chạy từ back-end/). Prod chạy Docker không có file này,
// biến đến từ môi trường → chỉ bỏ qua ENOENT, lỗi khác (vd sai cú pháp) ném lại.
// loadEnvFile không ghi đè biến đã có sẵn trong môi trường.
try {
  process.loadEnvFile();
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}
```

- [ ] **Step 2: Tạo `.env.example`**

```
# Bắt buộc
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
BREVO_API_KEY=
MAIL_FROM_NAME=SkillPath
# phải là sender/domain đã xác minh trong Brevo
MAIL_FROM_EMAIL=no-reply@mail.dotattuan.id.vn

# Không bắt buộc
# prod: .skillpath.dotattuan.id.vn — để trống khi dev
COOKIE_DOMAIN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
PORT=4000
```

- [ ] **Step 3: Kiểm tra `.env` đã nằm trong `.gitignore`**

Run: `git check-ignore .env && git check-ignore -q .env.example; echo $?`
Expected: dòng đầu in `.env`, dòng sau in `1` (tức `.env.example` **không** bị ignore).

---

### Task 3: Prisma schema và migration `init`

**Files:**
- Create: `back-end/prisma/schema.prisma`
- Create: `back-end/prisma/sql/01_post_migrate.sql`
- Create: `back-end/prisma/sql/02_pg_cron.sql`
- Generated: `back-end/prisma/migrations/<ts>_init/migration.sql`

`schema-database.md` là nguồn sự thật duy nhất. Trích **nguyên văn** bằng script, không gõ lại bằng tay.

- [ ] **Step 1: Trích schema và SQL**

Run (từ `back-end/`):
```bash
mkdir -p prisma/sql
python3 - <<'EOF'
import re
doc = open('../schema-database.md', encoding='utf-8').read()
prisma = re.findall(r'```prisma\n(.*?)```', doc, re.S)
assert len(prisma) == 1, f'cần đúng 1 khối prisma, thấy {len(prisma)}'
open('prisma/schema.prisma', 'w', encoding='utf-8').write(prisma[0])

section5 = doc.split('## 5. SQL bổ sung', 1)[1].split('## 6.', 1)[0]
sql = re.findall(r'```sql\n(.*?)```', section5, re.S)
assert len(sql) == 1, f'cần đúng 1 khối sql ở mục 5, thấy {len(sql)}'
marker = '--  8. Dọn user chưa xác minh'
head, tail = sql[0].split(marker, 1)
# bỏ dòng gạch ngang "-- ----" ngay trước tiêu đề mục 8 khỏi phần đầu
head = head.rstrip().rsplit('\n', 1)[0] + '\n'
open('prisma/sql/01_post_migrate.sql', 'w', encoding='utf-8').write(head)
open('prisma/sql/02_pg_cron.sql', 'w', encoding='utf-8').write('-- ' + '-' * 75 + '\n' + marker + tail)
EOF
head -3 prisma/sql/02_pg_cron.sql; grep -c "pg_cron\|cron.schedule" prisma/sql/01_post_migrate.sql
```
Expected: 3 dòng đầu của `02_pg_cron.sql` là dòng gạch ngang, tiêu đề mục 8 và dòng "KHÔNG dán vào migration". Lệnh `grep -c` in `0` (file 01 không chứa pg_cron).

- [ ] **Step 2: Kiểm tra schema hợp lệ**

Run: `pnpm prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

Nếu lỗi: **dừng lại và báo người dùng**. Lỗi nằm ở `schema-database.md` và phải sửa ở đó, rồi chạy lại Step 1. Không sửa trực tiếp `schema.prisma`.

- [ ] **Step 3: Tạo migration (chưa áp dụng)**

Run: `pnpm prisma migrate dev --create-only --name init`
Expected: tạo `prisma/migrations/<timestamp>_init/migration.sql`.

- [ ] **Step 4: Chèn extension lên đầu và nối SQL bổ sung vào cuối migration**

Schema không để Prisma quản lý extension (tránh drift với các extension Supabase cài sẵn), nên phải tự tạo `vector` trước `CREATE TABLE` có cột vector:

```bash
f=$(ls prisma/migrations/*_init/migration.sql)
{ printf 'CREATE EXTENSION IF NOT EXISTS vector;\nCREATE EXTENSION IF NOT EXISTS pg_trgm;\nCREATE EXTENSION IF NOT EXISTS unaccent;\n\n'; cat "$f"; cat prisma/sql/01_post_migrate.sql; } > "$f.tmp" && mv "$f.tmp" "$f"
```

- [ ] **Step 5: Áp dụng migration**

Run: `pnpm prisma migrate dev`
Expected: `Your database is now in sync with your schema.` và Prisma Client được generate.

Nếu SQL bổ sung lỗi (ví dụ tên cột sai): sửa tại `schema-database.md` mục 5, chạy lại Step 1, xoá thư mục `prisma/migrations/*_init`, chạy `pnpm prisma migrate reset --force` (DB dev, xoá sạch dữ liệu), rồi lặp lại Step 3–5.

- [ ] **Step 6: Áp dụng pg_cron (chạy tay, ngoài migration)**

```bash
pnpm prisma db execute --schema prisma/schema.prisma --file prisma/sql/02_pg_cron.sql
```
Expected: `Script executed successfully.` Kiểm tra: `SELECT jobname, schedule, active FROM cron.job` có `purge-unverified-users | 0 20 * * * | true`.

---

### Task 4: Infra: Prisma và Redis

**Files:**
- Create: `back-end/src/infra/prisma.service.ts`
- Create: `back-end/src/infra/redis.ts`
- Create: `back-end/src/infra/infra.module.ts`

- [ ] **Step 1: `src/infra/prisma.service.ts`**

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

- [ ] **Step 2: `src/infra/redis.ts`**

```ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { SecondaryStorage } from 'better-auth';
import { Redis } from 'ioredis';
import { requireEnv } from '../env.js';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    super(requireEnv('REDIS_URL'));
  }

  async onModuleDestroy() {
    await this.quit();
  }
}

// ponytail: Redis lỗi thì mọi request có auth lỗi theo (dựa vào độ ổn định của Upstash).
// Nâng cấp: bắt lỗi trong get/set, trả null để Better Auth đọc session từ DB.
export function redisStorage(redis: Redis): SecondaryStorage {
  return {
    get: (key) => redis.get(key),
    getAndDelete: (key) => redis.getdel(key),
    // TTL chỉ đặt lúc tạo key (NX); INCR sau đó không gia hạn — đúng hợp đồng
    // của Better Auth cho rate limit cửa sổ cố định. MULTI đảm bảo nguyên tử.
    increment: async (key, ttl) => {
      const result = await redis
        .multi()
        .set(key, 0, 'EX', ttl, 'NX')
        .incr(key)
        .exec();
      const [err, count] = result?.[1] ?? [new Error('Redis MULTI bị huỷ')];
      if (err) throw err;
      return count as number;
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, 'EX', ttl);
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  };
}
```

- [ ] **Step 3: `src/infra/infra.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { RedisService } from './redis.js';

@Global()
@Module({
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService],
})
export class InfraModule {}
```

- [ ] **Step 4: Type-check**

Run: `pnpm exec tsc --noEmit -p tsconfig.build.json`
Expected: không lỗi. (Dùng `tsconfig.build.json` vì file test cũ chỉ được sửa ở Task 6.)

---

### Task 5: MailService

**Files:**
- Create: `back-end/src/mail/mail.service.ts`

- [ ] **Step 1: `src/mail/mail.service.ts`**

```ts
import { Injectable, Logger } from '@nestjs/common';
import { requireEnv } from '../env.js';

// Ranh giới gửi mail. Khi có RabbitMQ chỉ đổi ruột send() sang publish job.
// Gọi thẳng REST API của Brevo bằng fetch có sẵn — không cần SDK.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly apiKey = requireEnv('BREVO_API_KEY');
  private readonly sender = {
    name: requireEnv('MAIL_FROM_NAME'),
    email: requireEnv('MAIL_FROM_EMAIL'),
  };

  sendVerification(to: string, url: string) {
    return this.send(
      to,
      'Xác minh email SkillPath',
      `<p>Bấm vào link để xác minh email (hết hạn sau 24 giờ):</p><p><a href="${url}">${url}</a></p>`,
    );
  }

  sendResetPassword(to: string, url: string) {
    return this.send(
      to,
      'Đặt lại mật khẩu SkillPath',
      `<p>Bấm vào link để đặt lại mật khẩu:</p><p><a href="${url}">${url}</a></p>`,
    );
  }

  // Không bao giờ throw: auth gọi không await, lỗi lọt ra thành unhandled
  // rejection làm sập Node. fetch không throw với HTTP 4xx/5xx → tự kiểm tra res.ok.
  private async send(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: this.sender,
          to: [{ email: to }],
          subject,
          htmlContent,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        this.logger.error(`Gửi mail tới ${to} thất bại: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      this.logger.error(`Gửi mail tới ${to} thất bại`, err as Error);
    }
  }
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit -p tsconfig.build.json`
Expected: không lỗi. (Dùng `tsconfig.build.json` vì file test cũ chỉ được sửa ở Task 6.)

---

### Task 6: Cấu hình Better Auth và mount vào Express

**Files:**
- Create: `back-end/src/auth/auth.ts`
- Create: `back-end/src/auth/auth.module.ts` (bản tối thiểu, Task 8 bổ sung)
- Create: `back-end/src/setup-app.ts`
- Modify: `back-end/src/main.ts`
- Modify: `back-end/src/app.module.ts`

- [ ] **Step 1: `src/auth/auth.ts`**

```ts
import type { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';
import type { Redis } from 'ioredis';
import { v7 as uuidv7 } from 'uuid';
import { optionalEnv, requireEnv } from '../env.js';
import { redisStorage } from '../infra/redis.js';
import type { MailService } from '../mail/mail.service.js';

export const AUTH = Symbol('AUTH');

// Better Auth mặc định chỉ biết 'admin' | 'user' → setRole('instructor') sẽ lỗi
// YOU_ARE_NOT_ALLOWED_TO_SET_NON_EXISTENT_VALUE nếu không khai báo ở đây.
const ac = createAccessControl(defaultStatements);
export const roles = {
  student: ac.newRole({}),
  instructor: ac.newRole({}),
  admin: ac.newRole({ ...adminAc.statements }),
};
export type Role = keyof typeof roles;

function oauth(prefix: 'GOOGLE' | 'GITHUB') {
  const clientId = optionalEnv(`${prefix}_CLIENT_ID`);
  const clientSecret = optionalEnv(`${prefix}_CLIENT_SECRET`);
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

export function createAuth(
  prisma: PrismaClient,
  redis: Redis,
  mail: MailService,
) {
  const cookieDomain = optionalEnv('COOKIE_DOMAIN');
  const google = oauth('GOOGLE');
  const github = oauth('GITHUB');

  return betterAuth({
    baseURL: requireEnv('BETTER_AUTH_URL'),
    basePath: '/api/auth',
    secret: requireEnv('BETTER_AUTH_SECRET'),
    trustedOrigins: [requireEnv('FE_URL')],
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    // Redis là lớp đọc nhanh; bảng session vẫn là nguồn chính (spec §2).
    secondaryStorage: redisStorage(redis),
    session: { storeSessionInDatabase: true },
    advanced: {
      // Khớp UUID v7 của 40 bảng còn lại.
      database: { generateId: () => uuidv7() },
      crossSubDomainCookies: { enabled: !!cookieDomain, domain: cookieDomain },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        void mail.sendResetPassword(user.email, url);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60 * 24,
      sendVerificationEmail: async ({ user, url }) => {
        void mail.sendVerification(user.email, url);
      },
    },
    // Provider thiếu key thì bỏ hẳn (dev có thể không cấu hình OAuth).
    socialProviders: {
      ...(google && { google }),
      ...(github && { github }),
    },
    user: {
      additionalFields: {
        targetTrack: { type: 'string', required: false },
        level: { type: 'string', required: false },
      },
    },
    rateLimit: {
      enabled: true, // mặc định Better Auth chỉ bật ở production
      storage: 'secondary-storage',
      customRules: { '/sign-up/email': { window: 600, max: 3 } },
    },
    plugins: [
      admin({ ac, roles, defaultRole: 'student', adminRoles: ['admin'] }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
```

- [ ] **Step 2: `src/auth/auth.module.ts` (bản tối thiểu)**

```ts
import { Module } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService } from '../infra/redis.js';
import { MailService } from '../mail/mail.service.js';
import { AUTH, createAuth } from './auth.js';

@Module({
  providers: [
    MailService,
    {
      provide: AUTH,
      inject: [PrismaService, RedisService, MailService],
      useFactory: createAuth,
    },
  ],
  exports: [AUTH],
})
export class AuthModule {}
```

- [ ] **Step 3: `src/setup-app.ts`**

```ts
import type { INestApplication } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import express, { type Express } from 'express';
import { AUTH, type Auth } from './auth/auth.js';
import { requireEnv } from './env.js';

// Thứ tự là bắt buộc (spec §5); main.ts và e2e dùng chung để không lệch nhau.
// App phải được tạo với { bodyParser: false }.
export function setupApp(app: INestApplication): void {
  // 1. CORS trước auth handler, không thì /api/auth/* thiếu header CORS.
  app.enableCors({ origin: requireEnv('FE_URL'), credentials: true });
  // 2. .all chứ không .use — .use cắt prefix khỏi req.url, Better Auth sẽ route sai.
  // Nest 12: HttpServer.getInstance() không nhận type argument → ép kiểu.
  (app.getHttpAdapter().getInstance() as Express).all(
    '/api/auth/*splat',
    toNodeHandler(app.get<Auth>(AUTH)),
  );
  // 3. Body parser SAU auth handler — Better Auth tự đọc body.
  app.use(express.json());
  app.setGlobalPrefix('api');
}
```

- [ ] **Step 4: Thay `src/main.ts`**

```ts
import './env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  setupApp(app);
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
```

- [ ] **Step 5: Sửa `src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { InfraModule } from './infra/infra.module.js';

@Module({
  imports: [InfraModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 6: Sửa `test/app.e2e-spec.ts` cho khớp `setupApp` và prefix `/api`**

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
```

- [ ] **Step 7: Tăng timeout e2e trong `vitest.config.e2e.ts`** (DB và Redis ở cloud, mỗi request mất vài trăm ms). Thêm vào object `test`:

```ts
    testTimeout: 30_000,
    hookTimeout: 30_000,
```

- [ ] **Step 8: Chạy thử server**

Run: `pnpm start:dev` (chạy nền), đợi dòng `Nest application successfully started`, rồi:
```bash
curl -s http://localhost:4000/api/auth/ok
```
Expected: `{"ok":true}`. Tắt server sau khi xong.

---

### Task 7: E2E cho các route auth (spec §10, bước 1–3 và 7)

**Files:**
- Create: `back-end/test/auth.e2e-spec.ts`

Các route `/api/auth/*` đã chạy từ Task 6, nên phần test này phải PASS ngay. Nếu FAIL nghĩa là cấu hình Task 6 sai.

- [ ] **Step 1: Tạo `test/auth.e2e-spec.ts`**

```ts
import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () =>
  `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const randomEmail = () => `e2e-${randomUUID()}@example.com`;

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminCookie: string;
  let studentCookie: string;
  let studentId: string;
  const studentEmail = randomEmail();
  const createdEmails: string[] = [];
  const mail = { sendVerification: vi.fn(), sendResetPassword: vi.fn() };

  // Bộ đếm rate limit nằm ở Redis và sống qua các lần chạy → mỗi request một IP
  // ngẫu nhiên (Better Auth chỉ tin X-Forwarded-For một giá trị).
  // Origin luôn gửi vì Better Auth kiểm tra origin với request có cookie.
  const call = (
    method: 'get' | 'post',
    path: string,
    opts: { cookie?: string; ip?: string } = {},
  ) => {
    const r = request(app.getHttpServer())
      [method](path)
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', opts.ip ?? randomIp());
    return opts.cookie ? r.set('Cookie', opts.cookie) : r;
  };
  const signUp = (email: string, ip?: string) => {
    createdEmails.push(email);
    return call('post', '/api/auth/sign-up/email', { ip }).send({
      name: 'E2E',
      email,
      password: PASSWORD,
    });
  };
  const signIn = (email: string) =>
    call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD });
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[])
      .map((c) => c.split(';')[0])
      .join('; ');
  const verifyPathFor = async (email: string) => {
    await vi.waitFor(() =>
      expect(mail.sendVerification).toHaveBeenCalledWith(email, expect.any(String)),
    );
    const [, url] = mail.sendVerification.mock.calls.findLast(
      ([to]) => to === email,
    ) as [string, string];
    const { pathname, search } = new URL(url);
    return pathname + search;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mail)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    // Không có endpoint tự nâng quyền (spec §9) → nâng admin thẳng qua DB.
    const adminEmail = randomEmail();
    await signUp(adminEmail).expect(200);
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'admin', emailVerified: true },
    });
    adminCookie = cookieOf(await signIn(adminEmail).expect(200));
  });

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: createdEmails } } });
    await app?.close();
  });

  it('1. sign-up gửi mail xác minh', async () => {
    const res = await signUp(studentEmail).expect(200);
    studentId = res.body.user.id;
    await verifyPathFor(studentEmail);
  });

  it('2. chưa xác minh thì không sign-in được', async () => {
    const res = await signIn(studentEmail).expect(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('3. mở link xác minh rồi sign-in được', async () => {
    const res = await call('get', await verifyPathFor(studentEmail));
    expect(res.status).toBeLessThan(400);
    studentCookie = cookieOf(await signIn(studentEmail).expect(200));
  });

  it('7. sign-up quá 3 lần / 10 phút cùng IP thì 429', async () => {
    const ip = randomIp();
    for (let i = 0; i < 3; i++) await signUp(randomEmail(), ip).expect(200);
    await signUp(randomEmail(), ip).expect(429);
  });
});
```

- [ ] **Step 2: Chạy**

Run: `pnpm test:e2e`
Expected: `app.e2e-spec.ts` có 1 test PASS, `auth.e2e-spec.ts` có 4 test PASS.

Nếu FAIL, tra theo bảng:
- `sign-up` trả 500 kèm lỗi Prisma về `id`: `generateId` chưa chạy. Kiểm tra lại `advanced.database.generateId`.
- Request treo đến timeout: `express.json()` đang đứng trước auth handler. Kiểm tra thứ tự trong `setup-app.ts`.
- 403 `INVALID_ORIGIN`: giá trị `FE_URL` trong `.env` khác với `trustedOrigins`.
- Bước 7 không ra 429: kiểm tra `redisStorage().increment` và xem Redis có key dạng `<ip>|/sign-up/email` không (`redis-cli --scan --pattern '*sign-up*'`).

---

### Task 8: Guard, decorator, `/api/me` (spec §10, bước 4–6)

**Files:**
- Modify: `back-end/test/auth.e2e-spec.ts`
- Create: `back-end/src/auth/decorators.ts`
- Create: `back-end/src/auth/auth.guard.ts`
- Create: `back-end/src/auth/me.controller.ts`
- Modify: `back-end/src/auth/auth.module.ts`
- Modify: `back-end/src/app.controller.ts`

- [ ] **Step 1: Viết test trước (sẽ FAIL)**

Trong `test/auth.e2e-spec.ts`:

(a) Thêm import `Roles`:
```ts
import { Roles } from '../src/auth/decorators.js';
```

(b) Thêm controller thăm dò ngay sau các hằng số đầu file (trước `describe`):
```ts
@Controller('probe')
class ProbeController {
  @Roles('admin')
  @Get('admin')
  admin() {
    return 'ok';
  }

  @Roles('instructor')
  @Get('instructor')
  instructor() {
    return 'ok';
  }
}
```

(c) Trong `beforeAll`, đăng ký controller đó:
```ts
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProbeController],
    })
```

(d) Thêm 3 test sau test `3.` và trước test `7.`:
```ts
  it('4. /api/me cần session', async () => {
    const res = await call('get', '/api/me', { cookie: studentCookie }).expect(200);
    expect(res.body).toMatchObject({
      email: studentEmail,
      role: 'student',
      emailVerified: true,
    });
    await call('get', '/api/me').expect(401);
  });

  it('5. @Roles chặn sai role; đổi role có hiệu lực ngay (Redis được làm mới)', async () => {
    await call('get', '/api/probe/admin', { cookie: studentCookie }).expect(403);
    await call('post', '/api/auth/admin/set-role', { cookie: adminCookie })
      .send({ userId: studentId, role: 'instructor' })
      .expect(200);
    await call('get', '/api/probe/instructor', { cookie: studentCookie }).expect(200);
  });

  it('6. bị ban thì mất session', async () => {
    await call('post', '/api/auth/admin/ban-user', { cookie: adminCookie })
      .send({ userId: studentId })
      .expect(200);
    await call('get', '/api/me', { cookie: studentCookie }).expect(401);
  });
```

- [ ] **Step 2: Chạy để thấy FAIL**

Run: `pnpm test:e2e`
Expected: FAIL. Lỗi đầu tiên là không import được `../src/auth/decorators.js`.

- [ ] **Step 3: `src/auth/decorators.ts`**

```ts
import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from './auth.js';
import type { AuthedRequest } from './auth.guard.js';

export const IS_PUBLIC = 'auth:public';
export const ROLES = 'auth:roles';

/** Bỏ qua AuthGuard cho route/controller này. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Chỉ cho qua user có ít nhất một trong các role. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** User của session hiện tại (AuthGuard đã gán). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
```

- [ ] **Step 4: `src/auth/auth.guard.ts`**

```ts
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { AUTH, type Auth, type AuthSession, type Role } from './auth.js';
import { IS_PUBLIC, ROLES } from './decorators.js';

export type AuthedRequest = Request & Partial<AuthSession>;

// Global guard (APP_GUARD). Không kiểm tra `banned`: plugin admin đã chặn tạo
// session và revoke session hiện có khi ban.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const session = await this.auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) throw new UnauthorizedException();
    req.user = session.user;
    req.session = session.session;

    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES,
      targets,
    );
    // Plugin admin cho phép nhiều role dạng "student,instructor".
    const userRoles = session.user.role?.split(',') ?? [];
    if (required && !required.some((r) => userRoles.includes(r))) {
      throw new ForbiddenException();
    }
    return true;
  }
}
```

`decorators.ts` và `auth.guard.ts` import lẫn nhau, nhưng bên `decorators.ts` chỉ là `import type` nên sẽ bị xoá khi biên dịch. Vì vậy không có vòng lặp import lúc chạy.

- [ ] **Step 5: `src/auth/me.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';
import type { AuthSession } from './auth.js';
import { CurrentUser } from './decorators.js';

@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: AuthSession['user']) {
    return user;
  }
}
```

- [ ] **Step 6: Thay `src/auth/auth.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService } from '../infra/redis.js';
import { MailService } from '../mail/mail.service.js';
import { AUTH, createAuth } from './auth.js';
import { AuthGuard } from './auth.guard.js';
import { MeController } from './me.controller.js';

// Export AUTH để module khác gọi auth.api.* (vd duyệt giảng viên → setRole).
@Module({
  controllers: [MeController],
  providers: [
    MailService,
    {
      provide: AUTH,
      inject: [PrismaService, RedisService, MailService],
      useFactory: createAuth,
    },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH],
})
export class AuthModule {}
```

- [ ] **Step 7: Gắn `@Public()` cho `src/app.controller.ts`** (health check `GET /api` không cần đăng nhập)

```ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators.js';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
```

- [ ] **Step 8: Chạy để thấy PASS**

Run: `pnpm test:e2e`
Expected: 8 test PASS (1 của app, 7 của auth).

Nếu test `5.` FAIL ở `/api/probe/instructor` (vẫn 403): role trong Redis chưa được làm mới. Việc này trái với mã nguồn đã đọc của 1.7.6, nên **dừng lại và báo người dùng**. Không tự thêm cơ chế revoke.

---

### Task 9: README, pg_cron và kiểm tra toàn bộ

**Files:**
- Replace: `back-end/README.md`

- [ ] **Step 1: Thay `back-end/README.md`** (README mặc định của Nest không có thông tin gì về dự án)

````markdown
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
````

- [ ] **Step 2: Kiểm tra toàn bộ**

Run lần lượt:
```bash
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
```
Expected:
- `lint`: không có error.
- `build`: thành công và tạo `dist/main.js`.
- `test`: 1 PASS.
- `test:e2e`: 8 PASS.

- [ ] **Step 3: OAuth** — route `/api/auth/sign-in/social` cần POST từ trình duyệt kèm redirect, chỉ test được khi có FE. Ghi vào báo cáo: "OAuth chưa test tay, chờ FE".

- [ ] **Step 4: Báo cáo** danh sách file đã tạo/sửa và kết quả Step 2. **Không commit.**
