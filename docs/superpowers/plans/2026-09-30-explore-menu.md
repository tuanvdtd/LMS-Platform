# Menu "Khám phá" kiểu Udemy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menu "Khám phá" 3 cấp (category cấp 1 → cấp 2 → topic phổ biến) lấy từ DB, header responsive như Udemy, FE bật `cacheComponents` kèm loading skeleton.

**Architecture:** BE thêm bảng curated `category_topics` (2 migration: schema, seed) và `GET /api/categories/tree` public. FE lấy cây trong Server Component `SiteHeader` bằng hàm `'use cache'` (`cacheLife` hours, lỗi thì minutes + `[]`), truyền xuống `Header` client. Desktop dùng `Popover` (Base UI) + 3 cột Tailwind, mobile dùng `Sheet` + 3 màn trượt. Đổi route chi tiết khoá sang `/course/[slug]` để `/courses/...` dành cho danh mục.

**Tech Stack:** NestJS 12, Prisma 6.19, vitest 4 + supertest, Next.js 16.3 (cacheComponents), shadcn base-nova (Base UI), Tailwind v4, axios, `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-30-explore-menu-design.md`

## Global Constraints

- Nhánh `feat/explore-menu`. **Không commit giữa chừng, không push, không thêm Co-Authored-By.** Sếp chưa chọn chế độ commit cho task này → mặc định hỏi trước mỗi commit; plan gom lại **một** đề xuất commit ở Task 10 và chờ duyệt.
- Lệnh BE chạy từ `back-end/`, cần `.env` trỏ DB **dev**. Lệnh FE chạy từ `it-course-platform/`. Package manager: `pnpm`.
- Next 16 khác bản cũ: trước khi viết code FE, đọc `it-course-platform/node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` và `03-api-reference/04-functions/cacheLife.md`.
- Không sửa migration cũ. `prisma migrate dev` **luôn** kèm `--create-only`, mở file sinh ra xoá mọi lệnh động tới `idx_courses_embedding`, `uq_course_primary_topic` (object viết tay, xem `back-end/README.md`), rồi mới `prisma migrate deploy`.
- Không dùng axios cho `/api/auth/*` (đã có `authClient`). Không thêm Zustand/TanStack Query.
- Màu dùng token (`text-primary`, `bg-muted`, `bg-popover`, `text-muted-foreground`), không hard-code màu Udemy.

---

## File map

| File | Việc |
|---|---|
| `back-end/prisma/schema.prisma` | Sửa: thêm `CategoryTopic`, relation ngược ở `Category`, `Topic` |
| `back-end/prisma/migrations/<ts>_category_topics/migration.sql` | Prisma sinh |
| `back-end/prisma/migrations/<ts>_category_topics_seed/migration.sql` | Tạo: seed 185 dòng |
| `back-end/src/categories/categories.service.ts` | Tạo: dựng cây |
| `back-end/src/categories/categories.controller.ts` | Tạo: `GET /categories/tree` |
| `back-end/src/categories/categories.module.ts` | Tạo |
| `back-end/src/app.module.ts` | Sửa: import `CategoriesModule` |
| `back-end/test/categories.e2e-spec.ts` | Tạo: test seed + API |
| `it-course-platform/next.config.ts` | Sửa: `cacheComponents: true` |
| `it-course-platform/src/components/ui/{skeleton,popover,sheet}.tsx` | shadcn sinh |
| `it-course-platform/src/types/index.ts` | Sửa: `CategoryNode`, `SubcategoryNode`, `TopicLink` |
| `it-course-platform/src/lib/category-links.ts` (+ `.test.ts`) | Tạo: dựng URL |
| `it-course-platform/src/lib/api/client.ts` | Tạo: axios |
| `it-course-platform/src/lib/api/categories.ts` | Tạo: `getCategoryTree` |
| `it-course-platform/src/components/layout/site-header.tsx` | Tạo: Server wrapper |
| `it-course-platform/src/components/layout/account-links.ts` | Tạo: link tài khoản dùng chung |
| `it-course-platform/src/components/layout/explore-menu.tsx` | Tạo: mega menu desktop |
| `it-course-platform/src/components/layout/mobile-nav.tsx` | Tạo: drawer mobile |
| `it-course-platform/src/components/layout/header.tsx` | Viết lại: responsive |
| 4 layout + `src/app/not-found.tsx` | Sửa: `Header` → `SiteHeader` |
| `src/app/(student)/courses/[slug]/` → `src/app/(student)/course/[slug]/` | Chuyển route |
| `product-ui.tsx`, `cart-view.tsx`, `skills/page.tsx`, `instructor/courses/page.tsx` | Sửa link khoá |
| `src/components/skeletons/*.tsx` (6 file) | Tạo |
| `src/app/{(student),(auth),(focus),(cartless),instructor,learn}/loading.tsx` | Tạo |
| `docs/superpowers/specs/2026-09-29-udemy-taxonomy-topics-design.md` | Sửa: ghi chú D4, §5 |

---

### Task 1: Bảng `category_topics`

**Files:**
- Modify: `back-end/prisma/schema.prisma` (model `Category` ~dòng 240, model `Topic` ~dòng 538)
- Create: `back-end/prisma/migrations/<ts>_category_topics/migration.sql` (Prisma sinh)

**Interfaces:**
- Produces: model `CategoryTopic` (`category_topics`: `categoryId`, `topicId`, `position`), `Category.popularTopics`, `Topic.categories`.

- [ ] **Step 1: Thêm model vào `schema.prisma`**

Trong `model Category`, thêm dòng sau `courses  Course[]`:

```prisma
  popularTopics CategoryTopic[] // chỉ node cấp 2, xem CategoryTopic
```

Trong `model Topic`, thêm sau `targetedBy UserTargetTopic[]`:

```prisma
  categories CategoryTopic[]
```

Thêm model mới ngay sau `model Topic { ... }`:

```prisma
// "Các chủ đề phổ biến" trong menu Khám phá: danh sách curated theo category cấp 2
// (spec 2026-09-30-explore-menu E1, thay D4 của spec taxonomy). Chỉ seed ghi bảng này;
// "chỉ gắn vào cấp 2" do seed đảm bảo, khi có admin sửa thì kiểm ở service.
model CategoryTopic {
  categoryId String @db.Uuid
  topicId    String @db.Uuid
  position   Int    @default(0)

  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  topic    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([categoryId, topicId])
  @@index([categoryId, position])
  @@map("category_topics")
}
```

- [ ] **Step 2: Sinh migration, chưa áp dụng**

```bash
cd back-end && pnpm prisma migrate dev --create-only --name category_topics
```

- [ ] **Step 3: Dọn migration**

```bash
f=$(ls -d prisma/migrations/*_category_topics | tail -1)/migration.sql; cat "$f"; grep -c "idx_courses\|uq_course_primary_topic\|searchTsv\|mv_" "$f" || true
```

