# Tạo khoá học + Học viên mục tiêu + Trang tổng quan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đợt 1/4 flow giảng viên: học viên tự bật vai trò giảng viên, tạo khoá bằng modal chỉ nhập tên, danh sách "Khoá học của tôi", trang quản lý toàn màn hình (thanh trên + sidebar checklist) với 2 trang "Học viên mục tiêu" và "Trang tổng quan" (trừ ảnh/video), lưu bằng nút Lưu.

**Architecture:** BE: migration `course_draft_nullable` (nháp cho `categoryId/track/level` NULL, drop 2 cột tin nhắn), pipe `ZodValidationPipe` tự viết, hàm thuần `buildChecklist` + `slugify`, module `topics` (`GET /topics`), module `instructor-courses` (POST/GET/GET :id/PATCH :id, chủ khoá → 404, `in_review` → 409), `POST /me/become-instructor` ghi role qua `internalAdapter.updateUser` để refresh cache session Redis; `GET /categories/tree` thêm `id`. FE: tách `instructor/` thành route group `(dashboard)` (layout cũ) và `(manage)` (toàn màn hình); `instructor/layout.tsx` thành gate client (`useSession`); trang quản lý dùng `CourseProvider` (context `course` + `dirty`) bọc `<Suspense>` vì `useParams` dưới `cacheComponents`; form react-hook-form + zod, gọi API bằng axios `api` có sẵn.

**Tech Stack:** NestJS 12, Prisma 6.19, better-auth 1.7.6, zod 4, vitest 4 + supertest; Next.js 16.3 (App Router, `cacheComponents`), shadcn `base-nova` (Base UI), react-hook-form + @hookform/resolvers, axios, sonner.

**Spec:** `docs/superpowers/specs/2026-09-30-course-create-basics-design.md`

## Global Constraints

- **Không commit giữa các task, không push, không thêm Co-Authored-By.** Sếp chưa chọn chế độ commit cho task này → mặc định hỏi trước mỗi commit; plan gom **một** đề xuất commit ở Task 13 và chờ duyệt.
- Lệnh BE chạy từ `back-end/` (`.env` trỏ DB + Redis **dev**), lệnh FE chạy từ `it-course-platform/`, lệnh sửa tài liệu chạy từ gốc repo. Package manager: `pnpm`.
- BE là ESM (`"type": "module"`, `module: nodenext`): **import tương đối phải có đuôi `.js`**. Kiểu dùng trong tham số có decorator (`@Body() body: X`) phải `import type` (isolatedModules + emitDecoratorMetadata).
- Test BE: unit `src/**/*.spec.ts` (`pnpm test`), e2e `test/*.e2e-spec.ts` (`pnpm test:e2e`) chạy thật vào DB dev. Đăng nhập trong e2e theo pattern `test/auth.e2e-spec.ts` (mock `MailService`, `Origin` + `X-Forwarded-For` ngẫu nhiên mỗi request); bootstrap app theo `test/categories.e2e-spec.ts` (`createNestApplication({ bodyParser: false })` + `setupApp`).
- `tsc` BE baseline đã có **1 lỗi sẵn** ở `src/sentry-redact.spec.ts(64,19)` — ngoài phạm vi, không sửa; "tsc sạch" nghĩa là không có lỗi nào khác.
- **Migration:** theo đúng `back-end/README.md` mục "Sửa schema": `migrate diff` từ DB thật vào thư mục mới → xoá 3 dòng `DROP INDEX uq_*_position` → **DỪNG, báo sếp chạy `pnpm db:deploy`, chờ sếp xác nhận** (agent không được chạy deploy). Cấm `prisma migrate dev`, `migrate reset`, `db push`. Máy không có `psql`. Không sửa migration cũ và các file `prisma/sql/0*.sql`.
- FE: Next 16.3 khác bản cũ. Trước khi viết code FE (Task 7), đọc: `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`, `01-app/03-api-reference/04-functions/cacheLife.md`, `01-app/03-api-reference/04-functions/use-params.md` (mục "Cache Components"), `01-app/03-api-reference/03-file-conventions/route-groups.md`, `01-app/03-api-reference/05-config/01-next-config-js/redirects.md`.
- FE không dùng axios cho `/api/auth/*` (đã có `authClient`). Không thêm Zustand/TanStack Query. Màu dùng token (`text-primary`, `bg-muted`, `text-muted-foreground`, `text-destructive`).
- shadcn style `base-nova` trên `@base-ui/react`: component nhận `render` prop thay cho `asChild`. `cn` import từ `@/lib/utils`.

---

## File map

| File | Việc |
|---|---|
| `back-end/prisma/schema.prisma` | Sửa: `Course.categoryId/track/level` optional, `category Category?`, bỏ `welcomeMessage`, `congratsMessage` |
| `back-end/prisma/migrations/<ts>_course_draft_nullable/migration.sql` | `migrate diff` sinh, xoá 3 dòng `DROP INDEX` |
| `schema-database.md` | Sửa: đồng bộ khối prisma §4 từ `schema.prisma` |
| `back-end/package.json` | Sửa: thêm `zod` |
| `back-end/src/common/zod.pipe.ts` (+ `.spec.ts`) | Tạo: `ZodValidationPipe`, `validationError` |
| `back-end/src/instructor-courses/slugify.ts` (+ `.spec.ts`) | Tạo: `slugify`, `courseSlug` |
| `back-end/src/instructor-courses/course-checklist.ts` (+ `.spec.ts`) | Tạo: `buildChecklist`, `countWords`, hằng số ngưỡng |
| `back-end/src/categories/categories.service.ts` | Sửa: thêm `id` ở 3 cấp |
| `back-end/src/topics/topics.controller.ts`, `topics.module.ts` | Tạo: `GET /topics` |
| `back-end/test/categories.e2e-spec.ts` | Sửa: kỳ vọng có `id`; thêm test `GET /api/topics` |
| `back-end/src/auth/me.controller.ts` | Sửa: `POST /me/become-instructor` |
| `back-end/src/instructor-courses/instructor-courses.{schemas,service,controller,module}.ts` | Tạo |
| `back-end/src/app.module.ts` | Sửa: import `TopicsModule`, `InstructorCoursesModule` |
| `back-end/test/instructor-courses.e2e-spec.ts` | Tạo |
| `it-course-platform/src/components/ui/{dialog,textarea,select,label,sonner}.tsx` | shadcn sinh |
| `it-course-platform/src/app/layout.tsx` | Sửa: mount `<Toaster />` |
| `it-course-platform/src/types/index.ts` | Sửa: `id` cho `CategoryNode`/`SubcategoryNode`/`TopicLink` |
| `it-course-platform/src/types/instructor-course.ts` | Tạo |
| `it-course-platform/src/lib/api/instructor-courses.ts` | Tạo |
| `src/app/instructor/{page,loading}.tsx`, `_components/`, `analytics/`, `courses/`, `messages/`, `problems/`, `profile/`, `qa/`, `questions/`, `verification/` → `src/app/instructor/(dashboard)/` | `git mv` |
| `src/app/instructor/courses/{new,[id]/edit,_components/course-builder.tsx}` | Xoá |
| `src/app/instructor/(dashboard)/layout.tsx` | Tạo: nội dung layout cũ |
| `src/app/instructor/layout.tsx` | Viết lại: gate client + màn "Trở thành giảng viên" |
| `src/app/instructor/(dashboard)/{page,messages/page,profile/page,verification/page}.tsx` | Sửa import tuyệt đối; `page.tsx` sửa link tạo khoá |
| `it-course-platform/next.config.ts` | Sửa: redirect `/manage` → `/manage/goals` |
| `src/app/instructor/(dashboard)/courses/page.tsx` + `_components/{my-courses,create-course-dialog}.tsx` | Viết lại / tạo |
| `src/app/instructor/(manage)/courses/[id]/manage/layout.tsx` | Tạo |
| `src/app/instructor/(manage)/courses/[id]/manage/_components/{course-provider,course-manage-shell,checklist-sidebar,guarded-link,form-save,string-list-editor,goals-form,basics-form,category-picker,topic-picker}.tsx` | Tạo |
| `src/app/instructor/(manage)/courses/[id]/manage/{goals,basics}/page.tsx` | Tạo |

---

### Task 1: Migration `course_draft_nullable`

