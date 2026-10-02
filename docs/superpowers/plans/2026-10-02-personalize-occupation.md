# Cá nhân hoá kiểu Udemy (Occupation + kỹ năng theo dõi) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay trục `track` bằng `users.occupation` + bảng `occupation_topics`, bỏ `courses.track`, thêm API `/topics/popular` và `/me/preferences`, viết lại `/onboarding` thành wizard 3 bước lưu thật.

**Architecture:** Prisma: enum `Track` → `Occupation`, bảng mới `occupation_topics` (seed bằng migration riêng). BE: `TopicsController` thêm `GET /topics/popular`; module mới `preferences` (`GET/PATCH /me/preferences`, ghi user qua `internalAdapter.updateUser`, thay toàn bộ `user_target_topics` trong transaction); Better Auth `additionalFields` `occupation`/`level` đặt `input: false`. FE: hook `use-onboarding.ts` giữ toàn bộ logic + API, view dựng bằng skill `/evon:ui-ux`; gỡ track khỏi form basics giảng viên; trang cài đặt có link sửa sở thích.

**Tech Stack:** NestJS 12, Prisma 6.19, Better Auth 1.7, zod 4, vitest 4 + supertest; Next.js 16.3, React 19.2, shadcn `base-nova`, axios, sonner.

**Spec:** `docs/superpowers/specs/2026-10-02-personalize-occupation-design.md`

## Global Constraints

- **Không commit giữa các task, không push, không thêm Co-Authored-By.** Sếp chưa chọn chế độ commit cho task này → mặc định hỏi trước mỗi commit; plan gom **một** đề xuất commit ở Task 10 và chờ duyệt.
- Lệnh BE chạy từ `back-end/` (`.env` trỏ DB + Redis **dev**), lệnh FE chạy từ `it-course-platform/`. Package manager `pnpm`.
- BE là ESM: **import tương đối phải có đuôi `.js`**. Kiểu dùng trong tham số có decorator (`@Body() body: X`) phải `import type`.
- **Migration: KHÔNG dùng `prisma migrate dev` / `pnpm db:migrate`** (README "Sửa schema": nó xoá 3 unique DEFERRABLE `uq_*_position`). Dùng `migrate diff` + sửa tay + `pnpm db:deploy`.
- Test BE: unit `src/**/*.spec.ts` (`pnpm test`), e2e `test/*.e2e-spec.ts` (`pnpm test:e2e`, DB dev thật, ~1-2s/query → `beforeAll` đặt timeout 120s).
- `tsc` BE baseline có **1 lỗi sẵn** ở `src/sentry-redact.spec.ts(64,19)` — không sửa; "tsc sạch" = không lỗi nào khác.
- Key/enum tiếng Anh, tiếng Việt chỉ ở label.
- FE: không thêm thư viện. 401 từ `api` (axios) **đã** được interceptor ở `src/lib/api/client.ts` chuyển sang `/login?redirect=<trang hiện tại>` → onboarding không tự xử lý 401, chỉ không toast khi 401.
- Ngoài phạm vi: trang học viên dùng mock (`featured-courses`, `categories/[track]`, `skills`, type `Track` trong `src/types/index.ts`) — **không sửa**.

---

## File map

| File | Việc |
|---|---|
| `back-end/prisma/schema.prisma` | enum `Occupation`, `User.occupation`, bỏ `Course.track` + index, model `OccupationTopic`, sửa comment |
| `back-end/prisma/sql/06_occupation_topics.sql` (mới) | Seed nghề → topic, idempotent |
| `back-end/prisma/migrations/<t1>_personalize_occupation/migration.sql` (mới) | Sinh bằng `migrate diff` |
| `back-end/prisma/migrations/<t2>_occupation_topics_seed/migration.sql` (mới) | Chép nguyên `06` |
| `back-end/src/instructor-courses/{instructor-courses.schemas,instructor-courses.service,course-checklist,course-checklist.spec}.ts` | Bỏ `track` |
| `back-end/test/{instructor-courses,taxonomy,udemy-curriculum}.e2e-spec.ts` | Bỏ `track` |
| `back-end/src/auth/auth.ts` | `occupation`/`level` `input: false` |
| `back-end/src/topics/topics.controller.ts` | `GET /topics/popular` |
| `back-end/src/preferences/{preferences.schemas,preferences.service,preferences.controller,preferences.module}.ts` (mới) | `/me/preferences` |
| `back-end/src/app.module.ts` | Đăng ký `PreferencesModule` |
| `back-end/test/preferences.e2e-spec.ts` (mới) | E2E preferences + popular + sign-up |
| `it-course-platform/src/lib/auth-client.ts` | `inferAdditionalFields` khớp BE (`occupation`) |
| `it-course-platform/src/types/preferences.ts` (mới) | `OCCUPATION_LABEL`, `LEARNER_LEVELS`, type |
| `it-course-platform/src/lib/api/preferences.ts` (mới) | Client API |
| `it-course-platform/src/types/instructor-course.ts` | Bỏ `TRACK_LABEL`, `Track`, `track` |
| `it-course-platform/src/app/instructor/(manage)/courses/[id]/manage/_components/basics-form.tsx` | Bỏ ô + badge Track |
| `it-course-platform/src/app/onboarding/_components/use-onboarding.ts` (mới) | Logic wizard |
| `it-course-platform/src/app/onboarding/_components/onboarding-view.tsx` | Viết lại bằng `/evon:ui-ux` |
| `it-course-platform/src/app/(student)/settings/_components/settings-view.tsx` | Link "Sở thích học tập" |
| `de-xuat-do-an.md`, `schema-database.md` | Cập nhật tài liệu |

---

### Task 1: Schema Prisma + seed + 2 migration

**Files:**
- Modify: `back-end/prisma/schema.prisma`
- Create: `back-end/prisma/sql/06_occupation_topics.sql`
- Create: `back-end/prisma/migrations/<t1>_personalize_occupation/migration.sql`
- Create: `back-end/prisma/migrations/<t2>_occupation_topics_seed/migration.sql`

- [ ] **Step 1: Sửa `schema.prisma`**

