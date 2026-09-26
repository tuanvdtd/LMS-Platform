# Thiết kế Database — SkillPath LMS

Schema đề xuất cho [de-xuat-do-an.md](./de-xuat-do-an.md). PostgreSQL (Supabase) + pgvector, khai bằng Prisma.

Phạm vi: toàn bộ mức **Bắt buộc** và **Nên có** trong §3.6. Bỏ mức Mở rộng (phát hiện đạo văn code), nhưng giữ sẵn cột `embedding` và `searchTsv` vì thêm sau tốn migration.

---

## 1. Tổng quan

**43 bảng + 3 materialized view**, chia 10 nhóm:

| # | Nhóm | Bảng | Phục vụ |
|---|---|---|---|
| 1 | Auth | `user` `session` `account` `verification` | Better Auth sở hữu (§3.1, §4.4) |
| 2 | Xác minh & kiểm duyệt | `instructor_applications` `instructor_profiles` `course_approvals` `content_reports` | §3.2 |
| 3 | Khoá học & nội dung | `categories` `courses` `sections` `lessons` `lesson_resources` `course_reviews` | §3.1, §3.2 |
| 4 | Ghi danh & tiến độ | `enrollments` `lesson_progress` | §3.1, §3.5b |
| 5 | Thương mại | `cart_items` `orders` `order_items` `refunds` `payment_events` | §3.1, §3.5a |
| 6 | Kỹ năng | `skills` `_SkillPrereq` `course_skills` `user_skill_mastery` `user_target_skills` | §3.3 hồ sơ năng lực, §3.4 tầng 2 |
| 7 | Trắc nghiệm | `questions` `question_options` `question_skills` `quizzes` `quiz_questions` `quiz_attempts` `quiz_answers` | §3.3, §3.5c |
| 8 | Bài tập lập trình | `exercises` `exercise_starter_codes` `exercise_test_cases` `exercise_skills` `submissions` `submission_results` | §3.3, §4.5 |
| 9 | Chứng chỉ | `certificates` | §3.3 |
| 10 | Thống kê dashboard | `stat_course_daily` `stat_video_buckets` `stat_questions` `stat_exercises` `stat_student_risk` `email_logs` | §3.5 |
| — | Materialized view | `mv_course_copurchase` `mv_lesson_dropoff` `mv_course_completion` | §3.4 tầng 3, §3.5b |

## 2. Quyết định thiết kế chính

| Quyết định | Lý do |
|---|---|
| **Tách kỹ năng TỰ KHAI khỏi kỹ năng ĐO ĐƯỢC** | `user_target_skills` (học viên chọn lúc onboarding) vs `user_skill_mastery` (tính từ bài test). Chênh lệch hai bảng là tín hiệu tầng 2, và bảng đầu cho tầng 2 **chạy ngay ngày đăng ký** thay vì phải chờ có dữ liệu test. Không gộp làm một vì "muốn học" và "đang yếu" là hai việc khác nhau — yếu `sql-join` nhưng không quan tâm SQL thì không nên gợi ý. |
| **Hai trục phân loại tách rời** | `categories` = chủ đề (kiểu Udemy, để duyệt/lọc/breadcrumb). `Track` = nghề nghiệp học viên nhắm tới (để khớp `users.targetTrack` ở recommendation tầng 1). Udemy chỉ có trục đầu; §3.4 cần cả hai. Gộp làm một enum thì mất breadcrumb và thêm danh mục phải migrate. |
| **`categories` là bảng tự tham chiếu, không phải enum** | Một bảng thay vì ba (`category`/`subcategory`/`topic`). Admin thêm danh mục không cần redeploy — Udemy sửa taxonomy của họ định kỳ. Trigger chặn ở 2 tầng. |
| **Không có tầng "topic" của Udemy** | `skills` + `course_skills` đã là tầng mịn và làm việc thật (mastery, đồ thị tiên quyết, tầng 2). Thêm `topics` là khái niệm thứ ba chồng lấn, không ai tiêu thụ. |
| **UUID v7** cho mọi khoá chính | Sắp theo thời gian → B-tree không phân mảnh như UUID v4. Better Auth phải cấu hình `generateId` cùng loại, xem ghi chú trong schema. |
| **Không có bảng lưu heartbeat thô** | §4.5: Supabase free giới hạn 500MB. Worker Kafka gom batch rồi ghi thẳng vào `stat_video_buckets` và `lesson_progress`. |
| **Bảng `session` gần như rỗng** | §4.4 giữ session ở Redis (`storeSessionInDatabase: false`). Bảng chỉ để plugin `admin` revoke/impersonate chạy ổn định; xoá được. |
| **Tiền lưu `Int`** | Đơn vị nhỏ nhất của currency. Không dùng `Float` cho tiền. |
| **`order_items` snapshot giá + phí** | Đổi giá khoá sau này không làm sai báo cáo doanh thu lịch sử. |
| **`lessons` một bảng cho 4 loại** | Cột nullable theo `type`, quiz/exercise trỏ ngược về `lessonId` — rẻ hơn 4 bảng con và 4 join. |
| **`quiz_answers.selectedOptionIds` là `uuid[]`** | Phân tích đáp án nhiễu (§3.5c) làm bằng `unnest()`, không cần thêm bảng nối. |
| **`submission_results.judge0Token` UNIQUE** | Callback của Judge0 ghi đúng dòng và idempotent khi bị gọi lại (§4.5). |
| **`enrollments` UNIQUE(user, course)** | Idempotency cho Stripe webhook — gọi lại không tạo ghi danh trùng. |
| **`payment_events` PK(provider, eventId)** | Insert trước khi xử lý; trùng khoá = webhook đã nhận rồi. |
| **3 MV thay 3 bảng stat** | Dữ liệu nguồn đã nằm trong `enrollments`/`lesson_progress`, cron `REFRESH CONCURRENTLY` hằng đêm là đủ. |
| **`instructor_profiles` tồn tại = đã xác minh** | Không cần thêm cột boolean nào. |
| **Đa hình có chủ ý ở `content_reports`** | `targetType` + `targetId` không FK cứng — 4 loại đối tượng bị báo cáo, làm 4 cột nullable thì tệ hơn. |

**Đã cố ý bỏ:** bảng `coupons` (đề xuất không nhắc) · `audit_logs` chung (các bảng duyệt đã có `reviewedById` + `reviewedAt`) · bảng phát hiện đạo văn code · transactional outbox cho Kafka (§4.5 chấp nhận mất heartbeat khi Kafka lỗi).

## 3. Sơ đồ quan hệ chính

```
user ─┬─< instructor_applications ──> (admin duyệt)
      ├─── instructor_profiles          (tồn tại = đã xác minh)
      ├─< courses ─┬── categories ─< categories  (tự tham chiếu, 2 tầng)
      │            ├─< course_approvals
      │            ├─< sections ─< lessons ─┬─< lesson_resources
      │            │                        ├─── quizzes ─< quiz_questions >─ questions
      │            │                        ├─── exercises ─< exercise_test_cases
      │            │                        └─< stat_video_buckets
      │            ├─< course_skills >─ skills ─< _SkillPrereq (tự tham chiếu)
      │            ├─< course_reviews
      │            └─< stat_course_daily
      ├─< enrollments ─< lesson_progress >─ lessons
      ├─< orders ─< order_items ─< refunds
      ├─< cart_items
      ├─< user_skill_mastery >─ skills          ← kỹ năng ĐO ĐƯỢC (từ bài test)
      ├─< user_target_skills >─ skills          ← kỹ năng TỰ KHAI (onboarding)
      │                                            chênh lệch 2 bảng = tầng 2
      ├─< quiz_attempts ─< quiz_answers >─ questions
      ├─< submissions ─< submission_results >─ exercise_test_cases
      ├─< certificates
      ├─< stat_student_risk
      └─< email_logs

questions >─< question_skills >─ skills        ← "mỗi câu gắn tag kỹ năng"
exercises >─< exercise_skills  >─ skills
```