**Files:**
- Modify: `back-end/prisma/schema.prisma` (model `Course`, ~dòng 260–332)
- Create: `back-end/prisma/migrations/<ts>_course_draft_nullable/migration.sql`
- Modify: `schema-database.md` (khối ```` ```prisma ```` ở §4)

**Interfaces:**
- Produces: `courses."categoryId"`, `"track"`, `"level"` nullable; Prisma type `Course.categoryId: string | null`, `track: Track | null`, `level: SkillLevel | null`, `category: Category | null`; không còn `welcomeMessage`, `congratsMessage`.

- [ ] **Step 1: Kiểm không còn code dùng 2 cột sắp drop**

```bash
cd back-end && grep -rn "welcomeMessage\|congratsMessage" src test ../it-course-platform/src
```

Expected: không ra dòng nào (đã kiểm lúc viết plan; chỉ còn trong `schema.prisma`, `schema-database.md`, spec/plan cũ — tài liệu lịch sử, không sửa).

- [ ] **Step 2: Sửa `schema.prisma`**

Trong `model Course`, thay khối

```prisma
  categoryId           String       @db.Uuid
  track                Track
  level                SkillLevel
```

bằng

```prisma
  // Nháp được để trống (spec 2026-09-30-course-create-basics C2); checklist gửi duyệt bắt buộc đủ.
  categoryId           String?       @db.Uuid
  track                Track?
  level                SkillLevel?
```

Thay khối

```prisma
  // Trang "Học viên mục tiêu" + "Tin nhắn khoá học" của Udemy. Độ dài/số mục kiểm lúc gửi duyệt (service).
  learningObjectives String[] @default([]) // ≥4 mục, ≤160 ký tự/mục
  requirements       String[] @default([]) // ≥1
  targetAudience     String[] @default([]) // ≥1
  welcomeMessage     String? // ≤1000
  congratsMessage    String? // ≤1000
  qaEnabled          Boolean  @default(true)
```

bằng

```prisma
  // Trang "Học viên mục tiêu" của Udemy. Độ dài/số mục kiểm lúc gửi duyệt (service).
  // Bỏ trang "Tin nhắn khoá học" → không có welcomeMessage/congratsMessage (spec course-create-basics C7).
  learningObjectives String[] @default([]) // ≥4 mục, ≤160 ký tự/mục
  requirements       String[] @default([]) // ≥1
  targetAudience     String[] @default([]) // ≥1
  qaEnabled          Boolean  @default(true)
```

Thay dòng relation

```prisma
  category      Category          @relation(fields: [categoryId], references: [id], onDelete: Restrict)
```

bằng

```prisma
  category      Category?         @relation(fields: [categoryId], references: [id], onDelete: Restrict)
```

```bash
pnpm prisma format && pnpm db:generate
```

Expected: `Formatted ...`, `✔ Generated Prisma Client`.

- [ ] **Step 3: Sinh migration từ DB thật (chưa áp dụng)**

```bash
f=prisma/migrations/$(date -u +%Y%m%d%H%M%S)_course_draft_nullable/migration.sql; mkdir -p "$(dirname "$f")"
pnpm prisma migrate diff \
  --from-url "$(node --env-file=.env -e 'process.stdout.write(process.env.DIRECT_URL)')" \
  --to-schema-datamodel prisma/schema.prisma --script > "$f"
echo "$f"; cat "$f"; ls prisma/migrations | tail -3
```

Expected: thư mục mới đứng **cuối** danh sách (sau `20260930095907_exercise_languages_not_null`; nếu không, đổi tên thư mục với timestamp lớn hơn). Nội dung gồm 3 dòng `DROP INDEX "uq_sections_position"` / `"uq_items_position"` / `"uq_questions_position"` (drift đã biết) và:

```sql
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "congratsMessage",
DROP COLUMN "welcomeMessage",
ALTER COLUMN "categoryId" DROP NOT NULL,
ALTER COLUMN "track" DROP NOT NULL,
ALTER COLUMN "level" DROP NOT NULL;
```

- [ ] **Step 4: Dọn migration**

Mở file, xoá 3 dòng `DROP INDEX ... uq_*_position` (và comment `-- DropIndex` đi kèm). Nếu còn câu lệnh nào khác ngoài `ALTER TABLE "courses"` ở trên (vd động tới `idx_courses_embedding`, `uq_course_primary_topic`, `chk_*`, `mv_*`) → xoá luôn và ghi lại để báo sếp. Kiểm:

```bash
f=$(ls -d prisma/migrations/*_course_draft_nullable | tail -1)/migration.sql
grep -c "uq_\|idx_\|chk_\|mv_" "$f" || true; cat "$f"
```

Expected: grep in `0`; file chỉ còn khối `ALTER TABLE "courses"`.

- [ ] **Step 5: DỪNG — báo sếp chạy deploy, chờ xác nhận**

Báo sếp: "Migration `<tên thư mục>` đã sẵn sàng (nội dung như trên). Sếp chạy giúp em `cd back-end && pnpm db:deploy`." **Không tự chạy.** Chờ sếp xác nhận đã chạy xong (`All migrations have been successfully applied.`) rồi mới làm Step 6.

- [ ] **Step 6: Kiểm schema và DB khớp (chỉ đọc)**

```bash
pnpm prisma migrate diff \
  --from-url "$(node --env-file=.env -e 'process.stdout.write(process.env.DIRECT_URL)')" \
  --to-schema-datamodel prisma/schema.prisma --script
```

Expected: chỉ còn 3 dòng `DROP INDEX uq_*_position` (drift đã biết), **không** có gì về `courses`.

- [ ] **Step 7: Typecheck + test e2e cũ vẫn xanh**

```bash
pnpm exec tsc --noEmit -p tsconfig.json; pnpm vitest run --config ./vitest.config.e2e.ts test/udemy-curriculum.e2e-spec.ts test/taxonomy.e2e-spec.ts
```

Expected: `tsc` chỉ còn lỗi baseline ở `src/sentry-redact.spec.ts`; 2 file test PASS (fixture vẫn truyền `categoryId/track/level`, không vỡ khi các cột thành optional).

- [ ] **Step 8: Đồng bộ `schema-database.md` §4 từ `schema.prisma`** (chạy từ gốc repo)

```bash
cd .. && node -e '
const fs = require("fs");
const doc = fs.readFileSync("schema-database.md", "utf8");
const schema = fs.readFileSync("back-end/prisma/schema.prisma", "utf8").trimEnd();
const open = "## 4. Prisma schema\n\n```prisma\n";
const start = doc.indexOf(open) + open.length;
const end = doc.indexOf("\n```\n", start);
if (start < open.length || end < 0) throw new Error("Không tìm thấy khối prisma §4");
fs.writeFileSync("schema-database.md", doc.slice(0, start) + schema + doc.slice(end));'
diff <(awk '/^## 4. Prisma schema/{f=1;next} f&&/^```prisma/{p=1;next} p&&/^```$/{exit} p' schema-database.md) back-end/prisma/schema.prisma && echo SYNC-OK
grep -n "welcomeMessage" schema-database.md || true
```

Expected: `SYNC-OK`; grep không ra dòng nào.

---

### Task 2: Nền validation zod (`ZodValidationPipe`)

**Files:**
- Modify: `back-end/package.json` (dependency `zod`)
- Create: `back-end/src/common/zod.pipe.ts`, `back-end/src/common/zod.pipe.spec.ts`

**Interfaces:**
- Produces: `class ZodValidationPipe<T extends z.ZodType>` (`new ZodValidationPipe(schema)`, trả `z.output<T>`); `validationError(errors: FieldError[]): BadRequestException`; `type FieldError = { path: string[]; message: string }`. Body lỗi: `{ statusCode: 400, message: 'Dữ liệu không hợp lệ', errors: FieldError[] }`. Import module này bật `z.config(z.locales.vi())` (message mặc định tiếng Việt).

- [ ] **Step 1: Cài zod**

```bash
cd back-end && pnpm add zod@^4
```

Expected: `package.json` có `"zod": "^4.x"` trong `dependencies`.

- [ ] **Step 2: Viết test (fail)**

`back-end/src/common/zod.pipe.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { type FieldError, validationError, ZodValidationPipe } from './zod.pipe.js';

type Body = { statusCode: number; message: string; errors: FieldError[] };
const bodyOf = (fn: () => unknown): Body => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    return (e as BadRequestException).getResponse() as Body;
  }
  throw new Error('không ném lỗi');
};

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({ name: z.string().trim().min(1), tags: z.array(z.string().max(3)) }).strict(),
  );

  it('hợp lệ → trả dữ liệu đã parse (có trim)', () => {
    expect(pipe.transform({ name: '  a ', tags: [] })).toEqual({ name: 'a', tags: [] });
  });

  it('sai → 400, path là mảng chuỗi, message tiếng Việt mặc định', () => {
    const body = bodyOf(() => pipe.transform({ name: ' ', tags: ['abcd'] }));
    expect(body).toMatchObject({ statusCode: 400, message: 'Dữ liệu không hợp lệ' });
    expect(body.errors.map((e) => e.path)).toEqual([['name'], ['tags', '0']]);
    expect(body.errors[0].message).toMatch(/^Quá nhỏ/);
  });

  it('validationError dựng cùng body cho lỗi do service tự kiểm', () => {
    const body = validationError([{ path: ['categoryId'], message: 'x' }]).getResponse();
    expect(body).toEqual({
      statusCode: 400,
      message: 'Dữ liệu không hợp lệ',
      errors: [{ path: ['categoryId'], message: 'x' }],
    });
  });
});
```

```bash
pnpm vitest run src/common/zod.pipe.spec.ts
```

Expected: FAIL (`Cannot find module './zod.pipe.js'` / không resolve được).

- [ ] **Step 3: Viết pipe**

`back-end/src/common/zod.pipe.ts`:

```ts
import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

// Message mặc định tiếng Việt cho mọi schema (config toàn cục, áp dụng lúc parse).
// Schema nào cần câu chữ riêng thì tự truyền message.
z.config(z.locales.vi());

export type FieldError = { path: string[]; message: string };

// Body 400 chung của API nghiệp vụ (spec course-create-basics §4.3). Service dùng lại cho
// lỗi chỉ kiểm được bằng DB (vd categoryId không tồn tại).
export function validationError(errors: FieldError[]) {
  return new BadRequestException({ statusCode: 400, message: 'Dữ liệu không hợp lệ', errors });
}

// Dùng ở tham số: @Body(new ZodValidationPipe(schema)), @Query(new ZodValidationPipe(schema)).
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    throw validationError(
      result.error.issues.map((i) => ({ path: i.path.map(String), message: i.message })),
    );
  }
}
```

- [ ] **Step 4: Chạy test, xác nhận pass**

```bash
pnpm vitest run src/common/zod.pipe.spec.ts
```

Expected: 3 test PASS.

---

### Task 3: `slugify` + checklist (hàm thuần)

**Files:**
- Create: `back-end/src/instructor-courses/slugify.ts`, `slugify.spec.ts`
- Create: `back-end/src/instructor-courses/course-checklist.ts`, `course-checklist.spec.ts`

**Interfaces:**
- Produces: `slugify(text: string): string`; `courseSlug(title: string): string` (`<slug>-<6 ký tự [a-z0-9]>`); `countWords(s: string | null): number`; `buildChecklist(input: ChecklistInput): ChecklistItem[]` (thứ tự `goals`, `curriculum`, `basics`); hằng `MIN_OBJECTIVES = 4`, `MIN_DESCRIPTION_WORDS = 200`, `MIN_PUBLISHED_LECTURES = 5`, `MIN_VIDEO_MINUTES = 30`; types `ChecklistKey`, `ChecklistItem`, `ChecklistInput`.

- [ ] **Step 1: Viết test slugify (fail)**

`back-end/src/instructor-courses/slugify.spec.ts`:

```ts
import { courseSlug, slugify } from './slugify.js';

describe('slugify', () => {
  it('bỏ dấu tiếng Việt, kể cả đ/Đ', () => {
    expect(slugify('Lập trình ReactJS từ A đến Z')).toBe('lap-trinh-reactjs-tu-a-den-z');
    expect(slugify('Đường đi của dữ liệu')).toBe('duong-di-cua-du-lieu');
  });

  it('ký tự đặc biệt thành một gạch, không có gạch ở đầu/cuối', () => {
    expect(slugify('  C++ & Node.js!!  ')).toBe('c-node-js');
    expect(slugify('!!!')).toBe('');
  });

  it('dài > 60 → cắt còn ≤ 60, không kết thúc bằng gạch', () => {
    expect(slugify('a'.repeat(100))).toBe('a'.repeat(60));
    expect(slugify(`${'a'.repeat(59)} bcd`)).toBe('a'.repeat(59));
  });
});

describe('courseSlug', () => {
  it('slug + hậu tố 6 ký tự [a-z0-9], mỗi lần một khác', () => {
    const a = courseSlug('Lập trình React');
    expect(a).toMatch(/^lap-trinh-react-[a-z0-9]{6}$/);
    expect(courseSlug('Lập trình React')).not.toBe(a);
  });

  it('tiêu đề không còn ký tự hợp lệ → chỉ hậu tố', () => {
    expect(courseSlug('!!!')).toMatch(/^[a-z0-9]{6}$/);
  });
});
```

```bash
cd back-end && pnpm vitest run src/instructor-courses/slugify.spec.ts
```

Expected: FAIL (không tìm thấy `./slugify.js`).

- [ ] **Step 2: Viết slugify**

`back-end/src/instructor-courses/slugify.ts`:

```ts
import { randomBytes } from 'node:crypto';

// "Lập trình C++ cơ bản" → "lap-trinh-c-co-ban". đ/Đ không tách dấu bằng NFD nên thay tay.
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// Hậu tố ngẫu nhiên để hai khoá cùng tên không đụng nhau; slug không đổi khi sửa tiêu đề (spec §4.1).
export function courseSlug(title: string): string {
  const suffix = Array.from(randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');
  const base = slugify(title);
  return base ? `${base}-${suffix}` : suffix;
}
```

```bash
pnpm vitest run src/instructor-courses/slugify.spec.ts
```

Expected: 5 test PASS.

- [ ] **Step 3: Viết test checklist (fail)**

`back-end/src/instructor-courses/course-checklist.spec.ts`:

```ts
import {
  buildChecklist,
  type ChecklistInput,
  countWords,
  MIN_DESCRIPTION_WORDS,
  MIN_OBJECTIVES,
  MIN_PUBLISHED_LECTURES,
  MIN_VIDEO_MINUTES,
} from './course-checklist.js';

const complete: ChecklistInput = {
  title: 'React',
  subtitle: 'Từ số 0',
  description: 'từ '.repeat(200),
  level: 'beginner',
  track: 'frontend',
  thumbnailUrl: 'https://cdn.example.com/t.png',
  learningObjectives: ['a', 'b', 'c', 'd'],
  requirements: ['r'],
  targetAudience: ['t'],
  hasPrimaryTopic: true,
  categoryDepth: 2,
  publishedLectureCount: 5,
  videoSeconds: 30 * 60,
};

const empty: ChecklistInput = {
  title: 'React',
  subtitle: null,
  description: null,
  level: null,
  track: null,
  thumbnailUrl: null,
  learningObjectives: [],
  requirements: [],
  targetAudience: [],
  hasPrimaryTopic: false,
  categoryDepth: null,
  publishedLectureCount: 0,
  videoSeconds: 0,
};

const byKey = (input: ChecklistInput) =>
  Object.fromEntries(buildChecklist(input).map((i) => [i.key, i]));

describe('countWords', () => {
  it('rỗng / null / chỉ khoảng trắng → 0', () => {
    expect(countWords(null)).toBe(0);
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t ')).toBe(0);
  });
  it('nhiều khoảng trắng liên tiếp không sinh từ rỗng', () => {
    expect(countWords('  một   hai\n\tba  ')).toBe(3);
  });
});

describe('buildChecklist', () => {
  it('hằng số ngưỡng (đợt 4 dùng lại khi gửi duyệt)', () => {
    expect([MIN_OBJECTIVES, MIN_DESCRIPTION_WORDS, MIN_PUBLISHED_LECTURES, MIN_VIDEO_MINUTES]).toEqual([
      4, 200, 5, 30,
    ]);
  });

  it('đủ điều kiện → 3 mục done, thứ tự goals, curriculum, basics', () => {
    expect(buildChecklist(complete)).toEqual([
      { key: 'goals', done: true, missing: [] },
      { key: 'curriculum', done: true, missing: [] },
      { key: 'basics', done: true, missing: [] },
    ]);
  });

  it('khoá trống → goals thiếu đủ 3 ý', () => {
    expect(byKey(empty).goals).toEqual({
      key: 'goals',
      done: false,
      missing: [
        { message: 'Cần thêm 4 mục tiêu học tập', anchor: 'objectives' },
        { message: 'Cần ít nhất 1 yêu cầu', anchor: 'requirements' },
        { message: 'Cần ít nhất 1 đối tượng học viên', anchor: 'audience' },
      ],
    });
  });

  it('khoá trống → curriculum thiếu bài giảng và phút video', () => {
    expect(byKey(empty).curriculum.missing).toEqual([
      { message: 'Cần thêm 5 bài giảng đã xuất bản', anchor: 'curriculum' },
      { message: 'Cần thêm 30 phút video', anchor: 'curriculum' },
    ]);
  });

  it('khoá trống → basics thiếu đủ 7 ý theo đúng thứ tự', () => {
    expect(byKey(empty).basics.missing).toEqual([
      { message: 'Thiếu phụ đề', anchor: 'subtitle' },
      { message: 'Mô tả còn thiếu 200 từ', anchor: 'description' },
      { message: 'Chưa chọn cấp độ', anchor: 'level' },
      { message: 'Chưa chọn track', anchor: 'track' },
      { message: 'Chưa chọn thể loại con', anchor: 'category' },
      { message: 'Chưa chọn chủ đề chính', anchor: 'topic' },
      { message: 'Chưa có ảnh bìa', anchor: 'thumbnail' },
    ]);
  });

  it('sát ngưỡng: thiếu đúng 1', () => {
    const c = byKey({
      ...complete,
      learningObjectives: ['a', 'b', 'c'],
      description: 'từ '.repeat(199),
      publishedLectureCount: 4,
      videoSeconds: 30 * 60 - 1,
    });
    expect(c.goals.missing).toEqual([{ message: 'Cần thêm 1 mục tiêu học tập', anchor: 'objectives' }]);
    expect(c.basics.missing).toEqual([{ message: 'Mô tả còn thiếu 1 từ', anchor: 'description' }]);
    expect(c.curriculum.missing).toEqual([
      { message: 'Cần thêm 1 bài giảng đã xuất bản', anchor: 'curriculum' },
      { message: 'Cần thêm 1 phút video', anchor: 'curriculum' },
    ]);
  });

  it('category cấp 1 không tính; phụ đề chỉ khoảng trắng coi như thiếu', () => {
    const c = byKey({ ...complete, categoryDepth: 1, subtitle: '   ' });
    expect(c.basics.done).toBe(false);
    expect(c.basics.missing.map((m) => m.anchor)).toEqual(['subtitle', 'category']);
  });
});
```

```bash
pnpm vitest run src/instructor-courses/course-checklist.spec.ts
```

Expected: FAIL (không tìm thấy `./course-checklist.js`).

- [ ] **Step 4: Viết checklist**

`back-end/src/instructor-courses/course-checklist.ts`:

```ts
// Checklist "đã sẵn sàng gửi duyệt" (spec course-create-basics §4.4). Hàm thuần: đợt 4 dùng lại
// khi gửi duyệt. Định giá/khuyến mại thêm ở đợt 4.
export const MIN_OBJECTIVES = 4;
export const MIN_DESCRIPTION_WORDS = 200;
export const MIN_PUBLISHED_LECTURES = 5;
export const MIN_VIDEO_MINUTES = 30;

export type ChecklistKey = 'goals' | 'curriculum' | 'basics';
export type ChecklistMissing = { message: string; anchor: string };
export type ChecklistItem = { key: ChecklistKey; done: boolean; missing: ChecklistMissing[] };

export type ChecklistInput = {
  title: string;
  subtitle: string | null;
  description: string | null;
  level: string | null;
  track: string | null;
  thumbnailUrl: string | null;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  hasPrimaryTopic: boolean;
  categoryDepth: 1 | 2 | null;
  publishedLectureCount: number;
  videoSeconds: number;
};

export function countWords(text: string | null): number {
  return (text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

const item = (key: ChecklistKey, missing: ChecklistMissing[]): ChecklistItem => ({
  key,
  done: missing.length === 0,
  missing,
});

export function buildChecklist(c: ChecklistInput): ChecklistItem[] {
  const goals: ChecklistMissing[] = [];
  if (c.learningObjectives.length < MIN_OBJECTIVES)
    goals.push({
      message: `Cần thêm ${MIN_OBJECTIVES - c.learningObjectives.length} mục tiêu học tập`,
      anchor: 'objectives',
    });
  if (c.requirements.length < 1) goals.push({ message: 'Cần ít nhất 1 yêu cầu', anchor: 'requirements' });
  if (c.targetAudience.length < 1)
    goals.push({ message: 'Cần ít nhất 1 đối tượng học viên', anchor: 'audience' });

  const curriculum: ChecklistMissing[] = [];
  if (c.publishedLectureCount < MIN_PUBLISHED_LECTURES)
    curriculum.push({
      message: `Cần thêm ${MIN_PUBLISHED_LECTURES - c.publishedLectureCount} bài giảng đã xuất bản`,
      anchor: 'curriculum',
    });
  const minVideoSeconds = MIN_VIDEO_MINUTES * 60;
  if (c.videoSeconds < minVideoSeconds)
    curriculum.push({
      message: `Cần thêm ${Math.ceil((minVideoSeconds - c.videoSeconds) / 60)} phút video`,
      anchor: 'curriculum',
    });

  // Tiêu đề luôn có (tạo/PATCH đều bắt 1–60 ký tự) nên không có dòng "thiếu tiêu đề".
  const basics: ChecklistMissing[] = [];
  if (!c.subtitle?.trim()) basics.push({ message: 'Thiếu phụ đề', anchor: 'subtitle' });
  const words = countWords(c.description);
  if (words < MIN_DESCRIPTION_WORDS)
    basics.push({ message: `Mô tả còn thiếu ${MIN_DESCRIPTION_WORDS - words} từ`, anchor: 'description' });
  if (!c.level) basics.push({ message: 'Chưa chọn cấp độ', anchor: 'level' });
  if (!c.track) basics.push({ message: 'Chưa chọn track', anchor: 'track' });
  if (c.categoryDepth !== 2) basics.push({ message: 'Chưa chọn thể loại con', anchor: 'category' });
  if (!c.hasPrimaryTopic) basics.push({ message: 'Chưa chọn chủ đề chính', anchor: 'topic' });
  if (!c.thumbnailUrl) basics.push({ message: 'Chưa có ảnh bìa', anchor: 'thumbnail' });

  return [item('goals', goals), item('curriculum', curriculum), item('basics', basics)];
}
```

- [ ] **Step 5: Chạy test, xác nhận pass**

```bash
pnpm vitest run src/instructor-courses/
```

Expected: 2 file, 14 test PASS.

---

### Task 4: `id` trong cây danh mục + `GET /api/topics`

**Files:**
- Modify: `back-end/src/categories/categories.service.ts`
- Create: `back-end/src/topics/topics.controller.ts`, `back-end/src/topics/topics.module.ts`
- Modify: `back-end/src/app.module.ts`
- Test: `back-end/test/categories.e2e-spec.ts`

**Interfaces:**
- Consumes: `ZodValidationPipe` (Task 2), `PrismaService`, `@Public()`.
- Produces: `CategoryNode = { id, slug, name, children: SubcategoryNode[] }`, `SubcategoryNode = { id, slug, name, topics: TopicLink[] }`, `TopicLink = { id, slug, name }`; `GET /api/topics?q=&limit=` (public) → `{ id, slug, name }[]`, `q` trim 1–50, `limit` 1–20 mặc định 10, sai → 400 body chuẩn.

- [ ] **Step 1: Sửa test cây + thêm test topics (fail)**

Trong `back-end/test/categories.e2e-spec.ts`, describe `GET /api/categories/tree`:

- thay `expect(Object.keys(tree[0]).sort()).toEqual(['children', 'name', 'slug']);` bằng `expect(Object.keys(tree[0]).sort()).toEqual(['children', 'id', 'name', 'slug']);`
- thay `expect(Object.keys(dev.children[0]).sort()).toEqual(['name', 'slug', 'topics']);` bằng `expect(Object.keys(dev.children[0]).sort()).toEqual(['id', 'name', 'slug', 'topics']);`
- thay `expect(web.topics[0]).toEqual({ slug: 'javascript', name: 'JavaScript' });` bằng

```ts
    const js = await prisma.topic.findUniqueOrThrow({ where: { slug: 'javascript' } });
    expect(web.topics[0]).toEqual({ id: js.id, slug: 'javascript', name: 'JavaScript' });
    expect(web.id).toBe((await prisma.category.findUniqueOrThrow({ where: { slug: 'web-development' } })).id);
```

Thêm cuối file:

```ts
describe('GET /api/topics', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
  });
  afterAll(() => app.close());

  it('public, tìm theo tên không phân biệt hoa thường, mặc định ≤ 10', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/topics?q=JAVA').expect(200);
    const topics = body as { id: string; slug: string; name: string }[];
    expect(topics.length).toBeGreaterThan(0);
    expect(topics.length).toBeLessThanOrEqual(10);
    for (const t of topics) {
      expect(Object.keys(t).sort()).toEqual(['id', 'name', 'slug']);
      expect(t.name.toLowerCase()).toContain('java');
    }
  });

  it('limit giới hạn số kết quả', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/topics?q=a&limit=2').expect(200);
    expect(body).toHaveLength(2);
  });

  it('q rỗng / thiếu, limit ngoài 1–20 → 400 có path', async () => {
    const res = await request(app.getHttpServer()).get('/api/topics?q=%20').expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, message: 'Dữ liệu không hợp lệ' });
    expect(res.body.errors[0].path).toEqual(['q']);
    await request(app.getHttpServer()).get('/api/topics').expect(400);
    const bad = await request(app.getHttpServer()).get('/api/topics?q=a&limit=21').expect(400);
    expect(bad.body.errors[0].path).toEqual(['limit']);
  });
});
```

```bash
cd back-end && pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts
```

Expected: 2 test cây FAIL (thiếu `id`), 3 test topics FAIL (401 do guard global hoặc 404).

- [ ] **Step 2: Thêm `id` vào cây**

Thay toàn bộ `back-end/src/categories/categories.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';

// id để FE gửi PATCH categoryId/primaryTopicId (spec course-create-basics C10). Chỉ thêm trường.
export type TopicLink = { id: string; slug: string; name: string };
export type SubcategoryNode = { id: string; slug: string; name: string; topics: TopicLink[] };
export type CategoryNode = { id: string; slug: string; name: string; children: SubcategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Một query: cấp 1 → cấp 2 → topic phổ biến, cả ba sắp theo position.
  async tree(): Promise<CategoryNode[]> {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        children: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            slug: true,
            name: true,
            popularTopics: {
              orderBy: { position: 'asc' },
              select: { topic: { select: { id: true, slug: true, name: true } } },
            },
          },
        },
      },
    });
    return roots.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      children: r.children.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        topics: c.popularTopics.map((p) => p.topic),
      })),
    }));
  }
}
```

- [ ] **Step 3: Module topics**

`back-end/src/topics/topics.controller.ts`:

```ts
import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';

const searchQuery = z.object({
  q: z.string().trim().min(1).max(50),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

// Ô "Chủ đề chính" ở trang tổng quan (spec course-create-basics §4.1). ILIKE dùng được
// index idx_topics_name_trgm (gin_trgm_ops).
@Public()
@Controller('topics')
export class TopicsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  search(@Query(new ZodValidationPipe(searchQuery)) query: z.output<typeof searchQuery>) {
    return this.prisma.topic.findMany({
      where: { name: { contains: query.q, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: query.limit,
      select: { id: true, slug: true, name: true },
    });
  }
}
```

`back-end/src/topics/topics.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller.js';

@Module({ controllers: [TopicsController] })
export class TopicsModule {}
```

Sửa `back-end/src/app.module.ts`: thêm `import { TopicsModule } from './topics/topics.module.js';` (xếp theo alphabet sau import `InfraModule`) và đổi `imports` thành

```ts
  imports: [SentryModule.forRoot(), InfraModule, AuthModule, CategoriesModule, TopicsModule],
```

- [ ] **Step 4: Chạy test, xác nhận pass**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts && pnpm exec tsc --noEmit -p tsconfig.json
```

Expected: toàn bộ test trong file PASS (4 seed + 3 cây + 3 topics); `tsc` chỉ còn lỗi baseline.

---

### Task 5: `POST /api/me/become-instructor`

**Files:**
- Modify: `back-end/src/auth/me.controller.ts`
- Create: `back-end/test/instructor-courses.e2e-spec.ts` (khung + test become-instructor; Task 6 thêm tiếp)

**Interfaces:**
- Consumes: `AUTH` (provider trong `AuthModule`, cùng module với `MeController`), `Auth['$context']` → `internalAdapter.updateUser(userId, data): Promise<User>` (better-auth 1.7.6: ghi DB rồi `refreshUserSessions` ghi lại `{session, user}` của mọi session active trong Redis).
- Produces: `POST /api/me/become-instructor` → `200` user (role dạng `student,instructor`; role null → `instructor`; đã có thì trả nguyên, idempotent). Trong e2e: biến `alice` (vừa bật vai trò), `bob` (`student,instructor`), `student`, helper `call(method, path, cookie?)`, `prisma`.

- [ ] **Step 1: Viết khung e2e + test (fail)**

`back-end/test/instructor-courses.e2e-spec.ts`:

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
// Rate limit của Better Auth nằm ở Redis, sống qua các lần chạy → mỗi request một IP (xem auth.e2e-spec).
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;

type TestUser = { id: string; cookie: string };

describe('Instructor courses (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const emails: string[] = [];
  let alice: TestUser; // học viên, tự bật vai trò qua become-instructor
  let bob: TestUser; // giảng viên khác
  let student: TestUser;

  const call = (method: 'get' | 'post' | 'patch', path: string, cookie?: string) => {
    const r = request(app.getHttpServer())
      [method](path)
      .set('Origin', FE_URL)
      .set('X-Forwarded-For', randomIp());
    return cookie ? r.set('Cookie', cookie) : r;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  // Đăng ký → đánh dấu đã xác minh (+ role) thẳng DB trước khi có session → đăng nhập.
  const makeUser = async (role = 'student'): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email').send({ name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
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
    [alice, bob, student] = await Promise.all([makeUser(), makeUser('student,instructor'), makeUser()]);
  });

  // Dọn: course trước (FK instructor Restrict; section/item/course_topics cascade), user sau.
  afterAll(async () => {
    const ids = [alice, bob, student].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  describe('POST /api/me/become-instructor', () => {
    it('chưa đăng nhập → 401', () => call('post', '/api/me/become-instructor').expect(401));

    it('gọi 2 lần → role chứa instructor đúng một lần; /api/me thấy ngay (cache Redis được làm mới)', async () => {
      await call('post', '/api/me/become-instructor', alice.cookie).expect(200);
      const res = await call('post', '/api/me/become-instructor', alice.cookie).expect(200);
      expect(res.body.role).toBe('student,instructor');
      const me = await call('get', '/api/me', alice.cookie).expect(200);
      expect(me.body.role).toBe('student,instructor');
      const db = await prisma.user.findUniqueOrThrow({ where: { id: alice.id } });
      expect(db.role).toBe('student,instructor');
    });
  });
});
```

```bash
cd back-end && pnpm vitest run --config ./vitest.config.e2e.ts test/instructor-courses.e2e-spec.ts
```

Expected: test "gọi 2 lần" FAIL với 404 (route chưa có); test 401 PASS (guard global chạy trước khi Nest trả 404 cho route lạ không có — nếu ra 404 thay vì 401 cũng chấp nhận ở bước này, sẽ PASS sau Step 2).

- [ ] **Step 2: Endpoint**

Thay toàn bộ `back-end/src/auth/me.controller.ts`:

```ts
import { Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import { AUTH, type Auth, type AuthSession } from './auth.js';
import { CurrentUser } from './decorators.js';

@Controller('me')
export class MeController {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  @Get()
  me(@CurrentUser() user: AuthSession['user']) {
    return user;
  }

  // Học viên tự bật vai trò giảng viên (spec course-create-basics C6). Phải ghi qua
  // internalAdapter: nó refresh cache {session, user} trong Redis (secondaryStorage).
  // Ghi thẳng prisma.user thì guard vẫn đọc role cũ → 403. admin.setRole đòi quyền admin.
  @Post('become-instructor')
  @HttpCode(200)
  async becomeInstructor(@CurrentUser() user: AuthSession['user']) {
    const roles = user.role?.split(',').filter(Boolean) ?? [];
    if (roles.includes('instructor')) return user;
    const ctx = await this.auth.$context;
    return ctx.internalAdapter.updateUser(user.id, { role: [...roles, 'instructor'].join(',') });
  }
}
```

- [ ] **Step 3: Chạy test, xác nhận pass**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/instructor-courses.e2e-spec.ts test/auth.e2e-spec.ts && pnpm exec tsc --noEmit -p tsconfig.json
```

Expected: 2 test mới + 10 test auth PASS; `tsc` chỉ còn lỗi baseline.

---

### Task 6: Module `instructor-courses`

**Files:**
- Create: `back-end/src/instructor-courses/instructor-courses.schemas.ts`, `instructor-courses.service.ts`, `instructor-courses.controller.ts`, `instructor-courses.module.ts`
- Modify: `back-end/src/app.module.ts`
- Test: `back-end/test/instructor-courses.e2e-spec.ts` (thêm)

**Interfaces:**
- Consumes: `ZodValidationPipe`, `validationError` (Task 2); `courseSlug` (Task 3); `buildChecklist`, `countWords`, `ChecklistItem` (Task 3); `@Roles`, `@CurrentUser` (`src/auth/decorators.ts`); khung e2e (Task 5).
- Produces (mọi route `@Roles('instructor')`, prefix `/api/instructor/courses`):
  - `POST /` `{ title }` → `201 { id }` (transaction: course draft + section 1 "Giới thiệu" + lecture 1 "Giới thiệu").
  - `GET /` → `{ id, title, status, thumbnailUrl, updatedAt, progress: { done, total } }[]`, `updatedAt DESC`, chỉ khoá của mình.
  - `GET /:id` → `CourseDetail` (spec §4.2); không phải chủ / không tồn tại / id sai định dạng → 404.
  - `PATCH /:id` body §4.3 (strict, mọi trường optional) → `CourseDetail`; `in_review` → `409 { statusCode: 409, code: 'COURSE_LOCKED', message }`; `categoryId` cấp 1/không tồn tại → 400 `path ['categoryId']`; `primaryTopicId` không tồn tại → 400 `path ['primaryTopicId']`.

- [ ] **Step 1: Viết test (fail)**

Trong `back-end/test/instructor-courses.e2e-spec.ts`, thêm cuối describe `'POST /api/me/become-instructor'` (sau test "gọi 2 lần"):

```ts
    it('ngay sau đó, cùng cookie → GET /api/instructor/courses 200 (guard thấy role mới)', () =>
      call('get', '/api/instructor/courses', alice.cookie).expect(200));
```

Thêm describe mới ngay sau describe đó (vẫn trong describe ngoài cùng):

```ts
  describe('/api/instructor/courses', () => {
    let courseId: string;
    const url = () => `/api/instructor/courses/${courseId}`;
    const primaryRows = () =>
      prisma.courseTopic.findMany({ where: { courseId, isPrimary: true }, select: { topicId: true } });
    type Err = { path: string[]; message: string };

    it('học viên → 403', () => call('get', '/api/instructor/courses', student.cookie).expect(403));

    it('tạo khoá → 201 {id}; DB có section + lecture mặc định, slug từ tiêu đề', async () => {
      const res = await call('post', '/api/instructor/courses', alice.cookie)
        .send({ title: '  Lập trình React cơ bản ' })
        .expect(201);
      expect(Object.keys(res.body)).toEqual(['id']);
      courseId = res.body.id;
      const course = await prisma.course.findUniqueOrThrow({
        where: { id: courseId },
        include: { sections: { include: { items: true } } },
      });
      expect(course).toMatchObject({
        title: 'Lập trình React cơ bản',
        status: 'draft',
        instructorId: alice.id,
        categoryId: null,
        track: null,
        level: null,
      });
      expect(course.slug).toMatch(/^lap-trinh-react-co-ban-[a-z0-9]{6}$/);
      expect(course.sections).toHaveLength(1);
      expect(course.sections[0]).toMatchObject({ title: 'Giới thiệu', position: 1 });
      expect(course.sections[0].items).toHaveLength(1);
      expect(course.sections[0].items[0]).toMatchObject({
        courseId,
        type: 'lecture',
        title: 'Giới thiệu',
        position: 1,
        isPublished: false,
        lectureKind: null,
      });
    });

    it('tên chỉ có khoảng trắng / quá 60 ký tự → 400 path title', async () => {
      const res = await call('post', '/api/instructor/courses', alice.cookie).send({ title: '   ' }).expect(400);
      expect(res.body).toMatchObject({ statusCode: 400, message: 'Dữ liệu không hợp lệ' });
      expect((res.body.errors as Err[]).map((e) => e.path)).toEqual([['title']]);
      await call('post', '/api/instructor/courses', alice.cookie).send({ title: 'x'.repeat(61) }).expect(400);
    });

    it('danh sách chỉ có khoá của mình, kèm progress', async () => {
      const other = await call('post', '/api/instructor/courses', bob.cookie).send({ title: 'Khoá của Bob' }).expect(201);
      const { body } = await call('get', '/api/instructor/courses', alice.cookie).expect(200);
      const list = body as { id: string }[];
      expect(list.map((c) => c.id)).toContain(courseId);
      expect(list.map((c) => c.id)).not.toContain(other.body.id);
      expect(list.find((c) => c.id === courseId)).toEqual({
        id: courseId,
        title: 'Lập trình React cơ bản',
        status: 'draft',
        thumbnailUrl: null,
        updatedAt: expect.any(String),
        progress: { done: 0, total: 3 },
      });
    });

    it('GET chi tiết: đúng shape CourseDetail, checklist 3 mục', async () => {
      const { body } = await call('get', url(), alice.cookie).expect(200);
      expect(Object.keys(body).sort()).toEqual(
        [
          'id', 'slug', 'status', 'title', 'subtitle', 'description', 'language', 'level', 'track',
          'thumbnailUrl', 'promoVideoUrl', 'learningObjectives', 'requirements', 'targetAudience',
          'category', 'primaryTopic', 'updatedAt', 'checklist',
        ].sort(),
      );
      expect(body).toMatchObject({ id: courseId, language: 'vi', category: null, primaryTopic: null, learningObjectives: [] });
      expect(body.checklist.map((i: { key: string }) => i.key)).toEqual(['goals', 'curriculum', 'basics']);
      expect(body.checklist[2].missing.map((m: { anchor: string }) => m.anchor)).toEqual([
        'subtitle', 'description', 'level', 'track', 'category', 'topic', 'thumbnail',
      ]);
    });

    it('PATCH hợp lệ → CourseDetail với checklist mới; bỏ phần tử rỗng; trim', async () => {
      const { body } = await call('patch', url(), alice.cookie)
        .send({
          learningObjectives: ['Hiểu JSX', 'Viết component', '   ', 'Dùng hooks', 'Gọi API'],
          requirements: ['Biết JavaScript'],
          targetAudience: ['Người mới học React'],
          subtitle: '  Từ số 0  ',
          level: 'beginner',
          track: 'frontend',
        })
        .expect(200);
      expect(body.learningObjectives).toEqual(['Hiểu JSX', 'Viết component', 'Dùng hooks', 'Gọi API']);
      expect(body.subtitle).toBe('Từ số 0');
      expect(body.checklist[0]).toEqual({ key: 'goals', done: true, missing: [] });
      expect(body.checklist[2].missing.map((m: { anchor: string }) => m.anchor)).toEqual([
        'description', 'category', 'topic', 'thumbnail',
      ]);
      const again = await call('patch', url(), alice.cookie).send({ subtitle: '' }).expect(200);
      expect(again.body.subtitle).toBeNull();
    });

    it('PATCH sai → 400 có path cho từng trường; trường lạ bị chặn (strict)', async () => {
      const res = await call('patch', url(), alice.cookie)
        .send({ title: '', level: 'expert', learningObjectives: ['x'.repeat(161)], language: 'fr' })
        .expect(400);
      const paths = (res.body.errors as Err[]).map((e) => e.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['title', 'level', 'learningObjectives.0', 'language']));
      await call('patch', url(), alice.cookie).send({ welcomeMessage: 'hi' }).expect(400);
    });

    it('category cấp 1 / không tồn tại → 400 path categoryId; cấp 2 → OK, trả kèm parent', async () => {
      const root = await prisma.category.findFirstOrThrow({ where: { parentId: null, children: { some: {} } } });
      const leaf = await prisma.category.findFirstOrThrow({ where: { parentId: root.id } });
      const bad = await call('patch', url(), alice.cookie).send({ categoryId: root.id }).expect(400);
      expect(bad.body.errors).toEqual([{ path: ['categoryId'], message: expect.any(String) }]);
      await call('patch', url(), alice.cookie).send({ categoryId: randomUUID() }).expect(400);
      const ok = await call('patch', url(), alice.cookie).send({ categoryId: leaf.id }).expect(200);
      expect(ok.body.category).toEqual({
        id: leaf.id,
        slug: leaf.slug,
        name: leaf.name,
        parent: { id: root.id, slug: root.slug, name: root.name },
      });
      const cleared = await call('patch', url(), alice.cookie).send({ categoryId: null }).expect(200);
      expect(cleared.body.category).toBeNull();
    });

    it('đổi topic chính → luôn đúng 1 dòng isPrimary; topic đã gắn dạng không chính được nâng lên', async () => {
      const [t1, t2, t3] = await prisma.topic.findMany({ take: 3, orderBy: { slug: 'asc' } });
      await prisma.courseTopic.create({ data: { courseId, topicId: t3.id } }); // gắn sẵn, không chính

      await call('patch', url(), alice.cookie).send({ primaryTopicId: t1.id }).expect(200);
      const res = await call('patch', url(), alice.cookie).send({ primaryTopicId: t2.id }).expect(200);
      expect(res.body.primaryTopic).toEqual({ id: t2.id, slug: t2.slug, name: t2.name });
      expect(await primaryRows()).toEqual([{ topicId: t2.id }]);
      expect(await prisma.courseTopic.count({ where: { courseId, topicId: t3.id, isPrimary: false } })).toBe(1);

      await call('patch', url(), alice.cookie).send({ primaryTopicId: t3.id }).expect(200);
      expect(await primaryRows()).toEqual([{ topicId: t3.id }]);

      const bad = await call('patch', url(), alice.cookie).send({ primaryTopicId: randomUUID() }).expect(400);
      expect(bad.body.errors).toEqual([{ path: ['primaryTopicId'], message: expect.any(String) }]);

      const cleared = await call('patch', url(), alice.cookie).send({ primaryTopicId: null }).expect(200);
      expect(cleared.body.primaryTopic).toBeNull();
      expect(await primaryRows()).toEqual([]);
    });

    it('giảng viên khác / id không tồn tại / id sai định dạng → 404', async () => {
      await call('get', url(), bob.cookie).expect(404);
      await call('patch', url(), bob.cookie).send({ title: 'Cướp khoá' }).expect(404);
      await call('get', `/api/instructor/courses/${randomUUID()}`, alice.cookie).expect(404);
      await call('get', '/api/instructor/courses/abc', alice.cookie).expect(404);
    });

    it('khoá in_review → PATCH 409 COURSE_LOCKED; GET vẫn đọc được', async () => {
      await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
      const res = await call('patch', url(), alice.cookie).send({ title: 'Mới' }).expect(409);
      expect(res.body).toMatchObject({ statusCode: 409, code: 'COURSE_LOCKED' });
      await call('get', url(), alice.cookie).expect(200);
      await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
    });
  });
```

```bash
cd back-end && pnpm vitest run --config ./vitest.config.e2e.ts test/instructor-courses.e2e-spec.ts
```

Expected: các test mới FAIL với 404 (route chưa có), trừ "học viên → 403" có thể FAIL 404 tương tự.

- [ ] **Step 2: Schema zod**

`back-end/src/instructor-courses/instructor-courses.schemas.ts`:

```ts
import { SkillLevel, Track } from '@prisma/client';
import { z } from 'zod';
import { countWords } from './course-checklist.js';

// Luật PATCH theo spec course-create-basics §4.3. FE dùng cùng giới hạn.
const title = z.string().trim().min(1, 'Nhập tên khoá học').max(60, 'Tối đa 60 ký tự');
const emptyToNull = (s: string) => (s === '' ? null : s);
const stringList = z
  .array(z.string().trim().max(160, 'Tối đa 160 ký tự'))
  .max(10, 'Tối đa 10 mục')
  .transform((list) => list.filter(Boolean));

export const createCourseSchema = z.object({ title }).strict();
export type CreateCourseInput = z.output<typeof createCourseSchema>;

export const updateCourseSchema = z
  .object({
    title,
    subtitle: z.string().trim().max(120, 'Tối đa 120 ký tự').transform(emptyToNull),
    description: z
      .string()
      .trim()
      .refine((s) => countWords(s) <= 5000, 'Tối đa 5000 từ')
      .transform(emptyToNull),
    language: z.enum(['vi', 'en']),
    level: z.enum(SkillLevel).nullable(),
    track: z.enum(Track).nullable(),
    // guid: chỉ kiểm dạng 8-4-4-4-12; tồn tại/cấp 2 do service kiểm.
    categoryId: z.guid().nullable(),
    primaryTopicId: z.guid().nullable(),
    learningObjectives: stringList,
    requirements: stringList,
    targetAudience: stringList,
  })
  .partial()
  .strict();
export type UpdateCourseInput = z.output<typeof updateCourseSchema>;
```

- [ ] **Step 3: Service**

`back-end/src/instructor-courses/instructor-courses.service.ts`:

```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { type FieldError, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { buildChecklist } from './course-checklist.js';
import type { UpdateCourseInput } from './instructor-courses.schemas.js';
import { courseSlug } from './slugify.js';

const REF = { select: { id: true, slug: true, name: true } } as const;
const COURSE_SELECT = {
  id: true,
  slug: true,
  status: true,
  title: true,
  subtitle: true,
  description: true,
  language: true,
  level: true,
  track: true,
  thumbnailUrl: true,
  promoVideoUrl: true,
  learningObjectives: true,
  requirements: true,
  targetAudience: true,
  updatedAt: true,
  category: { select: { id: true, slug: true, name: true, parent: REF } },
  topics: { where: { isPrimary: true }, select: { topic: REF } },
} satisfies Prisma.CourseSelect;
type CourseRow = Prisma.CourseGetPayload<{ select: typeof COURSE_SELECT }>;
type LectureStats = { published: number; videoSeconds: number };

@Injectable()
export class InstructorCoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // Trùng slug (P2002) → sinh hậu tố mới, thử 1 lần nữa (spec §4.1). Khoá mới không đụng
  // unique nào khác nên P2002 ở đây chỉ có thể là slug.
  async create(instructorId: string, title: string): Promise<{ id: string }> {
    try {
      return await this.createOnce(instructorId, title);
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
      return this.createOnce(instructorId, title);
    }
  }

  async list(instructorId: string) {
    const courses = await this.prisma.course.findMany({
      where: { instructorId },
      orderBy: { updatedAt: 'desc' },
      select: COURSE_SELECT,
    });
    const stats = await this.lectureStats(courses.map((c) => c.id));
    return courses.map((c) => {
      const checklist = this.checklistOf(c, stats.get(c.id));
      return {
        id: c.id,
        title: c.title,
        status: c.status,
        thumbnailUrl: c.thumbnailUrl,
        updatedAt: c.updatedAt,
        progress: { done: checklist.filter((i) => i.done).length, total: checklist.length },
      };
    });
  }

  async detail(id: string, instructorId: string) {
    const course = await this.findOwned(id, instructorId);
    const stats = await this.lectureStats([course.id]);
    const { topics, ...rest } = course;
    return {
      ...rest,
      primaryTopic: topics[0]?.topic ?? null,
      checklist: this.checklistOf(course, stats.get(course.id)),
    };
  }

  async update(id: string, instructorId: string, body: UpdateCourseInput) {
    const course = await this.findOwned(id, instructorId);
    if (course.status === 'in_review') {
      throw new ConflictException({
        statusCode: 409,
        code: 'COURSE_LOCKED',
        message: 'Khoá học đang chờ duyệt, không sửa được',
      });
    }
    const { primaryTopicId, ...fields } = body;

    const errors: FieldError[] = [];
    if (fields.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: fields.categoryId },
        select: { parentId: true },
      });
      if (!category?.parentId) errors.push({ path: ['categoryId'], message: 'Hãy chọn một thể loại con' });
    }
    if (primaryTopicId) {
      const topic = await this.prisma.topic.findUnique({ where: { id: primaryTopicId }, select: { id: true } });
      if (!topic) errors.push({ path: ['primaryTopicId'], message: 'Chủ đề không tồn tại' });
    }
    if (errors.length) throw validationError(errors);

    await this.prisma.$transaction(async (tx) => {
      // updatedAt gán tay: PATCH chỉ đổi topic chính cũng phải đẩy khoá lên đầu danh sách.
      await tx.course.update({ where: { id }, data: { ...fields, updatedAt: new Date() } });
      if (primaryTopicId === undefined) return;
      // Tối đa 1 isPrimary/khoá (uq_course_primary_topic): xoá dòng chính cũ trước, rồi upsert
      // vì topic mới có thể đã gắn dạng không chính (PK courseId + topicId).
      await tx.courseTopic.deleteMany({
        where: { courseId: id, isPrimary: true, ...(primaryTopicId ? { topicId: { not: primaryTopicId } } : {}) },
      });
      if (primaryTopicId) {
        await tx.courseTopic.upsert({
          where: { courseId_topicId: { courseId: id, topicId: primaryTopicId } },
          create: { courseId: id, topicId: primaryTopicId, isPrimary: true },
          update: { isPrimary: true },
        });
      }
    });
    return this.detail(id, instructorId);
  }

  private createOnce(instructorId: string, title: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: { instructorId, title, slug: courseSlug(title) },
        select: { id: true },
      });
      await tx.section.create({
        data: {
          courseId: course.id,
          title: 'Giới thiệu',
          position: 1,
          items: { create: { courseId: course.id, type: 'lecture', title: 'Giới thiệu', position: 1 } },
        },
      });
      return course;
    });
  }

  // Không phải chủ khoá cũng trả 404 để không lộ khoá của người khác (spec §4.1).
  // id sai định dạng → Postgres ném lỗi uuid, nên chặn trước và coi như không tồn tại.
  private async findOwned(id: string, instructorId: string): Promise<CourseRow> {
    const course = z.guid().safeParse(id).success
      ? await this.prisma.course.findFirst({ where: { id, instructorId }, select: COURSE_SELECT })
      : null;
    if (!course) throw new NotFoundException();
    return course;
  }

  // Lecture đã xuất bản + tổng giây video của chúng, một query cho nhiều khoá.
  private async lectureStats(courseIds: string[]): Promise<Map<string, LectureStats>> {
    const rows = await this.prisma.curriculumItem.groupBy({
      by: ['courseId', 'lectureKind'],
      where: { courseId: { in: courseIds }, type: 'lecture', isPublished: true },
      _count: { _all: true },
      _sum: { durationSec: true },
    });
    const stats = new Map<string, LectureStats>();
    for (const r of rows) {
      const s = stats.get(r.courseId) ?? { published: 0, videoSeconds: 0 };
      s.published += r._count._all;
      if (r.lectureKind === 'video') s.videoSeconds += r._sum.durationSec ?? 0;
      stats.set(r.courseId, s);
    }
    return stats;
  }

  private checklistOf(c: CourseRow, s: LectureStats | undefined) {
    return buildChecklist({
      ...c,
      hasPrimaryTopic: c.topics.length > 0,
      categoryDepth: c.category ? (c.category.parent ? 2 : 1) : null,
      publishedLectureCount: s?.published ?? 0,
      videoSeconds: s?.videoSeconds ?? 0,
    });
  }
}
```

- [ ] **Step 4: Controller + module**

`back-end/src/instructor-courses/instructor-courses.controller.ts`:

```ts
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createCourseSchema, updateCourseSchema } from './instructor-courses.schemas.js';
import type { CreateCourseInput, UpdateCourseInput } from './instructor-courses.schemas.js';
import { InstructorCoursesService } from './instructor-courses.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses')
export class InstructorCoursesController {
  constructor(private readonly courses: InstructorCoursesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body(new ZodValidationPipe(createCourseSchema)) body: CreateCourseInput) {
    return this.courses.create(user.id, body.title);
  }

  @Get()
  list(@CurrentUser() user: User) {
    return this.courses.list(user.id);
  }

  @Get(':id')
  detail(@CurrentUser() user: User, @Param('id') id: string) {
    return this.courses.detail(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCourseSchema)) body: UpdateCourseInput,
  ) {
    return this.courses.update(id, user.id, body);
  }
}
```

`back-end/src/instructor-courses/instructor-courses.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { InstructorCoursesController } from './instructor-courses.controller.js';
import { InstructorCoursesService } from './instructor-courses.service.js';

@Module({ controllers: [InstructorCoursesController], providers: [InstructorCoursesService] })
export class InstructorCoursesModule {}
```

Sửa `back-end/src/app.module.ts`: thêm `import { InstructorCoursesModule } from './instructor-courses/instructor-courses.module.js';` và đổi `imports` thành

```ts
  imports: [
    SentryModule.forRoot(),
    InfraModule,
    AuthModule,
    CategoriesModule,
    TopicsModule,
    InstructorCoursesModule,
  ],
```

- [ ] **Step 5: Chạy test, xác nhận pass**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/instructor-courses.e2e-spec.ts && pnpm exec tsc --noEmit -p tsconfig.json && pnpm lint
```

Expected: toàn bộ test trong file PASS (2 become-instructor + 1 cùng cookie + 11 courses); `tsc` chỉ còn lỗi baseline; oxlint không lỗi mới. Nếu TS báo `z.enum(SkillLevel)` không nhận enum Prisma: đổi thành `z.enum(Object.values(SkillLevel) as [SkillLevel, ...SkillLevel[]])` (tương tự `Track`).

- [ ] **Step 6: Thử tay**

```bash
pnpm dev  # terminal khác
curl -s 'localhost:4000/api/topics?q=react' | head -c 300; echo
curl -s -o /dev/null -w '%{http_code}\n' localhost:4000/api/instructor/courses
```

Expected: JSON `[{"id":"…","slug":"react","name":"React"}…]`; `401`.

---

### Task 7: FE nền: shadcn, Toaster, type, API

**Files:**
- Create (shadcn CLI): `it-course-platform/src/components/ui/{dialog,textarea,select,label,sonner}.tsx`; `package.json` thêm `sonner`
- Modify: `it-course-platform/src/app/layout.tsx`, `it-course-platform/src/types/index.ts`
- Create: `it-course-platform/src/types/instructor-course.ts`, `it-course-platform/src/lib/api/instructor-courses.ts`

**Interfaces:**
- Consumes: `api` (`src/lib/api/client.ts`), API Task 4–6.
- Produces: `Dialog*`, `Textarea`, `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem`, `Label`, `Toaster` (tên thật theo file sinh ra); types `CourseStatus`, `SkillLevel`, `Track`, `CourseLanguage`, `Ref`, `ChecklistKey`, `ChecklistItem`, `CourseDetail`, `CourseListItem`, `UpdateCoursePayload`; map nhãn `COURSE_STATUS_LABEL`, `SKILL_LEVEL_LABEL`, `TRACK_LABEL`, `LANGUAGE_LABEL`; hàm `createCourse`, `listMyCourses`, `getCourse`, `updateCourse`, `becomeInstructor`, `searchTopics`; `CategoryNode`/`SubcategoryNode`/`TopicLink` có `id`.

- [ ] **Step 0: Đọc docs Next** — các file liệt kê ở Global Constraints. Ghi nhớ: dưới `cacheComponents`, `useParams`/`usePathname` trên route `[id]` không có `generateStaticParams` sẽ **suspend** lúc prerender → cần `<Suspense>` ở trên; `redirects()` trong `next.config.ts` nhận `:param`.

- [ ] **Step 1: Thêm component shadcn**

```bash
cd it-course-platform && pnpm dlx shadcn@latest add dialog textarea select label sonner
git status --short src/components/ui package.json
```

Nếu CLI hỏi ghi đè `button.tsx` (dependency của dialog) → trả lời **No**. Expected: 5 file mới; `button.tsx` không đổi (`git diff --stat src/components/ui/button.tsx` rỗng); `package.json` có `sonner`. Mở 5 file ghi lại export thật. Dự kiến (đã xem registry `base-nova` lúc viết plan): `Dialog`, `DialogTrigger` (nhận `render`), `DialogContent` (`showCloseButton` mặc định true), `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`; `Select` (= Base UI `Select.Root`: `value`, `onValueChange(value)`, `items` map value → nhãn, `disabled`), `SelectTrigger` (`size`, `className`, `id`), `SelectValue` (`placeholder`), `SelectContent`, `SelectItem` (`value`); `Textarea`; `Label`; `Toaster` (dùng `useTheme` của next-themes). Nếu khác, các task sau dùng tên thật.

- [ ] **Step 2: Mount Toaster một lần ở root layout**

Kiểm chưa có: `grep -rn "Toaster" src` → chỉ ra `src/components/ui/sonner.tsx`. Trong `src/app/layout.tsx`:
- thêm `import { Toaster } from "@/components/ui/sonner";` sau import `SentryUser`;
- trong `<ThemeProvider …>` đổi `{children}` thành

```tsx
          {children}
          <Toaster />
```

(Toaster phải nằm trong `ThemeProvider` vì gọi `useTheme`.)

- [ ] **Step 3: `id` cho cây danh mục**

Trong `src/types/index.ts`, thêm dòng `id: string;` làm trường đầu tiên của cả ba interface `TopicLink`, `SubcategoryNode`, `CategoryNode`, và sửa comment đầu khối thành:

```ts
// Cây menu "Khám phá" — khớp GET /api/categories/tree (back-end/src/categories).
// id dùng cho PATCH categoryId/primaryTopicId ở trang quản lý khoá.
```

Cache `'use cache'` của `getCategoryTree` (`cacheLife('hours')`) còn giữ cây **chưa có id** → khi chạy local phải restart `pnpm dev` / xoá `.next` (Task 13 làm).

- [ ] **Step 4: Type**

`src/types/instructor-course.ts`:

```ts
// Khớp API back-end/src/instructor-courses (spec 2026-09-30-course-create-basics §4.2).
// Khoá của map nhãn = giá trị enum trong DB.
export const COURSE_STATUS_LABEL = {
  draft: 'Bản nháp',
  in_review: 'Chờ duyệt',
  published: 'Đang bán',
  unpublished: 'Đã gỡ',
} as const;
export type CourseStatus = keyof typeof COURSE_STATUS_LABEL;

export const SKILL_LEVEL_LABEL = {
  all_levels: 'Mọi cấp độ',
  beginner: 'Mới bắt đầu',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
} as const;
export type SkillLevel = keyof typeof SKILL_LEVEL_LABEL;

export const TRACK_LABEL = {
  backend: 'Backend',
  frontend: 'Frontend',
  fullstack: 'Fullstack',
  mobile: 'Mobile',
  data: 'Dữ liệu',
  devops: 'DevOps',
  other: 'Khác',
} as const;
export type Track = keyof typeof TRACK_LABEL;

export const LANGUAGE_LABEL = { vi: 'Tiếng Việt', en: 'Tiếng Anh' } as const;
export type CourseLanguage = keyof typeof LANGUAGE_LABEL;

export interface Ref {
  id: string;
  slug: string;
  name: string;
}

export type ChecklistKey = 'goals' | 'curriculum' | 'basics';

export interface ChecklistItem {
  key: ChecklistKey;
  done: boolean;
  missing: { message: string; anchor: string }[];
}

export interface CourseDetail {
  id: string;
  slug: string;
  status: CourseStatus;
  title: string;
  subtitle: string | null;
  description: string | null;
  language: CourseLanguage;
  level: SkillLevel | null;
  track: Track | null;
  thumbnailUrl: string | null;
  promoVideoUrl: string | null;
  learningObjectives: string[];
  requirements: string[];
  targetAudience: string[];
  category: (Ref & { parent: Ref | null }) | null;
  primaryTopic: Ref | null;
  updatedAt: string;
  checklist: ChecklistItem[];
}

export interface CourseListItem {
  id: string;
  title: string;
  status: CourseStatus;
  thumbnailUrl: string | null;
  updatedAt: string;
  progress: { done: number; total: number };
}

// PATCH: chỉ gửi trường muốn đổi. subtitle/description chuỗi rỗng → BE lưu null.
export interface UpdateCoursePayload {
  title?: string;
  subtitle?: string;
  description?: string;
  language?: CourseLanguage;
  level?: SkillLevel | null;
  track?: Track | null;
  categoryId?: string | null;
  primaryTopicId?: string | null;
  learningObjectives?: string[];
  requirements?: string[];
  targetAudience?: string[];
}
```

- [ ] **Step 5: API**

`src/lib/api/instructor-courses.ts`:

```ts
import { api } from '@/lib/api/client';
import type { CourseDetail, CourseListItem, Ref, UpdateCoursePayload } from '@/types/instructor-course';

// API giảng viên (spec 2026-09-30-course-create-basics §4). Chỉ gọi từ client component:
// cần cookie session (api có withCredentials, 401 → interceptor chuyển /login).
export const createCourse = (title: string) =>
  api.post<{ id: string }>('/instructor/courses', { title }).then((r) => r.data);

export const listMyCourses = () => api.get<CourseListItem[]>('/instructor/courses').then((r) => r.data);

export const getCourse = (id: string) => api.get<CourseDetail>(`/instructor/courses/${id}`).then((r) => r.data);

export const updateCourse = (id: string, body: UpdateCoursePayload) =>
  api.patch<CourseDetail>(`/instructor/courses/${id}`, body).then((r) => r.data);

export const becomeInstructor = () => api.post('/me/become-instructor').then(() => undefined);

export const searchTopics = (q: string, signal?: AbortSignal) =>
  api.get<Ref[]>('/topics', { params: { q }, signal }).then((r) => r.data);
```

- [ ] **Step 6: Typecheck + lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: sạch (`explore-menu.tsx`, `mobile-nav.tsx`, `header.tsx`, `lib/api/categories.ts` chỉ đọc cây nên thêm `id` không vỡ).

---

### Task 8: Tách route `(dashboard)` / `(manage)` + gate giảng viên

**Files:**
- Delete: `src/app/instructor/courses/new/`, `src/app/instructor/courses/[id]/` (chỉ có `edit/`), `src/app/instructor/courses/_components/`
- Move: `src/app/instructor/{page.tsx,loading.tsx,_components,analytics,courses,messages,problems,profile,qa,questions,verification}` → `src/app/instructor/(dashboard)/`
- Create: `src/app/instructor/(dashboard)/layout.tsx`
- Rewrite: `src/app/instructor/layout.tsx`
- Modify: `src/app/instructor/(dashboard)/{page,messages/page,profile/page,verification/page}.tsx`, `next.config.ts`

**Interfaces:**
- Consumes: `authClient.useSession()` (`{ data, isPending, error, refetch }`, khởi tạo `isPending: true`), `becomeInstructor` (Task 7), `SiteHeader`, `InstructorSidebar`.
- Produces: mọi URL `/instructor/*` giữ nguyên; `instructor/layout.tsx` chỉ render `children` khi user có role `instructor`; `(dashboard)/layout.tsx` = header + sidebar; `/instructor/courses/:id/manage` → redirect `/manage/goals`.

- [ ] **Step 1: Xoá builder cũ, chuyển thư mục**

```bash
cd it-course-platform/src/app/instructor
git rm -r -q courses/new "courses/[id]" courses/_components
mkdir "(dashboard)"
git mv page.tsx loading.tsx _components analytics courses messages problems profile qa questions verification "(dashboard)/"
ls; ls "(dashboard)"
```

Expected: `instructor/` chỉ còn `(dashboard)/` và `layout.tsx`; `(dashboard)/` có đủ 11 mục; `(dashboard)/courses/` chỉ còn `page.tsx`.

- [ ] **Step 2: Sửa import tuyệt đối**

```bash
cd ../../..   # về it-course-platform
grep -rln "@/app/instructor/" src | xargs sed -i '' 's#@/app/instructor/#@/app/instructor/(dashboard)/#g'
grep -rn "@/app/instructor/" src
```

Expected: đúng 4 dòng, tất cả dạng `@/app/instructor/(dashboard)/…`: `(dashboard)/page.tsx` (`_components/revenue-chart`), `messages/page.tsx`, `profile/page.tsx`, `verification/page.tsx`. (Chỉ chạy `sed` **một lần**.)

- [ ] **Step 3: Link tạo khoá cũ**

Trong `src/app/instructor/(dashboard)/page.tsx` đổi `href="/instructor/courses/new"` thành `href="/instructor/courses"` (nút "+ Tạo khoá học mới" đưa về danh sách, nơi có `CreateCourseDialog`). Kiểm:

```bash
grep -rn "/instructor/courses/new\|/edit\b\|course-builder" src
```

Expected: chỉ còn dòng trong `(dashboard)/courses/page.tsx` (file này viết lại ở Task 9) hoặc không còn dòng nào.

- [ ] **Step 4: `(dashboard)/layout.tsx`** (nội dung layout cũ)

`src/app/instructor/(dashboard)/layout.tsx`:

```tsx
import { Suspense } from 'react';
import SiteHeader from '@/components/layout/site-header';
import InstructorSidebar from '@/components/layout/instructor-sidebar';

// Header + sidebar cho các trang dashboard giảng viên. Trang quản lý khoá ((manage)) toàn màn hình, không dùng layout này.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader cartCount={2} />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* usePathname() treo khi prerender route có [id] (cacheComponents) → cần Suspense; fallback giữ đúng bề rộng sidebar */}
        <Suspense fallback={<aside className="w-[220px] shrink-0 border-r bg-card" />}>
          <InstructorSidebar />
        </Suspense>
        {children}
      </div>
    </>
  );
}
```

- [ ] **Step 5: Gate `instructor/layout.tsx`**

Thay toàn bộ `src/app/instructor/layout.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { becomeInstructor } from '@/lib/api/instructor-courses';
import { authClient } from '@/lib/auth-client';