1. Comment Better Auth đầu file (~dòng 40): `targetTrack: { type: 'string', required: false },` → `occupation: { type: 'string', required: false, input: false },`; dòng `level` kế bên thêm `input: false`.
2. Model `User` (~dòng 63-65) thay:
```prisma
  // additionalFields — chọn ở onboarding (PATCH /me/preferences), nuôi recommendation tầng 1 (§3.4)
  occupation Occupation?
  level      SkillLevel?
```
3. Model `Course` (~dòng 270-276): xoá dòng `track Track?` và đổi khối comment "HAI TRỤC PHÂN LOẠI" thành:
```prisma
  // categoryId — chủ đề khoá nói về cái gì. Dùng để duyệt/lọc/breadcrumb (kiểu Udemy).
  // Khoá KHÔNG gắn nghề: nghề → topic qua occupation_topics, topic → khoá qua course_topics
  // (spec 2026-10-02-personalize-occupation P1).
  // Nháp được để trống (spec 2026-09-30-course-create-basics C2); checklist gửi duyệt bắt buộc đủ.
```
4. Xoá dòng `@@index([status, track, level]) // recommendation tầng 1`.
5. Model `Topic`: thêm relation `occupations OccupationTopic[]` sau `categories CategoryTopic[]`; comment `// Autocomplete ô "Tìm kiếm topic" ở bước 3 onboarding` → `bước 2 onboarding`.
6. Comment trên `model UserTargetTopic`: "ở bước 3 onboarding" → "ở bước 2 onboarding"; dòng `// Chip "Phổ biến với học viên như bạn" = topic của các khoá có track = user.targetTrack.` → `// Chip "Phổ biến với học viên như bạn" = occupation_topics của users.occupation.`
7. Thêm ngay sau `model UserTargetTopic { … }`:
```prisma
// Nghề → topic phổ biến (curated, seed ở prisma/sql/06). Nuôi chip "Phổ biến với học viên
// như bạn" ở bước 2 onboarding và recommendation tầng 1 (spec 2026-10-02-personalize-occupation §3).
model OccupationTopic {
  occupation Occupation
  topicId    String     @db.Uuid
  position   Int        @default(0)

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([occupation, topicId])
  @@index([occupation, position])
  @@map("occupation_topics")
}
```
8. Thay toàn bộ khối `enum Track { … }` và 3 dòng comment phía trên bằng:
```prisma
// Trục NGHỀ NGHIỆP của học viên (bước 1 onboarding, kiểu /personalize/occupation của Udemy).
// Enum vì danh sách ổn định, không cần admin thêm runtime. Khoá học không gắn nghề.
enum Occupation {
  frontend_developer
  backend_developer
  fullstack_developer
  mobile_developer
  devops_engineer
  data_engineer
  data_analyst
  ml_engineer
  qa_engineer
  software_architect
  game_developer
  other
}
```

- [ ] **Step 2: Kiểm schema hợp lệ**

Run (từ `back-end/`): `pnpm prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 3: Viết `back-end/prisma/sql/06_occupation_topics.sql`**

```sql
-- ============================================================================
--  Seed nghề → topic phổ biến (spec 2026-10-02-personalize-occupation §3.3).
--  Idempotent. Slug không có trong topics thì tự rơi khỏi JOIN.
--  Nội dung file này được chép nguyên vào migration <t2>_occupation_topics_seed.
-- ============================================================================

INSERT INTO occupation_topics (occupation, "topicId", position)
SELECT v.occupation::"Occupation", t.id, v.position
FROM (VALUES
  ('frontend_developer', 'html', 1),
  ('frontend_developer', 'css', 2),
  ('frontend_developer', 'javascript', 3),
  ('frontend_developer', 'typescript', 4),
  ('frontend_developer', 'react', 5),
  ('frontend_developer', 'nextjs', 6),
  ('frontend_developer', 'angular', 7),
  ('frontend_developer', 'web-development', 8),
  ('frontend_developer', 'git', 9),
  ('frontend_developer', 'user-interface', 10),
  ('backend_developer', 'nodejs', 1),
  ('backend_developer', 'java', 2),
  ('backend_developer', 'spring-framework', 3),
  ('backend_developer', 'python', 4),
  ('backend_developer', 'fastapi', 5),
  ('backend_developer', 'aspnet-core', 6),
  ('backend_developer', 'sql', 7),
  ('backend_developer', 'postgresql', 8),
  ('backend_developer', 'docker', 9),
  ('backend_developer', 'git', 10),
  ('fullstack_developer', 'javascript', 1),
  ('fullstack_developer', 'typescript', 2),
  ('fullstack_developer', 'react', 3),
  ('fullstack_developer', 'nextjs', 4),
  ('fullstack_developer', 'nodejs', 5),
  ('fullstack_developer', 'sql', 6),
  ('fullstack_developer', 'postgresql', 7),
  ('fullstack_developer', 'docker', 8),
  ('fullstack_developer', 'git', 9),
  ('fullstack_developer', 'web-development', 10),
  ('mobile_developer', 'react-native', 1),
  ('mobile_developer', 'google-flutter', 2),
  ('mobile_developer', 'dart-programming-language', 3),
  ('mobile_developer', 'android-development', 4),
  ('mobile_developer', 'kotlin', 5),
  ('mobile_developer', 'ios-development', 6),
  ('mobile_developer', 'swift', 7),
  ('mobile_developer', 'swiftui', 8),
  ('mobile_developer', 'mobile-development', 9),
  ('devops_engineer', 'docker', 1),
  ('devops_engineer', 'kubernetes', 2),
  ('devops_engineer', 'devops', 3),
  ('devops_engineer', 'linux', 4),
  ('devops_engineer', 'shell-scripting', 5),
  ('devops_engineer', 'amazon-aws', 6),
  ('devops_engineer', 'git', 7),
  ('devops_engineer', 'github', 8),
  ('devops_engineer', 'system-administration', 9),
  ('data_engineer', 'python', 1),
  ('data_engineer', 'sql', 2),
  ('data_engineer', 'postgresql', 3),
  ('data_engineer', 'data-engineering', 4),
  ('data_engineer', 'apache-kafka', 5),
  ('data_engineer', 'pandas', 6),
  ('data_engineer', 'amazon-aws', 7),
  ('data_engineer', 'docker', 8),
  ('data_analyst', 'sql', 1),
  ('data_analyst', 'python', 2),
  ('data_analyst', 'pandas', 3),
  ('data_analyst', 'data-analysis', 4),
  ('data_analyst', 'data-science', 5),
  ('data_analyst', 'mysql', 6),
  ('data_analyst', 'postgresql', 7),
  ('ml_engineer', 'python', 1),
  ('ml_engineer', 'machine-learning', 2),
  ('ml_engineer', 'deep-learning', 3),
  ('ml_engineer', 'pytorch', 4),
  ('ml_engineer', 'tensorflow', 5),
  ('ml_engineer', 'mlops', 6),
  ('ml_engineer', 'large-language-models', 7),
  ('ml_engineer', 'langchain', 8),
  ('ml_engineer', 'retrieval-augmented-generation', 9),
  ('qa_engineer', 'automation-testing', 1),
  ('qa_engineer', 'playwright', 2),
  ('qa_engineer', 'selenium-webdriver', 3),
  ('qa_engineer', 'pytest', 4),
  ('qa_engineer', 'postman', 5),
  ('qa_engineer', 'istqb-certified-tester-foundation-level-ctfl', 6),
  ('qa_engineer', 'javascript', 7),
  ('qa_engineer', 'python', 8),
  ('software_architect', 'software-architecture', 1),
  ('software_architect', 'system-design-interview', 2),
  ('software_architect', 'data-structures', 3),
  ('software_architect', 'algorithms', 4),
  ('software_architect', 'docker', 5),
  ('software_architect', 'kubernetes', 6),
  ('software_architect', 'amazon-aws', 7),
  ('software_architect', 'java', 8),
  ('game_developer', 'unity', 1),
  ('game_developer', 'unreal-engine', 2),
  ('game_developer', 'godot', 3),
  ('game_developer', 'c-sharp', 4),
  ('game_developer', 'c-plus-plus', 5),
  ('game_developer', 'game-development', 6),
  ('game_developer', 'blender', 7),
  ('game_developer', '3d-modeling', 8)
) AS v(occupation, slug, position)
JOIN topics t ON t.slug = v.slug
ON CONFLICT DO NOTHING;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT o.occupation, COUNT(ot."topicId") AS n
    FROM unnest(enum_range(NULL::"Occupation")) AS o(occupation)
    LEFT JOIN occupation_topics ot ON ot.occupation = o.occupation
    WHERE o.occupation <> 'other'
    GROUP BY o.occupation
    HAVING COUNT(ot."topicId") < 5
  LOOP
    RAISE NOTICE 'Nghề % chỉ có % topic', r.occupation, r.n;
  END LOOP;