Luồng tính **hồ sơ năng lực**: `quiz_answers` / `submissions` → tag qua `question_skills` / `exercise_skills` → cập nhật `user_skill_mastery` → nuôi recommendation tầng 2 và radar chart §3.5d.

---

## 4. Prisma schema

```prisma
// ============================================================================
//  SkillPath LMS — Prisma schema
//  PostgreSQL (Supabase) + pgvector
//
//  Quy ước:
//   - Mọi id là UUID v7 (sắp theo thời gian → index không phân mảnh như v4).
//     Better Auth phải được cấu hình sinh cùng loại id, xem ghi chú ở model User.
//   - Tiền lưu bằng Int, đơn vị nhỏ nhất của currency (cent / đồng). Không dùng Float.
//   - Bảng tiền tố `stat_` là dữ liệu tổng hợp do worker/cron ghi, không phải nguồn
//     sự thật. Xoá đi tính lại được.
//   - Cột Unsupported(...) Prisma Client không đọc/ghi được → dùng $queryRaw.
//     Xem mục 5 "SQL bổ sung" ở cuối tài liệu.
// ============================================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL") // transaction pooler :6543 ?pgbouncer=true
  directUrl  = env("DIRECT_URL") // session pooler / direct — dùng cho migrate
  extensions = [vector, pg_trgm, unaccent]
}

// ============================================================================
//  1. AUTH — Better Auth sở hữu 4 model dưới đây
// ============================================================================
//
//  Cấu hình bắt buộc trong auth.ts để id khớp với 40 bảng còn lại:
//
//    import { v7 as uuidv7 } from 'uuid';
//    betterAuth({
//      advanced: { database: { generateId: () => uuidv7() } },
//      secondaryStorage: redisStore,        // §4.4: session nằm ở Redis
//      session: { storeSessionInDatabase: false },
//      user: { additionalFields: {
//        targetTrack: { type: 'string', required: false },
//        level:       { type: 'string', required: false },
//      }},
//      plugins: [admin()],                  // role / banned / banReason / banExpires
//    });
//
//  Không tự sửa cột của 4 model này ngoài additionalFields.

model User {
  id            String   @id @db.Uuid
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // plugin admin — role là String (không phải enum) theo yêu cầu của Better Auth
  role       String?   @default("student") // "student" | "instructor" | "admin"
  banned     Boolean?  @default(false)
  banReason  String?
  banExpires DateTime?

  // additionalFields — chọn lúc đăng ký, nuôi recommendation tầng 1 (§3.4)
  targetTrack Track?
  level       SkillLevel?

  sessions Session[]
  accounts Account[]

  instructorProfile    InstructorProfile?
  applications         InstructorApplication[] @relation("applicant")
  applicationsReviewed InstructorApplication[] @relation("applicationReviewer")
  courses              Course[]                @relation("courseInstructor")
  approvalsSubmitted   CourseApproval[]        @relation("approvalSubmitter")
  approvalsReviewed    CourseApproval[]        @relation("approvalReviewer")
  reportsFiled         ContentReport[]         @relation("reporter")
  reportsHandled       ContentReport[]         @relation("reportHandler")
  reviews              CourseReview[]
  enrollments          Enrollment[]
  cartItems            CartItem[]
  orders               Order[]
  earnings             OrderItem[]             @relation("itemInstructor")
  skillMastery         UserSkillMastery[]
  targetSkills         UserTargetSkill[]
  questionsCreated     Question[]
  quizAttempts         QuizAttempt[]
  submissions          Submission[]
  certificates         Certificate[]
  riskScores           StatStudentRisk[]
  emailLogs            EmailLog[]

  @@index([role])
  @@map("user")
}

// Chỉ giữ để plugin admin revoke/impersonate hoạt động ổn định.
// Với storeSessionInDatabase: false, bảng này luôn rỗng — xoá được nếu không cần.
model Session {
  id             String   @id @db.Uuid
  token          String   @unique
  expiresAt      DateTime
  ipAddress      String?
  userAgent      String?
  impersonatedBy String?  @db.Uuid
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  userId String @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("session")
}

// Credential (password hash) + OAuth Google/GitHub dùng chung bảng này.
model Account {
  id                    String    @id @db.Uuid
  accountId             String
  providerId            String // "credential" | "google" | "github"
  password              String? // chỉ có với providerId = "credential"
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  userId String @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([providerId, accountId])
  @@index([userId])
  @@map("account")
}

// Token xác minh email / đặt lại mật khẩu.
model Verification {
  id         String   @id @db.Uuid
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([identifier])
  @@map("verification")
}

// ============================================================================
//  2. XÁC MINH GIẢNG VIÊN & KIỂM DUYỆT (§3.2)
// ============================================================================

model InstructorApplication {
  id     String            @id @default(uuid(7)) @db.Uuid
  userId String            @db.Uuid
  status ApplicationStatus @default(pending)
  // [{ type: "degree"|"certificate"|"portfolio"|"cv", url, name, sizeBytes }]
  documents    Json      @default("[]")
  experience   String?
  reviewedById String?   @db.Uuid
  reviewedAt   DateTime?
  rejectReason String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user       User  @relation("applicant", fields: [userId], references: [id], onDelete: Cascade)
  reviewedBy User? @relation("applicationReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([status, createdAt]) // hàng đợi duyệt của admin
  @@map("instructor_applications")
}

// Sự tồn tại của bản ghi = "đã được xác minh". Chỉ tạo khi application approved.
model InstructorProfile {
  userId     String   @id @db.Uuid
  headline   String?
  bio        String?
  website    String?
  socials    Json     @default("{}")
  verifiedAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("instructor_profiles")
}

// Lịch sử gửi duyệt — một khoá có thể gửi lại nhiều lần sau khi bị từ chối.
model CourseApproval {
  id            String         @id @default(uuid(7)) @db.Uuid
  courseId      String         @db.Uuid
  submittedById String         @db.Uuid
  status        ApprovalStatus @default(pending)
  copyrightNote String? // cam kết bản quyền tại thời điểm gửi duyệt (§3.2)
  reviewedById  String?        @db.Uuid
  reviewedAt    DateTime?
  reason        String?
  createdAt     DateTime       @default(now())

  course      Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  submittedBy User   @relation("approvalSubmitter", fields: [submittedById], references: [id])
  reviewedBy  User?  @relation("approvalReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)

  @@index([courseId, createdAt])
  @@index([status, createdAt])
  @@map("course_approvals")
}

model ContentReport {
  id          String           @id @default(uuid(7)) @db.Uuid
  reporterId  String           @db.Uuid
  targetType  ReportTargetType
  targetId    String           @db.Uuid // đa hình có chủ ý: không FK cứng
  reason      ReportReason
  detail      String?
  status      ReportStatus     @default(open)
  handledById String?          @db.Uuid
  handledAt   DateTime?
  actionTaken String?
  createdAt   DateTime         @default(now())

  reporter  User  @relation("reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  handledBy User? @relation("reportHandler", fields: [handledById], references: [id], onDelete: SetNull)

  @@index([targetType, targetId])
  @@index([status, createdAt])
  @@map("content_reports")
}

// ============================================================================
//  3. KHOÁ HỌC & NỘI DUNG
// ============================================================================

// Taxonomy chủ đề kiểu Udemy: Category → Subcategory, tự tham chiếu nên chỉ cần
// một bảng. Là BẢNG chứ không phải enum vì admin thêm danh mục mới không nên
// phải migrate + redeploy (Udemy sửa taxonomy của họ định kỳ).
// Khoá học gắn vào node lá (subcategory).
model Category {
  id       String  @id @default(uuid(7)) @db.Uuid
  parentId String? @db.Uuid // null = category gốc
  slug     String  @unique
  name     String
  position Int     @default(0)

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id], onDelete: Restrict)
  children Category[] @relation("CategoryTree")
  courses  Course[]

  @@index([parentId, position])
  @@map("categories")
}

model Course {
  id                   String       @id @default(uuid(7)) @db.Uuid
  instructorId         String       @db.Uuid
  slug                 String       @unique
  title                String
  subtitle             String?
  description          String?
  thumbnailUrl         String?
  promoVideoUrl        String?

  // HAI TRỤC PHÂN LOẠI, không trùng nhau:
  //  categoryId — chủ đề khoá nói về cái gì. Dùng để duyệt/lọc/breadcrumb (kiểu Udemy).
  //  track      — nghề nghiệp học viên nhắm tới. Dùng để khớp users.targetTrack
  //               trong recommendation tầng 1 (§3.4). Udemy không có trục này.
  categoryId           String       @db.Uuid
  track                Track
  level                SkillLevel
  language             String       @default("vi")
  priceAmount          Int          @default(0) // đơn vị nhỏ nhất của currency
  currency             String       @default("VND")
  status               CourseStatus @default(draft)
  publishedAt          DateTime?
  copyrightConfirmedAt DateTime?

  // Denormalized — worker cập nhật, không phải nguồn sự thật.
  ratingAvg        Decimal @default(0) @db.Decimal(3, 2)
  ratingCount      Int     @default(0)
  enrollmentCount  Int     @default(0)
  totalDurationSec Int     @default(0)
  lessonCount      Int     @default(0)

  // Prisma không có kiểu vector/tsvector → khai Unsupported, thao tác bằng $queryRaw.
  // embedding ghi bởi worker khi nhận event `course.approved` (§4.5).
  embedding Unsupported("vector(1536)")?
  searchTsv Unsupported("tsvector")?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  instructor   User              @relation("courseInstructor", fields: [instructorId], references: [id])
  category     Category          @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  sections     Section[]
  lessons      Lesson[]
  approvals    CourseApproval[]
  reviews      CourseReview[]
  enrollments  Enrollment[]
  cartItems    CartItem[]
  orderItems   OrderItem[]
  skills       CourseSkill[]
  questions    Question[]
  quizzes      Quiz[]
  exercises    Exercise[]
  certificates Certificate[]
  dailyStats   StatCourseDaily[]
  riskScores   StatStudentRisk[]

  @@index([instructorId])
  @@index([status, categoryId, level]) // duyệt danh mục
  @@index([status, track, level]) // recommendation tầng 1
  @@map("courses")
}

model Section {
  id       String @id @default(uuid(7)) @db.Uuid
  courseId String @db.Uuid
  title    String
  position Int

  course  Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lessons Lesson[]

  @@unique([courseId, position])
  @@map("sections")
}

// Một bảng cho cả 4 loại bài học. Cột theo type để nullable, quiz/exercise trỏ ngược
// về lessonId — rẻ hơn 4 bảng con + 4 join.
model Lesson {
  id          String     @id @default(uuid(7)) @db.Uuid
  sectionId   String     @db.Uuid
  courseId    String     @db.Uuid // denormalized: gần như mọi query đều lọc theo khoá
  type        LessonType
  title       String
  position    Int
  isPreview   Boolean    @default(false) // xem thử không cần mua
  durationSec Int        @default(0)

  videoAssetId String? // type=video: id trên Bunny/CF Stream, URL ký lúc phát (§3.2)
  articleBody  String? // type=article

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  section   Section           @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  course    Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  resources LessonResource[]
  progress  LessonProgress[]
  quiz      Quiz?
  exercise  Exercise?
  buckets   StatVideoBucket[]

  @@unique([sectionId, position])
  @@index([courseId])
  @@map("lessons")
}

model LessonResource {
  id        String @id @default(uuid(7)) @db.Uuid
  lessonId  String @db.Uuid
  title     String
  fileUrl   String
  sizeBytes Int    @default(0)

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([lessonId])
  @@map("lesson_resources")
}

model CourseReview {
  id        String   @id @default(uuid(7)) @db.Uuid
  courseId  String   @db.Uuid
  userId    String   @db.Uuid
  rating    Int // 1..5 — CHECK trong SQL
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([courseId, userId])
  @@index([courseId, createdAt])
  @@map("course_reviews")
}

// ============================================================================
//  4. GHI DANH & TIẾN ĐỘ
// ============================================================================

model Enrollment {
  id             String    @id @default(uuid(7)) @db.Uuid
  userId         String    @db.Uuid
  courseId       String    @db.Uuid
  orderId        String?   @db.Uuid // null = khoá free hoặc admin cấp tay
  progressPct    Decimal   @default(0) @db.Decimal(5, 2)
  completedAt    DateTime?
  lastAccessedAt DateTime?
  createdAt      DateTime  @default(now())

  user     User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  course   Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  order    Order?           @relation(fields: [orderId], references: [id], onDelete: SetNull)
  progress LessonProgress[]

  @@unique([userId, courseId]) // idempotency cho Stripe webhook (§4.5)
  @@index([courseId])
  @@index([userId, lastAccessedAt]) // điểm rủi ro bỏ học
  @@map("enrollments")
}

// Heartbeat 15s KHÔNG ghi trực tiếp vào đây — worker gom batch rồi update (§4.5).
model LessonProgress {
  enrollmentId    String    @db.Uuid
  lessonId        String    @db.Uuid
  watchedSec      Int       @default(0)
  lastPositionSec Int       @default(0)
  completedAt     DateTime?
  updatedAt       DateTime  @updatedAt

  enrollment Enrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  lesson     Lesson     @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@id([enrollmentId, lessonId])
  @@index([lessonId]) // mv_lesson_dropoff
  @@map("lesson_progress")
}

// ============================================================================
//  5. THƯƠNG MẠI
// ============================================================================

// Không cần bảng `carts` — giỏ hàng chỉ là quan hệ user↔course.
model CartItem {
  userId   String   @db.Uuid
  courseId String   @db.Uuid
  addedAt  DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@id([userId, courseId])
  @@map("cart_items")
}

model Order {
  id                      String          @id @default(uuid(7)) @db.Uuid
  userId                  String          @db.Uuid
  status                  OrderStatus     @default(pending)
  subtotalAmount          Int
  discountAmount          Int             @default(0)
  totalAmount             Int
  currency                String          @default("VND")
  provider                PaymentProvider @default(stripe)
  providerSessionId       String?         @unique // idempotency checkout
  providerPaymentIntentId String?         @unique
  paidAt                  DateTime?
  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt

  user        User         @relation(fields: [userId], references: [id])
  items       OrderItem[]
  refunds     Refund[]
  enrollments Enrollment[]

  @@index([userId, createdAt])
  @@index([status, paidAt]) // doanh thu theo ngày
  @@map("orders")
}

// Snapshot giá + phí tại thời điểm mua. Đổi giá khoá sau này không làm sai báo cáo.
model OrderItem {
  id                   String    @id @default(uuid(7)) @db.Uuid
  orderId              String    @db.Uuid
  courseId             String    @db.Uuid
  instructorId         String    @db.Uuid
  unitPriceAmount      Int
  platformFeeAmount    Int
  instructorEarnAmount Int
  refundedAt           DateTime?

  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  course     Course   @relation(fields: [courseId], references: [id])
  instructor User     @relation("itemInstructor", fields: [instructorId], references: [id])
  refunds    Refund[]

  @@unique([orderId, courseId])
  @@index([instructorId])
  @@index([courseId])
  @@map("order_items")
}

model Refund {
  id               String       @id @default(uuid(7)) @db.Uuid
  orderId          String       @db.Uuid
  orderItemId      String?      @db.Uuid // null = hoàn toàn bộ đơn
  amount           Int
  reason           String?
  providerRefundId String       @unique
  status           RefundStatus @default(pending)
  createdAt        DateTime     @default(now())

  order     Order      @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderItem OrderItem? @relation(fields: [orderItemId], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@map("refunds")
}

// Idempotency cho webhook Stripe. Insert trước khi xử lý; trùng khoá = đã nhận rồi.
model PaymentEvent {
  provider    PaymentProvider
  eventId     String
  type        String
  payload     Json
  receivedAt  DateTime        @default(now())
  processedAt DateTime?
  error       String?

  @@id([provider, eventId])
  @@index([processedAt])
  @@map("payment_events")
}

// ============================================================================
//  6. KỸ NĂNG — lõi của hồ sơ năng lực (§3.3) và recommendation tầng 2 (§3.4)
// ============================================================================

model Skill {
  id          String  @id @default(uuid(7)) @db.Uuid
  slug        String  @unique // "react-hooks", "sql-join"
  name        String
  track       Track?
  description String?

  // Đồ thị tiên quyết: JS → React → Next.js. Duyệt bằng WITH RECURSIVE (§4.6).
  prerequisites Skill[] @relation("SkillPrereq")
  requiredBy    Skill[] @relation("SkillPrereq")

  courses     CourseSkill[]
  questions   QuestionSkill[]
  exercises   ExerciseSkill[]
  mastery     UserSkillMastery[]
  targetedBy  UserTargetSkill[]

  @@index([track]) // chip "Phổ biến với học viên như bạn" ở bước 3 onboarding
  @@map("skills")
}

model CourseSkill {
  courseId String  @db.Uuid
  skillId  String  @db.Uuid
  weight   Decimal @default(1.0) @db.Decimal(4, 2)

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  skill  Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([courseId, skillId])
  @@index([skillId]) // "khoá nào dạy kỹ năng đang yếu"
  @@map("course_skills")
}

// Độ thành thạo 0..1. Cập nhật khi nhận event `submission.graded` (§4.5),
// đồng thời xoá cache gợi ý của user trong Redis.
model UserSkillMastery {
  userId          String   @db.Uuid
  skillId         String   @db.Uuid
  score           Decimal  @default(0) @db.Decimal(4, 3)
  attemptsCount   Int      @default(0)
  correctCount    Int      @default(0)
  lastEvaluatedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([userId, skillId])
  @@index([userId, score]) // lấy kỹ năng score < 0.6
  @@map("user_skill_mastery")
}

// Kỹ năng học viên TỰ KHAI muốn học — bước 3 onboarding (kiểu /personalize/skills
// của Udemy: đa chọn, có ô tìm kiếm + chip gợi ý theo nghề).
//
// Khác user_skill_mastery = kỹ năng ĐO ĐƯỢC từ bài test. Chênh lệch giữa hai bảng
// là tín hiệu chính của recommendation tầng 2, và quan trọng hơn: nó cho tầng 2
// chạy được NGAY NGÀY ĐẦU, khi user_skill_mastery còn rỗng hoàn toàn.
model UserTargetSkill {
  userId    String   @db.Uuid
  skillId   String   @db.Uuid
  createdAt DateTime @default(now()) // Udemy gọi là "theo dõi" — thêm/bỏ dần theo thời gian

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([userId, skillId])
  @@index([skillId])
  @@map("user_target_skills")
}

// ============================================================================
//  7. TRẮC NGHIỆM (§3.3)
// ============================================================================

model Question {
  id          String       @id @default(uuid(7)) @db.Uuid
  courseId    String       @db.Uuid // ngân hàng câu hỏi thuộc phạm vi khoá
  createdById String       @db.Uuid
  type        QuestionType
  stem        String
  explanation String?
  points      Int          @default(1)
  archivedAt  DateTime? // thay vì xoá — attempt cũ vẫn tham chiếu
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  course    Course           @relation(fields: [courseId], references: [id], onDelete: Cascade)
  createdBy User             @relation(fields: [createdById], references: [id])
  options   QuestionOption[]
  skills    QuestionSkill[]
  inQuizzes QuizQuestion[]
  answers   QuizAnswer[]
  stats     StatQuestion[]

  @@index([courseId])
  @@map("questions")
}

model QuestionOption {
  id         String  @id @default(uuid(7)) @db.Uuid
  questionId String  @db.Uuid
  content    String
  isCorrect  Boolean @default(false)
  position   Int

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionId, position])
  @@map("question_options")
}

// "Mỗi câu gắn tag kỹ năng" (§3.3) — nguồn để tính user_skill_mastery.
model QuestionSkill {
  questionId String @db.Uuid
  skillId    String @db.Uuid

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  skill    Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([questionId, skillId])
  @@index([skillId])
  @@map("question_skills")
}

model Quiz {
  id           String   @id @default(uuid(7)) @db.Uuid
  courseId     String   @db.Uuid
  lessonId     String?  @unique @db.Uuid // null = quiz độc lập, không nằm trong chương
  title        String
  description  String?
  timeLimitSec Int?
  passScorePct Int      @default(70)
  maxAttempts  Int? // null = không giới hạn
  shuffle      Boolean  @default(true)
  isFinal      Boolean  @default(false) // đạt bài này → cấp chứng chỉ (§3.3)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  course    Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lesson    Lesson?        @relation(fields: [lessonId], references: [id], onDelete: SetNull)
  questions QuizQuestion[]
  attempts  QuizAttempt[]
  stats     StatQuestion[]

  @@index([courseId])
  @@map("quizzes")
}

model QuizQuestion {
  quizId         String @db.Uuid
  questionId     String @db.Uuid
  position       Int
  pointsOverride Int?

  quiz     Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@id([quizId, questionId])
  @@unique([quizId, position])
  @@map("quiz_questions")
}

model QuizAttempt {
  id           String        @id @default(uuid(7)) @db.Uuid
  quizId       String        @db.Uuid
  userId       String        @db.Uuid
  attemptNo    Int
  status       AttemptStatus @default(in_progress)
  startedAt    DateTime      @default(now())
  submittedAt  DateTime?
  scorePct     Decimal?      @db.Decimal(5, 2)
  passed       Boolean?
  timeSpentSec Int?

  quiz        Quiz         @relation(fields: [quizId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers     QuizAnswer[]
  certificate Certificate?

  @@unique([quizId, userId, attemptNo])
  @@index([userId, submittedAt])
  @@index([quizId, scorePct]) // xếp hạng top/bottom 27% → discrimination index
  @@map("quiz_attempts")
}

// selectedOptionIds là mảng UUID thay vì bảng nối: phân tích đáp án nhiễu (§3.5c)
// làm bằng unnest(), không cần thêm một bảng nữa.
model QuizAnswer {
  id                String   @id @default(uuid(7)) @db.Uuid
  attemptId         String   @db.Uuid
  questionId        String   @db.Uuid
  selectedOptionIds String[] @db.Uuid
  isCorrect         Boolean
  pointsAwarded     Int      @default(0)
  answeredAt        DateTime @default(now())

  attempt  QuizAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question Question    @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([attemptId, questionId])
  @@index([questionId, isCorrect]) // difficulty index
  @@map("quiz_answers")
}

// ============================================================================
//  8. BÀI TẬP LẬP TRÌNH (§3.3, §4.5)
// ============================================================================

model Exercise {
  id                 String     @id @default(uuid(7)) @db.Uuid
  courseId           String     @db.Uuid
  lessonId           String?    @unique @db.Uuid
  title              String
  statement          String // markdown
  difficulty         Difficulty @default(medium)
  timeLimitMs        Int        @default(2000)
  memoryLimitKb      Int        @default(128000)
  allowedLanguageIds Int[] // id ngôn ngữ của Judge0
  referenceSolution  String?
  totalPoints        Int        @default(100)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  course      Course                @relation(fields: [courseId], references: [id], onDelete: Cascade)
  lesson      Lesson?               @relation(fields: [lessonId], references: [id], onDelete: SetNull)
  starters    ExerciseStarterCode[]
  testCases   ExerciseTestCase[]
  skills      ExerciseSkill[]
  submissions Submission[]
  stats       StatExercise?

  @@index([courseId])
  @@map("exercises")
}

model ExerciseStarterCode {
  exerciseId String @db.Uuid
  languageId Int
  code       String

  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@id([exerciseId, languageId])
  @@map("exercise_starter_codes")
}

model ExerciseTestCase {
  id             String  @id @default(uuid(7)) @db.Uuid
  exerciseId     String  @db.Uuid
  position       Int
  input          String
  expectedOutput String
  isPublic       Boolean @default(false) // false = test ẩn, không trả về cho học viên
  points         Int     @default(1)

  exercise Exercise           @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  results  SubmissionResult[]

  @@unique([exerciseId, position])
  @@map("exercise_test_cases")
}

model ExerciseSkill {
  exerciseId String @db.Uuid
  skillId    String @db.Uuid

  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  skill    Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([exerciseId, skillId])
  @@index([skillId])
  @@map("exercise_skills")
}

model Submission {
  id           String           @id @default(uuid(7)) @db.Uuid
  exerciseId   String           @db.Uuid
  userId       String           @db.Uuid
  languageId   Int
  sourceCode   String
  status       SubmissionStatus @default(pending)
  score        Int              @default(0)
  passedTests  Int              @default(0)
  totalTests   Int              @default(0)
  maxTimeMs    Int?
  maxMemoryKb  Int?
  compileError String?
  submittedAt  DateTime         @default(now())
  gradedAt     DateTime?

  exercise Exercise           @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  user     User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  results  SubmissionResult[]

  @@index([userId, submittedAt])
  @@index([exerciseId, status])
  @@map("submissions")
}

// judge0Token unique → callback của Judge0 ghi đúng dòng và idempotent khi bị gọi lại (§4.5).
model SubmissionResult {
  id            String           @id @default(uuid(7)) @db.Uuid
  submissionId  String           @db.Uuid
  testCaseId    String           @db.Uuid
  judge0Token   String           @unique
  status        SubmissionStatus @default(pending)
  timeMs        Int?
  memoryKb      Int?
  stdoutExcerpt String? // cắt ngắn, chỉ để hiển thị
  stderrExcerpt String?
  receivedAt    DateTime?

  submission Submission       @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  testCase   ExerciseTestCase @relation(fields: [testCaseId], references: [id], onDelete: Cascade)

  @@unique([submissionId, testCaseId])
  @@map("submission_results")
}

// ============================================================================
//  9. CHỨNG CHỈ (§3.3)
// ============================================================================

model Certificate {
  id                 String    @id @default(uuid(7)) @db.Uuid
  userId             String    @db.Uuid
  courseId           String    @db.Uuid
  serialNo           String    @unique // QR trỏ /verify/{serialNo}
  finalQuizAttemptId String?   @unique @db.Uuid
  pdfUrl             String?
  issuedAt           DateTime  @default(now())
  revokedAt          DateTime? // thu hồi khi khoá bị gỡ vì vi phạm
  revokeReason       String?

  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  course           Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  finalQuizAttempt QuizAttempt? @relation(fields: [finalQuizAttemptId], references: [id], onDelete: SetNull)

  @@unique([userId, courseId])
  @@map("certificates")
}

// ============================================================================
//  10. BẢNG TỔNG HỢP CHO DASHBOARD (§3.5)
//  Worker Kafka ghi theo batch, cron hằng đêm tính lại chỉ số nặng.
//  Không bảng nào lưu heartbeat thô — giới hạn 500MB của Supabase free (§4.5).
// ============================================================================

model StatCourseDaily {
  courseId String   @db.Uuid
  date     DateTime @db.Date

  // phễu chuyển đổi (§3.5a)
  views            Int @default(0)
  cartAdds         Int @default(0)
  checkoutsStarted Int @default(0)
  ordersPaid       Int @default(0)

  // doanh thu
  revenueAmount     Int @default(0)
  platformFeeAmount Int @default(0)
  refundAmount      Int @default(0)
  refundCount       Int @default(0)

  // hành vi học (§3.5b)
  newEnrollments Int @default(0)
  activeLearners Int @default(0)
  watchTimeSec   Int @default(0)

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@id([courseId, date])
  @@index([date])
  @@map("stat_course_daily")
}

// Một bucket = 15s video. Gộp đường giữ chân, điểm rơi bỏ và điểm tua lại vào
// một bảng — cùng khoá chính, cùng nguồn sự kiện.
model StatVideoBucket {
  lessonId    String @db.Uuid
  bucketIndex Int
  viewers     Int    @default(0) // số người xem tới mốc này
  rewatches   Int    @default(0) // số lượt tua lại đoạn này

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@id([lessonId, bucketIndex])
  @@map("stat_video_buckets")
}

// Discrimination index chia nhóm theo điểm của TỪNG quiz → khoá chính phải có quizId.
model StatQuestion {
  quizId     String @db.Uuid
  questionId String @db.Uuid

  attempts            Int      @default(0)
  correctCount        Int      @default(0)
  difficultyIndex     Decimal? @db.Decimal(4, 3) // p = tỉ lệ trả lời đúng
  discriminationIndex Decimal? @db.Decimal(4, 3) // D = p(top 27%) − p(bottom 27%)
  optionDistribution  Json     @default("{}") // { optionId: count } — đáp án nhiễu
  computedAt          DateTime @default(now())

  quiz     Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@id([quizId, questionId])
  @@map("stat_questions")
}

model StatExercise {
  exerciseId          String   @id @db.Uuid
  submissionCount     Int      @default(0)
  acceptedCount       Int      @default(0)
  acceptanceRate      Decimal? @db.Decimal(4, 3)
  avgAttemptsToAccept Decimal? @db.Decimal(6, 2)
  statusDistribution  Json     @default("{}") // { wrong_answer: 42, time_limit_exceeded: 7 }
  computedAt          DateTime @default(now())

  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)

  @@map("stat_exercises")
}

// Cron hằng đêm (§4.5). notifiedAt để không spam email nhắc nhở.
model StatStudentRisk {
  userId   String @db.Uuid
  courseId String @db.Uuid

  riskScore             Decimal   @db.Decimal(4, 3)
  daysInactive          Int       @default(0)
  progressDeltaVsMedian Decimal?  @db.Decimal(6, 2)
  avgQuizScore          Decimal?  @db.Decimal(5, 2)
  computedAt            DateTime  @default(now())
  notifiedAt            DateTime?

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@id([userId, courseId])
  @@index([courseId, riskScore]) // danh sách học viên cần chú ý
  @@map("stat_student_risk")
}

model EmailLog {
  id                String      @id @default(uuid(7)) @db.Uuid
  userId            String      @db.Uuid
  template          String // "risk_nudge" | "certificate_issued" | ...
  subject           String
  providerMessageId String?     @unique
  status            EmailStatus @default(queued)
  error             String?
  sentAt            DateTime?
  createdAt         DateTime    @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
  @@map("email_logs")
}

// ============================================================================
//  ENUMS
// ============================================================================

// Trục NGHỀ NGHIỆP, không phải trục chủ đề. Chủ đề nằm ở bảng `categories`.
// Là enum (không phải bảng) vì danh sách này ổn định và chỉ có ~7 giá trị —
// học viên chọn một lần lúc đăng ký, không ai cần admin thêm nghề mới runtime.
enum Track {
  backend
  frontend
  fullstack
  mobile
  data
  devops
  other
}

enum SkillLevel {
  all_levels // Udemy có, và phần lớn khoá thực tế rơi vào đây
  beginner
  intermediate
  advanced
}

enum ApplicationStatus {
  pending
  approved
  rejected
}

enum ApprovalStatus {
  pending
  approved
  rejected
}

enum CourseStatus {
  draft
  pending_review
  approved
  rejected
  unlisted // bị ẩn do báo cáo vi phạm
  archived
}

enum LessonType {
  video
  article
  quiz
  coding
}

enum ReportTargetType {
  course
  lesson
  review
  question
}

enum ReportReason {
  copyright
  inaccurate
  spam
  other
}

enum ReportStatus {
  open
  resolved
  dismissed
}

enum OrderStatus {
  pending
  paid
  failed
  refunded
  partially_refunded
}

enum PaymentProvider {
  stripe
  vnpay
}

enum RefundStatus {
  pending
  succeeded
  failed
}

enum QuestionType {
  single_choice
  multiple_choice
  true_false
}

enum AttemptStatus {
  in_progress
  submitted
  expired
}

enum Difficulty {
  easy
  medium
  hard
}

// Dùng chung cho Submission và SubmissionResult.
enum SubmissionStatus {
  pending
  running
  accepted
  wrong_answer
  time_limit_exceeded
  runtime_error
  compile_error
  internal_error
}

enum EmailStatus {
  queued
  sent
  delivered
  bounced
  failed
}
```