Expected: file chỉ có `CREATE TABLE "category_topics"`, `CREATE INDEX "category_topics_categoryId_position_idx"`, 2 `ADD CONSTRAINT ... FOREIGN KEY`. grep in `0`. Nếu có dòng khác (DROP INDEX ...), xoá dòng đó.

- [ ] **Step 4: Áp dụng + generate**

```bash
pnpm prisma migrate deploy && pnpm prisma generate
```

Expected: `All migrations have been successfully applied.`

- [ ] **Step 5: Kiểm schema và DB khớp**

```bash
pnpm prisma migrate diff --from-url "$DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script
```

(Nếu shell chưa có `DIRECT_URL`: `node --env-file=.env -e "console.log(process.env.DIRECT_URL)"` rồi truyền vào.) Expected: chỉ còn các dòng về `idx_courses_embedding` / `uq_course_primary_topic` hoặc `-- This is an empty migration.`; **không** có gì về `category_topics`.

---

### Task 2: Seed `category_topics` + test seed

**Files:**
- Create: `back-end/prisma/migrations/<ts>_category_topics_seed/migration.sql`
- Create: `back-end/test/categories.e2e-spec.ts`

**Interfaces:**
- Consumes: model `CategoryTopic` (Task 1).
- Produces: 185 dòng `category_topics` (24 category cấp 2 có topic, `other-it-and-software` trống).

- [ ] **Step 1: Viết test seed (fail)**

Tạo `back-end/test/categories.e2e-spec.ts`:

```ts
import '../src/env.js';
import { readFileSync, readdirSync } from 'node:fs';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

class Rollback extends Error {}
async function inRollback(fn: (tx: Prisma.TransactionClient) => Promise<void>) {
  await prisma
    .$transaction(async (tx) => {
      await fn(tx);
      throw new Rollback();
    })
    .catch((e: unknown) => {
      if (!(e instanceof Rollback)) throw e;
    });
}

const seedDir = readdirSync('prisma/migrations').find((d) => d.endsWith('_category_topics_seed'));
const seedSql = () => readFileSync(`prisma/migrations/${seedDir}/migration.sql`, 'utf8');

describe('category_topics — seed', () => {
  it('có 185 dòng, chỉ gắn vào category cấp 2, mỗi cấp 2 tối đa 9 topic', async () => {
    expect(await prisma.categoryTopic.count()).toBe(185);
    const rows = await prisma.categoryTopic.findMany({ include: { category: true } });
    expect(rows.every((r) => r.category.parentId !== null)).toBe(true);
    const perCat = new Map<string, number>();
    for (const r of rows) perCat.set(r.categoryId, (perCat.get(r.categoryId) ?? 0) + 1);
    expect(Math.max(...perCat.values())).toBeLessThanOrEqual(9);
  });

  it('Phát triển web: JavaScript đứng đầu, có Node.Js', async () => {
    const web = await prisma.category.findUnique({
      where: { slug: 'web-development' },
      include: { popularTopics: { orderBy: { position: 'asc' }, include: { topic: true } } },
    });
    const slugs = web!.popularTopics.map((p) => p.topic.slug);
    expect(slugs[0]).toBe('javascript');
    expect(slugs).toContain('nodejs');
  });

  it('một topic nằm được ở nhiều cấp 2 (python)', async () => {
    const n = await prisma.categoryTopic.count({ where: { topic: { slug: 'python' } } });
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it('chạy seed lần 2 không sinh dòng mới', () =>
    inRollback(async (tx) => {
      await tx.$executeRawUnsafe(seedSql());
      expect(await tx.categoryTopic.count()).toBe(185);
    }));
});
```

- [ ] **Step 2: Chạy test, xác nhận fail**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts
```

Expected: FAIL (`count` = 0, hoặc `seedDir` undefined → ENOENT).

- [ ] **Step 3: Tạo migration seed rỗng**

```bash
pnpm prisma migrate dev --create-only --name category_topics_seed
```

Mở file sinh ra; nếu Prisma sinh lệnh nào (drift) thì xoá hết. Dán nội dung sau thay toàn bộ file:

```sql
-- ============================================================================
--  Seed "Các chủ đề phổ biến" cho category cấp 2 (spec 2026-09-30-explore-menu §3.2).
--  Chọn tay từ topic đã seed ở taxonomy_seed, bám menu Khám phá của udemy.com (vi).
--  Idempotent: ON CONFLICT DO NOTHING. Slug sai → JOIN loại dòng, test đếm 185 sẽ bắt.
--  Thứ tự trong mảng = position (1-based).
-- ============================================================================
INSERT INTO category_topics ("categoryId", "topicId", position)
SELECT c.id, t.id, u.position
FROM (VALUES
  ('ai-fundamentals',        ARRAY['prompt-engineering','large-language-models','generative-ai','artificial-intelligence','chatgpt','claude-ai','google-gemini','microsoft-copilot','deepseek']),
  ('ai-for-developers',      ARRAY['ai-agents','openai-api','claude-code','github-copilot','openai-codex','retrieval-augmented-generation','langchain','springai','vibe-coding']),
  ('machine-learning',       ARRAY['machine-learning','deep-learning','tensorflow','pytorch','mlops','azure-machine-learning','data-science','python']),
  ('generative-ai-creative', ARRAY['midjourney','stable-diffusion','dall-e','generative-ai']),
  ('web-development',        ARRAY['javascript','angular','react','typescript','fastapi','aspnet-core','html','nodejs','nextjs']),
  ('data-science',           ARRAY['data-science','python','machine-learning','deep-learning','data-analysis','pandas','data-engineering','apache-kafka','sql']),
  ('mobile-apps',            ARRAY['google-flutter','react-native','ios-development','swift','swiftui','android-development','kotlin','dart-programming-language','mobile-development']),
  ('programming-languages',  ARRAY['python','java','c-sharp','javascript','c-plus-plus','c-programming','go-programming-language','python-scripting','spring-framework']),
  ('game-development',       ARRAY['unity','unreal-engine','unreal-engine-blueprints','godot','game-development','2d-game-development','3d-game-development','c-sharp','blender']),
  ('databases',              ARRAY['sql','mysql','postgresql','sql-server','oracle-sql','plsql','database-management']),
  ('software-testing',       ARRAY['automation-testing','playwright','selenium-webdriver','pytest','postman','istqb-certified-tester-foundation-level-ctfl']),
  ('software-engineering',   ARRAY['software-architecture','data-structures','algorithms','system-design-interview']),
  ('development-tools',      ARRAY['git','github','docker','kubernetes','devops']),
  ('no-code-development',    ARRAY['n8n','wordpress','microsoft-powerapps','microsoft-flow']),
  ('it-certification',       ARRAY['amazon-aws','aws-certified-cloud-practitioner','aws-certified-solutions-architect-associate','aws-certified-ai-practitioner','certified-kubernetes-application-developer-ckad','comptia-a','comptia-network','comptia-security','cisco-ccna']),
  ('network-and-security',   ARRAY['cyber-security','ethical-hacking','network-security','it-networking-fundamentals','information-security','it-audit','fortigate','ai-security','cc-certified-in-cybersecurity']),
  ('hardware',               ARRAY['embedded-systems','embedded-c','microcontroller','arduino','electronics','plc','kicad','circuit-design','robotic-process-automation']),
  ('operating-systems',      ARRAY['linux','linux-administration','windows-server','system-administration','active-directory','powershell','shell-scripting','proxmox-ve']),
  ('web-design',             ARRAY['figma','web-accessibility','elementor','wordpress','user-interface','css','html']),
  ('graphic-design-and-illustration', ARRAY['graphic-design','drawing','adobe-illustrator','photoshop','indesign','procreate-ipad-app','affinity-designer','digital-painting','canva']),
  ('design-tools',           ARRAY['figma','canva','photoshop','adobe-illustrator','autocad','solidworks','fusion-360','after-effects','blender']),
  ('user-experience',        ARRAY['user-experience-design','user-interface','mobile-app-design','ux-writing','web-accessibility','product-design','design-thinking','figma']),
  ('game-design',            ARRAY['pixel-art','game-texturing','unity','unreal-engine','blender','3d-modeling','godot']),
  ('3d-and-animation',       ARRAY['blender','3d-modeling','3d-animation','3d-sculpting','3d-printing','after-effects','motion-graphics','vfx-visual-effects','fusion-360'])
) AS s(category_slug, topic_slugs)
CROSS JOIN LATERAL unnest(s.topic_slugs) WITH ORDINALITY AS u(topic_slug, position)
JOIN categories c ON c.slug = s.category_slug AND c."parentId" IS NOT NULL
JOIN topics t ON t.slug = u.topic_slug
ON CONFLICT ("categoryId", "topicId") DO NOTHING;
```

(Tổng: 9+9+8+4 + 9+9+9+9+9+7+6+4+5+4 + 9+9+9+8 + 7+9+9+8+7+9 = 185.)

- [ ] **Step 4: Áp dụng**

```bash
pnpm prisma migrate deploy
```

- [ ] **Step 5: Chạy test, xác nhận pass**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts
```

