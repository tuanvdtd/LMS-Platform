# Taxonomy kiểu Udemy (Category 2 cấp + Topic) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi `skills` thành `topics` kiểu Udemy, bỏ tag câu hỏi (thay bằng tag cấp quiz), seed lại cây danh mục 4 cấp 1 và 25 cấp 2 cùng 159 topic.

**Architecture:** Hai migration Prisma mới: `taxonomy_topics` (đổi schema, thêm constraint) và `taxonomy_seed` (dữ liệu). SQL mà Prisma không diễn tả được nằm ở `prisma/sql/03_*.sql` và `04_*.sql`, rồi dán vào cuối migration tương ứng, giống cách đã làm với `01_post_migrate.sql`. Kiểm thử bằng một file vitest e2e gọi thẳng PrismaClient vào DB dev; mỗi test chạy trong transaction rồi rollback.

**Tech Stack:** Prisma 6.19, PostgreSQL (pg_trgm), vitest 4, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-29-udemy-taxonomy-topics-design.md`

## Global Constraints

- Mọi lệnh chạy từ `back-end/`. Mọi lệnh gọi DB cần `.env` có `DATABASE_URL` và `DIRECT_URL` trỏ tới DB **dev**.
- Tên bảng dùng snake_case (`@@map`), tên cột dùng camelCase, nên trong SQL tay mọi cột phải để trong nháy kép.
- **Không commit giữa chừng.** Sếp đã chọn "chỉ commit một lần khi xong toàn bộ task". Cuối Task 3 thì đề xuất commit message và chờ duyệt. Không thêm dòng Co-Authored-By, không push.
- Không sửa file migration `20260928065533_init`.
- Enum `Track` và `SkillLevel` **giữ nguyên** vì vẫn còn dùng ở `user` và `courses`.
- Không viết service, API hay UI. Các quy tắc ở service (topic chính khi publish, topic của quiz nằm trong topic của khoá, công thức EMA) chỉ là hợp đồng ghi trong spec §3.3 và §4.

---

## File map

| File | Việc |
|---|---|
| `back-end/prisma/schema.prisma` | Sửa: Skill → Topic, bỏ QuestionSkill, thêm QuizTopic, đổi relation field |
| `back-end/prisma/sql/03_taxonomy_topics.sql` | Tạo: constraint và index cho bảng topic |
| `back-end/prisma/sql/04_taxonomy_seed.sql` | Tạo: seed category, topic, cạnh tiên quyết (idempotent) |
| `back-end/prisma/sql/01_post_migrate.sql` | Sửa: thêm ghi chú trỏ sang 03/04 |
| `back-end/prisma/migrations/<ts>_taxonomy_topics/migration.sql` | Prisma sinh, rồi dán 03 vào cuối |
| `back-end/prisma/migrations/<ts>_taxonomy_seed/migration.sql` | Migration rỗng, dán 04 vào |
| `back-end/test/taxonomy.e2e-spec.ts` | Tạo: test constraint và seed |
| `schema-database.md`, `de-xuat-do-an.md` | Sửa tài liệu |

---

### Task 1: Đổi schema Skill → Topic và thêm constraint

**Files:**
- Modify: `back-end/prisma/schema.prisma` (các model `User`, `Course`, `Skill` và các bảng nối, `Question`, `QuestionSkill`, `Quiz`, `Exercise`, `ExerciseSkill`)
- Create: `back-end/prisma/sql/03_taxonomy_topics.sql`
- Create: `back-end/prisma/migrations/<ts>_taxonomy_topics/migration.sql` (Prisma sinh)
- Test: `back-end/test/taxonomy.e2e-spec.ts`

**Interfaces:**
- Produces: các Prisma model `Topic` (`topics`), `CourseTopic` (`course_topics`, có `isPrimary`), `QuizTopic` (`quiz_topics`), `ExerciseTopic` (`exercise_topics`), `UserTopicMastery` (`user_topic_mastery`), `UserTargetTopic` (`user_target_topics`), bảng nối ẩn `_TopicPrereq`. Relation field: `Topic.prerequisites` / `Topic.requiredBy`, `Course.topics`, `Quiz.topics`, `Exercise.topics`, `User.topicMastery`, `User.targetTopics`. Constraint `chk_mastery_score`, `chk_topic_not_self_prereq`, index `idx_topics_name_trgm`, `uq_course_primary_topic`.

- [ ] **Step 1: Kiểm tra các bảng skill đang rỗng**

Migration này DROP rồi CREATE lại bảng, nên cần chắc chắn không mất dữ liệu:

```bash
cd back-end && node -e "
process.loadEnvFile();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$queryRawUnsafe(\`SELECT
  (SELECT count(*) FROM skills) skills,
  (SELECT count(*) FROM course_skills) course_skills,
  (SELECT count(*) FROM question_skills) question_skills,
  (SELECT count(*) FROM exercise_skills) exercise_skills,
  (SELECT count(*) FROM user_skill_mastery) mastery,
  (SELECT count(*) FROM user_target_skills) target,
  (SELECT count(*) FROM courses) courses\`).then(r => { console.log(r); return p.\$disconnect(); });
"
```
Expected: tất cả bằng `0n`. **Nếu có số nào khác 0 thì DỪNG** và báo sếp, vì cần viết migration dạng `ALTER TABLE ... RENAME` thay cho DROP.

- [ ] **Step 2: Viết test (sẽ fail)**

Tạo `back-end/test/taxonomy.e2e-spec.ts`:

```ts
import '../src/env.js';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

// Mỗi test chạy trong transaction rồi rollback, không để lại rác trong DB dev.
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

const uid = () => randomUUID().slice(0, 8);

async function makeCourse(tx: Prisma.TransactionClient) {
  const user = await tx.user.create({
    data: { id: randomUUID(), name: 't', email: `tx-${uid()}@example.com` },
  });
  const root = await tx.category.create({ data: { slug: `r-${uid()}`, name: 'r' } });
  const leaf = await tx.category.create({
    data: { slug: `l-${uid()}`, name: 'l', parentId: root.id },
  });
  const course = await tx.course.create({
    data: {
      instructorId: user.id,
      slug: `c-${uid()}`,
      title: 't',
      categoryId: leaf.id,
      track: 'frontend',
      level: 'beginner',
    },
  });
  return { user, root, leaf, course };
}

describe('Taxonomy — constraint', () => {
  it('mỗi khoá tối đa 1 topic chính', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      const [t1, t2, t3] = await Promise.all(
        [1, 2, 3].map(() => tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } })),
      );
      await tx.courseTopic.create({ data: { courseId: course.id, topicId: t1.id, isPrimary: true } });
      await tx.courseTopic.create({ data: { courseId: course.id, topicId: t2.id } });
      await expect(
        tx.courseTopic.create({ data: { courseId: course.id, topicId: t3.id, isPrimary: true } }),
      ).rejects.toThrow();
    }));

  it('category không được sâu quá 2 cấp', () =>
    inRollback(async (tx) => {
      const { leaf } = await makeCourse(tx);
      await expect(
        tx.category.create({ data: { slug: `g-${uid()}`, name: 'g', parentId: leaf.id } }),
      ).rejects.toThrow(/2 tầng/);
    }));

  it('topic không được tiên quyết chính nó', () =>
    inRollback(async (tx) => {
      const t = await tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } });
      await expect(
        tx.topic.update({ where: { id: t.id }, data: { prerequisites: { connect: { id: t.id } } } }),
      ).rejects.toThrow();
    }));

  it('mastery score nằm trong 0..1', () =>
    inRollback(async (tx) => {
      const { user } = await makeCourse(tx);
      const t = await tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } });
      await expect(
        tx.userTopicMastery.create({ data: { userId: user.id, topicId: t.id, score: 1.5 } }),
      ).rejects.toThrow();
    }));

  it('quiz gắn được topic', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      const t = await tx.topic.create({ data: { slug: `t-${uid()}`, name: 't' } });
      const quiz = await tx.quiz.create({ data: { courseId: course.id, title: 'q' } });
      await tx.quizTopic.create({ data: { quizId: quiz.id, topicId: t.id } });
      expect(await tx.quizTopic.count({ where: { quizId: quiz.id } })).toBe(1);
    }));

  it('có index trigram cho tên topic', async () => {
    const rows = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE indexname = 'idx_topics_name_trgm'`;
    expect(rows).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Chạy test để thấy fail**

Run: `pnpm test:e2e test/taxonomy.e2e-spec.ts`
Expected: FAIL. Typecheck của vitest không chặn, nên lỗi là runtime `Cannot read properties of undefined (reading 'create')` ở `tx.topic` hoặc `tx.courseTopic`, và test index trả về 0 dòng.

- [ ] **Step 4: Sửa `schema.prisma`**

4a. Trong `model User`, thay 2 dòng:
```prisma
  skillMastery         UserSkillMastery[]
  targetSkills         UserTargetSkill[]
```
bằng:
```prisma
  topicMastery         UserTopicMastery[]
  targetTopics         UserTargetTopic[]
```

4b. Trong `model Course`, thay `  skills       CourseSkill[]` bằng `  topics       CourseTopic[]`.

4c. Thay toàn bộ khối từ dòng `//  6. KỸ NĂNG — lõi của hồ sơ năng lực ...` (tính cả dòng `// ====` ngay phía trên) tới hết `model UserTargetSkill { ... }` bằng:

```prisma
// ============================================================================
//  6. TOPIC — taxonomy kiểu Udemy + lõi hồ sơ năng lực (§3.3), gợi ý tầng 2 (§3.4)
// ============================================================================

// Topic kiểu Udemy ("react", "docker", slug theo udemy.com/topic/<slug>).
// Không gắn cứng vào một category: một topic xuất hiện ở nhiều nhánh cấp 2
// (Python ở cả Khoa học dữ liệu và Ngôn ngữ lập trình). Menu "Chủ đề phổ biến"
// của từng nhánh được tính từ course_topics của các khoá đã publish trong nhánh đó.
// Đây cũng là đơn vị đo năng lực: mastery, đồ thị tiên quyết, gợi ý tầng 2.
model Topic {
  id          String  @id @default(uuid(7)) @db.Uuid
  slug        String  @unique
  name        String
  description String?

  // Đồ thị tiên quyết: JavaScript → React → Next.js. Duyệt bằng WITH RECURSIVE (§4.6).
  prerequisites Topic[] @relation("TopicPrereq")
  requiredBy    Topic[] @relation("TopicPrereq")

  courses    CourseTopic[]
  quizzes    QuizTopic[]
  exercises  ExerciseTopic[]
  mastery    UserTopicMastery[]
  targetedBy UserTargetTopic[]

  @@map("topics")
}

// isPrimary = "khoá học chủ yếu dạy gì?" của Udemy. Tối đa 1 dòng true mỗi khoá
// (partial unique index uq_course_primary_topic); "đúng 1 khi publish" kiểm ở service.
model CourseTopic {
  courseId  String  @db.Uuid
  topicId   String  @db.Uuid
  isPrimary Boolean @default(false)

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  topic  Topic  @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([courseId, topicId])
  @@index([topicId]) // "khoá nào dạy topic đang yếu"
  @@map("course_topics")
}

// Mastery cập nhật bằng EMA sau mỗi quiz/bài tập (spec §4):
// score = attemptsCount == 0 ? s : 0.7·score + 0.3·s
model UserTopicMastery {
  userId          String   @db.Uuid
  topicId         String   @db.Uuid
  score           Decimal  @default(0) @db.Decimal(4, 3)
  attemptsCount   Int      @default(0)
  lastEvaluatedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([userId, topicId])
  @@index([userId, score]) // lấy topic score < 0.6
  @@map("user_topic_mastery")
}

// Topic học viên TỰ KHAI muốn học ở bước 3 onboarding (kiểu /personalize/skills
// của Udemy: đa chọn, có ô tìm kiếm và chip gợi ý theo nghề).
//
// Khác user_topic_mastery là topic ĐO ĐƯỢC từ bài test. Chênh lệch giữa hai bảng
// là tín hiệu chính của recommendation tầng 2, và quan trọng hơn: nó cho tầng 2
// chạy được NGAY NGÀY ĐẦU, khi user_topic_mastery còn rỗng hoàn toàn.
// Chip "Phổ biến với học viên như bạn" = topic của các khoá có track = user.targetTrack.
model UserTargetTopic {
  userId    String   @db.Uuid
  topicId   String   @db.Uuid
  createdAt DateTime @default(now()) // Udemy gọi là "theo dõi", thêm/bỏ dần theo thời gian

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([userId, topicId])
  @@index([topicId])
  @@map("user_target_topics")
}
```

4d. Trong `model Question`, xoá dòng `  skills    QuestionSkill[]`.

4e. Xoá toàn bộ khối `// "Mỗi câu gắn tag kỹ năng" (§3.3) ...` cùng `model QuestionSkill { ... }`, rồi thay bằng:

```prisma
// Tag topic ở cấp QUIZ (không tag từng câu): điểm lần làm quiz cộng vào mastery
// của mọi topic ở đây. 1–3 topic, phải thuộc course_topics của khoá (kiểm ở service).
model QuizTopic {
  quizId  String @db.Uuid
  topicId String @db.Uuid

  quiz  Quiz  @relation(fields: [quizId], references: [id], onDelete: Cascade)
  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([quizId, topicId])
  @@index([topicId])
  @@map("quiz_topics")
}
```

4f. Trong `model Quiz`, thêm `  topics    QuizTopic[]` ngay dưới `  questions QuizQuestion[]`.

4g. Trong `model Exercise`, thay `  skills      ExerciseSkill[]` bằng `  topics      ExerciseTopic[]`.

4h. Thay `model ExerciseSkill { ... }` bằng:

```prisma
model ExerciseTopic {
  exerciseId String @db.Uuid
  topicId    String @db.Uuid

  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  topic    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([exerciseId, topicId])
  @@index([topicId])
  @@map("exercise_topics")
}
```

4i. Kiểm tra:
Run: `pnpm prisma validate && grep -n "Skill\b\|skill" prisma/schema.prisma | grep -v SkillLevel`
Expected: `The schema ... is valid`, và grep không in ra dòng nào.

- [ ] **Step 5: Tạo `prisma/sql/03_taxonomy_topics.sql`**

```sql
-- ============================================================================
--  Bổ sung cho migration taxonomy_topics (spec 2026-09-29-udemy-taxonomy-topics §3.3).
--  Prisma DROP các bảng skill cũ nên constraint/index tạo ở 01_post_migrate.sql
--  mất theo, phải tạo lại trên bảng topic mới.
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
-- ============================================================================

ALTER TABLE user_topic_mastery
  ADD CONSTRAINT chk_mastery_score CHECK (score >= 0 AND score <= 1);

-- Bảng m-n ẩn của Prisma cho relation "TopicPrereq", 2 cột "A", "B".
ALTER TABLE "_TopicPrereq"
  ADD CONSTRAINT chk_topic_not_self_prereq CHECK ("A" <> "B");

-- Ô "Tìm kiếm topic" ở bước 3 onboarding: autocomplete trên toàn catalog.
CREATE INDEX idx_topics_name_trgm ON topics USING gin (name gin_trgm_ops);

-- Mỗi khoá tối đa 1 topic chính. "Đúng 1 khi publish" kiểm ở service publish.
CREATE UNIQUE INDEX uq_course_primary_topic ON course_topics ("courseId") WHERE "isPrimary";
```

- [ ] **Step 6: Sinh migration và dọn SQL thừa**

Run: `pnpm prisma migrate dev --create-only --name taxonomy_topics`

Mở `prisma/migrations/<ts>_taxonomy_topics/migration.sql`. SQL do Prisma sinh **chỉ được** đụng tới các object sau: `skills`, `course_skills`, `question_skills`, `exercise_skills`, `user_skill_mastery`, `user_target_skills`, `_SkillPrereq`, và các bảng mới `topics`, `course_topics`, `quiz_topics`, `exercise_topics`, `user_topic_mastery`, `user_target_topics`, `_TopicPrereq`. Xoá mọi câu lệnh khác, ví dụ `DROP INDEX "idx_courses_search"`, `DROP INDEX "idx_courses_title_trgm"`, `ALTER TABLE "courses" ... "searchTsv"`, hay đụng tới materialized view. Những object đó do 01 tạo và Prisma không biết tới.

Rồi dán 03 vào cuối:
```bash
f=$(ls -d prisma/migrations/*_taxonomy_topics)/migration.sql
cat prisma/sql/03_taxonomy_topics.sql >> "$f"
grep -c "idx_courses\|searchTsv\|mv_" "$f"
```
Expected: `0`.

- [ ] **Step 7: Apply migration và generate client**

Run: `pnpm prisma migrate dev`
Expected: `Your database is now in sync with your schema.` và không hỏi xác nhận mất dữ liệu (vì Step 1 đã xác nhận các bảng rỗng). Prisma client tự generate.

- [ ] **Step 8: Chạy test**

Run: `pnpm test:e2e test/taxonomy.e2e-spec.ts`
Expected: 6 test PASS.

- [ ] **Step 9: Typecheck và dò chỗ còn sót**

Run: `pnpm exec tsc --noEmit -p tsconfig.json && grep -rn -i "skill" src test | grep -v -i "SkillLevel\|skillpath"`
Expected: tsc không lỗi, grep không in ra dòng nào.

---

### Task 2: Seed cây danh mục, topic và cạnh tiên quyết

**Files:**
- Create: `back-end/prisma/sql/04_taxonomy_seed.sql`
- Create: `back-end/prisma/migrations/<ts>_taxonomy_seed/migration.sql`
- Modify: `back-end/prisma/sql/01_post_migrate.sql` (ghi chú)
- Test: `back-end/test/taxonomy.e2e-spec.ts` (thêm describe)

**Interfaces:**
- Consumes: bảng `topics`, `_TopicPrereq`, relation `Topic.prerequisites` từ Task 1; bảng `categories` có sẵn (trigger 2 cấp, `slug` unique).
- Produces: 4 category cấp 1 (`artificial-intelligence`, `development`, `it-and-software`, `design`), 25 category cấp 2, 159 topic, 17 cạnh tiên quyết.

- [ ] **Step 1: Thêm test seed (sẽ fail)**

Nối vào cuối `back-end/test/taxonomy.e2e-spec.ts`:

```ts
describe('Taxonomy — seed', () => {
  const L2: Record<string, string[]> = {
    'artificial-intelligence': [
      'ai-fundamentals', 'ai-for-developers', 'machine-learning', 'generative-ai-creative',
    ],
    development: [
      'web-development', 'data-science', 'mobile-apps', 'programming-languages',
      'game-development', 'databases', 'software-testing', 'software-engineering',
      'development-tools', 'no-code-development',
    ],
    'it-and-software': [
      'it-certification', 'network-and-security', 'hardware', 'operating-systems',
      'other-it-and-software',
    ],
    design: [
      'web-design', 'graphic-design-and-illustration', 'design-tools', 'user-experience',
      'game-design', '3d-and-animation',
    ],
  };

  it('có đúng 4 cấp 1 và 25 cấp 2 theo Udemy, không còn nhánh cũ', async () => {
    const all = await prisma.category.findMany({ include: { parent: true } });
    const roots = all.filter((c) => !c.parentId).map((c) => c.slug).sort();
    expect(roots).toEqual(Object.keys(L2).sort());
    for (const [root, kids] of Object.entries(L2)) {
      const actual = all.filter((c) => c.parent?.slug === root).map((c) => c.slug).sort();
      expect(actual).toEqual([...kids].sort());
    }
    expect(all.find((c) => ['lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang', 'web'].includes(c.slug)))
      .toBeUndefined();
  });

  it('có 159 topic, tên tiếng Việt theo Udemy', async () => {
    expect(await prisma.topic.count()).toBe(159);
    const ml = await prisma.topic.findUnique({ where: { slug: 'machine-learning' } });
    expect(ml?.name).toBe('Học máy');
  });

  it('cạnh tiên quyết đúng chiều: css cần html, react cần javascript', async () => {
    const css = await prisma.topic.findUnique({
      where: { slug: 'css' },
      include: { prerequisites: true },
    });
    expect(css?.prerequisites.map((t) => t.slug)).toEqual(['html']);
    const react = await prisma.topic.findUnique({
      where: { slug: 'react' },
      include: { prerequisites: true, requiredBy: true },
    });
    expect(react?.prerequisites.map((t) => t.slug)).toEqual(['javascript']);
    expect(react?.requiredBy.map((t) => t.slug).sort()).toEqual(['nextjs', 'react-native']);
    const [{ n }] = await prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) n FROM "_TopicPrereq"`;
    expect(n).toBe(17n);
  });
});
```

- [ ] **Step 2: Chạy test để thấy fail**

Run: `pnpm test:e2e test/taxonomy.e2e-spec.ts`
Expected: 6 test constraint PASS, 3 test seed FAIL (roots là `cntt-ha-tang, khoa-hoc-du-lieu, lap-trinh`, topic count bằng 0).

- [ ] **Step 3: Tạo `prisma/sql/04_taxonomy_seed.sql`**

```sql
-- ============================================================================
--  Seed taxonomy kiểu Udemy (spec 2026-09-29-udemy-taxonomy-topics §6).
--  Nguồn: menu "Khám phá" của udemy.com (vi) ngày 2026-09-29.
--  Idempotent: chạy lại (prisma db execute --file) không sinh dòng trùng.
-- ============================================================================