---

## 5. SQL bổ sung

Phần Prisma không diễn tả được: extension, CHECK constraint, generated column, partial index, HNSW index, materialized view.

```sql
-- ============================================================================
--  Phần schema Prisma không diễn tả được.
--
--  Cách áp dụng: dán vào cuối file migration do Prisma sinh ra
--    pnpm prisma migrate dev --create-only --name init
--    cat prisma/sql/01_post_migrate.sql >> prisma/migrations/<ts>_init/migration.sql
--    pnpm prisma migrate dev
--
--  LƯU Ý ĐẶT TÊN: tên bảng là snake_case (do @@map), tên cột là camelCase
--  (mặc định của Prisma) → mọi cột phải để trong nháy kép.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Extension
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
--  2. Ràng buộc toàn vẹn (rẻ hơn và chắc hơn validate ở tầng app)
-- ---------------------------------------------------------------------------
ALTER TABLE course_reviews
  ADD CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE user_skill_mastery
  ADD CONSTRAINT chk_mastery_score CHECK (score >= 0 AND score <= 1);

ALTER TABLE quizzes
  ADD CONSTRAINT chk_pass_score CHECK ("passScorePct" BETWEEN 0 AND 100);

ALTER TABLE orders
  ADD CONSTRAINT chk_order_amounts CHECK (
    "subtotalAmount" >= 0 AND "discountAmount" >= 0 AND "totalAmount" >= 0
    AND "totalAmount" = "subtotalAmount" - "discountAmount"
  );

ALTER TABLE order_items
  ADD CONSTRAINT chk_item_split CHECK (
    "unitPriceAmount" = "platformFeeAmount" + "instructorEarnAmount"
  );

ALTER TABLE exercises
  ADD CONSTRAINT chk_exercise_limits CHECK ("timeLimitMs" > 0 AND "memoryLimitKb" > 0);

-- SkillLevel dùng chung cho user và course, nhưng 'all_levels' chỉ có nghĩa với course.
ALTER TABLE "user"
  ADD CONSTRAINT chk_user_level CHECK (level IS NULL OR level <> 'all_levels');

-- Taxonomy chỉ sâu 2 tầng (Category → Subcategory), không cho lồng sâu hơn.
-- Khoá học phải gắn vào node lá.
ALTER TABLE categories
  ADD CONSTRAINT chk_category_not_self CHECK (id <> "parentId");

CREATE OR REPLACE FUNCTION chk_category_depth() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."parentId" IS NOT NULL
     AND (SELECT "parentId" FROM categories WHERE id = NEW."parentId") IS NOT NULL
  THEN
    RAISE EXCEPTION 'Taxonomy chỉ cho phép 2 tầng';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_category_depth
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION chk_category_depth();

-- Đồ thị kỹ năng tiên quyết không được tự trỏ vào chính nó.
-- Prisma sinh bảng m-n ẩn "_SkillPrereq" với 2 cột "A", "B".
ALTER TABLE "_SkillPrereq"
  ADD CONSTRAINT chk_skill_not_self_prereq CHECK ("A" <> "B");

-- Bài học video phải có asset, bài viết phải có nội dung.
ALTER TABLE lessons
  ADD CONSTRAINT chk_lesson_payload CHECK (
    (type <> 'video'   OR "videoAssetId" IS NOT NULL) AND
    (type <> 'article' OR "articleBody"  IS NOT NULL)
  );

-- ---------------------------------------------------------------------------
--  3. Full-text search tiếng Việt
--  unaccent() không IMMUTABLE nên không dùng trực tiếp trong generated column.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Prisma tạo cột tsvector thường; đổi thành GENERATED (không ALTER được, phải drop).
ALTER TABLE courses DROP COLUMN IF EXISTS "searchTsv";
ALTER TABLE courses ADD COLUMN "searchTsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(title, ''))),       'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(subtitle, ''))),    'B') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(description, ''))), 'C')
  ) STORED;

CREATE INDEX idx_courses_search ON courses USING gin ("searchTsv");
CREATE INDEX idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops); -- gõ sai chính tả

-- Ô "Tìm kiếm một kỹ năng" ở bước 3 onboarding — autocomplete trên toàn catalog.
CREATE INDEX idx_skills_name_trgm ON skills USING gin (name gin_trgm_ops);

-- ---------------------------------------------------------------------------
--  4. pgvector — recommendation tầng 4 (§3.4)
--  Chỉ index khoá đã duyệt: index nhỏ hơn, và query luôn lọc status anyway.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_courses_embedding ON courses
  USING hnsw (embedding vector_cosine_ops)
  WHERE status = 'approved';

-- ---------------------------------------------------------------------------
--  5. Partial index cho các hàng đợi — nhỏ, chỉ chứa việc còn tồn
-- ---------------------------------------------------------------------------
CREATE INDEX idx_payment_events_unprocessed ON payment_events ("receivedAt")
  WHERE "processedAt" IS NULL;

CREATE INDEX idx_submissions_inflight ON submissions ("submittedAt")
  WHERE status IN ('pending', 'running');

CREATE INDEX idx_reports_open ON content_reports ("createdAt")
  WHERE status = 'open';

CREATE INDEX idx_certificates_active ON certificates ("serialNo")
  WHERE "revokedAt" IS NULL;

CREATE INDEX idx_quizzes_final ON quizzes ("courseId")
  WHERE "isFinal" = true;

-- Chỉ có 1 quiz cuối khoá cho mỗi khoá học.
CREATE UNIQUE INDEX uq_one_final_quiz_per_course ON quizzes ("courseId")
  WHERE "isFinal" = true;

-- ---------------------------------------------------------------------------
--  6. Materialized view — cron REFRESH hằng đêm (§4.5, §4.6)
--  Dữ liệu nguồn đã nằm sẵn trong bảng nghiệp vụ nên không cần bảng stat riêng.
-- ---------------------------------------------------------------------------

-- Tầng 3: "Học viên mua khoá này cũng mua…"
CREATE MATERIALIZED VIEW mv_course_copurchase AS
SELECT
  a."courseId" AS course_id,
  b."courseId" AS other_course_id,
  COUNT(*)::int AS co_count
FROM enrollments a
JOIN enrollments b
  ON a."userId" = b."userId"
 AND a."courseId" <> b."courseId"
GROUP BY a."courseId", b."courseId"
HAVING COUNT(*) >= 2 -- bỏ nhiễu: 1 người mua chung không nói lên gì
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_copurchase ON mv_course_copurchase (course_id, other_course_id);
CREATE INDEX idx_mv_copurchase_rank ON mv_course_copurchase (course_id, co_count DESC);

-- §3.5b: "Bài học nào nhiều người dừng lại không học tiếp"
CREATE MATERIALIZED VIEW mv_lesson_dropoff AS
SELECT
  l.id                                        AS lesson_id,
  l."courseId"                                AS course_id,
  l.position,
  COUNT(lp.*)::int                            AS started,
  COUNT(lp."completedAt")::int                AS completed,
  ROUND(
    1 - COUNT(lp."completedAt")::numeric / NULLIF(COUNT(lp.*), 0), 3
  )                                           AS dropoff_rate,
  COALESCE(AVG(lp."watchedSec"), 0)::int      AS avg_watched_sec
FROM lessons l
LEFT JOIN lesson_progress lp ON lp."lessonId" = l.id
GROUP BY l.id, l."courseId", l.position
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_lesson_dropoff ON mv_lesson_dropoff (lesson_id);
CREATE INDEX idx_mv_lesson_dropoff_course ON mv_lesson_dropoff (course_id, position);

-- §3.5b: tỉ lệ hoàn thành khoá + học viên đang hoạt động
CREATE MATERIALIZED VIEW mv_course_completion AS
SELECT
  e."courseId"                                                AS course_id,
  COUNT(*)::int                                               AS enrolled,
  COUNT(e."completedAt")::int                                 AS completed,
  ROUND(COUNT(e."completedAt")::numeric / NULLIF(COUNT(*), 0), 3) AS completion_rate,
  AVG(e."progressPct")                                        AS avg_progress_pct,
  COUNT(*) FILTER (WHERE e."lastAccessedAt" > now() - interval '7 days')::int  AS active_7d,
  COUNT(*) FILTER (WHERE e."lastAccessedAt" > now() - interval '30 days')::int AS active_30d
FROM enrollments e
GROUP BY e."courseId"
WITH NO DATA;

CREATE UNIQUE INDEX uq_mv_course_completion ON mv_course_completion (course_id);

-- Cron gọi hàm này mỗi đêm. CONCURRENTLY để dashboard không bị khoá khi refresh
-- (đòi hỏi unique index ở trên, đã có).
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_copurchase;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_lesson_dropoff;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_completion;
END $$;

-- Lần đầu phải refresh không CONCURRENTLY vì view đang WITH NO DATA.
REFRESH MATERIALIZED VIEW mv_course_copurchase;
REFRESH MATERIALIZED VIEW mv_lesson_dropoff;
REFRESH MATERIALIZED VIEW mv_course_completion;

-- ---------------------------------------------------------------------------
--  7. Seed taxonomy — phần IT của Udemy, bỏ Hardware và "Other"
--  courses."categoryId" NOT NULL nên phải chạy trước khi tạo khoá học đầu tiên.
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, "parentId", slug, name, position) VALUES
  (gen_random_uuid(), NULL, 'lap-trinh',        'Lập trình',         1),
  (gen_random_uuid(), NULL, 'khoa-hoc-du-lieu', 'Khoa học dữ liệu',  2),
  (gen_random_uuid(), NULL, 'cntt-ha-tang',     'CNTT & Hạ tầng',    3);

INSERT INTO categories (id, "parentId", slug, name, position)
SELECT gen_random_uuid(), p.id, s.slug, s.name, s.position
FROM (VALUES
  ('lap-trinh',        'web',              'Phát triển Web',            1),
  ('lap-trinh',        'mobile',           'Phát triển Mobile',         2),
  ('lap-trinh',        'ngon-ngu',         'Ngôn ngữ lập trình',        3),
  ('lap-trinh',        'co-so-du-lieu',    'Cơ sở dữ liệu',             4),
  ('lap-trinh',        'game',             'Lập trình Game',            5),
  ('lap-trinh',        'kiem-thu',         'Kiểm thử phần mềm',         6),
  ('lap-trinh',        'ky-thuat-pm',      'Kỹ thuật phần mềm',         7),
  ('lap-trinh',        'cong-cu',          'Công cụ lập trình',         8),
  ('khoa-hoc-du-lieu', 'data-science',     'Data Science',              1),
  ('khoa-hoc-du-lieu', 'phan-tich-du-lieu','Phân tích dữ liệu',         2),
  ('khoa-hoc-du-lieu', 'ai-ml',            'AI & Machine Learning',     3),
  ('cntt-ha-tang',     'devops-cloud',     'DevOps & Cloud',            1),
  ('cntt-ha-tang',     'mang-bao-mat',     'Mạng & Bảo mật',            2),
  ('cntt-ha-tang',     'he-dieu-hanh',     'Hệ điều hành & Máy chủ',    3),
  ('cntt-ha-tang',     'chung-chi',        'Chứng chỉ CNTT',            4)
) AS s(parent_slug, slug, name, position)
JOIN categories p ON p.slug = s.parent_slug;
```