Expected: 4 test PASS. Nếu count < 185: có slug sai, tìm bằng
`SELECT s FROM unnest(ARRAY[...]) s WHERE s NOT IN (SELECT slug FROM topics)`.

- [ ] **Step 6: Test taxonomy cũ vẫn xanh**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/taxonomy.e2e-spec.ts
```

Expected: PASS (seed mới không đụng `categories`/`topics`).

---

### Task 3: API `GET /api/categories/tree`

**Files:**
- Create: `back-end/src/categories/categories.service.ts`, `categories.controller.ts`, `categories.module.ts`
- Modify: `back-end/src/app.module.ts`
- Test: `back-end/test/categories.e2e-spec.ts` (thêm `describe`)

**Interfaces:**
- Consumes: `PrismaService` (global, `src/infra/prisma.service.ts`), `@Public()` (`src/auth/decorators.ts`).
- Produces: `GET /api/categories/tree` → `CategoryNode[]` với `CategoryNode = { slug, name, children: { slug, name, topics: { slug, name }[] }[] }`, header `Cache-Control: public, max-age=300`.

- [ ] **Step 1: Viết test API (fail)**

Thêm vào đầu `back-end/test/categories.e2e-spec.ts` các import:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup-app.js';
```

Thêm cuối file:

```ts
type Tree = { slug: string; name: string; children: { slug: string; name: string; topics: { slug: string; name: string }[] }[] }[];

describe('GET /api/categories/tree', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
  });
  afterAll(() => app.close());

  it('public, có Cache-Control', () =>
    request(app.getHttpServer())
      .get('/api/categories/tree')
      .expect(200)
      .expect('Cache-Control', 'public, max-age=300'));

  it('tầng ngoài = category cấp 1 trong DB, đúng thứ tự position; con không có children', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/categories/tree');
    const tree = body as Tree;
    const roots = await prisma.category.findMany({ where: { parentId: null }, orderBy: { position: 'asc' } });
    expect(tree.map((c) => c.slug)).toEqual(roots.map((r) => r.slug));
    const dev = tree.find((c) => c.slug === 'development')!;
    const devKids = await prisma.category.findMany({
      where: { parent: { slug: 'development' } },
      orderBy: { position: 'asc' },
    });
    expect(dev.children.map((c) => c.slug)).toEqual(devKids.map((k) => k.slug));
    expect(dev.children.every((c) => !('children' in c))).toBe(true);
    expect(Object.keys(tree[0]).sort()).toEqual(['children', 'name', 'slug']);
  });

  it('web-development có topic javascript đứng đầu', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/categories/tree');
    const web = (body as Tree).flatMap((c) => c.children).find((c) => c.slug === 'web-development')!;
    expect(web.topics[0]).toEqual({ slug: 'javascript', name: 'JavaScript' });
  });
});
```

- [ ] **Step 2: Chạy, xác nhận fail**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts
```

Expected: 3 test mới FAIL với 404 (hoặc 401 vì guard global).

- [ ] **Step 3: Viết service**

`back-end/src/categories/categories.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';

export type TopicLink = { slug: string; name: string };
export type SubcategoryNode = { slug: string; name: string; topics: TopicLink[] };
export type CategoryNode = { slug: string; name: string; children: SubcategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Một query: cấp 1 → cấp 2 → topic phổ biến, cả ba sắp theo position.
  async tree(): Promise<CategoryNode[]> {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { position: 'asc' },
      select: {
        slug: true,
        name: true,
        children: {
          orderBy: { position: 'asc' },
          select: {
            slug: true,
            name: true,
            popularTopics: {
              orderBy: { position: 'asc' },
              select: { topic: { select: { slug: true, name: true } } },
            },
          },
        },
      },
    });
    return roots.map((r) => ({
      slug: r.slug,
      name: r.name,
      children: r.children.map((c) => ({
        slug: c.slug,
        name: c.name,
        topics: c.popularTopics.map((p) => p.topic),
      })),
    }));
  }
}
```

- [ ] **Step 4: Controller + module**

`back-end/src/categories/categories.controller.ts`:

```ts
import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { CategoriesService } from './categories.service.js';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  // FE cache phía server (cacheLife hours); max-age ngắn cho client/CDN.
  @Get('tree')
  @Header('Cache-Control', 'public, max-age=300')
  tree() {
    return this.categories.tree();
  }
}
```

`back-end/src/categories/categories.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';