-- 1. Xoá cây cũ ở mục 7 của 01_post_migrate.sql. Chỉ chạy khi chưa có khoá nào gắn vào.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM courses c
    JOIN categories cat ON cat.id = c."categoryId"
    JOIN categories p   ON p.id = cat."parentId"
    WHERE p.slug IN ('lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang')
  ) THEN
    RAISE EXCEPTION 'Còn khoá học gắn vào taxonomy cũ, phải chuyển khoá sang category mới trước';
  END IF;
END $$;

DELETE FROM categories WHERE "parentId" IN
  (SELECT id FROM categories WHERE slug IN ('lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang'));
DELETE FROM categories WHERE slug IN ('lap-trinh', 'khoa-hoc-du-lieu', 'cntt-ha-tang');

-- 2. Category cấp 1
INSERT INTO categories (id, "parentId", slug, name, position) VALUES
  (gen_random_uuid(), NULL, 'artificial-intelligence', 'Trí tuệ nhân tạo', 1),
  (gen_random_uuid(), NULL, 'development',             'Phát triển',        2),
  (gen_random_uuid(), NULL, 'it-and-software',         'CNTT & Phần mềm',   3),
  (gen_random_uuid(), NULL, 'design',                  'Thiết kế',          4)
ON CONFLICT (slug) DO NOTHING;