// Chặn quyền cho mọi trang /instructor (spec course-create-basics §5.4). Chạy ở client: session
// nằm ở back-end, proxy.ts chỉ kiểm có cookie. Không đọc usePathname/useParams → không cần Suspense;
// URL hiện tại lấy từ window trong effect.
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { data, isPending, error, refetch } = authClient.useSession();
  const router = useRouter();
  const signedOut = !isPending && !data && (!error || error.status === 401);

  useEffect(() => {
    if (!signedOut) return;
    router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [signedOut, router]);

  if (error && !data && !signedOut) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">Không kiểm tra được phiên đăng nhập.</p>
        <Button onClick={() => refetch()}>Thử lại</Button>
      </Centered>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4 p-6" role="status" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!data.user.role?.split(',').includes('instructor')) return <BecomeInstructor onDone={() => refetch()} />;
  return children;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}

// Một đường duy nhất để bật vai trò: nút "Chuyển sang Giảng viên" ở header dẫn tới /instructor → màn này.
function BecomeInstructor({ onDone }: { onDone: () => Promise<unknown> }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await becomeInstructor();
      await onDone(); // get-session trả role mới (BE đã refresh cache Redis)
    } catch {
      toast.error('Không bật được vai trò giảng viên, thử lại');
    } finally {
      setPending(false);
    }
  }

  return (
    <Centered>
      <h1 className="text-2xl font-extrabold">Trở thành giảng viên</h1>
      <p className="text-sm text-muted-foreground">
        Tạo khoá học và chia sẻ kiến thức với học viên SkillPath. Bạn có thể bắt đầu soạn khoá ngay; chỉ khi bán
        khoá có phí mới cần xác minh danh tính.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleClick} disabled={pending}>
          {pending ? 'Đang bật…' : 'Bắt đầu dạy học'}
        </Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Về trang học viên
        </Link>
      </div>
    </Centered>
  );
}
```

- [ ] **Step 6: Redirect `/manage` → `/manage/goals`**

Trong `next.config.ts`, đổi `redirects()` thành:

```ts
  async redirects() {
    return [
      { source: "/instructor/dashboard", destination: "/instructor", permanent: false },
      // Trang quản lý không có mục mặc định (spec course-create-basics §5.1)
      { source: "/instructor/courses/:id/manage", destination: "/instructor/courses/:id/manage/goals", permanent: false },
    ];
  },