@Module({ controllers: [CategoriesController], providers: [CategoriesService] })
export class CategoriesModule {}
```

Sửa `back-end/src/app.module.ts`: thêm `import { CategoriesModule } from './categories/categories.module.js';` và đổi `imports` thành `[SentryModule.forRoot(), InfraModule, AuthModule, CategoriesModule]`.

- [ ] **Step 5: Chạy test, xác nhận pass**

```bash
pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts && npx tsc --noEmit -p tsconfig.json
```

Expected: 7 test PASS. `tsc` chỉ còn lỗi có sẵn ở `src/sentry-redact.spec.ts` (ngoài phạm vi), không lỗi mới.

- [ ] **Step 6: Thử tay**

```bash
pnpm dev  # terminal khác
curl -s localhost:4000/api/categories/tree | head -c 400
```

Expected: JSON bắt đầu bằng `[{"slug":"artificial-intelligence","name":"Trí tuệ nhân tạo","children":[...`.

---

### Task 4: FE nền tảng: dependency, shadcn, type, link helper, axios

**Files:**
- Modify: `it-course-platform/package.json` (axios), `src/types/index.ts`
- Create: `src/components/ui/skeleton.tsx`, `popover.tsx`, `sheet.tsx` (shadcn CLI), `src/lib/category-links.ts`, `src/lib/category-links.test.ts`, `src/lib/api/client.ts`

**Interfaces:**
- Produces: types `TopicLink`, `SubcategoryNode`, `CategoryNode`; `categoryHref(l1: string, l2?: string): string`; `topicHref(slug: string): string`; `api` (AxiosInstance).

- [ ] **Step 1: Cài dependency + component**

```bash
cd it-course-platform && pnpm add axios && pnpm dlx shadcn@latest add skeleton popover sheet --yes
```

Nếu CLI hỏi ghi đè `button.tsx` (dependency của sheet) → trả lời **No**. Mở 3 file vừa sinh trong `src/components/ui/`, ghi lại tên export và prop thật (dự kiến: `Skeleton`; `Popover`, `PopoverTrigger`, `PopoverContent` nhận `align`/`sideOffset`/`className`; `Sheet`, `SheetTrigger`, `SheetContent` nhận `side`, `SheetTitle`). Nếu tên khác, các task sau dùng tên thật.

- [ ] **Step 2: Type**

Thêm cuối `src/types/index.ts`:

```ts
// Cây menu "Khám phá" — khớp GET /api/categories/tree (back-end/src/categories)
export interface TopicLink {
  slug: string;
  name: string;
}

export interface SubcategoryNode {
  slug: string;
  name: string;
  topics: TopicLink[];
}

export interface CategoryNode {
  slug: string;
  name: string;
  children: SubcategoryNode[];
}
```

- [ ] **Step 3: Viết test link (fail)**

`src/lib/category-links.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryHref, topicHref } from './category-links.ts';

test('link danh mục cấp 1 và cấp 2', () => {
  assert.equal(categoryHref('development'), '/courses/development');
  assert.equal(categoryHref('development', 'web-development'), '/courses/development/web-development');
});

test('link topic', () => {
  assert.equal(topicHref('javascript'), '/topic/javascript');
});
```

```bash
node --test src/lib/category-links.test.ts
```

Expected: FAIL (`Cannot find module './category-links.ts'`).

- [ ] **Step 4: Viết helper**

`src/lib/category-links.ts`:

```ts
// URL theo Udemy: /courses/<cấp 1>/<cấp 2>, /topic/<slug>. Chi tiết khoá ở /course/<slug>.
export function categoryHref(l1: string, l2?: string): string {
  return l2 ? `/courses/${l1}/${l2}` : `/courses/${l1}`;
}

export function topicHref(slug: string): string {
  return `/topic/${slug}`;
}
```

```bash
node --test src/lib/category-links.test.ts
```

Expected: 2 test PASS.

- [ ] **Step 5: axios client**

`src/lib/api/client.ts`:

```ts
import axios from 'axios';
import { safeRedirect } from '@/lib/safe-redirect';

// Client cho API nghiệp vụ gọi từ trình duyệt. withCredentials → gửi cookie session
// Better Auth (BE bật CORS credentials). Không dùng cho /api/auth/* — đã có authClient.
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(undefined, (err) => {
  if (axios.isAxiosError(err) && err.response?.status === 401 && typeof window !== 'undefined') {
    // Đang ở /login thì không redirect nữa, tránh vòng lặp reload
    if (window.location.pathname.startsWith('/login')) return Promise.reject(err);
    const back = safeRedirect(window.location.pathname + window.location.search);
    const url = new URL('/login', window.location.origin);
    url.searchParams.set('redirect', back);
    window.location.assign(url);
  }
  return Promise.reject(err);
});
```

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```

Expected: không lỗi mới.

---

### Task 5: Lấy cây danh mục + `SiteHeader`

**Files:**
- Create: `src/lib/api/categories.ts`, `src/components/layout/site-header.tsx`
- Modify: `next.config.ts`, `src/components/layout/header.tsx` (chỉ chữ ký props ở task này), `src/app/(student)/layout.tsx`, `src/app/(cartless)/layout.tsx`, `src/app/(focus)/layout.tsx`, `src/app/instructor/layout.tsx`, `src/app/not-found.tsx`

**Interfaces:**
- Consumes: `CategoryNode` (Task 4).
- Produces: `getCategoryTree(): Promise<CategoryNode[]>`; `<SiteHeader cartCount?: number />`; `Header` props `{ cartCount?: number; categories: CategoryNode[] }`.

- [ ] **Step 0: Bật `cacheComponents`**

`'use cache'` là lỗi biên dịch khi cờ chưa bật, và `SiteHeader` có ở mọi layout → bật ngay ở task này. `next.config.ts`, trong `nextConfig` thêm dòng đầu:

```ts
  // Cache chủ động bằng 'use cache' + cacheLife (spec E5). Xem docs 01-getting-started/08-caching.md
  cacheComponents: true,
```

Từ đây tới hết Task 8 chỉ chạy `tsc`/`lint`; `next build` sẽ còn lỗi blocking-route cho tới Task 9 (có `loading.tsx`). `pnpm dev` vẫn chạy được, lỗi hiện ở dev overlay là bình thường.

- [ ] **Step 1: Hàm lấy cây**

`src/lib/api/categories.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import { cacheLife } from 'next/cache';
import type { CategoryNode } from '@/types';

// Chỉ chạy ở server. Taxonomy hầu như không đổi → cache theo giờ.
// Lỗi: trả [] NGAY TRONG 'use cache' với cacheLife ngắn (spec E10). Bắt ở ngoài thì []
// bị nướng vào static shell lúc build và không có entry nào để revalidate.
export async function getCategoryTree(): Promise<CategoryNode[]> {
  'use cache';
  try {
    // Timeout: BE treo lúc build thì rơi nhanh vào nhánh [] thay vì chờ prerender timeout
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/tree`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`categories/tree ${res.status}`);
    const data = (await res.json()) as CategoryNode[];
    cacheLife('hours'); // sau khi parse OK: mỗi lần gọi chỉ một cacheLife chạy
    return data;
  } catch (err) {
    Sentry.captureException(err);
    cacheLife('minutes');
    return [];
  }
}
```

- [ ] **Step 2: `SiteHeader`**

`src/components/layout/site-header.tsx`:

```tsx
import Header from '@/components/layout/header';
import { getCategoryTree } from '@/lib/api/categories';