-- 3. Category cấp 2 (slug theo udemy.com/courses/<cấp 1>/<cấp 2>)
INSERT INTO categories (id, "parentId", slug, name, position)
SELECT gen_random_uuid(), p.id, s.slug, s.name, s.position
FROM (VALUES
  ('artificial-intelligence', 'ai-fundamentals',        'Nền tảng AI & LLM',                   1),
  ('artificial-intelligence', 'ai-for-developers',      'AI cho Nhà phát triển',               2),
  ('artificial-intelligence', 'machine-learning',       'Học máy & Deep Learning',             3),
  ('artificial-intelligence', 'generative-ai-creative', 'AI tạo sinh cho sáng tạo',            4),
  ('development', 'web-development',       'Phát triển web',                        1),
  ('development', 'data-science',          'Khoa học dữ liệu',                      2),
  ('development', 'mobile-apps',           'Phát triển ứng dụng di động',           3),
  ('development', 'programming-languages', 'Ngôn ngữ lập trình',                    4),
  ('development', 'game-development',      'Phát triển trò chơi',                   5),
  ('development', 'databases',             'Thiết kế & Phát triển cơ sở dữ liệu',   6),
  ('development', 'software-testing',      'Kiểm thử phần mềm',                     7),
  ('development', 'software-engineering',  'Kỹ thuật phần mềm',                     8),
  ('development', 'development-tools',     'Công cụ phát triển phần mềm',           9),
  ('development', 'no-code-development',   'Phát triển không cần lập trình',       10),
  ('it-and-software', 'it-certification',      'Chứng chỉ CNTT',          1),
  ('it-and-software', 'network-and-security',  'Mạng & Bảo mật',          2),
  ('it-and-software', 'hardware',              'Phần cứng',               3),
  ('it-and-software', 'operating-systems',     'Hệ điều hành & Máy chủ',  4),
  ('it-and-software', 'other-it-and-software', 'CNTT & Phần mềm khác',    5),
  ('design', 'web-design',                      'Thiết kế web',                     1),
  ('design', 'graphic-design-and-illustration', 'Thiết kế & Minh hoạ đồ hoạ',       2),
  ('design', 'design-tools',                    'Công cụ thiết kế',                 3),
  ('design', 'user-experience',                 'Thiết kế trải nghiệm người dùng',  4),
  ('design', 'game-design',                     'Thiết kế trò chơi',                5),
  ('design', '3d-and-animation',                '3D & Hoạt hình',                   6)
) AS s(parent_slug, slug, name, position)
JOIN categories p ON p.slug = s.parent_slug
ON CONFLICT (slug) DO NOTHING;