```

- [ ] **Step 7: Typecheck + lint**

Type route cũ (`.next/types`, `.next/dev/types`) còn trỏ tới trang đã xoá → tạo lại trước khi `tsc`:

```bash
rm -rf .next/dev/types && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint
```

Expected: sạch. Nếu `tsc` còn lỗi ở `.next/types/validator.ts` về `courses/new` hoặc `[id]/edit`: `rm -rf .next/types` rồi chạy lại `next typegen`.

---

### Task 9: Danh sách "Khoá học của tôi" + `CreateCourseDialog`

**Files:**
- Rewrite: `src/app/instructor/(dashboard)/courses/page.tsx`
- Create: `src/app/instructor/(dashboard)/courses/_components/my-courses.tsx`, `create-course-dialog.tsx`

**Interfaces:**
- Consumes: `listMyCourses`, `createCourse` (Task 7), `Dialog*`, `Label`, `Input`, `Button`, `Badge`, `Progress`, `Skeleton`, `toast` (sonner), `COURSE_STATUS_LABEL`.
- Produces: `<CreateCourseDialog />` (nút "Tạo khoá học" + modal, thành công → `router.push('/instructor/courses/{id}/manage/goals')`); `<MyCourses />`.

- [ ] **Step 1: Dialog tạo khoá**

`src/app/instructor/(dashboard)/courses/_components/create-course-dialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCourse } from '@/lib/api/instructor-courses';

