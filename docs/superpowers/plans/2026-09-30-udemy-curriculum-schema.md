# Schema kiểu Udemy (curriculum, quiz, coding, khoá học, tương tác) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đổi schema DB sang mô hình curriculum kiểu Udemy (section → curriculum item), quiz/bài thi thử/bài tập coding gắn vào item, trang giới thiệu khoá, trạng thái khoá 4 giá trị, coupon, thông báo, ghi chú, hỏi đáp.

**Architecture:** Sửa `schema.prisma`, sinh **một** migration `udemy_curriculum` bằng `--create-only`, sửa tay đầu file (drop MV + index phụ thuộc) và dán `prisma/sql/05_udemy_curriculum.sql` vào cuối (unique DEFERRABLE, CHECK, partial index, MV). Kiểm thử bằng vitest e2e gọi PrismaClient vào DB dev, mỗi test chạy trong transaction rồi rollback.

**Tech Stack:** Prisma 6.19, PostgreSQL (Supabase, pgvector), vitest 4, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-30-udemy-curriculum-schema-design.md`

## Global Constraints

- Lệnh BE chạy từ `back-end/`, `.env` trỏ DB **dev** (`DATABASE_URL`, `DIRECT_URL`). Máy dev **không có `psql`**: mọi thao tác SQL chạy qua Prisma (`prisma db execute`, `$queryRaw`).
- **Không commit giữa chừng, không push, không thêm Co-Authored-By.** Sếp chưa chọn chế độ commit cho task này → mặc định hỏi trước mỗi commit; plan gom **một** đề xuất commit ở Task 6 và chờ duyệt.
- Không sửa migration cũ (`init`, `taxonomy_*`, `category_topics*`, `drop_pg_fulltext`) và không sửa nội dung SQL của `01`/`03`/`04` (chỉ thêm dòng ghi chú ở `01`).
- Tên bảng snake_case (`@@map`), tên cột camelCase → trong SQL tay mọi cột để trong nháy kép.
- Không viết service/API/UI, không sửa `it-course-platform`. Các luật "service" trong spec là hợp đồng cho spec sau.
- Enum `Track`, `SkillLevel`, `ApprovalStatus` giữ nguyên.

---

## File map

| File | Việc |
|---|---|
| `back-end/prisma/schema.prisma` | Sửa: nhóm 3, 4, 5, 7, 8, 10, thêm nhóm 11 (tương tác), enum |
| `back-end/prisma/sql/05_udemy_curriculum.sql` | Tạo: unique DEFERRABLE, CHECK, partial index, MV `mv_item_dropoff` |
| `back-end/prisma/migrations/<ts>_udemy_curriculum/migration.sql` | Prisma sinh, sửa đầu file, dán 05 vào cuối |
| `back-end/prisma/sql/01_post_migrate.sql` | Sửa: chỉ thêm ghi chú `[2026-09-30]` trỏ sang 05 |
| `back-end/README.md` | Sửa: danh sách object viết tay (drift) |
| `back-end/test/udemy-curriculum.e2e-spec.ts` | Tạo: test constraint |
| `back-end/test/taxonomy.e2e-spec.ts` | Sửa: test quiz tạo qua curriculum item |
| `schema-database.md`, `de-xuat-do-an.md` | Sửa tài liệu |

---

### Task 1: Kiểm tra DB dev trước khi đổi schema

**Files:** không sửa file.

- [ ] **Step 1: Đếm dòng các bảng sẽ bị drop / đổi cột**

```bash
cd back-end && node --env-file=.env -e "
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
const t=['lessons','lesson_progress','lesson_resources','quizzes','questions','exercises','courses','order_items','enrollments','content_reports'];
p.\$queryRawUnsafe(t.map(x=>\`SELECT '\${x}' t, count(*)::int n FROM \${x}\`).join(' UNION ALL '))
 .then(r=>{console.table(r);return p.\$disconnect()})"
```

Expected: mọi dòng `n = 0`. **Nếu có bảng khác 0 → DỪNG, báo sếp**, không làm tiếp (spec §6.4).

---

### Task 2: Sửa `schema.prisma`

**Files:**
- Modify: `back-end/prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma Client có model `CurriculumItem`, `Asset`, `LectureResource`, `ItemProgress`, `Coupon`, `Announcement`, `Note`, `CourseQuestion`, `CourseAnswer`; enum `CurriculumItemType`, `LectureKind`, `AssetKind`, `AssetStatus`, `CouponType`; `CourseStatus` = `draft|in_review|published|unpublished`.

- [ ] **Step 1: Model `User` — relation field**

Trong `model User`, xoá dòng:
```prisma
  questionsCreated     Question[]
```
Thêm ngay sau dòng `emailLogs            EmailLog[]`:
```prisma
  assets               Asset[]
  couponsCreated       Coupon[]
  announcements        Announcement[]
  qaQuestions          CourseQuestion[]
  qaAnswers            CourseAnswer[]
```

- [ ] **Step 2: Model `Course`**

Thay dòng `lessonCount      Int     @default(0)` bằng:
```prisma
  lectureCount     Int     @default(0) // lecture đã xuất bản
```
Thêm ngay sau dòng `copyrightConfirmedAt DateTime?`:
```prisma

  // Trang "Học viên mục tiêu" + "Tin nhắn khoá học" của Udemy. Độ dài/số mục kiểm lúc gửi duyệt (service).
  learningObjectives String[] @default([]) // ≥4 mục, ≤160 ký tự/mục
  requirements       String[] @default([]) // ≥1
  targetAudience     String[] @default([]) // ≥1
  welcomeMessage     String? // ≤1000
  congratsMessage    String? // ≤1000
  qaEnabled          Boolean  @default(true)
```
Trong khối relation của `Course`, thay:
```prisma
  lessons      Lesson[]
```
bằng:
```prisma
  items        CurriculumItem[]
```
xoá dòng `  questions    Question[]`, thêm sau `  riskScores   StatStudentRisk[]`:
```prisma
  coupons       Coupon[]
  announcements Announcement[]
  qaQuestions   CourseQuestion[]
```

- [ ] **Step 3: Thay `Section`, `Lesson`, `LessonResource` (nhóm 3)**

Xoá nguyên 3 model `Section`, `Lesson`, `LessonResource` và comment ngay trên `Lesson`, thay bằng:

```prisma
// Unique (courseId, position) KHÔNG khai ở đây: tạo bằng SQL dạng DEFERRABLE INITIALLY DEFERRED
// (prisma/sql/05) để kéo thả đổi chỗ section trong một transaction. Prisma không tạo được deferrable.
model Section {
  id          String  @id @default(uuid(7)) @db.Uuid
  courseId    String  @db.Uuid
  title       String
  description String? // "mục tiêu của phần"
  position    Int

  course Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  items  CurriculumItem[]

  @@map("sections")
}

// Mục trong khung chương trình kiểu Udemy. Một bảng cho mọi loại, cột riêng từng loại để nullable;
// quiz/exercise là bảng 1-1 trỏ về itemId. Số "Bài giảng 3" tính lúc đọc (ROW_NUMBER theo type).
// Unique (sectionId, position) DEFERRABLE tạo ở prisma/sql/05. Payload lecture kiểm bằng chk_item_payload.
model CurriculumItem {
  id          String             @id @default(uuid(7)) @db.Uuid
  sectionId   String             @db.Uuid
  courseId    String             @db.Uuid // denormalized: gần như mọi query đều lọc theo khoá
  type        CurriculumItemType
  title       String
  position    Int
  isPublished Boolean            @default(false)

  // Chỉ lecture. lectureKind null = chưa chọn nội dung (không được xuất bản).
  lectureKind     LectureKind?
  videoAssetId    String?      @db.Uuid
  documentAssetId String?      @db.Uuid
  description     String?
  isPreview       Boolean      @default(false) // xem thử không cần mua
  isDownloadable  Boolean      @default(false)
  durationSec     Int          @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  section          Section           @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  course           Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  videoAsset       Asset?            @relation("ItemVideo", fields: [videoAssetId], references: [id], onDelete: Restrict)
  documentAsset    Asset?            @relation("ItemDocument", fields: [documentAssetId], references: [id], onDelete: Restrict)
  resources        LectureResource[]
  progress         ItemProgress[]
  buckets          StatVideoBucket[]
  notes            Note[]
  quiz             Quiz?
  exercise         Exercise?         @relation("ExerciseItem")
  relatedQuestions Question[]
  relatedExercises Exercise[]        @relation("ExerciseRelatedLecture")
  qaQuestions      CourseQuestion[]

  @@index([courseId])
  @@index([videoAssetId])
  @@index([documentAssetId])
  @@map("curriculum_items")
}

// Thư viện file của giảng viên ("Thêm từ thư viện" = WHERE ownerId = me AND status = 'ready').
// document chỉ nhận PDF (chk_asset_pdf). FK từ item/resource là Restrict: không xoá asset đang dùng.
model Asset {
  id          String      @id @default(uuid(7)) @db.Uuid
  ownerId     String      @db.Uuid
  kind        AssetKind
  fileName    String
  mimeType    String
  sizeBytes   BigInt // video ≤4GB, PDF ≤1GB — kiểm ở service upload
  storageKey  String      @unique // key trên S3
  hlsKey      String? // video sau khi transcode
  status      AssetStatus @default(uploading)
  durationSec Int?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  owner         User              @relation(fields: [ownerId], references: [id], onDelete: Restrict)
  videoItems    CurriculumItem[]  @relation("ItemVideo")
  documentItems CurriculumItem[]  @relation("ItemDocument")
  resources     LectureResource[]

  @@index([ownerId, createdAt])
  @@map("assets")
}

// Tài liệu đính kèm bài giảng: chỉ file PDF (asset kind = document, kiểm ở service).
model LectureResource {
  id       String @id @default(uuid(7)) @db.Uuid
  itemId   String @db.Uuid
  assetId  String @db.Uuid
  title    String
  position Int

  item  CurriculumItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  asset Asset          @relation(fields: [assetId], references: [id], onDelete: Restrict)

  @@unique([itemId, position])
  @@index([assetId])
  @@map("lecture_resources")
}
```

Trong `model CourseReview`, thêm sau dòng `comment   String?`:
```prisma
  instructorReply     String?
  instructorRepliedAt DateTime?
```

- [ ] **Step 4: Nhóm 4 — `Enrollment`, `LessonProgress`**

Trong `model Enrollment`: thêm sau dòng `orderId ...`:
```prisma
  couponId       String?   @db.Uuid // coupon free: ghi danh không qua order
```
thay dòng relation `progress LessonProgress[]` bằng:
```prisma
  coupon   Coupon?          @relation(fields: [couponId], references: [id], onDelete: SetNull)
  progress ItemProgress[]
  notes    Note[]
```
thêm `  @@index([couponId])` trước `@@map("enrollments")`.

Thay nguyên `model LessonProgress` (giữ comment heartbeat ở trên) bằng:
```prisma
model ItemProgress {
  enrollmentId    String    @db.Uuid
  itemId          String    @db.Uuid
  watchedSec      Int       @default(0)
  lastPositionSec Int       @default(0)
  completedAt     DateTime?
  updatedAt       DateTime  @updatedAt

  enrollment Enrollment     @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  item       CurriculumItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@id([enrollmentId, itemId])
  @@index([itemId]) // mv_item_dropoff
  @@map("item_progress")
}
```

- [ ] **Step 5: Nhóm 5 — `OrderItem`, thêm `Coupon`**

Trong `model OrderItem`, thêm sau dòng `courseId ...`:
```prisma
  couponId             String?   @db.Uuid
  listPriceAmount      Int // giá gốc lúc mua; giảm giá = listPriceAmount - unitPriceAmount
```
thêm relation sau `course Course ...`:
```prisma
  coupon     Coupon?  @relation(fields: [couponId], references: [id], onDelete: SetNull)
```
thêm `  @@index([couponId])` trước `@@map("order_items")`.

Thêm model mới ngay sau `model PaymentEvent`:
```prisma
// Coupon giảng viên tạo cho 1 khoá (Udemy rút gọn). Luật tháng/thời hạn/bậc giá kiểm ở service;
// CHECK hình dạng dữ liệu ở prisma/sql/05. Trừ lượt bằng 1 câu UPDATE ... RETURNING (spec §3.5).
model Coupon {
  id             String     @id @default(uuid(7)) @db.Uuid
  courseId       String     @db.Uuid
  createdById    String     @db.Uuid
  code           String // ^[A-Z0-9_-]{6,20}$
  type           CouponType
  priceAmount    Int? // fixed_price: > 0; free: null
  startsAt       DateTime
  endsAt         DateTime
  maxRedemptions Int? // free: bắt buộc
  redeemedCount  Int        @default(0)
  disabledAt     DateTime?
  createdAt      DateTime   @default(now())

  course      Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdBy   User         @relation(fields: [createdById], references: [id], onDelete: Restrict)
  orderItems  OrderItem[]
  enrollments Enrollment[]

  @@unique([courseId, code])
  @@index([courseId, createdAt])
  @@map("coupons")
}
```

- [ ] **Step 6: Nhóm 7 — `Question`, `QuestionOption`, `Quiz`, xoá `QuizQuestion`**

Thay nguyên `model Question` bằng:
```prisma
// Câu hỏi THUỘC quiz (bỏ ngân hàng câu hỏi, giống Udemy). Unique (quizId, position) DEFERRABLE ở sql/05.
model Question {
  id            String       @id @default(uuid(7)) @db.Uuid
  quizId        String       @db.Uuid
  position      Int
  type          QuestionType
  stemHtml      String
  relatedItemId String?      @db.Uuid // bài giảng liên quan, cùng khoá (service)
  points        Int          @default(1)
  archivedAt    DateTime? // thay vì xoá — attempt cũ vẫn tham chiếu
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  quiz        Quiz             @relation(fields: [quizId], references: [id], onDelete: Cascade)
  relatedItem CurriculumItem?  @relation(fields: [relatedItemId], references: [id], onDelete: SetNull)
  options     QuestionOption[]
  answers     QuizAnswer[]
  stats       StatQuestion?

  // Không cần @@index([quizId]): unique (quizId, position) ở sql/05 đã là index bắt đầu bằng quizId.
  @@index([relatedItemId])
  @@map("questions")
}
```

Trong `model QuestionOption` thêm sau dòng `isCorrect ...`:
```prisma
  explanation String? // giải thích từng đáp án, ≤600 ký tự (service); tối đa 15 đáp án/câu (service)
```

Thay nguyên `model Quiz` bằng:
```prisma
// Dùng chung cho item quiz và practice_test (loại lấy từ curriculum_items.type).
// practice_test bắt buộc timeLimitSec > 0 (service).
model Quiz {
  id           String   @id @default(uuid(7)) @db.Uuid
  itemId       String   @unique @db.Uuid
  courseId     String   @db.Uuid
  description  String?
  timeLimitSec Int?
  passScorePct Int      @default(70)
  maxAttempts  Int? // null = không giới hạn
  shuffle      Boolean  @default(true)
  isFinal      Boolean  @default(false) // đạt bài này → cấp chứng chỉ (§3.3)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  item      CurriculumItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  course    Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  questions Question[]
  topics    QuizTopic[]
  attempts  QuizAttempt[]

  @@index([courseId])
  @@map("quizzes")
}
```

Xoá nguyên `model QuizQuestion`.

- [ ] **Step 7: Nhóm 8 — `Exercise`, `ExerciseStarterCode`**

Thay nguyên `model Exercise` bằng:
```prisma
// Nhiều ngôn ngữ: test stdin/stdout của Judge0 không phụ thuộc ngôn ngữ (spec D8).
// Mỗi languageId trong allowedLanguageIds có đúng 1 dòng exercise_starter_codes (service).
model Exercise {
  id                  String     @id @default(uuid(7)) @db.Uuid
  itemId              String     @unique @db.Uuid
  courseId            String     @db.Uuid
  learningObjective   String? // ≤200 ký tự (service)
  instructionsHtml    String
  hints               String[]   @default([])
  solutionExplanation String?
  relatedItemId       String?    @db.Uuid
  difficulty          Difficulty @default(medium)
  timeLimitMs         Int        @default(2000)
  memoryLimitKb       Int        @default(128000)
  allowedLanguageIds  Int[] // id ngôn ngữ của Judge0, ≥1 (chk_exercise_languages)
  totalPoints         Int        @default(100)
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  item        CurriculumItem        @relation("ExerciseItem", fields: [itemId], references: [id], onDelete: Cascade)
  relatedItem CurriculumItem?       @relation("ExerciseRelatedLecture", fields: [relatedItemId], references: [id], onDelete: SetNull)
  course      Course                @relation(fields: [courseId], references: [id], onDelete: Cascade)
  starters    ExerciseStarterCode[]
  testCases   ExerciseTestCase[]
  topics      ExerciseTopic[]
  submissions Submission[]
  stats       StatExercise?

  @@index([courseId])
  @@index([relatedItemId])
  @@map("exercises")
}
```

Trong `model ExerciseStarterCode` thêm sau dòng `code       String`:
```prisma
  solutionCode String? // lời giải mẫu, để giảng viên chạy thử bộ test trước khi xuất bản
```

- [ ] **Step 8: Nhóm 10 — `StatVideoBucket`, `StatQuestion`**

Thay nguyên `model StatVideoBucket` bằng:
```prisma
model StatVideoBucket {
  itemId      String @db.Uuid
  bucketIndex Int
  viewers     Int    @default(0) // số người xem tới mốc này
  rewatches   Int    @default(0) // số lượt tua lại đoạn này

  item CurriculumItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@id([itemId, bucketIndex])
  @@map("stat_video_buckets")
}
```

Thay comment + `model StatQuestion` bằng:
```prisma
// Câu hỏi thuộc đúng 1 quiz nên khoá chính là questionId.
model StatQuestion {
  questionId String @id @db.Uuid

  attempts            Int      @default(0)
  correctCount        Int      @default(0)
  difficultyIndex     Decimal? @db.Decimal(4, 3) // p = tỉ lệ trả lời đúng
  discriminationIndex Decimal? @db.Decimal(4, 3) // D = p(top 27%) − p(bottom 27%)
  optionDistribution  Json     @default("{}") // { optionId: count } — đáp án nhiễu
  computedAt          DateTime @default(now())

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@map("stat_questions")
}
```

- [ ] **Step 9: Nhóm 11 mới — tương tác**

Thêm trước khối `//  ENUMS`:
```prisma
// ============================================================================
//  11. TƯƠNG TÁC — thông báo, ghi chú, hỏi đáp (spec 2026-09-30-udemy-curriculum §3.6)
// ============================================================================

model Announcement {
  id        String   @id @default(uuid(7)) @db.Uuid
  courseId  String   @db.Uuid
  authorId  String   @db.Uuid
  title     String
  bodyHtml  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  author User   @relation(fields: [authorId], references: [id], onDelete: Restrict)

  @@index([courseId, createdAt(sort: Desc)])
  @@map("announcements")
}

// Ghi chú riêng của học viên, gắn mốc thời gian video.
model Note {
  id           String   @id @default(uuid(7)) @db.Uuid
  enrollmentId String   @db.Uuid
  itemId       String   @db.Uuid
  positionSec  Int // ≥0 (chk_note_position)
  body         String // ≤1000 ký tự (service)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  enrollment Enrollment     @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  item       CurriculumItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([enrollmentId, itemId, positionSec])
  @@index([itemId])
  @@map("notes")
}

// Hỏi đáp, chỉ khi courses.qaEnabled (service). answerCount/instructorAnsweredAt cập nhật cùng
// transaction với insert course_answers. Partial index "chưa phản hồi" ở sql/05.
model CourseQuestion {
  id                   String    @id @default(uuid(7)) @db.Uuid
  courseId             String    @db.Uuid
  itemId               String?   @db.Uuid
  userId               String    @db.Uuid
  title                String // ≤255 (service)
  bodyHtml             String?
  answerCount          Int       @default(0)
  instructorAnsweredAt DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  course  Course          @relation(fields: [courseId], references: [id], onDelete: Cascade)
  item    CurriculumItem? @relation(fields: [itemId], references: [id], onDelete: SetNull)
  user    User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers CourseAnswer[]

  @@index([courseId, createdAt])
  @@index([itemId])
  @@index([userId])
  @@map("course_questions")
}

model CourseAnswer {
  id           String   @id @default(uuid(7)) @db.Uuid
  questionId   String   @db.Uuid
  userId       String   @db.Uuid
  bodyHtml     String
  isInstructor Boolean  @default(false) // chụp lúc trả lời
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  question CourseQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([questionId, createdAt])
  @@index([userId])
  @@map("course_answers")
}
```

- [ ] **Step 10: Enum**

Thay `enum CourseStatus { ... }` bằng:
```prisma
// Chuyển trạng thái: spec §3.4. unpublished → published luôn phải qua in_review.
enum CourseStatus {
  draft
  in_review
  published
  unpublished
}
```
Xoá nguyên `enum LessonType`. Thay `enum ReportTargetType` bằng:
```prisma
enum ReportTargetType {
  course
  item
  review
  quiz_question
  qa_question
  qa_answer
}
```
Thay `enum QuestionType` bằng:
```prisma
enum QuestionType {
  single_choice
  multiple_choice
}
```
Thêm cuối file:
```prisma
enum CurriculumItemType {
  lecture
  quiz
  practice_test
  coding_exercise
}

enum LectureKind {
  video
  document
}

enum AssetKind {
  video
  document
}

enum AssetStatus {
  uploading
  processing
  ready
  failed
}

enum CouponType {
  fixed_price
  free
}
```

- [ ] **Step 11: Format + validate + generate**

```bash
cd back-end && pnpm prisma format && pnpm prisma validate && pnpm prisma generate
```
Expected: `The schema at prisma/schema.prisma is valid 🚀` và `Generated Prisma Client`. Lỗi relation thiếu tên/thiếu phía ngược → sửa theo thông báo (thường là quên xoá relation cũ trong `User`/`Course`/`Quiz`).

- [ ] **Step 12: Không còn tham chiếu tên cũ**

```bash
grep -nE "\bLesson\b|LessonProgress|LessonResource|QuizQuestion|LessonType|lessonId|pending_review|approved\b|true_false" prisma/schema.prisma
```
Expected: chỉ còn `approved` trong `enum ApprovalStatus`, `enum ApplicationStatus` và comment (`course.approved`, "đã duyệt (approved)"); không còn model/field cũ.

---

### Task 3: Viết test constraint (chạy đỏ)

**Files:**
- Create: `back-end/test/udemy-curriculum.e2e-spec.ts`

**Interfaces:**
- Consumes: Prisma Client từ Task 2.

- [ ] **Step 1: Tạo file test**

```ts
import '../src/env.js';
import { randomUUID } from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
afterAll(() => prisma.$disconnect());

// Mỗi test chạy trong transaction rồi rollback, không để lại rác trong DB dev.
// Postgres huỷ cả transaction sau lệnh lỗi đầu tiên → mỗi test chỉ có MỘT lệnh bị từ chối, đặt cuối.
class Rollback extends Error {}
async function inRollback(fn: (tx: Prisma.TransactionClient) => Promise<void>) {
  await prisma
    .$transaction(
      async (tx) => {
        await fn(tx);
        throw new Rollback();
      },
      { timeout: 20_000 },
    )
    .catch((e: unknown) => {
      if (!(e instanceof Rollback)) throw e;
    });
}

const uid = () => randomUUID().slice(0, 8);
const DAY = 86_400_000;

async function makeCourse(tx: Prisma.TransactionClient) {
  const user = await tx.user.create({
    data: { id: randomUUID(), name: 't', email: `cur-${uid()}@example.com` },
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
  const section = await tx.section.create({
    data: { courseId: course.id, title: 's1', position: 1 },
  });
  return { user, course, section };
}

function makeAsset(
  tx: Prisma.TransactionClient,
  ownerId: string,
  kind: 'video' | 'document',
  mimeType = kind === 'video' ? 'video/mp4' : 'application/pdf',
) {
  return tx.asset.create({
    data: {
      ownerId,
      kind,
      fileName: 'f',
      mimeType,
      sizeBytes: 1000n,
      storageKey: `k-${uid()}`,
      status: 'ready',
    },
  });
}

function couponData(
  courseId: string,
  createdById: string,
  over: Partial<Prisma.CouponUncheckedCreateInput> = {},
): Prisma.CouponUncheckedCreateInput {
  return {
    courseId,
    createdById,
    code: `CODE${uid().toUpperCase()}`,
    type: 'fixed_price',
    priceAmount: 199_000,
    startsAt: new Date(Date.now() - DAY),
    endsAt: new Date(Date.now() + DAY),
    ...over,
  };
}

describe('curriculum_items — chk_item_payload', () => {
  it('đối chứng: lecture chưa có nội dung, lecture video, lecture PDF, quiz đều hợp lệ', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const video = await makeAsset(tx, user.id, 'video');
      const pdf = await makeAsset(tx, user.id, 'document');
      const base = { sectionId: section.id, courseId: course.id, title: 'x' };
      await tx.curriculumItem.create({ data: { ...base, type: 'lecture', position: 1 } });
      await tx.curriculumItem.create({
        data: { ...base, type: 'lecture', position: 2, lectureKind: 'video', videoAssetId: video.id, isPublished: true },
      });
      await tx.curriculumItem.create({
        data: { ...base, type: 'lecture', position: 3, lectureKind: 'document', documentAssetId: pdf.id },
      });
      await tx.curriculumItem.create({ data: { ...base, type: 'quiz', position: 4 } });
    }));

  it('lecture chưa có nội dung thì không được xuất bản', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1, isPublished: true },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));

  it('lecture video phải có videoAssetId', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1, lectureKind: 'video' },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));

  it('lecture không có lectureKind thì không được gắn asset', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const video = await makeAsset(tx, user.id, 'video');
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1, videoAssetId: video.id },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));

  it('item không phải lecture thì không có lectureKind', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      await expect(
        tx.curriculumItem.create({
          data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'quiz', position: 1, lectureKind: 'video' },
        }),
      ).rejects.toThrow(/chk_item_payload/);
    }));
});

describe('kéo thả — unique DEFERRABLE', () => {
  it('đổi chỗ hai section trong một transaction', () =>
    inRollback(async (tx) => {
      const { course, section: s1 } = await makeCourse(tx);
      const s2 = await tx.section.create({ data: { courseId: course.id, title: 's2', position: 2 } });
      await tx.section.update({ where: { id: s1.id }, data: { position: 2 } }); // tạm trùng với s2
      await tx.section.update({ where: { id: s2.id }, data: { position: 1 } });
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`; // ép kiểm ngay vì test sẽ rollback
    }));

  it('hai section trùng position vẫn bị chặn khi kiểm', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      await tx.section.create({ data: { courseId: course.id, title: 's2', position: 1 } });
      await expect(tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`).rejects.toThrow(/uq_sections_position/);
    }));

  it('đổi chỗ hai item trong một section', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      const base = { sectionId: section.id, courseId: course.id, title: 'x', type: 'quiz' as const };
      const a = await tx.curriculumItem.create({ data: { ...base, position: 1 } });
      const b = await tx.curriculumItem.create({ data: { ...base, position: 2 } });
      await tx.curriculumItem.update({ where: { id: a.id }, data: { position: 2 } });
      await tx.curriculumItem.update({ where: { id: b.id }, data: { position: 1 } });
      await tx.$executeRaw`SET CONSTRAINTS ALL IMMEDIATE`;
    }));
});

describe('assets', () => {
  it('asset document chỉ nhận PDF', () =>
    inRollback(async (tx) => {
      const { user } = await makeCourse(tx);
      await expect(makeAsset(tx, user.id, 'document', 'application/msword')).rejects.toThrow(/chk_asset_pdf/);
    }));

  it('không xoá được asset đang được bài giảng dùng', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const video = await makeAsset(tx, user.id, 'video');
      await tx.curriculumItem.create({
        data: {
          sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture',
          position: 1, lectureKind: 'video', videoAssetId: video.id,
        },
      });
      await expect(tx.asset.delete({ where: { id: video.id } })).rejects.toThrow();
    }));
});

describe('exercises, courses, notes, order_items', () => {
  it('bài tập coding phải có ít nhất 1 ngôn ngữ', () =>
    inRollback(async (tx) => {
      const { course, section } = await makeCourse(tx);
      const item = await tx.curriculumItem.create({
        data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'coding_exercise', position: 1 },
      });
      await expect(
        tx.exercise.create({
          data: { itemId: item.id, courseId: course.id, instructionsHtml: 'x', allowedLanguageIds: [] },
        }),
      ).rejects.toThrow(/chk_exercise_languages/);
    }));

  it('đối chứng: exercise 1 ngôn ngữ, giá 0, ghi chú mốc 0, order_item giá gốc = giá bán đều hợp lệ', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const base = { sectionId: section.id, courseId: course.id, title: 'x' };
      const ex = await tx.curriculumItem.create({ data: { ...base, type: 'coding_exercise', position: 1 } });
      await tx.exercise.create({
        data: { itemId: ex.id, courseId: course.id, instructionsHtml: 'x', allowedLanguageIds: [71] },
      });
      await tx.course.update({ where: { id: course.id }, data: { priceAmount: 0 } });
      const lec = await tx.curriculumItem.create({ data: { ...base, type: 'lecture', position: 2 } });
      const e = await tx.enrollment.create({ data: { userId: user.id, courseId: course.id } });
      await tx.note.create({ data: { enrollmentId: e.id, itemId: lec.id, positionSec: 0, body: 'x' } });
      const order = await tx.order.create({ data: { userId: user.id, subtotalAmount: 100, totalAmount: 100 } });
      await tx.orderItem.create({
        data: {
          orderId: order.id, courseId: course.id, instructorId: user.id,
          listPriceAmount: 100, unitPriceAmount: 100, platformFeeAmount: 30, instructorEarnAmount: 70,
        },
      });
    }));

  it('giá khoá không âm', () =>
    inRollback(async (tx) => {
      const { course } = await makeCourse(tx);
      await expect(
        tx.course.update({ where: { id: course.id }, data: { priceAmount: -1 } }),
      ).rejects.toThrow(/chk_course_price/);
    }));

  it('mốc ghi chú không âm', () =>
    inRollback(async (tx) => {
      const { user, course, section } = await makeCourse(tx);
      const item = await tx.curriculumItem.create({
        data: { sectionId: section.id, courseId: course.id, title: 'x', type: 'lecture', position: 1 },
      });
      const e = await tx.enrollment.create({ data: { userId: user.id, courseId: course.id } });
      await expect(
        tx.note.create({ data: { enrollmentId: e.id, itemId: item.id, positionSec: -1, body: 'x' } }),
      ).rejects.toThrow(/chk_note_position/);
    }));

  it('giá gốc order_item không nhỏ hơn giá bán', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      const order = await tx.order.create({
        data: { userId: user.id, subtotalAmount: 100, totalAmount: 100 },
      });
      await expect(
        tx.orderItem.create({
          data: {
            orderId: order.id, courseId: course.id, instructorId: user.id,
            listPriceAmount: 50, unitPriceAmount: 100, platformFeeAmount: 30, instructorEarnAmount: 70,
          },
        }),
      ).rejects.toThrow(/chk_order_item_list_price/);
    }));
});

describe('coupons', () => {
  it('đối chứng: coupon fixed_price và free hợp lệ', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await tx.coupon.create({ data: couponData(course.id, user.id) });
      await tx.coupon.create({
        data: couponData(course.id, user.id, { type: 'free', priceAmount: null, maxRedemptions: 100 }),
      });
    }));

  it('mã coupon chữ thường bị từ chối', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { code: 'abcdef' }) }),
      ).rejects.toThrow(/chk_coupon_code/);
    }));

  it('fixed_price phải có giá', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { priceAmount: null }) }),
      ).rejects.toThrow(/chk_coupon_price/);
    }));

  it('free không được có giá', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { type: 'free', maxRedemptions: 10 }) }),
      ).rejects.toThrow(/chk_coupon_price/);
    }));

  it('free bắt buộc có maxRedemptions', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { type: 'free', priceAmount: null }) }),
      ).rejects.toThrow(/chk_coupon_redemptions/);
    }));

  it('endsAt phải sau startsAt', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      const t = new Date();
      await expect(
        tx.coupon.create({ data: couponData(course.id, user.id, { startsAt: t, endsAt: t }) }),
      ).rejects.toThrow(/chk_coupon_window/);
    }));

  it('trừ lượt atomic: maxRedemptions = 1 thì lần 2 không trả dòng', () =>
    inRollback(async (tx) => {
      const { user, course } = await makeCourse(tx);
      const c = await tx.coupon.create({ data: couponData(course.id, user.id, { maxRedemptions: 1 }) });
      const redeem = () => tx.$queryRaw<{ id: string }[]>`
        UPDATE coupons SET "redeemedCount" = "redeemedCount" + 1
        WHERE id = ${c.id}::uuid AND "disabledAt" IS NULL
          AND now() BETWEEN "startsAt" AND "endsAt"
          AND ("maxRedemptions" IS NULL OR "redeemedCount" < "maxRedemptions")
        RETURNING id`;
      expect(await redeem()).toHaveLength(1);
      expect(await redeem()).toHaveLength(0);
    }));
});
```

- [ ] **Step 2: Typecheck file test**

```bash
cd back-end && pnpm exec tsc --noEmit -p tsconfig.json
```
Expected: không lỗi (Prisma Client đã generate ở Task 2). Nếu `tsconfig.json` không include `test/`, bỏ qua bước này — vitest sẽ báo lỗi kiểu khi chạy.

- [ ] **Step 2b: Sửa test cũ `test/taxonomy.e2e-spec.ts` theo schema mới**

Test "quiz gắn được topic" tạo quiz kiểu cũ (`title`, không có `itemId`). Thay dòng
`const quiz = await tx.quiz.create({ data: { courseId: course.id, title: 'q' } });` bằng:
```ts
      const section = await tx.section.create({ data: { courseId: course.id, title: 's', position: 1 } });
      const item = await tx.curriculumItem.create({
        data: { sectionId: section.id, courseId: course.id, title: 'q', type: 'quiz', position: 1 },
      });
      const quiz = await tx.quiz.create({ data: { itemId: item.id, courseId: course.id } });
```
Chạy lại `pnpm exec tsc --noEmit -p tsconfig.json`: không còn lỗi ở `test/` (lỗi có sẵn `src/sentry-redact.spec.ts` TS2352 không thuộc task này).

- [ ] **Step 3: Chạy test, xác nhận đỏ**

```bash
pnpm test:e2e test/udemy-curriculum.e2e-spec.ts
```
Expected: FAIL — lỗi dạng `The table public.curriculum_items does not exist` / `assets does not exist` vì DB chưa migrate.

---

### Task 4: SQL bổ sung + migration

**Files:**
- Create: `back-end/prisma/sql/05_udemy_curriculum.sql`
- Create (Prisma sinh): `back-end/prisma/migrations/<ts>_udemy_curriculum/migration.sql`
- Modify: `back-end/prisma/sql/01_post_migrate.sql`, `back-end/README.md`

- [ ] **Step 1: Tạo `prisma/sql/05_udemy_curriculum.sql`**

```sql
-- ============================================================================
--  Bổ sung cho migration udemy_curriculum (spec 2026-09-30-udemy-curriculum-schema §5).
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
--  ĐẦU migration.sql phải có (thêm tay, trước mọi lệnh Prisma sinh):
--    DROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;   -- phụ thuộc bảng lessons
--    DROP INDEX IF EXISTS idx_courses_embedding;           -- WHERE status = 'approved' chặn đổi enum
--
--  CẢNH BÁO drift — danh sách ĐẦY ĐỦ object viết tay mà Prisma không biết (thay danh sách ở 03).
--  `prisma migrate dev` có thể sinh DROP cho chúng. Luôn `--create-only`, xoá mọi câu lệnh động tới:
--    idx_courses_embedding, uq_course_primary_topic,
--    uq_sections_position, uq_items_position, uq_questions_position, idx_qa_unanswered,
--    idx_quizzes_final, uq_one_final_quiz_per_course, idx_certificates_active,
--    idx_submissions_inflight, idx_reports_open, idx_payment_events_unprocessed (partial index ở init),
--    các CHECK chk_* (Prisma không quản lý CHECK), mv_* (materialized view).
--  (idx_courses_search, idx_courses_title_trgm, searchTsv đã drop ở drop_pg_fulltext;
--   idx_topics_name_trgm do Prisma quản lý.)
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Unique DEFERRABLE — kéo thả đổi chỗ trong một transaction (spec D5)
-- ---------------------------------------------------------------------------
ALTER TABLE sections ADD CONSTRAINT uq_sections_position
  UNIQUE ("courseId", position) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE curriculum_items ADD CONSTRAINT uq_items_position
  UNIQUE ("sectionId", position) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE questions ADD CONSTRAINT uq_questions_position
  UNIQUE ("quizId", position) DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
--  2. CHECK
--  Mọi so sánh trên cột nullable dùng IS [NOT] DISTINCT FROM / coalesce:
--  CHECK trả NULL được coi là ĐẠT, nên "NULL = 'video'" sẽ lọt.
-- ---------------------------------------------------------------------------

-- Lecture: chưa có nội dung (không được xuất bản) | video | document. Loại khác: không có cột lecture.
ALTER TABLE curriculum_items ADD CONSTRAINT chk_item_payload CHECK (
  CASE WHEN type = 'lecture' THEN
       ("lectureKind" IS NULL AND "videoAssetId" IS NULL AND "documentAssetId" IS NULL
        AND NOT "isPublished")
    OR ("lectureKind" IS NOT DISTINCT FROM 'video'
        AND "videoAssetId" IS NOT NULL AND "documentAssetId" IS NULL)
    OR ("lectureKind" IS NOT DISTINCT FROM 'document'
        AND "documentAssetId" IS NOT NULL AND "videoAssetId" IS NULL)
  ELSE "lectureKind" IS NULL AND "videoAssetId" IS NULL AND "documentAssetId" IS NULL
  END
);

ALTER TABLE assets ADD CONSTRAINT chk_asset_pdf
  CHECK (kind <> 'document' OR "mimeType" = 'application/pdf');

ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (cardinality("allowedLanguageIds") >= 1);

ALTER TABLE courses ADD CONSTRAINT chk_course_price CHECK ("priceAmount" >= 0);

ALTER TABLE coupons
  ADD CONSTRAINT chk_coupon_code CHECK (code ~ '^[A-Z0-9_-]{6,20}$'),
  ADD CONSTRAINT chk_coupon_price CHECK (
       (type = 'fixed_price' AND coalesce("priceAmount", 0) > 0)
    OR (type = 'free' AND "priceAmount" IS NULL)
  ),
  ADD CONSTRAINT chk_coupon_window CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT chk_coupon_redemptions CHECK (
    "redeemedCount" >= 0
    AND ("maxRedemptions" IS NULL OR ("maxRedemptions" > 0 AND "redeemedCount" <= "maxRedemptions"))
    AND (type <> 'free' OR "maxRedemptions" IS NOT NULL)
  );

ALTER TABLE order_items ADD CONSTRAINT chk_order_item_list_price
  CHECK ("listPriceAmount" >= "unitPriceAmount");

ALTER TABLE notes ADD CONSTRAINT chk_note_position CHECK ("positionSec" >= 0);

-- ---------------------------------------------------------------------------
--  3. Partial index
-- ---------------------------------------------------------------------------
-- Tạo lại (drop ở đầu migration): chỉ index khoá đang bán.
CREATE INDEX idx_courses_embedding ON courses
  USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'published';

-- Dashboard giảng viên: câu hỏi chưa có giảng viên trả lời.
CREATE INDEX idx_qa_unanswered ON course_questions ("courseId", "createdAt")
  WHERE "instructorAnsweredAt" IS NULL;

-- ---------------------------------------------------------------------------
--  4. Materialized view — thay mv_lesson_dropoff (§3.5b: bài nào nhiều người bỏ dở)
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW mv_item_dropoff AS
SELECT
  i.id                                        AS item_id,
  i."courseId"                                AS course_id,
  s.position                                  AS section_position,
  i.position,
  COUNT(p."itemId")::int                      AS started,
  COUNT(p."completedAt")::int                 AS completed,
  ROUND(
    1 - COUNT(p."completedAt")::numeric / NULLIF(COUNT(p."itemId"), 0), 3
  )                                           AS dropoff_rate,
  COALESCE(AVG(p."watchedSec"), 0)::int       AS avg_watched_sec
FROM curriculum_items i
JOIN sections s ON s.id = i."sectionId"
LEFT JOIN item_progress p ON p."itemId" = i.id
WHERE i.type = 'lecture'
GROUP BY i.id, i."courseId", s.position, i.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_item_dropoff ON mv_item_dropoff (item_id);
CREATE INDEX idx_mv_item_dropoff_course ON mv_item_dropoff (course_id, section_position, position);

-- Giữ tên hàm: job pg_cron (nếu có) không phải sửa.
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_copurchase;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_item_dropoff;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_completion;
END $$;

REFRESH MATERIALIZED VIEW mv_item_dropoff;
```

- [ ] **Step 2: Sinh migration, chưa áp dụng**

```bash
cd back-end && pnpm prisma migrate dev --create-only --name udemy_curriculum
```
Prisma cảnh báo mất dữ liệu (drop bảng/cột, bỏ giá trị enum) và hỏi xác nhận → chọn **y** (Task 1 đã xác nhận các bảng rỗng). Nếu lệnh báo drift và đòi reset DB → **DỪNG, báo sếp**, không reset.

- [ ] **Step 3: Rà file sinh ra**

```bash
f=$(ls -d prisma/migrations/*_udemy_curriculum | tail -1)/migration.sql; echo "$f"
grep -nE "idx_courses_embedding|uq_course_primary_topic|uq_sections_position|uq_items_position|uq_questions_position|idx_qa_unanswered|idx_quizzes_final|uq_one_final_quiz_per_course|idx_certificates_active|idx_submissions_inflight|idx_reports_open|idx_payment_events_unprocessed|chk_|mv_" "$f" || echo "OK: không đụng object viết tay"
grep -n "sections_courseId_position_key" "$f"
```
Expected: dòng grep đầu in `OK: ...`; nếu có dòng nào → xoá dòng đó khỏi `$f`. Dòng `DROP INDEX "sections_courseId_position_key";` phải **CÓ** và **giữ lại** (05 tạo lại dạng constraint DEFERRABLE). Tương tự giữ `DROP TABLE "quiz_questions"`, `"lessons"`, `"lesson_progress"`, `"lesson_resources"` và các `CREATE TYPE "..._new"` của enum.

- [ ] **Step 4: Thêm 2 dòng đầu file và dán 05 vào cuối**

```bash
{ printf -- '-- Thêm tay (spec §6.3): object phụ thuộc bảng/enum sắp đổi.\nDROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;\nDROP INDEX IF EXISTS idx_courses_embedding;\n\n'; cat "$f"; printf '\n'; cat prisma/sql/05_udemy_curriculum.sql; } > "$f.tmp" && mv "$f.tmp" "$f"
head -5 "$f"; tail -3 "$f"
```
Expected: 3 dòng đầu là comment + 2 lệnh DROP; cuối file là `REFRESH MATERIALIZED VIEW mv_item_dropoff;`.

- [ ] **Step 5: Áp dụng + generate**

```bash
pnpm prisma migrate deploy && pnpm prisma generate
```
Expected: `All migrations have been successfully applied.` Nếu lỗi: đọc thông báo, sửa `migration.sql` (migration lỗi được đánh dấu failed). Prisma chạy phần đổi enum trong BEGIN/COMMIT riêng nên migration lỗi giữa chừng có thể đã áp một phần: **kiểm xem object nào đã tồn tại** (`prisma migrate diff --from-url ... --to-schema-datamodel ...` như Step 8) trước khi `pnpm prisma migrate resolve --rolled-back <tên_migration>` và deploy lại; nếu DB đã lệch khó gỡ → DỪNG, báo sếp. Không sửa migration cũ.

- [ ] **Step 6: Chạy test, xác nhận xanh**

```bash
pnpm test:e2e test/udemy-curriculum.e2e-spec.ts
```
Expected: PASS toàn bộ. Nếu một test `rejects.toThrow(/chk_.../)` fail vì message Prisma không chứa tên constraint (lỗi vẫn là check violation) → in `e.message` ra xem; chỉ nới regex khi chắc chắn lỗi là đúng constraint đó.

- [ ] **Step 7: Không vỡ test cũ**

```bash
pnpm test:e2e
```
Expected: PASS (taxonomy, categories, auth, app).

- [ ] **Step 8: Kiểm DB khớp schema**

```bash
pnpm prisma migrate diff \
  --from-url "$(node --env-file=.env -e 'process.stdout.write(process.env.DIRECT_URL)')" \
  --to-schema-datamodel prisma/schema.prisma --script
```
Expected: chỉ còn lệnh động tới object viết tay trong danh sách drift (`idx_courses_embedding`, `uq_course_primary_topic`, `uq_sections_position`, `uq_items_position`, `uq_questions_position`, `idx_qa_unanswered`, 6 partial index ở init) hoặc `-- This is an empty migration.`. Có bất kỳ lệnh nào khác (CREATE TABLE, ALTER COLUMN, …) → schema và DB lệch, sửa trước khi đi tiếp.

- [ ] **Step 9: Ghi chú ở `01_post_migrate.sql`**

Thêm dòng comment (không sửa SQL) ngay **trên** các khối sau:
- trên `ALTER TABLE lessons` (`chk_lesson_payload`): `-- [2026-09-30] Bảng lessons đã thay bằng curriculum_items, CHECK mới chk_item_payload ở 05_udemy_curriculum.sql.`
- trên `CREATE INDEX idx_courses_embedding`: `-- [2026-09-30] Tạo lại với WHERE status = 'published' ở 05_udemy_curriculum.sql.`
- trên `CREATE MATERIALIZED VIEW mv_lesson_dropoff`: `-- [2026-09-30] Thay bằng mv_item_dropoff ở 05_udemy_curriculum.sql.`
- trên `CREATE OR REPLACE FUNCTION refresh_analytics_views`: `-- [2026-09-30] Định nghĩa mới ở 05_udemy_curriculum.sql.`
- trên `ALTER TABLE quizzes ADD CONSTRAINT chk_pass_score`: không đổi (bảng quizzes giữ).

- [ ] **Step 10: README — danh sách drift**

Trong `back-end/README.md`, thay đoạn
```
Có object viết tay mà Prisma không biết: `idx_courses_embedding`, `uq_course_primary_topic`.
```
bằng
```
Có object viết tay mà Prisma không biết (danh sách đầy đủ ở đầu `prisma/sql/05_udemy_curriculum.sql`):
`idx_courses_embedding`, `uq_course_primary_topic`, `uq_sections_position`, `uq_items_position`,
`uq_questions_position`, `idx_qa_unanswered`, các partial index ở init (`idx_quizzes_final`,
`uq_one_final_quiz_per_course`, `idx_certificates_active`, `idx_submissions_inflight`, `idx_reports_open`,
`idx_payment_events_unprocessed`), các CHECK `chk_*` và materialized view `mv_*`.
```

---

### Task 5: Tài liệu

**Files:**
- Modify: `schema-database.md`, `de-xuat-do-an.md`

- [ ] **Step 1: `schema-database.md` §4 — chép schema mới**

Thay toàn bộ nội dung trong khối ```` ```prisma ```` của §4 bằng nội dung `back-end/prisma/schema.prisma` hiện tại:
```bash
cd /Users/bssgroup/Personal/Project && python3 - <<'EOF'
import re
doc = open('schema-database.md').read()
schema = open('back-end/prisma/schema.prisma').read().rstrip('\n')
start = doc.index('## 4. Prisma schema')
a = doc.index('```prisma\n', start) + len('```prisma\n')
b = doc.index('\n```', a)
open('schema-database.md', 'w').write(doc[:a] + schema + doc[b:])
EOF
grep -c "model CurriculumItem" schema-database.md
```
Expected: `1`.

- [ ] **Step 2: `schema-database.md` §5 — thêm SQL 05**

Ngay trước dòng `## 6. Truy vấn tham chiếu`, thêm:
````markdown
### 5.x Bổ sung 2026-09-30 — curriculum kiểu Udemy

Các khối về `lessons`, `mv_lesson_dropoff`, `idx_courses_embedding WHERE status = 'approved'` ở trên
đã lỗi thời; bản thay thế:

```sql
<dán nguyên nội dung back-end/prisma/sql/05_udemy_curriculum.sql>
```
````

- [ ] **Step 3: `schema-database.md` §1–§3 và §6**

- §1 bảng tổng quan: đổi số bảng (đếm lại `grep -c "^model " back-end/prisma/schema.prisma`); nhóm 3 thành `categories courses sections curriculum_items assets lecture_resources course_reviews`; nhóm 4 `enrollments item_progress`; nhóm 5 thêm `coupons`; nhóm 7 bỏ `quiz_questions`; thêm nhóm 11 `announcements notes course_questions course_answers`; MV `mv_item_dropoff`.
- §2: dòng "`lessons` một bảng cho 4 loại" đổi thành "`curriculum_items` một bảng cho mọi loại mục (lecture/quiz/practice_test/coding_exercise); quiz/exercise là bảng 1-1 trỏ về `itemId` bắt buộc"; thêm dòng "Unique `position` DEFERRABLE — kéo thả đổi chỗ section/mục trong một transaction"; dòng "3 MV" đổi `lesson_progress` → `item_progress`; ở "Đã cố ý bỏ" xoá `bảng coupons`, thêm `wishlist`, `assignment`, `nhiều giảng viên/khoá`.
- §3 sơ đồ: `sections ─< curriculum_items ─┬─< lecture_resources >─ assets`, `├─── quizzes ─< questions`, `├─── exercises ─< exercise_test_cases`, `├─< stat_video_buckets`, `└─< notes`; `enrollments ─< item_progress >─ curriculum_items`; thêm `courses ─< coupons`, `courses ─< announcements`, `courses ─< course_questions ─< course_answers`, `user ─< assets`.
- §6: thay mọi `c.status = 'approved'` bằng `c.status = 'published'`; truy vấn dùng `JOIN lessons l ON l.id = q."lessonId"` đổi thành `JOIN curriculum_items i ON i.id = q."itemId"` (sửa alias `l.` → `i.` trong truy vấn đó); `mv_lesson_dropoff` → `mv_item_dropoff`.

Kiểm:
```bash
grep -nE "lessons|lesson_progress|quiz_questions|status = 'approved'|mv_lesson_dropoff" schema-database.md
```
Expected: chỉ còn trong §5 (khối SQL cũ đã ghi chú là lỗi thời) và trong §4 không có dòng nào.

- [ ] **Step 4: `de-xuat-do-an.md`**

- Dòng 46: `| Ngân hàng câu hỏi | Giảng viên tạo câu hỏi trắc nghiệm, ...` → `| Câu hỏi trắc nghiệm | Giảng viên soạn câu hỏi ngay trong từng quiz (1 hoặc nhiều đáp án đúng, giải thích từng đáp án, gắn bài giảng liên quan), **mỗi quiz gắn 1–3 topic** của khoá (vd `react`, `sql`), topic theo taxonomy Udemy |`
- §3.1 "Chức năng nền": thêm gạch đầu dòng `- Coupon giảng viên tạo, thông báo khoá học, ghi chú theo mốc video, hỏi đáp`.

---

### Task 6: Kiểm tra cuối + đề xuất commit

- [ ] **Step 1: Chạy toàn bộ kiểm tra**

```bash
cd back-end && pnpm prisma validate && pnpm exec tsc --noEmit -p tsconfig.json && pnpm test:e2e && git status --short
```
Expected: validate OK, tsc không lỗi, e2e PASS. `git status` chỉ gồm: `prisma/schema.prisma`, `prisma/sql/05_udemy_curriculum.sql`, `prisma/sql/01_post_migrate.sql`, `prisma/migrations/<ts>_udemy_curriculum/`, `README.md`, `test/udemy-curriculum.e2e-spec.ts`, `../schema-database.md`, `../de-xuat-do-an.md`, spec và plan.

- [ ] **Step 2: Đề xuất commit, CHỜ sếp duyệt (không tự chạy `git commit`)**

Tạo nhánh trước khi commit (đang ở `main`): `git switch -c feat/udemy-curriculum-schema`.

Commit message đề xuất:
```
feat: schema curriculum kiểu Udemy — curriculum item, asset, quiz/coding gắn item, coupon, Q&A

- lessons → curriculum_items (lecture/quiz/practice_test/coding_exercise), publish từng mục
- assets (video/PDF) + lecture_resources; unique position DEFERRABLE cho kéo thả
- câu hỏi thuộc quiz, giải thích từng đáp án; bài tập coding giữ nhiều ngôn ngữ
- courses: mục tiêu/yêu cầu/đối tượng, lời chào/chúc; CourseStatus 4 trạng thái
- coupons, announcements, notes, course_questions/answers, trả lời review
```
Không thêm Co-Authored-By, không push.