-- 4. Topic (slug theo udemy.com/topic/<slug>; nhóm theo nhánh chỉ để dễ đọc)
INSERT INTO topics (id, slug, name)
SELECT gen_random_uuid(), t.slug, t.name
FROM (VALUES
  -- AI (27)
  ('prompt-engineering',             'Kỹ thuật tạo lệnh'),
  ('large-language-models',          'Mô hình ngôn ngữ lớn (LLM)'),
  ('generative-ai',                  'AI tạo sinh (GenAI)'),
  ('ai-agents',                      'Tác nhân AI & Agentic AI'),
  ('artificial-intelligence',        'Trí tuệ nhân tạo (AI)'),
  ('chatgpt',                        'ChatGPT'),
  ('claude-ai',                      'Claude AI'),
  ('claude-code',                    'Claude Code'),
  ('google-gemini',                  'Google Gemini'),
  ('microsoft-copilot',              'Microsoft Copilot'),
  ('deepseek',                       'DeepSeek'),
  ('openai-api',                     'OpenAI API'),
  ('github-copilot',                 'GitHub Copilot'),
  ('openai-codex',                   'OpenAI Codex'),
  ('retrieval-augmented-generation', 'Tối ưu hóa tăng cường truy xuất (RAG)'),
  ('langchain',                      'LangChain'),
  ('springai',                       'Spring AI'),
  ('machine-learning',               'Học máy'),
  ('deep-learning',                  'Học sâu'),
  ('tensorflow',                     'TensorFlow'),
  ('pytorch',                        'PyTorch'),
  ('mlops',                          'MLOps'),
  ('azure-machine-learning',         'Azure Machine Learning'),
  ('midjourney',                     'Midjourney'),
  ('stable-diffusion',               'Stable Diffusion'),
  ('dall-e',                         'DALL·E'),
  ('vibe-coding',                    'Vibe Coding'),
  -- Web (11)
  ('html',            'HTML'),
  ('css',             'CSS'),
  ('javascript',      'JavaScript'),
  ('typescript',      'TypeScript'),
  ('react',           'React JS'),
  ('angular',         'Angular'),
  ('nextjs',          'Next.js'),
  ('nodejs',          'Node.Js'),
  ('fastapi',         'FastAPI'),
  ('aspnet-core',     'ASP.NET Core'),
  ('web-development', 'Phát triển web'),
  -- Mobile (9)
  ('google-flutter',            'Google Flutter'),
  ('dart-programming-language', 'Dart (ngôn ngữ lập trình)'),
  ('react-native',              'React Native'),
  ('ios-development',           'Phát triển ứng dụng cho iOS'),
  ('swift',                     'Swift'),
  ('swiftui',                   'SwiftUI'),
  ('android-development',       'Phát triển Android'),
  ('kotlin',                    'Kotlin'),
  ('mobile-development',        'Phát triển ứng dụng mobile'),
  -- Ngôn ngữ lập trình (8)
  ('python',                  'Python'),
  ('java',                    'Java'),
  ('c-sharp',                 'C# (ngôn ngữ lập trình)'),
  ('c-plus-plus',             'C++ (ngôn ngữ lập trình)'),
  ('c-programming',           'C (ngôn ngữ lập trình)'),
  ('go-programming-language', 'Go (ngôn ngữ lập trình)'),
  ('python-scripting',        'Ngôn ngữ kịch bản Python'),
  ('spring-framework',        'Spring Framework'),
  -- Dữ liệu (5)
  ('data-science',     'Khoa học dữ liệu'),
  ('data-analysis',    'Phân tích dữ liệu'),
  ('pandas',           'Pandas'),
  ('data-engineering', 'Kỹ thuật dữ liệu'),
  ('apache-kafka',     'Apache Kafka'),
  -- Game (7)
  ('unity',                    'Unity'),
  ('unreal-engine',            'Unreal Engine'),
  ('unreal-engine-blueprints', 'Unreal Engine Blueprints'),
  ('godot',                    'Godot'),
  ('game-development',         'Nguyên tắc cơ bản về phát triển trò chơi'),
  ('2d-game-development',      'Phát triển trò chơi 2D'),
  ('3d-game-development',      'Phát triển trò chơi 3D'),
  -- Cơ sở dữ liệu (7)
  ('sql',                 'SQL'),
  ('mysql',               'MySQL'),
  ('postgresql',          'PostgreSQL'),
  ('sql-server',          'SQL Server'),
  ('oracle-sql',          'Oracle SQL'),
  ('plsql',               'PL/SQL'),
  ('database-management', 'Hệ thống quản lý cơ sở dữ liệu (DBMS)'),
  -- Kiểm thử (6)
  ('automation-testing',                           'Kiểm tra tự động hóa'),
  ('playwright',                                   'Microsoft Playwright'),
  ('selenium-webdriver',                           'Selenium WebDriver'),
  ('pytest',                                       'pytest'),
  ('postman',                                      'Postman'),
  ('istqb-certified-tester-foundation-level-ctfl', 'Chứng chỉ CTFL của ISTQB'),
  -- Kỹ thuật phần mềm (4)
  ('software-architecture',  'Kiến trúc phần mềm'),
  ('data-structures',        'Cấu trúc dữ liệu'),
  ('algorithms',             'Thuật toán'),
  ('system-design-interview','Phỏng vấn thiết kế hệ thống'),
  -- Công cụ (5)
  ('git',        'Git'),
  ('github',     'GitHub'),
  ('docker',     'Docker'),
  ('kubernetes', 'Kubernetes'),
  ('devops',     'DevOps (Phát triển và vận hành)'),
  -- No-code (4)
  ('n8n',                'n8n'),
  ('wordpress',          'WordPress'),
  ('microsoft-powerapps','Microsoft Power Apps'),
  ('microsoft-flow',     'Microsoft Power Automate'),
  -- Chứng chỉ (10)
  ('amazon-aws',                                     'Amazon AWS'),
  ('aws-certified-cloud-practitioner',               'Chứng chỉ AWS Certified Cloud Practitioner'),
  ('aws-certified-solutions-architect-associate',    'Chứng chỉ AWS Certified Solutions Architect - Associate'),
  ('aws-certified-ai-practitioner',                  'AWS Certified AI Practitioner'),
  ('certified-kubernetes-application-developer-ckad','Chứng chỉ nhà phát triển ứng dụng Kubernetes (CKAD)'),
  ('comptia-a',                                      'CompTIA A+'),
  ('comptia-network',                                'CompTIA Network+'),
  ('comptia-security',                               'CompTIA Security+'),
  ('cisco-ccna',                                     'Chứng chỉ mạng Cisco (CCNA) cấp hội viên'),
  ('cc-certified-in-cybersecurity',                  'Chứng chỉ an ninh mạng (CC)'),
  -- Mạng & Bảo mật (8)
  ('cyber-security',             'An ninh mạng'),
  ('ethical-hacking',            'Tấn công có đạo đức'),
  ('network-security',           'Bảo mật mạng'),
  ('it-networking-fundamentals', 'Nền tảng căn bản về mạng CNTT'),
  ('information-security',       'Bảo mật thông tin'),
  ('it-audit',                   'Kiểm toán CNTT'),
  ('fortigate',                  'FortiGate'),
  ('ai-security',                'Bảo mật AI'),
  -- Phần cứng (9)
  ('embedded-systems',           'Hệ thống nhúng'),
  ('embedded-c',                 'Ngôn ngữ C nhúng'),
  ('microcontroller',            'Vi điều khiển'),
  ('arduino',                    'Arduino'),
  ('electronics',                'Điện tử'),
  ('plc',                        'PLC (Thiết bị điều khiển lập trình được)'),
  ('kicad',                      'KiCad'),
  ('circuit-design',             'Thiết kế bảng mạch in'),
  ('robotic-process-automation', 'Tự động hóa quy trình bằng robot (RPA)'),
  -- Hệ điều hành & Máy chủ (8)
  ('linux',                 'Linux'),
  ('linux-administration',  'Quản trị Linux'),
  ('windows-server',        'Windows Server'),
  ('system-administration', 'Quản trị hệ thống'),
  ('active-directory',      'Active Directory'),
  ('powershell',            'PowerShell'),
  ('shell-scripting',       'Shell Scripting'),
  ('proxmox-ve',            'Proxmox VE'),
  -- Thiết kế (31)
  ('figma',                 'Figma'),
  ('canva',                 'Canva'),
  ('user-experience-design','Thiết kế trải nghiệm người dùng (UX)'),
  ('user-interface',        'Thiết kế giao diện người dùng'),
  ('mobile-app-design',     'Thiết kế ứng dụng mobile'),
  ('ux-writing',            'Viết nội dung trải nghiệm người dùng (UX)'),
  ('web-accessibility',     'Khả năng truy cập web'),
  ('product-design',        'Thiết kế sản phẩm'),
  ('design-thinking',       'Tư duy thiết kế'),
  ('elementor',             'Elementor'),
  ('graphic-design',        'Thiết kế đồ họa'),
  ('drawing',               'Vẽ'),
  ('adobe-illustrator',     'Adobe Illustrator'),
  ('photoshop',             'Adobe Photoshop'),
  ('indesign',              'Adobe InDesign'),
  ('procreate-ipad-app',    'Procreate'),
  ('affinity-designer',     'Affinity Designer'),
  ('digital-painting',      'Tranh kỹ thuật số'),
  ('pixel-art',             'Nghệ thuật pixel'),
  ('game-texturing',        'Tạo chất liệu trò chơi'),
  ('vfx-visual-effects',    'Hiệu ứng hình ảnh (VFX)'),
  ('blender',               'Blender'),
  ('3d-modeling',           'Dựng mô hình 3D'),
  ('3d-animation',          'Hoạt hình 3D'),
  ('3d-sculpting',          'Điêu khắc 3D'),
  ('3d-printing',           'In 3D'),
  ('fusion-360',            'Autodesk Fusion'),
  ('after-effects',         'Adobe After Effects'),
  ('motion-graphics',       'Đồ họa chuyển động'),
  ('autocad',               'AutoCAD'),
  ('solidworks',            'SOLIDWORKS')
) AS t(slug, name)
ON CONFLICT (slug) DO NOTHING;