const MAX = 60;
const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tên khoá học').max(MAX, `Tối đa ${MAX} ký tự`),
});
type Values = z.infer<typeof schema>;

// Không có wizard: chỉ nhập tên rồi vào trang quản lý (spec C1).
export function CreateCourseDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '' } });
  const title = useWatch({ control, name: 'title' });

  async function onSubmit(values: Values) {
    try {
      const { id } = await createCourse(values.title);
      router.push(`/instructor/courses/${id}/manage/goals`);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 400
          ? (err.response.data?.errors?.[0]?.message as string | undefined)
          : undefined;
      if (message) setError('title', { message });
      else toast.error('Tạo khoá học thất bại, thử lại');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus /> Tạo khoá học
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Tạo khoá học</DialogTitle>
            <DialogDescription>Đặt một tên tạm, bạn có thể đổi lại sau ở Trang tổng quan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-course-title">Tên khoá học</Label>
            <div className="relative">
              <Input
                id="new-course-title"
                autoFocus
                maxLength={MAX}
                placeholder="Ví dụ: Lập trình React từ số 0"
                className="pr-12"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'new-course-title-error' : undefined}
                {...register('title')}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                {MAX - title.length}
              </span>
            </div>
            {errors.title && (
              <p id="new-course-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Đang tạo…' : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Danh sách**

`src/app/instructor/(dashboard)/courses/_components/my-courses.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { listMyCourses } from '@/lib/api/instructor-courses';
import { COURSE_STATUS_LABEL, type CourseListItem } from '@/types/instructor-course';
import { CreateCourseDialog } from './create-course-dialog';

export function MyCourses() {
  const [courses, setCourses] = useState<CourseListItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listMyCourses().then(setCourses, () => setFailed(true));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold">Khoá học của tôi</h1>
        {courses && courses.length > 0 && <CreateCourseDialog />}
      </div>

      {failed ? (
        <p className="text-sm text-destructive">Không tải được danh sách khoá học, thử tải lại trang.</p>
      ) : !courses ? (
        <div className="space-y-3" role="status" aria-busy="true" aria-label="Đang tải">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <p className="font-semibold">Bạn chưa có khoá học nào</p>
          <p className="text-sm text-muted-foreground">Bắt đầu bằng một cái tên, phần còn lại soạn dần sau.</p>
          <CreateCourseDialog />
        </div>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {courses.map((c) => (
            <li key={c.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              {c.thumbnailUrl ? (
                <Image
                  src={c.thumbnailUrl}
                  alt=""
                  width={96}
                  height={54}
                  unoptimized
                  className="h-[54px] w-24 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-[54px] w-24 shrink-0 items-center justify-center rounded bg-muted">
                  <ImageIcon size={20} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold">{c.title}</p>
                  <Badge variant={c.status === 'published' ? 'default' : 'secondary'}>
                    {COURSE_STATUS_LABEL[c.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={(c.progress.done / c.progress.total) * 100}
                    className="max-w-48"
                    aria-label="Mức hoàn thiện"
                  />
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    Hoàn thiện {c.progress.done}/{c.progress.total} mục
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sửa lần cuối {new Date(c.updatedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <Link
                href={`/instructor/courses/${c.id}/manage/goals`}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Chỉnh sửa
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Trang**

Thay toàn bộ `src/app/instructor/(dashboard)/courses/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { MyCourses } from './_components/my-courses';

export const metadata: Metadata = { title: 'Khoá học của tôi | SkillPath' };

export default function InstructorCoursesPage() {
  return <MyCourses />;
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm exec tsc --noEmit && pnpm lint && grep -rn "/instructor/courses/new\|course-builder" src
```

Expected: sạch; grep không ra dòng nào.

---

### Task 10: Khung trang quản lý (`CourseProvider`, thanh trên, sidebar checklist)

**Files:**
- Create: `src/app/instructor/(manage)/courses/[id]/manage/layout.tsx`
- Create: `src/app/instructor/(manage)/courses/[id]/manage/_components/course-provider.tsx`, `course-manage-shell.tsx`, `checklist-sidebar.tsx`, `guarded-link.tsx`, `form-save.tsx`

**Interfaces:**
- Consumes: `getCourse` (Task 7), types Task 7, `Badge`, `Button`, `Skeleton`, `toast`.
- Produces:
  - `useCourse(): { course: CourseDetail; setCourse(c: CourseDetail): void; dirty: boolean; setDirty(d: boolean): void }`; `<CourseProvider>` (gọi `getCourse` một lần; 404 → "Không tìm thấy khoá học"; `dirty` → `beforeunload`); `<ManageSkeleton />`.
  - `<CourseManageShell>{children}</CourseManageShell>` (thanh trên + `ChecklistSidebar` + banner `in_review`).
  - `<GuardedLink href>` (hỏi `confirm('Bỏ thay đổi chưa lưu?')` khi `dirty` và rời trang).
  - `<SaveButton isDirty isSubmitting locked />`; `applySaveError(err, setError, onLocked, toField?)` (400 → `setError` theo `path`; 409 `COURSE_LOCKED` → `onLocked()`; khác → toast "Lưu thất bại, thử lại").
  - Anchor id mà trang con phải có: goals `objectives`, `requirements`, `audience`; basics `subtitle`, `description`, `level`, `track`, `category`, `topic`, `thumbnail` (thêm `scroll-mt-20` vì thanh trên sticky).

- [ ] **Step 1: `course-provider.tsx`**

```tsx
'use client';

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCourse } from '@/lib/api/instructor-courses';
import type { CourseDetail } from '@/types/instructor-course';

type CourseContextValue = {
  course: CourseDetail;
  setCourse: (course: CourseDetail) => void; // sau khi lưu: cập nhật thanh trên + checklist
  dirty: boolean; // form đang mở có thay đổi chưa lưu
  setDirty: (dirty: boolean) => void;
};

const CourseContext = createContext<CourseContextValue | null>(null);

export function useCourse(): CourseContextValue {
  const value = use(CourseContext);
  if (!value) throw new Error('useCourse phải nằm trong CourseProvider');
  return value;
}

export function ManageSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="h-14 border-b" />
      <div className="flex gap-8 p-6">
        <Skeleton className="hidden h-72 w-64 md:block" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

// useParams suspend khi prerender route [id] (cacheComponents) → layout bọc <Suspense>.
export function CourseProvider({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<'not_found' | 'failed' | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(
    () =>
      getCourse(id).then(
        (c) => {
          setCourse(c);
          setError(null);
        },
        (e: unknown) => setError(axios.isAxiosError(e) && e.response?.status === 404 ? 'not_found' : 'failed'),
      ),
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Đóng tab / tải lại khi còn thay đổi chưa lưu (spec §5.3). Link nội bộ do GuardedLink lo.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const value = useMemo(() => (course ? { course, setCourse, dirty, setDirty } : null), [course, dirty]);

  if (error === 'not_found') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-extrabold">Không tìm thấy khoá học</h1>
        <p className="text-sm text-muted-foreground">Khoá học không tồn tại hoặc không thuộc về bạn.</p>
        <Link href="/instructor/courses" className={buttonVariants({ variant: 'outline' })}>
          Về danh sách khoá học
        </Link>
      </main>
    );
  }
  if (error === 'failed') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">Không tải được khoá học.</p>
        <Button
          onClick={() => {
            setError(null);
            void load();
          }}
        >
          Thử lại
        </Button>
      </main>
    );
  }
  if (!value) return <ManageSkeleton />;
  return <CourseContext value={value}>{children}</CourseContext>;
}
```

- [ ] **Step 2: `guarded-link.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCourse } from './course-provider';