// Server wrapper: lấy cây danh mục (cache) rồi truyền cho Header client.
export default async function SiteHeader({ cartCount }: { cartCount?: number }) {
  return <Header cartCount={cartCount} categories={await getCategoryTree()} />;
}
```

- [ ] **Step 3: `Header` nhận prop bắt buộc**

Trong `src/components/layout/header.tsx` đổi chữ ký:

```tsx
import type { CategoryNode } from '@/types';

export default function Header({
  cartCount = 0,
  categories,
}: {
  cartCount?: number;
  categories: CategoryNode[];
}) {
```

(Thân hàm viết lại ở Task 7; `categories` tạm chưa dùng.)

- [ ] **Step 4: Đổi 5 chỗ render**

Ở mỗi file dưới, đổi import `import Header from "@/components/layout/header";` thành `import SiteHeader from "@/components/layout/site-header";` và `<Header cartCount={N} />` thành `<SiteHeader cartCount={N} />` (giữ nguyên N):

- `src/app/(student)/layout.tsx` (N=2)
- `src/app/(cartless)/layout.tsx` (N=0)
- `src/app/(focus)/layout.tsx` (N=2)
- `src/app/instructor/layout.tsx` (N=2)
- `src/app/not-found.tsx` (N=0, import dùng nháy đơn)

- [ ] **Step 5: Kiểm không sót**

```bash
grep -rn "<Header" src/app; npx tsc --noEmit
```

Expected: grep không ra dòng nào; `tsc` sạch (sót chỗ nào thì báo thiếu prop `categories`).

---

### Task 6: Mega menu desktop

**Files:**
- Create: `src/components/layout/explore-menu.tsx`

**Interfaces:**
- Consumes: `CategoryNode`, `categoryHref`, `topicHref`, `Popover*`, `Button`.
- Produces: `<ExploreMenu categories={CategoryNode[]} />`.

- [ ] **Step 1: Viết component**

`src/components/layout/explore-menu.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryHref, topicHref } from '@/lib/category-links';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { CategoryNode } from '@/types';