END $$;
```

- [ ] **Step 4: Sinh migration schema `<t1>`**

Run (từ `back-end/`):
```bash
f=prisma/migrations/$(date -u +%Y%m%d%H%M%S)_personalize_occupation/migration.sql; mkdir -p "$(dirname "$f")"
pnpm prisma migrate diff \
  --from-url "$(node --env-file=.env -e 'process.stdout.write(process.env.DIRECT_URL)')" \
  --to-schema-datamodel prisma/schema.prisma --script > "$f"
echo "$f"; cat "$f"
```
Mở file, **xoá 3 dòng `DROP INDEX "uq_sections_position"` / `"uq_items_position"` / `"uq_questions_position"`** và mọi lệnh động tới object viết tay khác liệt kê trong README (partial index, `chk_*`, `mv_*`). Phần còn lại phải chỉ gồm: `CREATE TYPE "Occupation"`, `DROP INDEX "courses_status_track_level_idx"`, `ALTER TABLE "courses" DROP COLUMN "track"`, `ALTER TABLE "user" DROP COLUMN "targetTrack", ADD COLUMN "occupation"`, `DROP TYPE "Track"`, `CREATE TABLE "occupation_topics"` + index + FK. Có lệnh nào khác → DỪNG, báo sếp.

- [ ] **Step 5: Tạo migration seed `<t2>` (t2 > t1)**

```bash
g=prisma/migrations/$(date -u +%Y%m%d%H%M%S)_occupation_topics_seed/migration.sql; mkdir -p "$(dirname "$g")"
cp prisma/sql/06_occupation_topics.sql "$g"; ls prisma/migrations | tail -3
```
Expected: `_personalize_occupation` đứng trước `_occupation_topics_seed`. Nếu cùng giây thì đổi tên thư mục seed +1 giây.

- [ ] **Step 6: Áp migration + generate**

Run: `pnpm db:deploy && pnpm db:generate`
Expected: `All migrations have been successfully applied.` và không có NOTICE "chỉ có … topic".

- [ ] **Step 7: Kiểm dữ liệu seed**

Run:
```bash
node --env-file=.env -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.occupationTopic.groupBy({by:['occupation'],_count:true}).then(r=>{console.log(r);return p.\$disconnect()})"
```
Expected: 11 nghề (không có `other`), mỗi nghề `_count` 7–10.

---

### Task 2: Better Auth — `occupation`/`level` chỉ ghi qua API

**Files:**
- Modify: `back-end/src/auth/auth.ts:83-88`
- Test: `back-end/test/preferences.e2e-spec.ts` (tạo ở Task 5, test sign-up nằm ở đó)

- [ ] **Step 1: Sửa `additionalFields`**

```ts
    user: {
      // Chỉ ghi qua PATCH /me/preferences (có validate enum). input: false → client gửi kèm
      // lúc sign-up/updateUser thì Better Auth trả 400 FIELD_NOT_ALLOWED.
      additionalFields: {
        occupation: { type: 'string', required: false, input: false },
        level: { type: 'string', required: false, input: false },
      },
    },