// Link trong trang quản lý: form chưa lưu thì hỏi trước khi rời trang (spec §5.3).
// Cùng trang (chỉ đổi #anchor) thì không hỏi.
export function GuardedLink({
  href,
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const { dirty } = useCourse();
  const pathname = usePathname();
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        const leaving = href.split('#')[0] !== pathname;
        if (dirty && leaving && !window.confirm('Bỏ thay đổi chưa lưu?')) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
```

- [ ] **Step 3: `form-save.tsx`**

```tsx
'use client';

import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SaveButton({ isDirty, isSubmitting, locked }: { isDirty: boolean; isSubmitting: boolean; locked: boolean }) {
  return (
    <Button type="submit" disabled={locked || !isDirty || isSubmitting}>
      {isSubmitting ? 'Đang lưu…' : 'Lưu'}
    </Button>
  );
}

type ApiFieldError = { path: string[]; message: string };

// Lỗi khi lưu (spec §5.3, §7): 400 → lỗi dưới từng ô theo path; 409 COURSE_LOCKED → khoá form;
// còn lại (mạng/500/400 không có path) → toast, giữ nguyên dữ liệu form.
// toField đổi path API → tên field của form (mặc định nối bằng dấu chấm).
export function applySaveError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  onLocked: () => void,
  toField: (path: string[]) => string = (path) => path.join('.'),
) {
  const res = axios.isAxiosError(err) ? err.response : undefined;
  if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') {
    onLocked();
    return;
  }
  const errors = res?.status === 400 ? (res.data?.errors as ApiFieldError[] | undefined) : undefined;
  if (errors?.length && errors.every((e) => e.path.length > 0)) {
    for (const e of errors) setError(toField(e.path) as Path<T>, { message: e.message });
    return;
  }
  toast.error('Lưu thất bại, thử lại');
}
```

- [ ] **Step 4: `checklist-sidebar.tsx`**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChecklistKey } from '@/types/instructor-course';
import { useCourse } from './course-provider';
import { GuardedLink } from './guarded-link';

type Entry = { label: string; key?: ChecklistKey; page?: 'goals' | 'basics' };

// Mục không có page = "Sắp có" (đợt 2–4).
const GROUPS: { title: string; entries: Entry[] }[] = [
  { title: 'Lên kế hoạch cho khoá học', entries: [{ label: 'Học viên mục tiêu', key: 'goals', page: 'goals' }] },
  { title: 'Tạo nội dung', entries: [{ label: 'Khung chương trình', key: 'curriculum' }] },
  {
    title: 'Xuất bản khoá học',
    entries: [{ label: 'Trang tổng quan', key: 'basics', page: 'basics' }, { label: 'Định giá' }, { label: 'Khuyến mại' }],
  },
];

export function ChecklistSidebar() {
  const { course } = useCourse();
  const pathname = usePathname();
  const base = `/instructor/courses/${course.id}/manage`;

  return (
    <aside className="shrink-0 border-b p-4 md:w-72 md:border-r md:border-b-0">
      <nav className="space-y-6" aria-label="Các bước tạo khoá học">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-2 text-sm font-bold">{group.title}</h2>
            <ul className="space-y-1">
              {group.entries.map((entry) => {
                const item = course.checklist.find((c) => c.key === entry.key);
                if (!entry.page) {
                  return (
                    <li key={entry.label} className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground opacity-60">
                      <Circle size={16} />
                      {entry.label}
                      <span className="ml-auto text-xs">Sắp có</span>
                    </li>
                  );
                }
                const href = `${base}/${entry.page}`;
                const Icon = item?.done ? CheckCircle2 : Circle;
                return (
                  <li key={entry.label}>
                    <GuardedLink
                      href={href}
                      aria-current={pathname === href ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                        pathname === href && 'bg-muted font-semibold',
                      )}
                    >
                      <Icon size={16} className={item?.done ? 'text-primary' : 'text-muted-foreground'} />
                      {entry.label}
                    </GuardedLink>
                    {item && !item.done && (
                      <ul className="mt-1 ml-8 space-y-1">
                        {item.missing.map((m) => (
                          <li key={m.message}>
                            <GuardedLink
                              href={`${href}#${m.anchor}`}
                              className="text-xs text-muted-foreground hover:text-primary hover:underline"
                            >
                              {m.message}
                            </GuardedLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <Button className="w-full" disabled>
          Gửi đi để xem xét (Sắp có)
        </Button>
      </nav>
    </aside>
  );
}
```

- [ ] **Step 5: `course-manage-shell.tsx`**

```tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { COURSE_STATUS_LABEL } from '@/types/instructor-course';
import { ChecklistSidebar } from './checklist-sidebar';
import { useCourse } from './course-provider';
import { GuardedLink } from './guarded-link';