---

## 6. Truy vấn tham chiếu

Bản mẫu cho 4 tầng recommendation (§3.4, §4.6) và 2 chỉ số chất lượng đề (§3.5c). Copy vào service, chạy bằng `$queryRaw`.

```sql
-- ============================================================================
--  Truy vấn tham chiếu cho 4 tầng recommendation (§3.4, §4.6).
--  Không chạy khi migrate — đây là bản mẫu để copy vào recommendation.service.ts
--  ($queryRaw). Giữ ở đây để đối chiếu khi schema đổi.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  TẦNG 1 — theo mục tiêu (cold start: học viên mới chưa có dữ liệu)
--  $1 = user.targetTrack, $2 = user.level
-- ---------------------------------------------------------------------------
SELECT c.id, c.title, c."ratingAvg",
       'Phù hợp với mục tiêu ' || $1 || ' trình độ ' || $2 AS reason
FROM courses c
WHERE c.status = 'approved'
  AND c.track = $1::"Track"
  -- khoá 'all_levels' hợp với mọi trình độ, không được lọc mất
  AND c.level IN ($2::"SkillLevel", 'all_levels')
ORDER BY c."ratingAvg" DESC, c."enrollmentCount" DESC
LIMIT 10;

-- ---------------------------------------------------------------------------
--  DUYỆT DANH MỤC (không phải recommendation) — breadcrumb + đếm khoá
--  $1 = slug của subcategory
-- ---------------------------------------------------------------------------
SELECT
  parent.name || ' > ' || child.name AS breadcrumb,
  c.id, c.title, c."ratingAvg", c."priceAmount"
FROM courses c
JOIN categories child  ON child.id = c."categoryId"
LEFT JOIN categories parent ON parent.id = child."parentId"
WHERE c.status = 'approved' AND child.slug = $1
ORDER BY c."enrollmentCount" DESC
LIMIT 20;

-- ---------------------------------------------------------------------------
--  ONBOARDING BƯỚC 3 — hai truy vấn cho màn chọn kỹ năng
-- ---------------------------------------------------------------------------

-- Chip "Phổ biến với học viên như bạn": kỹ năng của nghề đã chọn, xếp theo số
-- khoá dạy nó. $1 = users.targetTrack
SELECT s.id, s.name, COUNT(cs."courseId")::int AS course_count
FROM skills s
LEFT JOIN course_skills cs ON cs."skillId" = s.id
WHERE s.track = $1::"Track"
GROUP BY s.id, s.name
ORDER BY course_count DESC
LIMIT 20;

-- Ô "Tìm kiếm một kỹ năng": autocomplete toàn catalog. $1 = chuỗi người dùng gõ
SELECT s.id, s.name, similarity(s.name, $1) AS sim
FROM skills s
WHERE s.name % $1 -- dùng idx_skills_name_trgm
ORDER BY sim DESC
LIMIT 10;

-- ---------------------------------------------------------------------------
--  TẦNG 2 ⭐ — theo lỗ hổng kỹ năng, có chặn bằng đồ thị tiên quyết
--  $1 = userId
--
--  Ý tưởng:
--   weak        — kỹ năng cần học, gồm HAI nguồn:
--                   (a) đo được yếu   — user_skill_mastery.score < 0.6
--                   (b) tự khai muốn học nhưng chưa có điểm — user_target_skills
--                 Nhờ (b), truy vấn này chạy được ngay ngày đầu đăng ký, khi
--                 user_skill_mastery còn rỗng. Đây là lời giải cold start cho
--                 tầng 2, không phải chỉ tầng 1.
--   candidate   — khoá dạy đúng kỹ năng đó, chưa mua
--   blocked     — khoá mà học viên CHƯA vững một kỹ năng tiên quyết nào đó
--                 (duyệt đệ quy toàn bộ chuỗi JS → React → Next.js)
--  Kết quả = candidate − blocked, ưu tiên kỹ năng nằm trong mục tiêu tự khai.
-- ---------------------------------------------------------------------------
WITH weak AS (
  -- (a) đo được yếu
  SELECT m."skillId",
         m.score,
         true AS measured,
         EXISTS (SELECT 1 FROM user_target_skills t
                 WHERE t."userId" = $1 AND t."skillId" = m."skillId") AS is_target
  FROM user_skill_mastery m
  WHERE m."userId" = $1 AND m.score < 0.6

  UNION

  -- (b) tự khai muốn học, chưa đo bao giờ → coi như score 0
  SELECT t."skillId", 0::numeric, false, true
  FROM user_target_skills t
  WHERE t."userId" = $1
    AND NOT EXISTS (SELECT 1 FROM user_skill_mastery m
                    WHERE m."userId" = $1 AND m."skillId" = t."skillId")
),
owned AS (
  SELECT "courseId" FROM enrollments WHERE "userId" = $1
),
candidate AS (
  SELECT cs."courseId", w."skillId", w.score, w.measured, w.is_target
  FROM course_skills cs
  JOIN weak w ON w."skillId" = cs."skillId"
  WHERE cs."courseId" NOT IN (SELECT "courseId" FROM owned)
),
-- Toàn bộ kỹ năng tiên quyết (bắc cầu) của các kỹ năng mà khoá ứng viên dạy.
-- "_SkillPrereq"."A" = skill, "B" = skill mà A yêu cầu (quan hệ Skill.prerequisites).
prereq_closure AS (
  WITH RECURSIVE walk("courseId", "skillId") AS (
    SELECT cs."courseId", sp."B"
    FROM course_skills cs
    JOIN "_SkillPrereq" sp ON sp."A" = cs."skillId"
    WHERE cs."courseId" IN (SELECT "courseId" FROM candidate)

    UNION -- UNION (không ALL) tự chống vòng lặp nếu đồ thị bị khai sai

    SELECT w."courseId", sp."B"
    FROM walk w
    JOIN "_SkillPrereq" sp ON sp."A" = w."skillId"
  )
  SELECT * FROM walk
),
blocked AS (
  SELECT DISTINCT pc."courseId"
  FROM prereq_closure pc
  LEFT JOIN user_skill_mastery m
    ON m."userId" = $1 AND m."skillId" = pc."skillId"
  WHERE COALESCE(m.score, 0) < 0.6 -- chưa học hoặc chưa vững kỹ năng tiên quyết
)
SELECT
  c.id,
  c.title,
  MIN(cand.score)                                    AS weakest_score,
  bool_or(cand.is_target)                            AS hits_declared_goal,
  ARRAY_AGG(DISTINCT s.name)                         AS targets_skills,
  -- Lý do hiển thị khác nhau tuỳ nguồn tín hiệu (§3.4: "gợi ý có giải thích lý do")
  CASE
    WHEN bool_and(NOT cand.measured)
      THEN 'Gợi ý vì bạn muốn học ' || (ARRAY_AGG(s.name ORDER BY cand.score))[1]
    ELSE 'Gợi ý vì bạn đạt ' || ROUND(MIN(cand.score) * 100) || '% ở kỹ năng ' ||
         (ARRAY_AGG(s.name ORDER BY cand.score))[1]
  END AS reason
FROM candidate cand
JOIN courses c ON c.id = cand."courseId"
JOIN skills  s ON s.id = cand."skillId"
WHERE c.status = 'approved'
  AND c.id NOT IN (SELECT "courseId" FROM blocked)
GROUP BY c.id, c.title
-- Kỹ năng học viên tự khai muốn học được ưu tiên trước: yếu sql-join nhưng không
-- quan tâm SQL thì không nên đẩy lên đầu.
ORDER BY hits_declared_goal DESC, weakest_score ASC, c."ratingAvg" DESC
LIMIT 10;

-- Biến thể: bài học cần ôn lại TRONG khoá đang học (§3.4 tầng 2, vế đầu).
-- $1 = userId, $2 = courseId
SELECT DISTINCT l.id, l.title, s.name AS skill, m.score
FROM user_skill_mastery m
JOIN skills s           ON s.id = m."skillId"
JOIN question_skills qs ON qs."skillId" = m."skillId"
JOIN quiz_questions qq  ON qq."questionId" = qs."questionId"
JOIN quizzes q          ON q.id = qq."quizId" AND q."courseId" = $2
JOIN lessons l          ON l.id = q."lessonId"
WHERE m."userId" = $1 AND m.score < 0.6
ORDER BY m.score ASC
LIMIT 5;

-- ---------------------------------------------------------------------------
--  TẦNG 3 — "Học viên mua khoá này cũng mua…" (đọc từ materialized view)
--  $1 = courseId
-- ---------------------------------------------------------------------------
SELECT c.id, c.title, mv.co_count,
       mv.co_count || ' học viên mua khoá này cũng mua khoá kia' AS reason
FROM mv_course_copurchase mv
JOIN courses c ON c.id = mv.other_course_id
WHERE mv.course_id = $1 AND c.status = 'approved'
ORDER BY mv.co_count DESC
LIMIT 5;

-- ---------------------------------------------------------------------------
--  TẦNG 4 — nội dung gần giống (pgvector, cosine)
--  $1 = embedding của khoá vừa học, $2 = courseId để loại chính nó
-- ---------------------------------------------------------------------------
SELECT c.id, c.title,
       1 - (c.embedding <=> $1::vector) AS similarity
FROM courses c
WHERE c.status = 'approved'
  AND c.id <> $2
  AND c.embedding IS NOT NULL
ORDER BY c.embedding <=> $1::vector
LIMIT 5;

-- ============================================================================
--  CHỈ SỐ CHẤT LƯỢNG ĐỀ (§3.5c) — cron hằng đêm ghi vào stat_questions
-- ============================================================================

-- Difficulty index (p) + phân bố đáp án nhiễu. $1 = quizId
WITH answers AS (
  SELECT qa."questionId", qa."isCorrect", qa."selectedOptionIds"
  FROM quiz_answers qa
  JOIN quiz_attempts at ON at.id = qa."attemptId"
  WHERE at."quizId" = $1 AND at.status = 'submitted'
)
SELECT
  a."questionId",
  COUNT(*)::int AS attempts,
  COUNT(*) FILTER (WHERE a."isCorrect")::int AS correct_count,
  ROUND(AVG(a."isCorrect"::int)::numeric, 3) AS difficulty_index,
  (
    SELECT jsonb_object_agg(opt, cnt)
    FROM (
      SELECT unnest(x."selectedOptionIds")::text AS opt, COUNT(*) AS cnt
      FROM answers x WHERE x."questionId" = a."questionId"
      GROUP BY 1
    ) d
  ) AS option_distribution
FROM answers a
GROUP BY a."questionId";

-- Discrimination index D = p(top 27%) − p(bottom 27%). $1 = quizId
WITH ranked AS (
  SELECT id, "scorePct",
         NTILE(100) OVER (ORDER BY "scorePct" DESC) AS pct_rank
  FROM quiz_attempts
  WHERE "quizId" = $1 AND status = 'submitted' AND "scorePct" IS NOT NULL
),
grp AS (
  SELECT id, CASE WHEN pct_rank <= 27 THEN 'top'
                  WHEN pct_rank > 73  THEN 'bottom' END AS band
  FROM ranked
)
SELECT
  qa."questionId",
  ROUND(
    AVG(qa."isCorrect"::int) FILTER (WHERE g.band = 'top')::numeric -
    AVG(qa."isCorrect"::int) FILTER (WHERE g.band = 'bottom')::numeric, 3
  ) AS discrimination_index
FROM quiz_answers qa
JOIN grp g ON g.id = qa."attemptId"
WHERE g.band IS NOT NULL
GROUP BY qa."questionId";
```