```

- [ ] **Step 2: tsc**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: lỗi baseline + lỗi `Track`/`track` ở `src/instructor-courses/*` (do Task 1 đã generate client mới; Task 3 sửa). Không có lỗi nào ở `src/auth/*`. (Test hành vi ở Task 5 Step 1, case "sign-up gửi occupation → 400". Làm task này **trước** Task 3 để e2e ở Task 3 không chạy với `targetTrack` còn khai ở Better Auth trong khi cột đã bị drop.)

---

### Task 3: Gỡ `track` khỏi module instructor-courses + test cũ

**Files:**
- Modify: `back-end/src/instructor-courses/instructor-courses.schemas.ts:1,27`
- Modify: `back-end/src/instructor-courses/instructor-courses.service.ts:21`
- Modify: `back-end/src/instructor-courses/course-checklist.ts:17,69`
- Modify: `back-end/src/instructor-courses/course-checklist.spec.ts:12,28,86`
- Modify: `back-end/test/instructor-courses.e2e-spec.ts:107,151,159,171`
- Modify: `back-end/test/taxonomy.e2e-spec.ts:37`, `back-end/test/udemy-curriculum.e2e-spec.ts:42`

- [ ] **Step 1: Sửa unit test trước (để fail)**

`course-checklist.spec.ts`: xoá dòng `track: 'frontend',` (complete), `track: null,` (empty), và dòng `{ message: 'Chưa chọn track', anchor: 'track' },`; đổi tên test `'khoá trống → basics thiếu đủ 7 ý theo đúng thứ tự'` → `'… thiếu đủ 6 ý …'`.

- [ ] **Step 2: Chạy, xác nhận fail**

Run: `pnpm test src/instructor-courses/course-checklist.spec.ts`
Expected: FAIL ở test "thiếu đủ 6 ý" (còn dòng 'Chưa chọn track') — và lỗi kiểu do `ChecklistInput` vẫn đòi `track` nếu chạy tsc.

- [ ] **Step 3: Sửa code**

- `course-checklist.ts`: xoá `track: string | null;` khỏi `ChecklistInput` và dòng `if (!c.track) basics.push({ message: 'Chưa chọn track', anchor: 'track' });`.
- `instructor-courses.schemas.ts`: dòng 1 → `import { SkillLevel } from '@prisma/client';`; xoá dòng `track: z.enum(Track).nullable(),`.
- `instructor-courses.service.ts`: xoá `track: true,` trong `COURSE_SELECT`. Tìm thêm: `grep -n "track" src/instructor-courses/*.ts` phải không còn kết quả (trừ chữ `tracking`).

- [ ] **Step 4: Sửa e2e cũ**

- `instructor-courses.e2e-spec.ts`: xoá `track: null,` (~107); bỏ `'track',` trong mảng key (~151); bỏ `'track',` trong mảng anchor (~159); xoá `track: 'frontend',` trong body PATCH (~171). Thêm 1 assert sau PATCH hợp lệ: `await call('patch', url(), alice.cookie).send({ track: 'frontend' }).expect(400);` (strict chặn trường đã bỏ).
- `taxonomy.e2e-spec.ts` (~37), `udemy-curriculum.e2e-spec.ts` (~42): xoá `track: 'frontend',`.

- [ ] **Step 5: Chạy unit + tsc + e2e liên quan**

Run: `pnpm test && pnpm exec tsc --noEmit -p tsconfig.json; pnpm test:e2e test/instructor-courses.e2e-spec.ts test/taxonomy.e2e-spec.ts test/udemy-curriculum.e2e-spec.ts`
Expected: unit PASS; tsc chỉ còn lỗi baseline `sentry-redact.spec.ts(64,19)`; e2e PASS.

---

### Task 4: `GET /topics/popular`

**Files:**
- Modify: `back-end/src/topics/topics.controller.ts`
- Test: `back-end/test/preferences.e2e-spec.ts` (Task 5 viết chung; ở đây viết riêng phần popular)

- [ ] **Step 1: Tạo `back-end/test/preferences.e2e-spec.ts` với phần popular (failing)**

```ts
import { INestApplication } from '@nestjs/common';
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
// Rate limit Better Auth nằm ở Redis → mỗi request một IP (xem auth.e2e-spec).
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };
type Ref = { id: string; slug: string; name: string };

describe('Personalize (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];

  const call = (method: 'get' | 'post' | 'patch', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())
      [method](path)
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true } });
    const res = await call('post', '/api/auth/sign-in/email').send({ email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  }, 120_000);

  afterAll(async () => {
    await prisma?.user.deleteMany({ where: { email: { in: emails } } }); // user_target_topics cascade
    await app?.close();
  });

  describe('GET /api/topics/popular', () => {
    it('frontend_developer → đúng thứ tự position của seed', async () => {
      const { body } = await call('get', '/api/topics/popular?occupation=frontend_developer').expect(200);
      expect((body as Ref[]).slice(0, 3).map((t) => t.slug)).toEqual(['html', 'css', 'javascript']);
      expect(Object.keys(body[0]).sort()).toEqual(['id', 'name', 'slug']);
    });

    it('other → [] ; nghề sai / thiếu → 400', async () => {
      const { body } = await call('get', '/api/topics/popular?occupation=other').expect(200);
      expect(body).toEqual([]);
      await call('get', '/api/topics/popular?occupation=chef').expect(400);
      await call('get', '/api/topics/popular').expect(400);
    });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận fail**

Run: `pnpm test:e2e test/preferences.e2e-spec.ts`
Expected: FAIL — `/api/topics/popular` trả 400 (khớp `GET /topics` với `q` thiếu) hoặc 404.

- [ ] **Step 3: Thêm route vào `topics.controller.ts`**

Sửa import và thêm schema + method (đặt `popular` **trước** `search` cho dễ đọc; Nest khớp path chính xác nên không xung đột):

```ts
import { Controller, Get, Query } from '@nestjs/common';
import { Occupation } from '@prisma/client';
import { z } from 'zod';
// … import cũ giữ nguyên

const popularQuery = z.object({ occupation: z.enum(Occupation) });

// trong class TopicsController:
  // Chip "Phổ biến với học viên như bạn" ở bước 2 onboarding (spec personalize-occupation §4).
  @Get('popular')
  async popular(@Query(new ZodValidationPipe(popularQuery)) { occupation }: z.output<typeof popularQuery>) {
    const rows = await this.prisma.occupationTopic.findMany({
      where: { occupation },
      orderBy: { position: 'asc' },
      select: { topic: { select: { id: true, slug: true, name: true } } },
    });
    return rows.map((r) => r.topic);
  }
```

- [ ] **Step 4: Chạy, xác nhận pass**

Run: `pnpm test:e2e test/preferences.e2e-spec.ts`
Expected: 2 test PASS.

---

### Task 5: Module `preferences` — `GET/PATCH /me/preferences`

**Files:**
- Create: `back-end/src/preferences/preferences.schemas.ts`
- Create: `back-end/src/preferences/preferences.service.ts`
- Create: `back-end/src/preferences/preferences.controller.ts`
- Create: `back-end/src/preferences/preferences.module.ts`
- Modify: `back-end/src/app.module.ts`
- Test: `back-end/test/preferences.e2e-spec.ts`

- [ ] **Step 1: Thêm test vào `preferences.e2e-spec.ts` (failing)**

Thêm vào trong `describe('Personalize (e2e)')`, sau block popular:

```ts
  describe('/api/me/preferences', () => {
    let u: TestUser;
    let topics: Ref[];
    const prefs = () => call('get', '/api/me/preferences', u.cookie).expect(200).then((r) => r.body);
    type Err = { path: string[]; message: string };

    beforeAll(async () => {
      u = await makeUser();
      topics = await prisma.topic.findMany({ take: 3, orderBy: { slug: 'asc' }, select: { id: true, slug: true, name: true } });
    }, 120_000);

    it('chưa đăng nhập → 401', async () => {
      await call('get', '/api/me/preferences').expect(401);
      await call('patch', '/api/me/preferences').send({}).expect(401);
    });

    it('user mới → tất cả trống; body {} không đổi gì', async () => {
      expect(await prefs()).toEqual({ occupation: null, level: null, topics: [] });
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({}).expect(200);
      expect(body).toEqual({ occupation: null, level: null, topics: [] });
    });

    it('PATCH từng field riêng → GET và /api/me thấy ngay', async () => {
      await call('patch', '/api/me/preferences', u.cookie).send({ occupation: 'backend_developer' }).expect(200);
      await call('patch', '/api/me/preferences', u.cookie).send({ level: 'intermediate' }).expect(200);
      expect(await prefs()).toMatchObject({ occupation: 'backend_developer', level: 'intermediate' });
      const me = await call('get', '/api/me', u.cookie).expect(200);
      expect(me.body).toMatchObject({ occupation: 'backend_developer', level: 'intermediate' });
    });

    it('topicIds lần sau thay hẳn lần trước', async () => {
      await call('patch', '/api/me/preferences', u.cookie).send({ topicIds: [topics[0].id, topics[1].id] }).expect(200);
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({ topicIds: [topics[2].id] }).expect(200);
      expect(body.topics).toEqual([topics[2]]);
      expect(await prisma.userTargetTopic.count({ where: { userId: u.id } })).toBe(1);
    });

    it('topic không tồn tại → 400 path topicIds, danh sách cũ còn nguyên', async () => {
      const res = await call('patch', '/api/me/preferences', u.cookie)
        .send({ topicIds: [topics[0].id, randomUUID()] })
        .expect(400);
      expect((res.body.errors as Err[]).map((e) => e.path)).toEqual([['topicIds']]);
      expect((await prefs()).topics).toEqual([topics[2]]);
    });

    it('enum sai / all_levels / trùng / >30 / trường lạ → 400', async () => {
      const bad = (body: object) => call('patch', '/api/me/preferences', u.cookie).send(body).expect(400);
      await bad({ occupation: 'chef' });
      await bad({ level: 'all_levels' });
      await bad({ topicIds: [topics[0].id, topics[0].id] });
      await bad({ topicIds: Array.from({ length: 31 }, () => randomUUID()) });
      await bad({ targetTrack: 'frontend' });
    });

    it('null xoá lựa chọn', async () => {
      const { body } = await call('patch', '/api/me/preferences', u.cookie).send({ occupation: null, level: null, topicIds: [] }).expect(200);
      expect(body).toEqual({ occupation: null, level: null, topics: [] });
    });
  });

  it('sign-up gửi kèm occupation → 400 (input: false)', async () => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    const res = await call('post', '/api/auth/sign-up/email')
      .send({ name: 'E2E', email, password: PASSWORD, occupation: 'frontend_developer' })
      .expect(400);
    expect(res.body.message).toMatch(/occupation is not allowed to be set/);
  });
```

- [ ] **Step 2: Chạy, xác nhận fail**

Run: `pnpm test:e2e test/preferences.e2e-spec.ts`
Expected: các test `/api/me/preferences` FAIL với 404; test sign-up PASS (Task 2 đã làm).

- [ ] **Step 3: `preferences.schemas.ts`**

```ts
import { Occupation } from '@prisma/client';
import { z } from 'zod';

// all_levels là thuộc tính khoá ("hợp mọi trình độ"), học viên chỉ chọn 3 mức (spec §4, §6).
export const LEARNER_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const updatePreferencesSchema = z
  .object({
    occupation: z.enum(Occupation).nullable(),
    level: z.enum(LEARNER_LEVELS).nullable(),
    // guid: chỉ kiểm dạng 8-4-4-4-12; tồn tại do service kiểm.
    topicIds: z
      .array(z.guid())
      .max(30, 'Tối đa 30 kỹ năng')
      .refine((ids) => new Set(ids).size === ids.length, 'Kỹ năng bị trùng'),
  })
  .partial()
  .strict();
export type UpdatePreferencesInput = z.output<typeof updatePreferencesSchema>;
```

- [ ] **Step 4: `preferences.service.ts`**

```ts
import { Inject, Injectable } from '@nestjs/common';
import { AUTH, type Auth } from '../auth/auth.js';
import { validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { UpdatePreferencesInput } from './preferences.schemas.js';

const REF = { select: { id: true, slug: true, name: true } } as const;

@Injectable()
export class PreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  // Đọc DB chứ không đọc user của session: ngay sau PATCH, session trong request vẫn là bản cũ.
  async get(userId: string) {
    const [user, rows] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { occupation: true, level: true } }),
      this.prisma.userTargetTopic.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'asc' }, { topic: { name: 'asc' } }],
        select: { topic: REF },
      }),
    ]);
    return { occupation: user.occupation, level: user.level, topics: rows.map((r) => r.topic) };
  }

  async update(userId: string, input: UpdatePreferencesInput) {
    const { topicIds, ...fields } = input;
    if (topicIds) {
      // Kiểm trước khi xoá để topic sai không làm mất danh sách cũ.
      const found = await this.prisma.topic.count({ where: { id: { in: topicIds } } });
      if (found !== topicIds.length) throw validationError([{ path: ['topicIds'], message: 'Topic không tồn tại' }]);
      await this.prisma.$transaction([
        this.prisma.userTargetTopic.deleteMany({ where: { userId } }),
        this.prisma.userTargetTopic.createMany({ data: topicIds.map((topicId) => ({ userId, topicId })) }),
      ]);
    }
    if (Object.keys(fields).length > 0) {
      // Qua internalAdapter để cache {session, user} trong Redis được làm mới (như become-instructor).
      const ctx = await this.auth.$context;
      await ctx.internalAdapter.updateUser(userId, fields);
    }
    return this.get(userId);
  }
}
```

- [ ] **Step 5: `preferences.controller.ts`**

```ts
import { Body, Controller, Get, Patch } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { updatePreferencesSchema } from './preferences.schemas.js';
import type { UpdatePreferencesInput } from './preferences.schemas.js';
import { PreferencesService } from './preferences.service.js';

// Onboarding cá nhân hoá (spec 2026-10-02-personalize-occupation §4). Field nào cũng optional
// để "Lưu rồi thoát" lưu được giữa chừng.
@Controller('me/preferences')
export class PreferencesController {
  constructor(private readonly preferences: PreferencesService) {}

  @Get()
  get(@CurrentUser() user: AuthSession['user']) {
    return this.preferences.get(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthSession['user'],
    @Body(new ZodValidationPipe(updatePreferencesSchema)) body: UpdatePreferencesInput,
  ) {
    return this.preferences.update(user.id, body);
  }
}
```

- [ ] **Step 6: `preferences.module.ts` + đăng ký**

```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PreferencesController } from './preferences.controller.js';
import { PreferencesService } from './preferences.service.js';

@Module({ imports: [AuthModule], controllers: [PreferencesController], providers: [PreferencesService] })
export class PreferencesModule {}
```

`app.module.ts`: thêm `import { PreferencesModule } from './preferences/preferences.module.js';` và thêm `PreferencesModule` vào cuối mảng `imports`.

- [ ] **Step 7: Chạy, xác nhận pass**

Run: `pnpm test:e2e test/preferences.e2e-spec.ts && pnpm exec tsc --noEmit -p tsconfig.json && pnpm lint`
Expected: toàn bộ PASS; tsc chỉ lỗi baseline; lint sạch.

Nếu `internalAdapter.updateUser` báo lỗi kiểu với `fields` (kiểu `occupation` là enum Prisma, adapter khai `string`) → truyền `fields as Record<string, unknown>`; không đổi gì khác.

---

### Task 6: FE — type, API client, gỡ track khỏi form basics

**Files:**
- Create: `it-course-platform/src/types/preferences.ts`
- Create: `it-course-platform/src/lib/api/preferences.ts`
- Modify: `it-course-platform/src/lib/auth-client.ts:15-18`
- Modify: `it-course-platform/src/types/instructor-course.ts:19-28,56,84`
- Modify: `it-course-platform/src/app/instructor/(manage)/courses/[id]/manage/_components/basics-form.tsx`

- [ ] **Step 1: `src/types/preferences.ts`**

```ts
import type { Ref, SkillLevel } from './instructor-course';

// Khớp enum Occupation ở back-end (spec 2026-10-02-personalize-occupation §3.1).
export const OCCUPATION_LABEL = {
  frontend_developer: 'Lập trình viên Frontend',
  backend_developer: 'Lập trình viên Backend',
  fullstack_developer: 'Lập trình viên Fullstack',
  mobile_developer: 'Lập trình viên Mobile',
  devops_engineer: 'Kỹ sư DevOps',
  data_engineer: 'Kỹ sư dữ liệu',
  data_analyst: 'Chuyên viên phân tích dữ liệu',
  ml_engineer: 'Kỹ sư học máy',
  qa_engineer: 'Kỹ sư kiểm thử (QA)',
  software_architect: 'Kiến trúc sư phần mềm',
  game_developer: 'Lập trình viên game',
  other: 'Nghề khác',
} as const;
export type Occupation = keyof typeof OCCUPATION_LABEL;

// all_levels là thuộc tính khoá, học viên chỉ chọn 3 mức. Label dùng SKILL_LEVEL_LABEL.
export const LEARNER_LEVELS = ['beginner', 'intermediate', 'advanced'] as const satisfies readonly SkillLevel[];
export type LearnerLevel = (typeof LEARNER_LEVELS)[number];

export interface Preferences {
  occupation: Occupation | null;
  level: LearnerLevel | null;
  topics: Ref[];
}

export interface UpdatePreferencesPayload {
  occupation?: Occupation | null;
  level?: LearnerLevel | null;
  topicIds?: string[];
}
```

- [ ] **Step 2: `src/lib/api/preferences.ts`**

```ts
import { api } from '@/lib/api/client';
import type { Ref } from '@/types/instructor-course';
import type { Occupation, Preferences, UpdatePreferencesPayload } from '@/types/preferences';

// Onboarding cá nhân hoá (spec 2026-10-02-personalize-occupation §4). Chỉ gọi từ client component.
export const getPreferences = () => api.get<Preferences>('/me/preferences').then((r) => r.data);

export const updatePreferences = (body: UpdatePreferencesPayload) =>
  api.patch<Preferences>('/me/preferences', body).then((r) => r.data);

export const getPopularTopics = (occupation: Occupation, signal?: AbortSignal) =>
  api.get<Ref[]>('/topics/popular', { params: { occupation }, signal }).then((r) => r.data);
```

(Ô tìm topic dùng lại `searchTopics` có sẵn ở `src/lib/api/instructor-courses.ts`.)

- [ ] **Step 3: `types/instructor-course.ts`**

Xoá khối `TRACK_LABEL` + `export type Track`, dòng `track: Track | null;` trong `CourseDetail`, dòng `track?: Track | null;` trong `UpdateCoursePayload`.

- [ ] **Step 4: `basics-form.tsx`**

- Import: xoá `type Track,` và `TRACK_LABEL,`.
- zod schema: xoá `track: z.custom<Track | null>(),`. `toValues`: xoá `track: c.track,`.
- `useWatch`: `const [title, subtitle, description, level, primaryTopic] = useWatch({ control, name: ['title', 'subtitle', 'description', 'level', 'primaryTopic'] });`
- Xoá nguyên `<FormField label="Track" …>…</FormField>`; lưới chứa nó `grid gap-4 sm:grid-cols-3` → `sm:grid-cols-2` (còn Ngôn ngữ + Cấp độ).
- Xem trước: `{(level || track || primaryTopic) && (` → `{(level || primaryTopic) && (`; xoá dòng badge `{track && …TRACK_LABEL[track]…}`.

- [ ] **Step 5: `src/lib/auth-client.ts`** — trong `inferAdditionalFields`, thay 2 dòng bằng:

```ts
        occupation: { type: 'string', required: false, input: false },
        level: { type: 'string', required: false, input: false },
```

- [ ] **Step 6: Kiểm**

Run (từ `it-course-platform/`): `pnpm exec tsc --noEmit && pnpm lint`; rồi `grep -rn "TRACK_LABEL\|targetTrack" src` → không còn kết quả.
Expected: tsc + lint sạch.

---

### Task 7: FE — hook logic onboarding

**Files:**
- Create: `it-course-platform/src/app/onboarding/_components/use-onboarding.ts`

- [ ] **Step 1: Viết hook**

```ts
'use client';

import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { getPopularTopics, getPreferences, updatePreferences } from '@/lib/api/preferences';
import type { Ref } from '@/types/instructor-course';
import type { LearnerLevel, Occupation, UpdatePreferencesPayload } from '@/types/preferences';

export const STEP_COUNT = 3;
type Step = 0 | 1 | 2;

// Toàn bộ logic wizard /onboarding (spec 2026-10-02-personalize-occupation §5.1); view chỉ render.
// 401 do interceptor của api chuyển /login?redirect=/onboarding — ở đây chỉ không toast.
export function useOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [occupation, setOccupation] = useState<Occupation | null>(null);
  const [topics, setTopics] = useState<Ref[]>([]);
  const [level, setLevel] = useState<LearnerLevel | null>(null);
  const [popular, setPopular] = useState<Ref[]>([]);
  const [saving, setSaving] = useState(false);

  // Điền sẵn lựa chọn cũ; lỗi thì bắt đầu với form trống.
  useEffect(() => {
    getPreferences()
      // Chỉ điền khi người dùng chưa kịp chọn gì (response về muộn không ghi đè lựa chọn mới).
      .then((p) => {
        setOccupation((o) => o ?? p.occupation);
        setTopics((t) => (t.length ? t : p.topics));
        setLevel((l) => l ?? p.level);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!occupation) return; // UI không có đường đưa occupation về null
    const ctrl = new AbortController();
    getPopularTopics(occupation, ctrl.signal)
      .then(setPopular)
      .catch(() => !ctrl.signal.aborted && setPopular([]));
    return () => ctrl.abort();
  }, [occupation]);

  // Chip = topic phổ biến + topic đã chọn từ ô tìm mà không nằm trong danh sách phổ biến.
  const chips = useMemo(
    () => [...popular, ...topics.filter((t) => !popular.some((p) => p.id === t.id))],
    [popular, topics],
  );
  const isSelected = (id: string) => topics.some((t) => t.id === id);
  const toggleTopic = (t: Ref) =>
    setTopics((prev) => (prev.some((x) => x.id === t.id) ? prev.filter((x) => x.id !== t.id) : [...prev, t]));

  const payloadOf = (s: Step): UpdatePreferencesPayload =>
    s === 0 ? { occupation } : s === 1 ? { topicIds: topics.map((t) => t.id) } : level ? { level } : {};

  async function save(body: UpdatePreferencesPayload): Promise<boolean> {
    setSaving(true);
    try {
      await updatePreferences(body);
      return true;
    } catch (err) {
      if (!(isAxiosError(err) && err.response?.status === 401)) toast.error('Lưu thất bại, thử lại');
      return false;
    } finally {
      setSaving(false);
    }
  }

  const canNext = step !== 0 || occupation !== null;

  async function next() {
    if (!canNext || !(await save(payloadOf(step)))) return;
    if (step < 2) setStep((step + 1) as Step);
    else router.push('/');
  }

  const back = () => setStep((s) => (s > 0 ? ((s - 1) as Step) : s));

  // Bước 3 "Bỏ qua": không gửi level.
  const skip = () => router.push('/');

  async function saveAndExit() {
    if (step === 0 && !occupation) return router.push('/');
    if (await save(payloadOf(step))) router.push('/');
  }

  return {
    step, occupation, setOccupation, level, setLevel, topics, chips, isSelected, toggleTopic,
    saving, canNext, next, back, skip, saveAndExit,
  };
}
```

- [ ] **Step 2: Kiểm**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch.

---

### Task 8: FE — dựng lại view onboarding bằng `/evon:ui-ux`

**Files:**
- Modify: `it-course-platform/src/app/onboarding/_components/onboarding-view.tsx` (viết lại toàn bộ)

- [ ] **Step 1: Gọi skill `/evon:ui-ux`** với prompt (nguyên văn từ spec §5.1) **cộng thêm** đoạn ràng buộc tích hợp ở cuối:

```
Dựng luôn (không wireframe): dựng lại màn /onboarding (it-course-platform/src/app/onboarding) — wizard cá nhân hoá 3 bước kiểu
udemy.com/personalize. Màn toàn trang, không Header chung; header riêng: logo SkillPath trái,
nút "Lưu rồi thoát" phải, thanh tiến trình "Bước x/3" dưới header.

Việc chính từng bước:
1. Nghề — "Bạn đang học để làm nghề gì?": 12 nghề (OCCUPATION_LABEL), chọn 1, bắt buộc.
2. Kỹ năng — "Bạn quan tâm kỹ năng nào?": ô tìm topic (combobox, GET /topics?q=) + nhóm chip
   checkbox "Phổ biến với học viên như bạn" (GET /topics/popular?occupation=). Chọn nhiều,
   được để trống. Topic chọn từ ô tìm hiện thêm thành chip đã tick.
3. Trình độ — 3 mức beginner/intermediate/advanced (SKILL_LEVEL_LABEL, bỏ all_levels), chọn 1, có "Bỏ qua".
Nút dưới: "Quay lại" / "Tiếp theo" (bước cuối: "Hoàn tất"). Đang gửi thì khoá nút, lỗi thì toast.
API trả 401 thì chuyển /login?redirect=/onboarding.

Dữ liệu thật: nghề 12 mục ở trên; chip ví dụ cho frontend_developer: HTML, CSS, JavaScript,
TypeScript, React, Next.js, Angular, Git. Key giá trị tiếng Anh, tiếng Việt chỉ ở label.
Dùng component shadcn có sẵn trong components/ui và token màu trong globals.css. Mobile 1 cột.

Ràng buộc tích hợp (bắt buộc):
- Logic + API đã có trong hook `useOnboarding()` ở `_components/use-onboarding.ts`
  (trả step, occupation/setOccupation, level/setLevel, chips/isSelected/toggleTopic, saving,
  canNext, next, back, skip, saveAndExit, STEP_COUNT). View KHÔNG gọi API trực tiếp, không sửa hook,
  trừ ô tìm topic: dùng `searchTopics(q, signal)` từ `@/lib/api/instructor-courses` (debounce ~250ms,
  huỷ request cũ bằng AbortController), chọn kết quả → `toggleTopic(ref)`.
- Label: `OCCUPATION_LABEL`, `LEARNER_LEVELS` từ `@/types/preferences`; `SKILL_LEVEL_LABEL` từ
  `@/types/instructor-course`.
- Giữ `export function OnboardingView()` (page.tsx import tên này). Radio/checkbox phải dùng được
  bằng bàn phím (role radio/checkbox hoặc input thật).
```

Chế độ **dựng luôn, không wireframe** (sếp chốt 2026-10-02): thêm "dựng luôn" vào đầu prompt. Xong thì dọn `$TMPDIR/evon-design`, `$TMPDIR/evon-probe` (memory "Dọn file tạm evon").

- [ ] **Step 2: Kiểm**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch.

---

### Task 9: FE — trang cài đặt + tài liệu

**Files:**
- Modify: `it-course-platform/src/app/(student)/settings/_components/settings-view.tsx` (`ProfileTab`)
- Modify: `de-xuat-do-an.md:258`
- Modify: `schema-database.md` (dòng ~33, 136, 160, 368-372, 424, 807, 1293, 1831-1867)

- [ ] **Step 1: `ProfileTab`**

Chỉ thay nguyên khối `<div>` "Mục tiêu học tập" (label + `<select>`) bằng:

```tsx
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Sở thích học tập</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Nghề, kỹ năng quan tâm và trình độ — dùng để gợi ý khoá học</p>
          </div>
          <Link href="/onboarding" className="text-sm font-semibold text-primary hover:underline">Chỉnh sửa</Link>
        </div>
```
Thêm `import Link from 'next/link';`.

- [ ] **Step 2: `de-xuat-do-an.md:258`** thay dòng tầng 1:

```
| 1. Theo nghề | `users(occupation, level)`, `occupation_topics`, `course_topics` | Lấy topic của nghề, tìm khoá dạy các topic đó, lọc `level` (đúng mức hoặc `all_levels`), xếp theo số topic khớp → đúng level trước → `rating` |
```

- [ ] **Step 3: `schema-database.md`** (tài liệu mirror schema — sửa cho khớp Task 1):
- ~33: dòng "Hai trục phân loại tách rời" → "**Khoá không gắn nghề**: `categories` = chủ đề; nghề học viên (`users.occupation`) nối với khoá qua `occupation_topics` → `course_topics` (spec 2026-10-02-personalize-occupation)."
- ~136, ~160: `targetTrack` → `occupation` (`Occupation?`, `input: false`).
- ~368-372, ~424: bỏ comment track, cột `track`, index `[status, track, level]`.
- ~807: comment chip → `occupation_topics của users.occupation`; thêm khối `model OccupationTopic` giống Task 1.
- ~1293: enum `Track` → enum `Occupation` (giống Task 1).
- ~1831-1867: thay SQL tầng 1 và SQL chip bằng:

```sql
-- ---------------------------------------------------------------------------
--  TẦNG 1 — theo nghề (cold start). $1 = users.occupation, $2 = users.level (có thể NULL)
--  Khớp level: đúng mức hoặc all_levels; level NULL → không lọc (spec personalize-occupation §6)
-- ---------------------------------------------------------------------------
SELECT c.id, c.title, c."ratingAvg", COUNT(*)::int AS matched_topics
FROM courses c
JOIN course_topics ct ON ct."courseId" = c.id
JOIN occupation_topics ot ON ot."topicId" = ct."topicId" AND ot.occupation = $1::"Occupation"
WHERE c.status = 'published'
  AND ($2::"SkillLevel" IS NULL OR c.level IN ($2::"SkillLevel", 'all_levels'))
GROUP BY c.id
ORDER BY matched_topics DESC, (c.level = $2::"SkillLevel") DESC, c."ratingAvg" DESC
LIMIT 12;
```
và
```sql
-- Chip "Phổ biến với học viên như bạn": curated theo nghề. $1 = users.occupation
SELECT t.id, t.slug, t.name
FROM occupation_topics ot
JOIN topics t ON t.id = ot."topicId"
WHERE ot.occupation = $1::"Occupation"
ORDER BY ot.position;
```
Đổi tiêu đề "ONBOARDING BƯỚC 3" → "ONBOARDING BƯỚC 2".

- [ ] **Step 4: Kiểm**

Run (từ repo root): `grep -n -i "targetTrack\|\"Track\"\|c\.track" de-xuat-do-an.md schema-database.md` → không còn kết quả. FE: `pnpm exec tsc --noEmit && pnpm lint` sạch.

---

### Task 10: Kiểm tra cuối + đề xuất commit

- [ ] **Step 1: Toàn bộ BE**

Run (từ `back-end/`): `pnpm test && pnpm test:e2e && pnpm exec tsc --noEmit -p tsconfig.json && pnpm lint`
Expected: PASS hết; tsc chỉ lỗi baseline.

- [ ] **Step 2: Toàn bộ FE**

Run (từ `it-course-platform/`): `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: sạch, build thành công.

- [ ] **Step 3: Chạy tay** (skill `run` hoặc `pnpm dev` hai bên)

1. Đăng nhập học viên → `/onboarding`: bước 1 chọn "Lập trình viên Frontend" → bước 2 thấy chip HTML/CSS/JavaScript…, tìm "docker" chọn thêm → "Lưu rồi thoát" → về `/`.
2. Mở lại `/onboarding` → nghề + kỹ năng được điền sẵn (Docker hiện thành chip đã tick) → đi tiếp bước 3, chọn "Trung cấp" → "Hoàn tất".
3. Đăng xuất, mở `/onboarding` → bị chuyển `/login?redirect=%2Fonboarding`.
4. Giảng viên → trang tổng quan khoá: không còn ô Track; checklist không còn "Chưa chọn track".
5. `/settings` → tab Hồ sơ có "Sở thích học tập" → "Chỉnh sửa" mở `/onboarding`.

- [ ] **Step 4: Đề xuất commit, CHỜ sếp duyệt** (không tự chạy `git commit`, không push, không Co-Authored-By)

Tóm tắt thay đổi + message đề xuất:
```
feat: cá nhân hoá kiểu Udemy — occupation + kỹ năng theo dõi, bỏ track của khoá
```