// Toàn màn hình kiểu Udemy (spec C4): thanh trên + sidebar checklist, không dùng layout /instructor.
export function CourseManageShell({ children }: { children: React.ReactNode }) {
  const { course } = useCourse();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4">
        <GuardedLink href="/instructor/courses" className="flex shrink-0 items-center gap-1 text-sm font-medium hover:text-primary">
          <ArrowLeft size={16} /> Quay lại khoá học
        </GuardedLink>
        <span className="min-w-0 truncate font-bold">{course.title}</span>
        <Badge variant="secondary">{COURSE_STATUS_LABEL[course.status]}</Badge>
        <Button variant="outline" size="sm" className="ml-auto" disabled title="Sắp có">
          Xem trước
        </Button>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <ChecklistSidebar />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-10">
          <div className="mx-auto max-w-3xl space-y-6">
            {course.status === 'in_review' && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Khoá học đang chờ duyệt, không sửa được
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: `layout.tsx`**

`src/app/instructor/(manage)/courses/[id]/manage/layout.tsx`:

```tsx
import { Suspense } from 'react';
import { CourseManageShell } from './_components/course-manage-shell';
import { CourseProvider, ManageSkeleton } from './_components/course-provider';

// CourseProvider đọc [id] bằng useParams → suspend khi prerender (cacheComponents), nên cả cây
// client (provider, thanh trên, ChecklistSidebar) nằm trong Suspense.
export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ManageSkeleton />}>
      <CourseProvider>
        <CourseManageShell>{children}</CourseManageShell>
      </CourseProvider>
    </Suspense>
  );
}
```

- [ ] **Step 7: Typecheck + lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: sạch. (Link tới `goals`/`basics` 404 cho tới Task 11/12.)

---

### Task 11: Trang "Học viên mục tiêu" (`goals`)

**Files:**
- Create: `src/app/instructor/(manage)/courses/[id]/manage/_components/string-list-editor.tsx`, `goals-form.tsx`
- Create: `src/app/instructor/(manage)/courses/[id]/manage/goals/page.tsx`

**Interfaces:**
- Consumes: `useCourse`, `SaveButton`, `applySaveError` (Task 10); `updateCourse` (Task 7).
- Produces: `GoalsValues = { learningObjectives | requirements | targetAudience: { value: string }[] }`, `GoalsListName`; `<StringListEditor name anchor title hint placeholder control register errors />`; hằng `MAX_ITEMS = 10`, `MAX_ITEM_LENGTH = 160`; trang `/instructor/courses/[id]/manage/goals`.

- [ ] **Step 1: `string-list-editor.tsx`**

```tsx
'use client';

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GoalsListName, GoalsValues } from './goals-form';

export const MAX_ITEMS = 10;
export const MAX_ITEM_LENGTH = 160;

type Props = {
  name: GoalsListName;
  anchor: string;
  title: string;
  hint: string;
  placeholder: string;
  control: Control<GoalsValues>;
  register: UseFormRegister<GoalsValues>;
  errors: FieldErrors<GoalsValues>;
};

// Danh sách câu trả lời: ≤10 ô, ≤160 ký tự/ô, bộ đếm, xoá từng ô (luôn giữ ít nhất 1 ô).
export function StringListEditor({ name, anchor, title, hint, placeholder, control, register, errors }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name });
  const listError = errors[name];

  return (
    <section id={anchor} className="scroll-mt-20 space-y-3">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {fields.map((field, i) => {
        const error = listError?.[i]?.value?.message;
        return (
          <div key={field.id}>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder={placeholder}
                  maxLength={MAX_ITEM_LENGTH}
                  className="pr-12"
                  aria-label={`${title} – ô ${i + 1}`}
                  aria-invalid={!!error}
                  {...register(`${name}.${i}.value`)}
                />
                <Remaining control={control} name={name} index={i} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Xoá ô ${i + 1}`}
                disabled={fields.length === 1}
                onClick={() => remove(i)}
              >
                <Trash2 />
              </Button>
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
      {listError?.message && <p className="text-xs text-destructive">{listError.message}</p>}
      <Button
        type="button"
        variant="ghost"
        className="text-primary"
        disabled={fields.length >= MAX_ITEMS}
        onClick={() => append({ value: '' })}
      >
        <Plus /> Thêm câu trả lời
      </Button>
    </section>
  );
}

function Remaining({ control, name, index }: { control: Control<GoalsValues>; name: GoalsListName; index: number }) {
  const value = useWatch({ control, name: `${name}.${index}.value` });
  return (
    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
      {MAX_ITEM_LENGTH - (value?.length ?? 0)}
    </span>
  );
}
```

- [ ] **Step 2: `goals-form.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { updateCourse } from '@/lib/api/instructor-courses';
import { useCourse } from './course-provider';
import { applySaveError, SaveButton } from './form-save';
import { MAX_ITEM_LENGTH, MAX_ITEMS, StringListEditor } from './string-list-editor';

// Giới hạn khớp BE (spec §4.3). Ô rỗng được phép trong form, bỏ đi khi gửi.
const row = z.object({ value: z.string().trim().max(MAX_ITEM_LENGTH, `Tối đa ${MAX_ITEM_LENGTH} ký tự`) });
const list = z.array(row).max(MAX_ITEMS, `Tối đa ${MAX_ITEMS} mục`);
const schema = z.object({ learningObjectives: list, requirements: list, targetAudience: list });

export type GoalsValues = z.infer<typeof schema>;
export type GoalsListName = keyof GoalsValues;

// useFieldArray cần object → { value }. Hiện đủ số ô mặc định (4 / 1 / 1).
const toRows = (items: string[], min: number) =>
  Array.from({ length: Math.max(items.length, min) }, (_, i) => ({ value: items[i] ?? '' }));
const toList = (rows: { value: string }[]) => rows.map((r) => r.value.trim()).filter(Boolean);

export function GoalsForm() {
  const { course, setCourse, setDirty } = useCourse();
  const locked = course.status === 'in_review';
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GoalsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      learningObjectives: toRows(course.learningObjectives, 4),
      requirements: toRows(course.requirements, 1),
      targetAudience: toRows(course.targetAudience, 1),
    },
  });

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  async function onSubmit(values: GoalsValues) {
    try {
      const updated = await updateCourse(course.id, {
        learningObjectives: toList(values.learningObjectives),
        requirements: toList(values.requirements),
        targetAudience: toList(values.targetAudience),
      });
      setCourse(updated);
      reset(values);
      toast.success('Đã lưu');
    } catch (err) {
      applySaveError(
        err,
        setError,
        () => setCourse({ ...course, status: 'in_review' }),
        // ['learningObjectives', '2'] → 'learningObjectives.2.value' (index sau khi BE bỏ ô rỗng, gần đúng)
        (path) => (path.length > 1 ? `${path[0]}.${path[1]}.value` : path[0]),
      );
    }
  }

  const listProps = { control, register, errors };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-2xl font-extrabold">Học viên mục tiêu</h1>
        <SaveButton isDirty={isDirty} isSubmitting={isSubmitting} locked={locked} />
      </div>
      <p className="text-sm text-muted-foreground">
        Các mô tả dưới đây hiển thị công khai trên trang tổng quan khoá học, giúp học viên quyết định khoá học có
        phù hợp với họ hay không.
      </p>
      <fieldset disabled={locked} className="space-y-10">
        <StringListEditor
          name="learningObjectives"
          anchor="objectives"
          title="Học viên sẽ học được gì trong khoá học của bạn?"
          hint="Nhập ít nhất 4 mục tiêu hoặc kết quả học tập mà học viên đạt được sau khi hoàn thành khoá học."
          placeholder="Ví dụ: Xây dựng ứng dụng React có định tuyến và gọi API"
          {...listProps}
        />
        <StringListEditor
          name="requirements"
          anchor="requirements"
          title="Yêu cầu hoặc điều kiện tiên quyết để tham gia khoá học là gì?"
          hint="Liệt kê kỹ năng, kinh nghiệm, công cụ hoặc thiết bị học viên cần có trước khi học. Nếu không có, hãy ghi rõ điều đó."
          placeholder="Ví dụ: Biết JavaScript cơ bản"
          {...listProps}
        />
        <StringListEditor
          name="targetAudience"
          anchor="audience"
          title="Khoá học này dành cho đối tượng nào?"
          hint="Mô tả rõ những học viên sẽ thấy nội dung khoá học có giá trị."
          placeholder="Ví dụ: Lập trình viên frontend mới bắt đầu với React"
          {...listProps}
        />
      </fieldset>
    </form>
  );
}
```

- [ ] **Step 3: Trang**

`src/app/instructor/(manage)/courses/[id]/manage/goals/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { GoalsForm } from '../_components/goals-form';

export const metadata: Metadata = { title: 'Học viên mục tiêu | SkillPath' };

export default function GoalsPage() {
  return <GoalsForm />;
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: sạch. Nếu `tsc` báo route `/instructor/courses/[id]/manage/goals` thiếu trong type route: `pnpm exec next typegen` rồi chạy lại.

---

### Task 12: Trang "Trang tổng quan" (`basics`)

**Files:**
- Create: `src/app/instructor/(manage)/courses/[id]/manage/_components/category-picker.tsx`, `topic-picker.tsx`, `basics-form.tsx`
- Create: `src/app/instructor/(manage)/courses/[id]/manage/basics/page.tsx`

**Interfaces:**
- Consumes: `getCategoryTree()` (`src/lib/api/categories.ts`, `'use cache'`), `CategoryNode` có `id` (Task 7), `searchTopics`, `updateCourse`, `Select*`, `Textarea`, `Label`, `useCourse`, `SaveButton`, `applySaveError`.
- Produces: `<CategoryPicker categories value onChange invalid? />` (cấp 1 → cấp 2, `value` = id cấp 2 | null); `<TopicPicker value onChange invalid? />` (debounce 300ms, `value: Ref | null`); `<BasicsForm categories />`; trang `/instructor/courses/[id]/manage/basics` (server component).

- [ ] **Step 1: `category-picker.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CategoryNode } from '@/types';

const labels = (list: { id: string; name: string }[]) => Object.fromEntries(list.map((x) => [x.id, x.name]));

// Cây nhận qua props từ trang server (getCategoryTree có cache), không gọi axios (spec §5.2).
// Khoá chỉ gắn vào thể loại con → value là id cấp 2; cấp 1 là state cục bộ.
export function CategoryPicker({
  categories,
  value,
  onChange,
  invalid,
}: {
  categories: CategoryNode[];
  value: string | null;
  onChange: (id: string | null) => void;
  invalid?: boolean;
}) {
  const [parentId, setParentId] = useState<string | null>(
    () => categories.find((c) => c.children.some((s) => s.id === value))?.id ?? null,
  );

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">Không tải được danh mục, thử tải lại trang.</p>;
  }
  const children = categories.find((c) => c.id === parentId)?.children ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Select
        items={labels(categories)}
        value={parentId}
        onValueChange={(id) => {
          setParentId(id);
          onChange(null);
        }}
      >
        <SelectTrigger id="category-l1" className="w-full" aria-label="Thể loại">
          <SelectValue placeholder="Chọn thể loại" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select items={labels(children)} value={value} onValueChange={(id) => onChange(id)} disabled={!parentId}>
        <SelectTrigger id="category-l2" className="w-full" aria-label="Thể loại con" aria-invalid={invalid}>
          <SelectValue placeholder="Chọn thể loại con" />
        </SelectTrigger>
        <SelectContent>
          {children.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
```

- [ ] **Step 2: `topic-picker.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchTopics } from '@/lib/api/instructor-courses';
import type { Ref } from '@/types/instructor-course';

// "Khoá học chủ yếu dạy gì?" — tìm topic theo tên, debounce 300ms, huỷ request cũ khi gõ tiếp.
export function TopicPicker({
  value,
  onChange,
  invalid,
}: {
  value: Ref | null;
  onChange: (topic: Ref | null) => void;
  invalid?: boolean;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Ref[]>([]);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      searchTopics(term, ctrl.signal).then(setResults, () => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{value.name}</Badge>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Bỏ chọn chủ đề" onClick={() => onChange(null)}>
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        id="topic-search"
        value={q}
        maxLength={50}
        autoComplete="off"
        placeholder="Ví dụ: React, Docker, Python"
        aria-invalid={invalid}
        onChange={(e) => {
          setQ(e.target.value);
          if (!e.target.value.trim()) setResults([]);
        }}
      />
      {q.trim() && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover py-1 shadow-md">
          {results.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => {
                  onChange(t);
                  setQ('');
                  setResults([]);
                }}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `basics-form.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateCourse } from '@/lib/api/instructor-courses';
import type { CategoryNode } from '@/types';
import {
  type CourseDetail,
  type CourseLanguage,
  LANGUAGE_LABEL,
  type Ref,
  SKILL_LEVEL_LABEL,
  type SkillLevel,
  type Track,
  TRACK_LABEL,
} from '@/types/instructor-course';
import { CategoryPicker } from './category-picker';
import { useCourse } from './course-provider';
import { applySaveError, SaveButton } from './form-save';
import { TopicPicker } from './topic-picker';