// Menu "Khám phá" kiểu Udemy: 3 cột liền nhau (cấp 1 → cấp 2 → chủ đề phổ biến).
// shadcn không có cascading panel nên cột tự dựng bằng Tailwind (spec E6).
// Chuột: hover mở cột kế. Bàn phím: Tab đi trong cột, → mở cột kế và focus dòng đầu,
// ← quay về dòng cha. Không mở cột theo onFocus: Base UI focus dòng đầu khi mở bằng
// click/Enter, và Tab qua cả cột 1 sẽ liên tục đổi cột 2.
export function ExploreMenu({ categories }: { categories: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const [l1Slug, setL1Slug] = useState<string | null>(null);
  const [l2Slug, setL2Slug] = useState<string | null>(null);
  const l1 = categories.find((c) => c.slug === l1Slug);
  const l2 = l1?.children.find((c) => c.slug === l2Slug);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setL1Slug(null);
      setL2Slug(null);
    }
  }
  const close = () => onOpenChange(false);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger openOnHover delay={150} render={<Button variant="ghost" size="sm" className="px-3" />}>
        Khám phá
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="flex w-auto flex-row gap-0 overflow-hidden p-0">
        {categories.length === 0 ? (
          <p className="w-72 px-4 py-3 text-sm text-muted-foreground">Không tải được danh mục</p>
        ) : (
          <>
            <MenuColumn level={1}>
              {categories.map((c) => (
                <MenuRow
                  key={c.slug}
                  href={categoryHref(c.slug)}
                  active={c.slug === l1Slug}
                  chevron
                  onActivate={() => {
                    setL1Slug(c.slug);
                    setL2Slug(null);
                  }}
                  onNavigate={close}
                >
                  {c.name}
                </MenuRow>
              ))}
            </MenuColumn>
            {l1 && (
              <MenuColumn level={2}>
                {l1.children.map((c) => (
                  <MenuRow
                    key={c.slug}
                    href={categoryHref(l1.slug, c.slug)}
                    active={c.slug === l2Slug}
                    chevron={c.topics.length > 0}
                    onActivate={() => setL2Slug(c.slug)}
                    onNavigate={close}
                    parentLevel={1}
                  >
                    {c.name}
                  </MenuRow>
                ))}
              </MenuColumn>
            )}
            {l2 && l2.topics.length > 0 && (
              <MenuColumn level={3} title="Các chủ đề phổ biến">
                {l2.topics.map((t) => (
                  <MenuRow key={t.slug} href={topicHref(t.slug)} onNavigate={close} parentLevel={2}>
                    {t.name}
                  </MenuRow>
                ))}
              </MenuColumn>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function MenuColumn({ level, title, children }: { level: 1 | 2 | 3; title?: string; children: React.ReactNode }) {
  return (
    <div data-menu-col={level} className="max-h-[70vh] w-72 overflow-y-auto border-l py-2 first:border-l-0">
      {title && <p className="px-4 pb-2 pt-2 text-sm font-bold text-muted-foreground">{title}</p>}
      <ul>{children}</ul>
    </div>
  );
}

function MenuRow({
  href,
  active = false,
  chevron = false,
  onActivate,
  onNavigate,
  parentLevel,
  children,
}: {
  href: string;
  active?: boolean;
  chevron?: boolean;
  onActivate?: () => void;
  onNavigate: () => void;
  parentLevel?: 1 | 2; // cột chứa dòng cha, để ← quay về
  children: React.ReactNode;
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLAnchorElement>) {
    const panel = e.currentTarget.closest('[data-menu-col]')?.parentElement;
    const level = Number(e.currentTarget.closest('[data-menu-col]')?.getAttribute('data-menu-col'));
    if (e.key === 'ArrowRight' && chevron && onActivate) {
      e.preventDefault();
      flushSync(onActivate); // render cột kế trước khi focus
      panel?.querySelector<HTMLElement>(`[data-menu-col="${level + 1}"] a`)?.focus();
    } else if (e.key === 'ArrowLeft' && parentLevel) {
      e.preventDefault();
      panel?.querySelector<HTMLElement>(`[data-menu-col="${parentLevel}"] a[data-active="true"]`)?.focus();
    }
  }

  return (
    <li>
      <Link
        href={href}
        data-active={active}
        onMouseEnter={onActivate}
        onKeyDown={onKeyDown}
        onClick={onNavigate}
        className={cn(
          'flex items-center justify-between gap-2 px-4 py-2 text-sm text-foreground outline-none hover:text-primary focus-visible:bg-muted',
          active && 'bg-muted text-primary',
        )}
      >
        {children}
        {chevron && <ChevronRight size={14} className="shrink-0" />}
      </Link>
    </li>
  );
}
```

Nếu `PopoverTrigger` do shadcn sinh không chuyển tiếp `openOnHover`/`delay` (xem file ở Task 4 Step 1), truyền thẳng qua props vì component trải `...props` xuống `PopoverPrimitive.Trigger` (Base UI 1.8 có 2 prop này).

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: sạch.

---

### Task 7: Drawer mobile + header responsive

**Files:**
- Create: `src/components/layout/account-links.ts`, `src/components/layout/mobile-nav.tsx`
- Modify (viết lại): `src/components/layout/header.tsx`

**Interfaces:**
- Consumes: `ExploreMenu` (Task 6), `Sheet*`, `Skeleton` (Task 4), `authClient`.
- Produces: `accountLinks`; `<MobileNav categories user onSignOut />`; `Header` responsive.

- [ ] **Step 1: Link tài khoản dùng chung**

`src/components/layout/account-links.ts`:

```ts
import { Award, BarChart2, BookOpen, Briefcase, Settings } from 'lucide-react';

// Dùng chung cho dropdown avatar (desktop) và drawer (mobile).
export const accountLinks = [
  { icon: BookOpen, label: 'Học tập của tôi', to: '/my-learning' },
  { icon: BarChart2, label: 'Hồ sơ năng lực', to: '/skills' },
  { icon: Award, label: 'Chứng chỉ', to: '/certificates' },
  { icon: Briefcase, label: 'Lịch sử mua hàng', to: '/orders' },
  { icon: Settings, label: 'Cài đặt', to: '/settings' },
] as const;
```

- [ ] **Step 2: Drawer**

`src/components/layout/mobile-nav.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Bell, ChevronLeft, ChevronRight, LogOut, Menu, MessageCircle, Moon, Sun, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryHref, topicHref } from '@/lib/category-links';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { accountLinks } from '@/components/layout/account-links';
import type { CategoryNode } from '@/types';

type NavUser = { name: string; email: string };

// 3 màn nằm ngang trong một dải rộng 300%, trượt theo độ sâu của stack.
const SLIDE = ['translate-x-0', '-translate-x-1/3', '-translate-x-2/3'] as const;

export function MobileNav({
  categories,
  user,
  onSignOut,
}: {
  categories: CategoryNode[];
  user: NavUser | undefined;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<string[]>([]);
  const { resolvedTheme, setTheme } = useTheme();
  const l1 = categories.find((c) => c.slug === stack[0]);
  const l2 = l1?.children.find((c) => c.slug === stack[1]);
  const close = () => setOpen(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setStack([]);
      }}
    >
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Mở menu" />}>
        <Menu size={20} />
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 overflow-hidden p-0 data-[side=left]:w-72">
        <SheetTitle className="sr-only">Điều hướng</SheetTitle>
        <div className={cn('flex h-full w-[300%] transition-transform duration-200', SLIDE[stack.length])}>
          {/* Màn gốc */}
          <Screen>
            {user ? (
              <div className="border-b py-3 pl-4 pr-12">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-b py-3 pl-2 pr-12">
                <Link href="/login" onClick={close} className="px-2 py-2 text-sm font-medium text-primary">Đăng nhập</Link>
                <Link href="/register" onClick={close} className="px-2 py-2 text-sm font-medium text-primary">Đăng ký</Link>
              </div>
            )}
            <SectionTitle>Danh mục</SectionTitle>
            {categories.length === 0 && (
              <p className="px-4 py-2 text-sm text-muted-foreground">Không tải được danh mục</p>
            )}
            {categories.map((c) => (
              <DrillRow key={c.slug} onClick={() => setStack([c.slug])}>{c.name}</DrillRow>
            ))}
            {user && (
              <div className="mt-2 border-t py-2">
                {/* Header mobile ẩn 💬 🔔 → đưa vào drawer */}
                <Link href="/messages" onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <MessageCircle size={15} className="text-muted-foreground" />
                  Tin nhắn
                </Link>
                <Link href="/notifications" onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <Bell size={15} className="text-muted-foreground" />
                  Thông báo
                </Link>
                {accountLinks.map(({ icon: Icon, label, to }) => (
                  <Link key={to} href={to} onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <Icon size={15} className="text-muted-foreground" />
                    {label}
                  </Link>
                ))}
                <Link href="/instructor" onClick={close} className="flex items-center gap-3 px-4 py-2 text-sm text-primary">
                  <User size={15} />
                  Chuyển sang Giảng viên
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            )}
            <div className="mt-2 border-t py-2">
              <Link href="/teach" onClick={close} className="block px-4 py-2 text-sm">Dạy học</Link>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="flex w-full items-center gap-3 px-4 py-2 text-sm"
              >
                <Sun size={15} className="hidden dark:block" />
                <Moon size={15} className="dark:hidden" />
                Đổi giao diện sáng/tối
              </button>
            </div>
          </Screen>

          {/* Màn cấp 1 */}
          <Screen>
            {l1 && (
              <>
                <BackRow onClick={() => setStack([])}>Menu</BackRow>
                <Link href={categoryHref(l1.slug)} onClick={close} className="block px-4 py-2 text-sm font-semibold text-primary">
                  Tất cả {l1.name}
                </Link>
                {l1.children.map((c) =>
                  c.topics.length > 0 ? (
                    <DrillRow key={c.slug} onClick={() => setStack([l1.slug, c.slug])}>{c.name}</DrillRow>
                  ) : (
                    <Link key={c.slug} href={categoryHref(l1.slug, c.slug)} onClick={close} className="block px-4 py-2 text-sm">
                      {c.name}
                    </Link>
                  ),
                )}
              </>
            )}
          </Screen>

          {/* Màn cấp 2 */}
          <Screen>
            {l1 && l2 && (
              <>
                <BackRow onClick={() => setStack([l1.slug])}>{l1.name}</BackRow>
                <Link href={categoryHref(l1.slug, l2.slug)} onClick={close} className="block px-4 py-2 text-sm font-semibold text-primary">
                  Tất cả {l2.name}
                </Link>
                <SectionTitle>Các chủ đề phổ biến</SectionTitle>
                {l2.topics.map((t) => (
                  <Link key={t.slug} href={topicHref(t.slug)} onClick={close} className="block px-4 py-2 text-sm">
                    {t.name}
                  </Link>
                ))}
              </>
            )}
          </Screen>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// pr-12 ở dòng đầu mỗi màn: chừa chỗ nút ✕ mặc định của SheetContent (absolute top-3 right-3).
function Screen({ children }: { children: React.ReactNode }) {
  return <nav className="h-full w-1/3 overflow-y-auto pb-6">{children}</nav>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="px-4 pb-1 pt-4 text-xs font-bold uppercase text-muted-foreground">{children}</p>;
}

function DrillRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between px-4 py-2 text-left text-sm">
      {children}
      <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
    </button>
  );
}

function BackRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 border-b bg-muted py-3 pl-4 pr-12 text-sm font-medium">
      <ChevronLeft size={16} />
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Viết lại `header.tsx`**

Thay toàn bộ `src/components/layout/header.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Bell, BookOpen, LogOut, MessageCircle, Moon, Search, ShoppingCart, Sun, User, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { accountLinks } from '@/components/layout/account-links';
import { ExploreMenu } from '@/components/layout/explore-menu';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { CategoryNode } from '@/types';

// Bố cục theo Udemy (spec §5.1): < lg = ☰ · logo giữa · 🔍 🛒; ≥ lg = đầy đủ.
export default function Header({
  cartCount = 0,
  categories,
}: {
  cartCount?: number;
  categories: CategoryNode[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  async function signOut() {
    const { error } = await authClient.signOut().catch(() => ({ error: true }));
    if (error) return;
    router.replace('/');
    router.refresh();
  }

  const iconLink = 'relative rounded-lg p-2 transition-colors hover:bg-muted';

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="relative mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
        <div className="lg:hidden">
          <MobileNav categories={categories} user={user} onSignOut={signOut} />
        </div>

        {/* Logo: giữa trên mobile, trái trên desktop */}
        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:static lg:mr-1 lg:translate-x-0"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen size={16} className="text-primary-foreground" />
          </div>
          <span className="hidden text-lg font-bold text-foreground sm:block">
            Skill<span className="text-primary">Path</span>
          </span>
        </Link>

        <div className="hidden lg:block">
          <ExploreMenu categories={categories} />
        </div>

        <SearchForm className="hidden max-w-xl flex-1 lg:flex" />

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/teach"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted lg:block"
          >
            Dạy học
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Đổi giao diện sáng/tối"
          >
            {/* CSS-driven icon swap avoids a hydration mismatch before the theme is known */}
            <Sun size={16} className="hidden dark:block" />
            <Moon size={16} className="dark:hidden" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSearchOpen((o) => !o)}
            aria-label={searchOpen ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </Button>

          <Link href="/cart" className={iconLink} aria-label={`Giỏ hàng (${cartCount} khoá)`}>
            <ShoppingCart size={18} className="text-foreground" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {user && (
            <>
              <Link href="/messages" className={`${iconLink} hidden lg:block`} aria-label="Tin nhắn">
                <MessageCircle size={18} className="text-foreground" />
                <span className="absolute right-1 top-1 size-2 rounded-full bg-blue-500" />
              </Link>
              <Link href="/notifications" className={`${iconLink} hidden lg:block`} aria-label="Thông báo">
                <Bell size={18} className="text-foreground" />
                <span className="absolute right-1 top-1 size-2 rounded-full bg-red-500" />
              </Link>
            </>
          )}

          <div className="hidden lg:block">
            {isPending ? (
              <div className="flex size-9 items-center justify-center">
                <Skeleton className="size-7 rounded-full" />
              </div>
            ) : !user ? (
              <div className="ml-1 flex items-center gap-1">
                <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>Đăng nhập</Link>
                <Link href="/register" className={buttonVariants({ size: 'sm' })}>Đăng ký</Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu tài khoản" />}
                >
                  <Avatar className="size-7">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  {accountLinks.map(({ icon: Icon, label, to }) => (
                    <DropdownMenuItem key={to} render={<Link href={to} />}>
                      <Icon size={15} className="text-muted-foreground" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-primary focus:text-primary" render={<Link href="/instructor" />}>
                    <User size={15} />
                    Chuyển sang Giảng viên
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={signOut}>
                    <LogOut size={15} />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t px-4 py-2 lg:hidden">
          <SearchForm autoFocus onSubmitted={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}

function SearchForm({
  className = 'flex',
  autoFocus,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const [q, setQ] = useState('');
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/courses?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  return (
    <form onSubmit={submit} className={className} role="search">
      <div className="flex w-full items-center gap-2 rounded-full border bg-secondary px-3 py-1.5">
        <Search size={16} className="text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          placeholder="Tìm kiếm khoá học, kỹ năng..."
          aria-label="Tìm kiếm khoá học"
          className="h-auto flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Typecheck + lint**

```bash
npx tsc --noEmit && pnpm lint
```

Expected: sạch (bỏ import thừa nếu lint báo).

---

### Task 8: Đổi route chi tiết khoá sang `/course/[slug]`

**Files:**
- Move: `src/app/(student)/courses/[slug]/` → `src/app/(student)/course/[slug]/`
- Modify: `src/components/shared/product-ui.tsx:285,336`, `src/app/(student)/cart/_components/cart-view.tsx:54`, `src/app/(student)/skills/page.tsx:125-127`, `src/app/instructor/courses/page.tsx:87`

**Interfaces:**
- Produces: chi tiết khoá ở `/course/<slug>`; `/courses/<x>` không còn bị trang chi tiết khoá bắt.

- [ ] **Step 1: Chuyển thư mục**

```bash
mkdir -p "src/app/(student)/course" && git mv "src/app/(student)/courses/[slug]" "src/app/(student)/course/[slug]"
```

- [ ] **Step 2: Sửa `PageProps`**

Trong `src/app/(student)/course/[slug]/page.tsx`: `PageProps<'/courses/[slug]'>` → `PageProps<'/course/[slug]'>`.

- [ ] **Step 3: Sửa link**

- `product-ui.tsx` 2 chỗ: `` href={`/courses/${course.slug}`} `` → `` href={`/course/${course.slug}`} ``
- `cart-view.tsx:54`: `/courses/${` → `/course/${`
- `skills/page.tsx:125-127`: `link: '/courses/` → `link: '/course/` (3 dòng)
- `instructor/courses/page.tsx:87`: `` href={`/courses/${c.slug}`} `` → `` href={`/course/${c.slug}`} ``

- [ ] **Step 4: Kiểm không sót**

```bash
grep -rnE "[\`'\"]/courses/" src | grep -v category-links
```

Expected: không ra dòng nào.

```bash
npx tsc --noEmit
```

Expected: sạch (Next typegen tạo lại `PageProps` khi `next dev`/`build`; nếu `tsc` báo `'/course/[slug]'` không có trong route map, chạy `pnpm next typegen` hoặc để Task 9 build xử lý).

---

### Task 9: Skeleton + loading, build sạch với `cacheComponents`

**Files:**
- Create: `src/components/skeletons/{course-card,course-grid,auth-form,learn-layout,instructor-dashboard,centered-content}-skeleton.tsx`
- Create: `src/app/(student)/loading.tsx`, `src/app/(auth)/loading.tsx`, `src/app/(focus)/loading.tsx`, `src/app/learn/loading.tsx`, `src/app/instructor/loading.tsx`, `src/app/(cartless)/loading.tsx`

**Interfaces:**
- Consumes: `Skeleton` (Task 4).
- Produces: 6 skeleton component tên `<Thứ>Skeleton`.

- [ ] **Step 1: Kiểm cờ đã bật**

`grep -n cacheComponents next.config.ts` phải ra dòng `cacheComponents: true` (Task 5 Step 0).

- [ ] **Step 2: Skeleton (mỗi file một component)**

`src/components/skeletons/course-card-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

// Khớp bố cục CourseCard (components/shared/product-ui.tsx): ảnh 16:9, tiêu đề 2 dòng, giảng viên, giá.
export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
```

`src/components/skeletons/course-grid-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';

export function CourseGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-8" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-6 h-7 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

`src/components/skeletons/auth-form-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function AuthFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-4 px-4 py-16" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mx-auto h-7 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
```

`src/components/skeletons/learn-layout-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function LearnLayoutSkeleton() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-4 p-4" aria-busy="true" aria-label="Đang tải">
      <div className="flex-1 space-y-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="hidden w-80 space-y-3 lg:block">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
```

`src/components/skeletons/instructor-dashboard-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function InstructorDashboardSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-7 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
```

`src/components/skeletons/centered-content-skeleton.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function CenteredContentSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-20 text-center" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mx-auto size-16 rounded-full" />
      <Skeleton className="mx-auto h-6 w-48" />
      <Skeleton className="mx-auto h-4 w-64" />
      <Skeleton className="mx-auto h-10 w-40" />
    </div>
  );
}
```

- [ ] **Step 3: `loading.tsx`**

Mỗi file một dòng export (đổi tên component theo bảng):

```tsx
// src/app/(student)/loading.tsx
import { CourseGridSkeleton } from '@/components/skeletons/course-grid-skeleton';
export default function Loading() {
  return <CourseGridSkeleton />;
}
```

| File | Component |
|---|---|
| `src/app/(student)/loading.tsx` | `CourseGridSkeleton` |
| `src/app/(auth)/loading.tsx` | `AuthFormSkeleton` |
| `src/app/(focus)/loading.tsx` | `LearnLayoutSkeleton` |
| `src/app/learn/loading.tsx` | `LearnLayoutSkeleton` |
| `src/app/instructor/loading.tsx` | `InstructorDashboardSkeleton` |
| `src/app/(cartless)/loading.tsx` | `CenteredContentSkeleton` |

- [ ] **Step 4: Build, sửa đến khi sạch**

BE phải đang chạy (`back-end: pnpm dev`) để header có dữ liệu thật lúc prerender.

```bash
pnpm build 2>&1 | tail -60
```

Xử lý từng lỗi Next báo, theo thứ tự ưu tiên:
1. Lỗi blocking-route ở page đọc `params`/`searchParams` mà group đã có `loading.tsx`: thường không xảy ra; nếu có, bọc phần đọc dữ liệu trong `<Suspense fallback={<…Skeleton />}>` ngay trong page.
2. Page ngoài route group (`onboarding/page.tsx`, `global-error`, …) báo lỗi: thêm `loading.tsx` cạnh page với `CenteredContentSkeleton`.
3. Page nào bị báo đọc giờ/ngẫu nhiên trong render (có thể không page nào: `Math.random()` ở `revenue/page.tsx` nằm ở module scope, dòng 12-13): thêm `import { connection } from 'next/server'` và `await connection();` ở đầu page component (biến page thành `async`). `instructor/loading.tsx` đã cung cấp `<Suspense>` mà `connection()` cần (docs `02-guides/migrating-to-cache-components.md`).
4. Lỗi khác: đọc thông báo + link docs Next in ra, sửa tối thiểu.

Expected cuối: `✓ Compiled successfully`, không lỗi, route `/course/[slug]` có trong bảng route.

- [ ] **Step 5: Test + lint**

```bash
node --test $(find src -name '*.test.ts') && pnpm lint
```

Expected: mọi test cũ + `category-links.test.ts` PASS; lint sạch.

---

### Task 10: Kiểm tay, cập nhật tài liệu, đề xuất commit

**Files:**
- Modify: `docs/superpowers/specs/2026-09-29-udemy-taxonomy-topics-design.md`

- [ ] **Step 1: Ghi chú spec taxonomy**

Trong bảng quyết định, cuối dòng D4 thêm: ` **[2026-09-30] Thay bằng bảng curated `category_topics`, xem `2026-09-30-explore-menu-design.md` E1.**`
Dưới tiêu đề `## 5. Menu "Chủ đề phổ biến"` thêm dòng: `> [2026-09-30] Đã thay: menu đọc bảng \`category_topics\` (spec 2026-09-30-explore-menu §3). Query dưới đây không còn dùng.`

- [ ] **Step 2: Kiểm bằng Chrome DevTools** (BE `pnpm dev`, FE `pnpm dev`)

Mở `http://localhost:3000`:
- 1440×900: hover "Khám phá" → cột 1 (4 mục); hover "Phát triển" → cột 2 (10 mục); hover "Phát triển web" → cột 3 "Các chủ đề phổ biến" có JavaScript… Bấm Enter trên nút → focus dòng đầu cột 1, **chưa** mở cột 2; Tab/Shift+Tab đi trong cột; → trên "Phát triển" mở cột 2 và focus dòng đầu; → trên "Phát triển web" mở cột 3; ← quay về dòng cha; Esc đóng. Click "JavaScript" → sang `/topic/javascript` (404) và menu đóng. Chụp màn hình.
- 1024×768 (mép breakpoint `lg`): mở đủ 3 cột, rê chuột qua cột 2 → cột 3; popup không bị dời vị trí làm nhấp nháy/đổi cột. Nếu có: truyền `collisionAvoidance={{ align: 'none' }}` qua Positioner của PopoverContent hoặc thu cột `lg:w-64 xl:w-72`.
- 390×844: header ☰ · logo giữa · 🔍 🛒; 🔍 mở hàng tìm kiếm, submit → `/courses?q=`; ☰ mở drawer → "Phát triển" → "‹ Menu" có; → "Phát triển web" → topic; "‹ Phát triển" quay lại; bấm link → drawer đóng. Chụp màn hình.
- Tắt BE, `pnpm build && pnpm start`: header render, menu "Không tải được danh mục". Bật BE lại, đợi ~1–5 phút, tải lại → menu có dữ liệu.
- `/courses/development` → 404 (không phải trang chi tiết khoá); một khoá mock (vd `/course/react-mastery-2024`) mở đúng.
- Throttle mạng "Slow 4G", điều hướng `/course/...` → thấy `CourseGridSkeleton` trước khi page hiện.

- [ ] **Step 3: Chạy lại toàn bộ kiểm tra**

```bash
cd back-end && pnpm vitest run --config ./vitest.config.e2e.ts test/categories.e2e-spec.ts test/taxonomy.e2e-spec.ts
cd ../it-course-platform && node --test $(find src -name '*.test.ts') && pnpm lint && pnpm build
```

Expected: tất cả PASS/sạch.

- [ ] **Step 4: Đề xuất commit (KHÔNG tự commit)**

Trình `git status` + `git diff --stat` cho sếp, đề xuất:

```
feat: menu Khám phá kiểu Udemy, header responsive, cacheComponents

- BE: bảng category_topics + seed 185 topic phổ biến, GET /api/categories/tree (public)
- FE: mega menu 3 cột (Popover) + drawer mobile (Sheet), header responsive
- FE: bật cacheComponents, loading.tsx + skeleton cho mọi route group
- FE: axios client (withCredentials) cho API nghiệp vụ
- Đổi route chi tiết khoá /courses/[slug] → /course/[slug]
```

Chờ sếp duyệt trước khi chạy `git commit`. Không push.