-- 5. Cạnh tiên quyết (topic, topic tiên quyết của nó).
-- Quy ước cột của bảng ẩn Prisma: "A" = topic, "B" = topic tiên quyết.
-- Test "cạnh tiên quyết đúng chiều" kiểm quy ước này qua Topic.prerequisites.
INSERT INTO "_TopicPrereq" ("A", "B")
SELECT a.id, b.id
FROM (VALUES
  ('css', 'html'), ('javascript', 'css'), ('typescript', 'javascript'),
  ('react', 'javascript'), ('nextjs', 'react'), ('nodejs', 'javascript'),
  ('data-analysis', 'python'), ('machine-learning', 'data-analysis'),
  ('deep-learning', 'machine-learning'),
  ('langchain', 'large-language-models'), ('retrieval-augmented-generation', 'large-language-models'),
  ('postgresql', 'sql'), ('mysql', 'sql'),
  ('docker', 'linux'), ('kubernetes', 'docker'),
  ('github', 'git'), ('react-native', 'react')
) AS e(topic, requires)
JOIN topics a ON a.slug = e.topic
JOIN topics b ON b.slug = e.requires
ON CONFLICT DO NOTHING;
```

- [ ] **Step 4: Tạo migration seed rỗng rồi dán 04 vào**

```bash
pnpm prisma migrate dev --create-only --name taxonomy_seed
f=$(ls -d prisma/migrations/*_taxonomy_seed)/migration.sql
cat prisma/sql/04_taxonomy_seed.sql >> "$f"
pnpm prisma migrate dev
```
Expected: lần `--create-only` sinh migration rỗng (`-- This is an empty migration.`) vì schema không đổi. Lần `migrate dev` cuối apply thành công.

- [ ] **Step 5: Chạy test**

Run: `pnpm test:e2e test/taxonomy.e2e-spec.ts`
Expected: 9 test PASS.

Nếu **chỉ** test "cạnh tiên quyết đúng chiều" fail, và `css.prerequisites` ra `[]` trong khi `css.requiredBy` ra `['html']`, thì Prisma dùng quy ước cột ngược lại. Khi đó đổi `INSERT INTO "_TopicPrereq" ("A", "B")` thành `("B", "A")` trong **cả** `04_taxonomy_seed.sql` lẫn file migration seed, sửa comment quy ước thành `"B" = topic, "A" = topic tiên quyết`, rồi chạy:
```bash
pnpm prisma migrate reset --skip-seed   # DB dev: xoá sạch và apply lại mọi migration
```
Chỉ làm bước này trên DB dev, sau khi hỏi sếp, vì `reset` xoá cả user đang test. Sau đó chạy lại test.

- [ ] **Step 6: Kiểm tra seed idempotent**

```bash
pnpm prisma db execute --schema prisma/schema.prisma --file prisma/sql/04_taxonomy_seed.sql
pnpm test:e2e test/taxonomy.e2e-spec.ts
```
Expected: lệnh execute chạy không lỗi, 9 test vẫn PASS (số lượng không đổi: 159 topic, 17 cạnh).

- [ ] **Step 7: Ghi chú trong `01_post_migrate.sql`**

Thêm dòng comment ngay trên các khối sau (không đổi SQL, vì file này đã nằm trong migration `init`):
- trên `ALTER TABLE user_skill_mastery`: `-- [2026-09-29] Bảng đã đổi thành user_topic_mastery, constraint tạo lại ở 03_taxonomy_topics.sql.`
- trên `ALTER TABLE "_SkillPrereq"`: `-- [2026-09-29] Đã đổi thành "_TopicPrereq", xem 03_taxonomy_topics.sql.`
- trên `CREATE INDEX idx_skills_name_trgm`: `-- [2026-09-29] Đã thay bằng idx_topics_name_trgm ở 03_taxonomy_topics.sql.`
- dưới tiêu đề mục 7: `--  [2026-09-29] Cây này đã bị thay bằng taxonomy Udemy ở 04_taxonomy_seed.sql.`

---

### Task 3: Cập nhật tài liệu và đề xuất commit

**Files:**
- Modify: `schema-database.md`
- Modify: `de-xuat-do-an.md:46`

**Interfaces:**
- Consumes: tên model và bảng từ Task 1, seed từ Task 2.

- [ ] **Step 1: `de-xuat-do-an.md` dòng 46**

Thay:
```
| Ngân hàng câu hỏi | Giảng viên tạo câu hỏi trắc nghiệm, **mỗi câu gắn tag kỹ năng** (vd `react-hooks`, `sql-join`) |
```
bằng:
```
| Ngân hàng câu hỏi | Giảng viên tạo câu hỏi trắc nghiệm; **mỗi quiz gắn 1–3 topic** của khoá (vd `react`, `sql`), topic theo taxonomy Udemy |
```
Rồi `grep -n "kỹ năng" de-xuat-do-an.md`, và ở mỗi dòng nói về độ thành thạo hoặc lỗ hổng thì đổi "kỹ năng" thành "topic" nếu câu vẫn đọc tự nhiên. Ví dụ "React Hooks" ở dòng 63 đổi thành "React JS". Các dòng tên miền `skillpath` thì giữ nguyên.

- [ ] **Step 2: `schema-database.md`**

- Bảng nhóm (dòng 20–22): nhóm 6 đổi thành `topics` `_TopicPrereq` `course_topics` `user_topic_mastery` `user_target_topics`; nhóm 7 đổi `question_skills` thành `quiz_topics`; nhóm 8 đổi `exercise_skills` thành `exercise_topics`.
- Dòng 31 ("Tách kỹ năng TỰ KHAI..."): đổi tên bảng sang `user_target_topics`/`user_topic_mastery`, ví dụ `sql-join` đổi thành `sql`.
- Thay dòng 34 ("Không có tầng topic của Udemy") bằng:
  `| **Topic kiểu Udemy thay cho skill** | Một bảng `topics` (slug theo udemy.com/topic) làm cả taxonomy duyệt lẫn đơn vị đo năng lực. Topic không gắn cứng vào category; "Chủ đề phổ biến" của nhánh cấp 2 tính từ course_topics. Tag ở cấp quiz, không tag từng câu (spec 2026-09-29-udemy-taxonomy-topics). |`
- Sơ đồ quan hệ (dòng 62–81): đổi mọi `skills`/`*_skills` sang tên mới, dòng `questions >─< question_skills` thay bằng `quizzes >─< quiz_topics >─ topics`, và luồng hồ sơ năng lực thành: `quiz_attempts` / `submissions` → topic qua `quiz_topics` / `exercise_topics` → EMA vào `user_topic_mastery`.
- Bản copy schema Prisma trong file (từ dòng `//  SkillPath LMS — Prisma schema`): thay toàn bộ bằng nội dung hiện tại của `back-end/prisma/schema.prisma`.

Run: `grep -n "skill" schema-database.md | grep -v -i "SkillLevel\|skillpath"`
Expected: không còn dòng nào.

- [ ] **Step 3: Kiểm tra cuối**

Run: `cd back-end && pnpm exec tsc --noEmit -p tsconfig.json && pnpm test:e2e && git status --short`
Expected: tsc sạch, **toàn bộ** e2e (auth + taxonomy) PASS. `git status` liệt kê: `schema.prisma`, 2 thư mục migration mới, `prisma/sql/01_post_migrate.sql`, `03_*.sql`, `04_*.sql`, `test/taxonomy.e2e-spec.ts`, `schema-database.md`, `de-xuat-do-an.md`, spec và plan.

- [ ] **Step 4: Đề xuất commit và chờ sếp duyệt**

**Không tự chạy `git commit`.** Trình bày danh sách file ở Step 3 cùng message đề xuất, rồi chờ sếp đồng ý:

```
feat: taxonomy kiểu Udemy — category 2 cấp + topic, tag cấp quiz

- Đổi skills → topics (slug theo udemy.com/topic), bỏ question_skills, thêm quiz_topics
- course_topics.isPrimary + partial unique index: tối đa 1 topic chính mỗi khoá
- Seed 4 category cấp 1 (AI, Phát triển, CNTT & Phần mềm, Thiết kế), 25 cấp 2, 159 topic, 17 cạnh tiên quyết
- E2E test constraint + seed, cập nhật schema-database.md và de-xuat-do-an.md
```