const TITLE_MAX = 60;
const SUBTITLE_MAX = 120;
const MIN_WORDS = 200; // gợi ý, khớp MIN_DESCRIPTION_WORDS ở BE
const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Giới hạn khớp BE (spec §4.3). Select chỉ cho chọn giá trị hợp lệ nên enum không kiểm lại.
const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề khoá học').max(TITLE_MAX, `Tối đa ${TITLE_MAX} ký tự`),
  subtitle: z.string().trim().max(SUBTITLE_MAX, `Tối đa ${SUBTITLE_MAX} ký tự`),
  description: z.string().refine((s) => countWords(s) <= 5000, 'Tối đa 5000 từ'),
  language: z.custom<CourseLanguage>(),
  level: z.custom<SkillLevel | null>(),
  track: z.custom<Track | null>(),
  categoryId: z.string().nullable(),
  primaryTopic: z.custom<Ref | null>(),
});
type Values = z.infer<typeof schema>;

const toValues = (c: CourseDetail): Values => ({
  title: c.title,
  subtitle: c.subtitle ?? '',
  description: c.description ?? '',
  language: c.language,
  level: c.level,
  track: c.track,
  categoryId: c.category?.id ?? null,
  primaryTopic: c.primaryTopic,
});

export function BasicsForm({ categories }: { categories: CategoryNode[] }) {
  const { course, setCourse, setDirty } = useCourse();
  const locked = course.status === 'in_review';
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(course) });
  const [title, subtitle, description] = useWatch({ control, name: ['title', 'subtitle', 'description'] });
  const words = countWords(description);

  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);

  async function onSubmit(values: Values) {
    const { primaryTopic, ...fields } = values;
    try {
      const updated = await updateCourse(course.id, { ...fields, primaryTopicId: primaryTopic?.id ?? null });
      setCourse(updated);
      reset(values);
      toast.success('Đã lưu');
    } catch (err) {
      applySaveError(
        err,
        setError,
        () => setCourse({ ...course, status: 'in_review' }),
        (path) => (path[0] === 'primaryTopicId' ? 'primaryTopic' : path[0]),
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-2xl font-extrabold">Trang tổng quan khoá học</h1>
        <SaveButton isDirty={isDirty} isSubmitting={isSubmitting} locked={locked} />
      </div>

      <fieldset disabled={locked} className="space-y-6">
        <Field label="Tiêu đề khoá học" htmlFor="title" error={errors.title?.message} counter={`${title.length}/${TITLE_MAX}`}>
          <Input id="title" maxLength={TITLE_MAX} className="scroll-mt-20" aria-invalid={!!errors.title} {...register('title')} />
        </Field>

        <Field
          label="Phụ đề khoá học"
          htmlFor="subtitle"
          error={errors.subtitle?.message}
          counter={`${subtitle.length}/${SUBTITLE_MAX}`}
        >
          <Input
            id="subtitle"
            maxLength={SUBTITLE_MAX}
            placeholder="Một câu tóm tắt học viên sẽ đạt được gì"
            className="scroll-mt-20"
            aria-invalid={!!errors.subtitle}
            {...register('subtitle')}
          />
        </Field>

        <Field
          label="Mô tả khoá học"
          htmlFor="description"
          error={errors.description?.message}
          hint={`${words} từ${words < MIN_WORDS ? ` · nên có ít nhất ${MIN_WORDS} từ` : ''}`}
        >
          <Textarea
            id="description"
            rows={10}
            className="min-h-40 scroll-mt-20"
            aria-invalid={!!errors.description}
            {...register('description')}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ngôn ngữ" htmlFor="language">
            <Controller
              control={control}
              name="language"
              render={({ field }) => (
                <EnumSelect id="language" labels={LANGUAGE_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn ngôn ngữ" />
              )}
            />
          </Field>
          <Field label="Cấp độ" htmlFor="level" error={errors.level?.message}>
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <EnumSelect id="level" labels={SKILL_LEVEL_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn cấp độ" />
              )}
            />
          </Field>
          <Field label="Track nghề nghiệp" htmlFor="track" error={errors.track?.message}>
            <Controller
              control={control}
              name="track"
              render={({ field }) => (
                <EnumSelect id="track" labels={TRACK_LABEL} value={field.value} onChange={field.onChange} placeholder="Chọn track" />
              )}
            />
          </Field>
        </div>

        <Field anchor="category" label="Thể loại" htmlFor="category-l1" error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <CategoryPicker categories={categories} value={field.value} onChange={field.onChange} invalid={!!errors.categoryId} />
            )}
          />
        </Field>

        <Field
          anchor="topic"
          label="Khoá học của bạn chủ yếu dạy gì?"
          htmlFor="topic-search"
          error={errors.primaryTopic?.message}
          hint="Chọn một chủ đề chính, ví dụ React hoặc Docker."
        >
          <Controller
            control={control}
            name="primaryTopic"
            render={({ field }) => <TopicPicker value={field.value} onChange={field.onChange} invalid={!!errors.primaryTopic} />}
          />
        </Field>

        <div id="thumbnail" className="grid scroll-mt-20 gap-4 sm:grid-cols-2">
          {['Ảnh bìa khoá học', 'Video quảng cáo'].map((label) => (
            <div key={label} className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">Sắp có (đợt 2)</p>
            </div>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  anchor,
  error,
  hint,
  counter,
  children,
}: {
  label: string;
  htmlFor: string;
  anchor?: string; // id để checklist cuộn tới, khi control không có id trùng anchor
  error?: string;
  hint?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={anchor} className="scroll-mt-20 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {counter && <span className="text-xs text-muted-foreground">{counter}</span>}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function EnumSelect<T extends string>({
  id,
  labels,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  labels: Record<T, string>;
  value: T | null;
  onChange: (value: T) => void;
  placeholder: string;
}) {
  return (
    <Select items={labels} value={value} onValueChange={(v) => v && onChange(v as T)}>
      <SelectTrigger id={id} className="w-full scroll-mt-20">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(labels) as T[]).map((key) => (
          <SelectItem key={key} value={key}>
            {labels[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

Anchor → phần tử: `subtitle`/`description` = id của Input/Textarea; `level`/`track` = id của `SelectTrigger`; `category`/`topic` = `Field anchor`; `thumbnail` = khung "Sắp có". Không có id trùng nhau.

- [ ] **Step 4: Trang (server component)**

`src/app/instructor/(manage)/courses/[id]/manage/basics/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getCategoryTree } from '@/lib/api/categories';
import { BasicsForm } from '../_components/basics-form';

export const metadata: Metadata = { title: 'Trang tổng quan | SkillPath' };

// Server component: cây danh mục lấy qua getCategoryTree ('use cache', cacheLife hours) có sẵn,
// truyền xuống CategoryPicker bằng props (spec §5.2). Dữ liệu khoá lấy từ CourseProvider (client).
export default async function BasicsPage() {
  return <BasicsForm categories={await getCategoryTree()} />;
}
```

- [ ] **Step 5: Typecheck + lint + build**

BE phải đang chạy (`back-end: pnpm dev`) để `getCategoryTree` có dữ liệu lúc build (không có thì fallback `[]`, build vẫn qua).

```bash
pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build 2>&1 | tail -40
```

Expected: `tsc`/lint sạch; build `✓ Compiled successfully`, không lỗi blocking-route; bảng route có `/instructor/courses/[id]/manage/goals`, `/instructor/courses/[id]/manage/basics`. Nếu build báo "Uncached data / URL data accessed outside of `<Suspense>`" ở route `manage`: kiểm `layout.tsx` Task 10 Step 6 có bọc `Suspense` và mọi `useParams`/`usePathname` nằm dưới `CourseProvider`. Nếu `Select` của Base UI báo lỗi kiểu `items`/`onValueChange`: đọc `node_modules/@base-ui/react/select/root/SelectRoot.d.ts` và chỉnh theo chữ ký thật.

---

### Task 13: Kiểm tra toàn bộ, kiểm tay bằng Chrome, đề xuất commit

**Files:** không tạo file mới.

- [ ] **Step 1: Test BE**

```bash
cd back-end && pnpm test && pnpm test:e2e && pnpm exec tsc --noEmit -p tsconfig.json; pnpm lint
```

Expected: unit PASS (gồm `zod.pipe`, `slugify`, `course-checklist`, `auth`, `sentry-redact`, `app.controller`); e2e PASS toàn bộ (`auth`, `app`, `categories`, `taxonomy`, `udemy-curriculum`, `instructor-courses`); `tsc` chỉ còn lỗi baseline; lint sạch.

- [ ] **Step 2: FE tĩnh**

```bash
cd ../it-course-platform && pnpm exec tsc --noEmit && pnpm lint && node --test $(find src -name '*.test.ts')
```

Expected: sạch; test cũ PASS.

- [ ] **Step 3: Chạy app** — BE `cd back-end && pnpm dev`; FE: `rm -rf .next && pnpm dev` (xoá cache `'use cache'` của cây danh mục chưa có `id`).

- [ ] **Step 4: Kiểm tay bằng Chrome DevTools** (controller lái Chrome; chụp màn hình từng mục)

1. Đăng nhập bằng một tài khoản học viên (role `student`) → bấm "Chuyển sang Giảng viên" ở header → màn **"Trở thành giảng viên"** → "Bắt đầu dạy học" → vào dashboard giảng viên (header + sidebar), không cần tải lại. Network: `POST /api/me/become-instructor` 200, sau đó `get-session` trả role `student,instructor`.
2. Đăng xuất, mở `/instructor/courses` → chuyển `/login?redirect=%2Finstructor%2Fcourses`; đăng nhập lại → quay về đúng trang.
3. `/instructor/courses` chưa có khoá → trạng thái trống + nút "Tạo khoá học". Mở dialog: nút **Tạo** disabled khi rỗng/chỉ khoảng trắng; bộ đếm giảm từ 60; không gõ quá 60 ký tự. Tạo "Lập trình React từ số 0" → chuyển `/instructor/courses/<id>/manage/goals`.
4. Trang quản lý: không có header/sidebar dashboard; thanh trên có "← Quay lại khoá học", tên khoá, badge "Bản nháp", "Xem trước" disabled. Sidebar: "Học viên mục tiêu" (vòng tròn) liệt kê 3 dòng thiếu; "Khung chương trình", "Định giá", "Khuyến mại" mờ + "Sắp có"; "Trang tổng quan" liệt kê 7 dòng thiếu; nút "Gửi đi để xem xét" disabled.
5. `goals`: 4 ô mục tiêu + 1 + 1 ô; nút **Lưu** disabled. Bấm dòng "Cần ít nhất 1 yêu cầu" → cuộn tới mục yêu cầu (không bị thanh trên che). Điền 4 mục tiêu, 1 yêu cầu, 1 đối tượng → Lưu bật → "Đang lưu…" → toast "Đã lưu" → Lưu disabled lại, "Học viên mục tiêu" thành dấu tick, danh sách thiếu biến mất. "+ Thêm câu trả lời" disabled khi đủ 10 ô; nút xoá disabled khi còn 1 ô.
6. Rời trang khi chưa lưu: sửa một ô → bấm "← Quay lại khoá học" → hộp `confirm('Bỏ thay đổi chưa lưu?')`; Huỷ → ở lại, dữ liệu còn; bấm dòng thiếu của chính trang đang mở → không hỏi. Tải lại trang (F5) khi đang sửa → trình duyệt hỏi rời trang (`beforeunload`; với DevTools MCP dùng `handle_dialog`).
7. `basics`: xoá hết tiêu đề → Lưu → lỗi "Nhập tiêu đề khoá học" dưới ô (validation FE). Nhập phụ đề (bộ đếm x/120), mô tả (hiện "N từ · nên có ít nhất 200 từ"), chọn Ngôn ngữ/Cấp độ/Track, Thể loại "Phát triển" → Thể loại con "Phát triển web" (ô con disabled cho tới khi chọn cấp 1), gõ "rea" trong ô chủ đề → sau ~300ms có gợi ý (Network: chỉ 1 request `/api/topics?q=rea`) → chọn "React" → badge + nút X. Lưu → toast; thanh trên cập nhật tiêu đề mới; checklist "Trang tổng quan" chỉ còn "Mô tả còn thiếu … từ" và "Chưa có ảnh bìa". Tải lại → dữ liệu còn nguyên, thể loại cấp 1 hiện đúng.
8. Lỗi 400 từ BE: trong DevTools console chạy `fetch('<API>/api/instructor/courses/<id>', {method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({categoryId: '<id category cấp 1>'})}).then(r=>r.json())` → `400` `errors[0].path = ['categoryId']` (BE chặn cả khi FE bị bỏ qua).
9. Lỗi mạng: DevTools Network "Offline" → sửa và Lưu → toast "Lưu thất bại, thử lại", dữ liệu form giữ nguyên; bật lại mạng, Lưu được.
10. `/instructor/courses/<id>/manage` → tự chuyển `/manage/goals`. `/instructor/courses/<uuid ngẫu nhiên>/manage/goals` → "Không tìm thấy khoá học" + link về danh sách. Đăng nhập tài khoản giảng viên khác mở URL khoá trên → cũng "Không tìm thấy khoá học".
11. `/instructor/courses`: dòng khoá có ảnh placeholder, badge, "Hoàn thiện 1/3 mục" (sau bước 5) , "Sửa lần cuối …", "Chỉnh sửa" → `manage/goals`. Link "+ Tạo khoá học mới" ở `/instructor` → `/instructor/courses`.
12. (Tuỳ chọn, cần sếp đồng ý vì ghi DB dev) đặt khoá sang `in_review` bằng `cd back-end && node --env-file=.env -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.course.update({where:{id:'<id>'},data:{status:'in_review'}}).then(()=>p.\$disconnect())"` → tải lại trang quản lý: banner "Khoá học đang chờ duyệt, không sửa được", mọi ô và nút Lưu disabled; đặt lại `draft` sau khi kiểm.
13. 390×844: trang quản lý xếp dọc (sidebar trên, form dưới), không tràn ngang; dialog tạo khoá vừa màn hình.

- [ ] **Step 5: Đề xuất commit (KHÔNG tự commit)**

Trình `git status` + `git diff --stat` cho sếp, đề xuất:

```
feat: tạo khoá học, học viên mục tiêu, trang tổng quan (đợt 1 flow giảng viên)

- DB: migration course_draft_nullable (categoryId/track/level cho NULL lúc nháp, drop welcomeMessage/congratsMessage)
- BE: ZodValidationPipe (zod), POST /me/become-instructor (refresh cache session qua internalAdapter)
- BE: module instructor-courses (tạo/danh sách/chi tiết/PATCH, checklist, slug), GET /topics, id trong cây danh mục
- FE: tách instructor thành (dashboard)/(manage), gate vai trò giảng viên
- FE: danh sách khoá + modal tạo khoá, trang quản lý toàn màn hình với checklist, Học viên mục tiêu, Trang tổng quan
```

Chờ sếp duyệt trước khi chạy `git commit`. Không push, không thêm Co-Authored-By.
