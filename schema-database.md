# Thiết kế Database — SkillPath LMS

Schema đề xuất cho [de-xuat-do-an.md](./de-xuat-do-an.md). PostgreSQL (Supabase) + pgvector, khai bằng Prisma.

Phạm vi: toàn bộ mức **Bắt buộc** và **Nên có** trong §3.6. Bỏ mức Mở rộng (phát hiện đạo văn code), nhưng giữ sẵn cột `embedding` và `searchTsv` vì thêm sau tốn migration.

---

## 1. Tổng quan

**52 bảng (gồm 1 bảng nối ẩn `_TopicPrereq` của Prisma) + 3 materialized view**, chia 11 nhóm:

| # | Nhóm | Bảng | Phục vụ |
|---|---|---|---|
| 1 | Auth | `user` `session` `account` `verification` | Better Auth sở hữu (§3.1, §4.4) |
| 2 | Xác minh & kiểm duyệt | `instructor_applications` `instructor_profiles` `course_approvals` `content_reports` | §3.2 |
| 3 | Khoá học & nội dung | `categories` `courses` `sections` `curriculum_items` `assets` `lecture_resources` `course_reviews` | §3.1, §3.2 |
| 4 | Ghi danh & tiến độ | `enrollments` `item_progress` | §3.1, §3.5b |
| 5 | Thương mại | `cart_items` `orders` `order_items` `refunds` `payment_events` `coupons` | §3.1, §3.5a |
| 6 | Topic | `topics` `_TopicPrereq` `category_topics` `course_topics` `user_topic_mastery` `user_target_topics` | §3.3 hồ sơ năng lực, §3.4 tầng 2 |
| 7 | Trắc nghiệm | `questions` `question_options` `quizzes` `quiz_topics` `quiz_attempts` `quiz_answers` | §3.3, §3.5c |
| 8 | Bài tập lập trình | `exercises` `exercise_starter_codes` `exercise_test_cases` `exercise_topics` `submissions` `submission_results` | §3.3, §4.5 |
| 9 | Chứng chỉ | `certificates` | §3.3 |
| 10 | Thống kê dashboard | `stat_course_daily` `stat_video_buckets` `stat_questions` `stat_exercises` `stat_student_risk` `email_logs` | §3.5 |
| 11 | Tương tác khoá học | `announcements` `notes` `course_questions` `course_answers` | §3.1 |
| — | Materialized view | `mv_course_copurchase` `mv_item_dropoff` `mv_course_completion` | §3.4 tầng 3, §3.5b |

## 2. Quyết định thiết kế chính

| Quyết định | Lý do |
|---|---|
| **Tách topic TỰ KHAI khỏi topic ĐO ĐƯỢC** | `user_target_topics` (học viên chọn lúc onboarding) vs `user_topic_mastery` (tính từ bài test). Chênh lệch hai bảng là tín hiệu tầng 2, và bảng đầu cho tầng 2 **chạy ngay ngày đăng ký** thay vì phải chờ có dữ liệu test. Không gộp làm một vì "muốn học" và "đang yếu" là hai việc khác nhau — yếu `sql` nhưng không quan tâm SQL thì không nên gợi ý. |
| **Khoá không gắn nghề** | `categories` = chủ đề (kiểu Udemy, để duyệt/lọc/breadcrumb). Nghề học viên (`users.occupation`) nối với khoá qua `occupation_topics` → `course_topics` (spec 2026-10-02-personalize-occupation). |
| **`categories` là bảng tự tham chiếu, không phải enum** | Một bảng thay vì ba (`category`/`subcategory`/`topic`). Admin thêm danh mục không cần redeploy — Udemy sửa taxonomy của họ định kỳ. Trigger chặn ở 2 tầng. |
| **Topic kiểu Udemy thay cho skill** | Một bảng `topics` (slug theo udemy.com/topic) làm cả taxonomy duyệt lẫn đơn vị đo năng lực. Topic không gắn cứng vào category; "Chủ đề phổ biến" của nhánh cấp 2 tính từ course_topics. Tag ở cấp quiz, không tag từng câu (spec 2026-09-29-udemy-taxonomy-topics). |
| **UUID v7** cho mọi khoá chính | Sắp theo thời gian → B-tree không phân mảnh như UUID v4. Better Auth phải cấu hình `generateId` cùng loại, xem ghi chú trong schema. |
| **Không có bảng lưu heartbeat thô** | §4.5: Supabase free giới hạn 500MB. Worker Kafka gom batch rồi ghi thẳng vào `stat_video_buckets` và `item_progress`. |
| **Session ở Redis + DB** | §4.4: `secondaryStorage` = Redis để đọc nhanh, `storeSessionInDatabase: true` để bảng `session` vẫn là nguồn chính — admin liệt kê/revoke được, Redis restart không đăng xuất mọi người. |
| **Tiền lưu `Int`** | Đơn vị nhỏ nhất của currency. Không dùng `Float` cho tiền. |
| **`order_items` snapshot giá + phí** | Đổi giá khoá sau này không làm sai báo cáo doanh thu lịch sử. |
| **`curriculum_items` một bảng cho mọi loại mục** (lecture/quiz/practice_test/coding_exercise) | Quiz/exercise là bảng 1-1 trỏ về `itemId` bắt buộc — rẻ hơn 4 bảng con và 4 join. |
| **Unique `position` DEFERRABLE** | Kéo thả đổi chỗ section/mục trong một transaction, không vướng unique giữa chừng. |
| **Bài giảng chỉ video hoặc PDF** | Trình duyệt không hiển thị được Word, không muốn thêm worker convert (spec D3). |
| **Câu hỏi thuộc quiz, bỏ ngân hàng câu hỏi** | Giống Udemy, UI soạn đơn giản (spec D6). |
| **`quiz_answers.selectedOptionIds` là `uuid[]`** | Phân tích đáp án nhiễu (§3.5c) làm bằng `unnest()`, không cần thêm bảng nối. |
| **`submission_results.judge0Token` UNIQUE** | Callback của Judge0 ghi đúng dòng và idempotent khi bị gọi lại (§4.5). |
| **`enrollments` UNIQUE(user, course)** | Idempotency cho Stripe webhook — gọi lại không tạo ghi danh trùng. |
| **`payment_events` PK(provider, eventId)** | Insert trước khi xử lý; trùng khoá = webhook đã nhận rồi. |
| **3 MV thay 3 bảng stat** | Dữ liệu nguồn đã nằm trong `enrollments`/`item_progress`, cron `REFRESH CONCURRENTLY` hằng đêm là đủ. |
| **`instructor_profiles` tồn tại = đã xác minh** | Không cần thêm cột boolean nào. |
| **Đa hình có chủ ý ở `content_reports`** | `targetType` + `targetId` không FK cứng — 4 loại đối tượng bị báo cáo, làm 4 cột nullable thì tệ hơn. |

**Đã cố ý bỏ:** `wishlist` · `assignment` · nhiều giảng viên/khoá · chế độ khoá riêng tư/unlisted · `audit_logs` chung (các bảng duyệt đã có `reviewedById` + `reviewedAt`) · bảng phát hiện đạo văn code · transactional outbox cho Kafka (§4.5 chấp nhận mất heartbeat khi Kafka lỗi).

## 3. Sơ đồ quan hệ chính

```
user ─┬─< instructor_applications ──> (admin duyệt)
      ├─── instructor_profiles          (tồn tại = đã xác minh)
      ├─< courses ─┬── categories ─< categories  (tự tham chiếu, 2 tầng)
      │            ├─< course_approvals
      │            ├─< sections ─< curriculum_items ─┬─< lecture_resources >─ assets
      │            │                                   ├─── quizzes ─< questions
      │            │                                   ├─── exercises ─< exercise_test_cases
      │            │                                   ├─< stat_video_buckets
      │            │                                   └─< notes
      │            ├─< coupons
      │            ├─< announcements
      │            ├─< course_questions ─< course_answers
      │            ├─< course_topics >─ topics ─< _TopicPrereq (tự tham chiếu)
      │            ├─< course_reviews
      │            └─< stat_course_daily
      ├─< enrollments ─< item_progress >─ curriculum_items
      ├─< assets
      ├─< orders ─< order_items ─< refunds
      ├─< cart_items
      ├─< user_topic_mastery >─ topics          ← topic ĐO ĐƯỢC (từ bài test)
      ├─< user_target_topics >─ topics          ← topic TỰ KHAI (onboarding)
      │                                            chênh lệch 2 bảng = tầng 2
      ├─< quiz_attempts ─< quiz_answers >─ questions
      ├─< submissions ─< submission_results >─ exercise_test_cases
      ├─< certificates
      ├─< stat_student_risk
      └─< email_logs

quizzes   >─< quiz_topics     >─ topics        ← "mỗi quiz gắn 1–3 topic"
exercises >─< exercise_topics >─ topics
```

Luồng tính **hồ sơ năng lực**: `quiz_attempts` / `submissions` → topic qua `quiz_topics` / `exercise_topics` → EMA vào `user_topic_mastery` → nuôi recommendation tầng 2 và radar chart §3.5d.

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
  provider = "prisma-client-js"
}

// Không dùng preview feature postgresqlExtensions: Supabase luôn cài sẵn
// pg_cron, pgcrypto, supabase_vault… → Prisma coi là drift và đòi reset mãi.
// vector / pg_trgm tạo bằng SQL ở ĐẦU migration init (mục 5).
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // transaction pooler :6543 ?pgbouncer=true
  directUrl = env("DIRECT_URL") // session pooler / direct — dùng cho migrate
}

// ============================================================================
//  1. AUTH — Better Auth sở hữu 4 model dưới đây
// ============================================================================
//
//  Cấu hình bắt buộc trong auth.ts để id khớp với 47 bảng còn lại:
//
//    import { v7 as uuidv7 } from 'uuid';
//    betterAuth({
//      advanced: { database: { generateId: () => uuidv7() } },
//      secondaryStorage: redisStore,        // §4.4: đọc session từ Redis
//      session: { storeSessionInDatabase: true }, // bảng session vẫn là nguồn chính
//      user: { additionalFields: {
//        occupation: { type: 'string', required: false, input: false },
//        level:      { type: 'string', required: false, input: false },
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

  // additionalFields — chọn ở onboarding (PATCH /me/preferences), nuôi recommendation tầng 1 (§3.4)
  occupation Occupation?
  level      SkillLevel?

  sessions Session[]
  accounts Account[]

  instructorProfile     InstructorProfile?
  applications          InstructorApplication[] @relation("applicant")
  applicationsReviewed  InstructorApplication[] @relation("applicationReviewer")
  courses               Course[]                @relation("courseInstructor")
  approvalsSubmitted    CourseApproval[]        @relation("approvalSubmitter")
  approvalsReviewed     CourseApproval[]        @relation("approvalReviewer")
  reportsFiled          ContentReport[]         @relation("reporter")
  reportsHandled        ContentReport[]         @relation("reportHandler")
  reviews               CourseReview[]
  enrollments           Enrollment[]
  cartItems             CartItem[]
  orders                Order[]
  earnings              OrderItem[]             @relation("itemInstructor")
  topicMastery          UserTopicMastery[]
  targetTopics          UserTargetTopic[]
  quizAttempts          QuizAttempt[]
  submissions           Submission[]
  certificates          Certificate[]
  riskScores            StatStudentRisk[]
  emailLogs             EmailLog[]
  assets                Asset[]
  couponsCreated        Coupon[]
  announcementsAuthored Announcement[]
  qaQuestions           CourseQuestion[]
  qaAnswers             CourseAnswer[]

  @@index([role])
  @@map("user")
}

// Nguồn chính của session (storeSessionInDatabase: true); Redis là lớp đọc nhanh.
// Admin liệt kê / revoke / impersonate dựa trên bảng này.
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
  id           String            @id @default(uuid(7)) @db.Uuid
  userId       String            @db.Uuid
  status       ApplicationStatus @default(pending)
  // [{ type: "degree"|"certificate"|"portfolio"|"cv", url, name, sizeBytes }]
  documents    Json              @default("[]")
  experience   String?
  reviewedById String?           @db.Uuid
  reviewedAt   DateTime?
  rejectReason String?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

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

  parent        Category?       @relation("CategoryTree", fields: [parentId], references: [id], onDelete: Restrict)
  children      Category[]      @relation("CategoryTree")
  courses       Course[]
  popularTopics CategoryTopic[] // chỉ node cấp 2, xem CategoryTopic

  @@index([parentId, position])
  @@map("categories")
}

model Course {
  id            String  @id @default(uuid(7)) @db.Uuid
  instructorId  String  @db.Uuid
  slug          String  @unique
  title         String
  subtitle      String?
  description   String?
  thumbnailUrl  String?
  promoVideoUrl String?

  // Khoá KHÔNG gắn nghề: nghề → topic qua occupation_topics, topic → khoá qua course_topics
  // (spec 2026-10-02-personalize-occupation P1). categoryId dùng để duyệt/lọc/breadcrumb (kiểu Udemy).
  // Nháp được để trống (spec 2026-09-30-course-create-basics C2); checklist gửi duyệt bắt buộc đủ.
  categoryId           String?      @db.Uuid
  level                SkillLevel?
  language             String       @default("vi")
  priceAmount          Int          @default(0) // đơn vị nhỏ nhất của currency
  currency             String       @default("VND")
  status               CourseStatus @default(draft)
  publishedAt          DateTime?
  copyrightConfirmedAt DateTime?

  // Trang "Học viên mục tiêu" của Udemy. Độ dài/số mục kiểm lúc gửi duyệt (service).
  // Bỏ trang "Tin nhắn khoá học" → không có welcomeMessage/congratsMessage (spec course-create-basics C7).
  learningObjectives String[] @default([]) // ≥4 mục, ≤160 ký tự/mục
  requirements       String[] @default([]) // ≥1
  targetAudience     String[] @default([]) // ≥1
  qaEnabled          Boolean  @default(true)

  // Denormalized — worker cập nhật, không phải nguồn sự thật.
  ratingAvg        Decimal @default(0) @db.Decimal(3, 2)
  ratingCount      Int     @default(0)
  enrollmentCount  Int     @default(0)
  totalDurationSec Int     @default(0)
  lectureCount     Int     @default(0) // lecture đã xuất bản

  // Prisma không có kiểu vector → khai Unsupported, thao tác bằng $queryRaw.
  // embedding ghi bởi worker khi nhận event `course.approved` (§4.5).
  // Tìm kiếm khoá học dùng Elasticsearch, không lưu tsvector trong DB.
  embedding Unsupported("vector(1536)")?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  instructor    User              @relation("courseInstructor", fields: [instructorId], references: [id])
  category      Category?         @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  sections      Section[]
  items         CurriculumItem[]
  approvals     CourseApproval[]
  reviews       CourseReview[]
  enrollments   Enrollment[]
  cartItems     CartItem[]
  orderItems    OrderItem[]
  topics        CourseTopic[]
  quizzes       Quiz[]
  exercises     Exercise[]
  certificates  Certificate[]
  dailyStats    StatCourseDaily[]
  riskScores    StatStudentRisk[]
  coupons       Coupon[]
  announcements Announcement[]
  qaQuestions   CourseQuestion[]

  @@index([instructorId])
  @@index([status, categoryId, level]) // duyệt danh mục
  @@map("courses")
}

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

  // Không cần @@index([sectionId]): unique (sectionId, position) ở sql/05 đã là index bắt đầu bằng sectionId.
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

  // Unique thường (không DEFERRABLE như sections/items/questions): đổi thứ tự phải renumber 2 bước.
  @@unique([itemId, position])
  @@index([assetId])
  @@map("lecture_resources")
}

model CourseReview {
  id                  String    @id @default(uuid(7)) @db.Uuid
  courseId            String    @db.Uuid
  userId              String    @db.Uuid
  rating              Int // 1..5 — CHECK trong SQL
  comment             String?
  instructorReply     String?
  instructorRepliedAt DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

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
  couponId       String?   @db.Uuid // coupon free: ghi danh không qua order
  progressPct    Decimal   @default(0) @db.Decimal(5, 2)
  completedAt    DateTime?
  lastAccessedAt DateTime?
  createdAt      DateTime  @default(now())

  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  course   Course         @relation(fields: [courseId], references: [id], onDelete: Cascade)
  order    Order?         @relation(fields: [orderId], references: [id], onDelete: SetNull)
  coupon   Coupon?        @relation(fields: [couponId], references: [id], onDelete: SetNull)
  progress ItemProgress[]
  notes    Note[]

  @@unique([userId, courseId]) // idempotency cho Stripe webhook (§4.5)
  @@index([courseId])
  @@index([userId, lastAccessedAt]) // điểm rủi ro bỏ học
  @@index([couponId])
  @@map("enrollments")
}

// Heartbeat 15s KHÔNG ghi trực tiếp vào đây — worker gom batch rồi update (§4.5).
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
  couponId             String?   @db.Uuid
  listPriceAmount      Int // giá gốc lúc mua; giảm giá = listPriceAmount - unitPriceAmount
  instructorId         String    @db.Uuid
  unitPriceAmount      Int
  platformFeeAmount    Int
  instructorEarnAmount Int
  refundedAt           DateTime?

  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  course     Course   @relation(fields: [courseId], references: [id])
  coupon     Coupon?  @relation(fields: [couponId], references: [id], onDelete: SetNull)
  instructor User     @relation("itemInstructor", fields: [instructorId], references: [id])
  refunds    Refund[]

  @@unique([orderId, courseId])
  @@index([instructorId])
  @@index([courseId])
  @@index([couponId])
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
  @@index([createdById])
  @@map("coupons")
}

// ============================================================================
//  6. TOPIC — taxonomy kiểu Udemy + lõi hồ sơ năng lực (§3.3), gợi ý tầng 2 (§3.4)
// ============================================================================

// Topic kiểu Udemy ("react", "docker", slug theo udemy.com/topic/<slug>).
// Không gắn cứng vào một category: một topic xuất hiện ở nhiều nhánh cấp 2
// (Python ở cả Khoa học dữ liệu và Ngôn ngữ lập trình). Menu "Chủ đề phổ biến"
// của từng nhánh được tính từ course_topics của các khoá đã duyệt (published) trong nhánh đó.
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
  occupations OccupationTopic[]
  categories CategoryTopic[]

  // Autocomplete ô "Tìm kiếm topic" ở bước 2 onboarding (name % $1). Cần extension pg_trgm.
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin, map: "idx_topics_name_trgm")
  @@map("topics")
}

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

// Topic học viên TỰ KHAI muốn học ở bước 2 onboarding (kiểu /personalize/skills
// của Udemy: đa chọn, có ô tìm kiếm và chip gợi ý theo nghề).
//
// Khác user_topic_mastery là topic ĐO ĐƯỢC từ bài test. Chênh lệch giữa hai bảng
// là tín hiệu chính của recommendation tầng 2, và quan trọng hơn: nó cho tầng 2
// chạy được NGAY NGÀY ĐẦU, khi user_topic_mastery còn rỗng hoàn toàn.
// Chip "Phổ biến với học viên như bạn" = occupation_topics của users.occupation.
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

// ============================================================================
//  7. TRẮC NGHIỆM (§3.3)
// ============================================================================

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

model QuestionOption {
  id          String  @id @default(uuid(7)) @db.Uuid
  questionId  String  @db.Uuid
  content     String
  isCorrect   Boolean @default(false)
  explanation String? // giải thích từng đáp án, ≤600 ký tự (service); tối đa 15 đáp án/câu (service)
  position    Int

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([questionId, position])
  @@map("question_options")
}

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

model ExerciseStarterCode {
  exerciseId   String  @db.Uuid
  languageId   Int
  code         String
  solutionCode String? // lời giải mẫu, để giảng viên chạy thử bộ test trước khi xuất bản

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

model ExerciseTopic {
  exerciseId String @db.Uuid
  topicId    String @db.Uuid

  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  topic    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([exerciseId, topicId])
  @@index([topicId])
  @@map("exercise_topics")
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
  itemId      String @db.Uuid
  bucketIndex Int
  viewers     Int    @default(0) // số người xem tới mốc này
  rewatches   Int    @default(0) // số lượt tua lại đoạn này

  item CurriculumItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@id([itemId, bucketIndex])
  @@map("stat_video_buckets")
}

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
  @@index([authorId])
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
// answerCount/instructorAnsweredAt là denormalized, worker/cron tính lại được.
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

// ============================================================================
//  ENUMS
// ============================================================================

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

// Chuyển trạng thái: spec §3.4. unpublished → published luôn phải qua in_review.
enum CourseStatus {
  draft
  in_review
  published
  unpublished
}

enum ReportTargetType {
  course
  item
  review
  quiz_question
  qa_question
  qa_answer
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

---

## 5. SQL bổ sung

Phần Prisma không diễn tả được: extension, CHECK constraint, generated column, partial index, HNSW index, materialized view.

```sql
-- ============================================================================
--  Phần schema Prisma không diễn tả được.
--
--  Cách áp dụng:
--    pnpm prisma migrate dev --create-only --name init
--    Chèn 3 dòng CREATE EXTENSION của mục 1 lên ĐẦU migration.sql (bảng courses
--    có cột vector, phải có extension trước CREATE TABLE), rồi nối phần còn lại:
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

ALTER TABLE user_topic_mastery
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

-- Lưu ý: chk_mastery_score và chk_topic_not_self_prereq (topic) nay nằm ở prisma/sql/03_taxonomy_topics.sql;
-- 01_post_migrate.sql giữ tên skill cũ kèm comment trỏ sang 03.
-- Đồ thị topic tiên quyết không được tự trỏ vào chính nó.
-- Prisma sinh bảng m-n ẩn "_TopicPrereq" với 2 cột "A", "B".
ALTER TABLE "_TopicPrereq"
  ADD CONSTRAINT chk_topic_not_self_prereq CHECK ("A" <> "B");

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

-- Ô "Tìm kiếm một topic" ở bước 2 onboarding — autocomplete trên toàn catalog.
CREATE INDEX idx_topics_name_trgm ON topics USING gin (name gin_trgm_ops);

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

-- Mỗi khoá tối đa 1 topic chính. "Đúng 1 khi publish" kiểm ở service publish.
CREATE UNIQUE INDEX uq_course_primary_topic ON course_topics ("courseId") WHERE "isPrimary";

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
--  7. Seed taxonomy — xem back-end/prisma/sql/04_taxonomy_seed.sql
--  4 category cấp 1, 25 cấp 2, 159 topic, 17 cạnh tiên quyết; idempotent
--  (chạy lại không nhân đôi). Phải chạy trước khi tạo khoá học đầu tiên
--  vì courses."categoryId" NOT NULL.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
--  8. Dọn user chưa xác minh email sau 7 ngày (pg_cron, 3h sáng giờ VN hằng ngày; pg_cron chạy theo UTC nên lịch là 20:00 UTC)
--  KHÔNG dán vào migration (shadow DB của migrate dev không tạo được pg_cron).
--  Tách ra prisma/sql/02_pg_cron.sql, chạy tay sau migrate deploy:
--    pnpm prisma db execute --file prisma/sql/02_pg_cron.sql
--  Bật extension pg_cron trong Supabase Dashboard trước. account/session xoá
--  theo nhờ onDelete: Cascade. User chưa xác minh không đăng nhập được nên
--  không có đơn hàng / ghi danh nào để mất.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('purge-unverified-users', '0 20 * * *', $$
  DELETE FROM "user"
  WHERE "emailVerified" = false AND "createdAt" < now() - interval '7 days'
$$);
```

### Bổ sung 2026-09-30 — curriculum kiểu Udemy

Các khối về `lessons`, `mv_lesson_dropoff`, `idx_courses_embedding WHERE status = 'approved'` ở trên
đã lỗi thời; bản thay thế:

```sql
-- ============================================================================
--  Bổ sung cho migration udemy_curriculum (spec 2026-09-30-udemy-curriculum-schema §5).
--  Cách áp dụng: dán vào cuối migration.sql do `migrate dev --create-only` sinh ra.
--  ĐẦU migration.sql phải có (thêm tay, trước mọi lệnh Prisma sinh):
--    DROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;   -- phụ thuộc bảng lessons
--    DROP INDEX IF EXISTS idx_courses_embedding;           -- WHERE status = 'approved' chặn đổi enum
--
--  CẢNH BÁO drift — danh sách ĐẦY ĐỦ object viết tay mà Prisma không biết (thay danh sách ở 03).
--  Luôn `--create-only`, rồi rà migration.sql:
--  (a) Luôn xuất hiện trong mọi `migrate dev --create-only`/`migrate diff`, phải xoá tay:
--    DROP INDEX uq_sections_position, uq_items_position, uq_questions_position
--    (unique DEFERRABLE, Prisma thấy như index lạ).
--  (b) Prisma không nhìn thấy (partial index, CHECK chk_*, MV mv_*) nên sẽ không sinh lệnh cho chúng
--      — đừng viết SQL động vào chúng:
--    idx_courses_embedding, uq_course_primary_topic, idx_qa_unanswered,
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
-- Asset đúng kind (video/document) không kiểm được bằng CHECK (khác bảng) → service đảm bảo.
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

-- [2026-09-30] Vá NULL ở migration exercise_languages_not_null.
ALTER TABLE exercises ADD CONSTRAINT chk_exercise_languages
  CHECK (coalesce(cardinality("allowedLanguageIds"), 0) >= 1);

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
WHERE c.status = 'published' AND child.slug = $1
ORDER BY c."enrollmentCount" DESC
LIMIT 20;

-- ---------------------------------------------------------------------------
--  ONBOARDING BƯỚC 2 — hai truy vấn cho màn chọn topic
-- ---------------------------------------------------------------------------

-- Chip "Phổ biến với học viên như bạn": curated theo nghề. $1 = users.occupation
SELECT t.id, t.slug, t.name
FROM occupation_topics ot
JOIN topics t ON t.id = ot."topicId"
WHERE ot.occupation = $1::"Occupation"
ORDER BY ot.position;

-- Ô "Tìm kiếm một topic": autocomplete toàn catalog. $1 = chuỗi người dùng gõ
SELECT s.id, s.name, similarity(s.name, $1) AS sim
FROM topics s
WHERE s.name % $1 -- dùng idx_topics_name_trgm
ORDER BY sim DESC
LIMIT 10;

-- ---------------------------------------------------------------------------
--  TẦNG 2 ⭐ — theo lỗ hổng topic, có chặn bằng đồ thị tiên quyết
--  $1 = userId
--
--  Ý tưởng:
--   weak        — topic cần học, gồm HAI nguồn:
--                   (a) đo được yếu   — user_topic_mastery.score < 0.6
--                   (b) tự khai muốn học nhưng chưa có điểm — user_target_topics
--                 Nhờ (b), truy vấn này chạy được ngay ngày đầu đăng ký, khi
--                 user_topic_mastery còn rỗng. Đây là lời giải cold start cho
--                 tầng 2, không phải chỉ tầng 1.
--   candidate   — khoá dạy đúng topic đó, chưa mua
--   blocked     — khoá mà học viên CHƯA vững một topic tiên quyết nào đó
--                 (duyệt đệ quy toàn bộ chuỗi JS → React → Next.js)
--  Kết quả = candidate − blocked, ưu tiên topic nằm trong mục tiêu tự khai.
-- ---------------------------------------------------------------------------
WITH weak AS (
  -- (a) đo được yếu
  SELECT m."topicId",
         m.score,
         true AS measured,
         EXISTS (SELECT 1 FROM user_target_topics t
                 WHERE t."userId" = $1 AND t."topicId" = m."topicId") AS is_target
  FROM user_topic_mastery m
  WHERE m."userId" = $1 AND m.score < 0.6

  UNION

  -- (b) tự khai muốn học, chưa đo bao giờ → coi như score 0
  SELECT t."topicId", 0::numeric, false, true
  FROM user_target_topics t
  WHERE t."userId" = $1
    AND NOT EXISTS (SELECT 1 FROM user_topic_mastery m
                    WHERE m."userId" = $1 AND m."topicId" = t."topicId")
),
owned AS (
  SELECT "courseId" FROM enrollments WHERE "userId" = $1
),
candidate AS (
  SELECT cs."courseId", w."topicId", w.score, w.measured, w.is_target
  FROM course_topics cs
  JOIN weak w ON w."topicId" = cs."topicId"
  WHERE cs."courseId" NOT IN (SELECT "courseId" FROM owned)
),
-- Toàn bộ topic tiên quyết (bắc cầu) của các topic mà khoá ứng viên dạy.
-- "_TopicPrereq"."A" = topic, "B" = topic mà A yêu cầu (quan hệ Topic.prerequisites).
prereq_closure AS (
  WITH RECURSIVE walk("courseId", "topicId") AS (
    SELECT cs."courseId", sp."B"
    FROM course_topics cs
    JOIN "_TopicPrereq" sp ON sp."A" = cs."topicId"
    WHERE cs."courseId" IN (SELECT "courseId" FROM candidate)

    UNION -- UNION (không ALL) tự chống vòng lặp nếu đồ thị bị khai sai

    SELECT w."courseId", sp."B"
    FROM walk w
    JOIN "_TopicPrereq" sp ON sp."A" = w."topicId"
  )
  SELECT * FROM walk
),
blocked AS (
  SELECT DISTINCT pc."courseId"
  FROM prereq_closure pc
  LEFT JOIN user_topic_mastery m
    ON m."userId" = $1 AND m."topicId" = pc."topicId"
  WHERE COALESCE(m.score, 0) < 0.6 -- chưa học hoặc chưa vững topic tiên quyết
)
SELECT
  c.id,
  c.title,
  MIN(cand.score)                                    AS weakest_score,
  bool_or(cand.is_target)                            AS hits_declared_goal,
  ARRAY_AGG(DISTINCT s.name)                         AS targets_topics,
  -- Lý do hiển thị khác nhau tuỳ nguồn tín hiệu (§3.4: "gợi ý có giải thích lý do")
  CASE
    WHEN bool_and(NOT cand.measured)
      THEN 'Gợi ý vì bạn muốn học ' || (ARRAY_AGG(s.name ORDER BY cand.score))[1]
    ELSE 'Gợi ý vì bạn đạt ' || ROUND(MIN(cand.score) * 100) || '% ở topic ' ||
         (ARRAY_AGG(s.name ORDER BY cand.score))[1]
  END AS reason
FROM candidate cand
JOIN courses c ON c.id = cand."courseId"
JOIN topics  s ON s.id = cand."topicId"
WHERE c.status = 'published'
  AND c.id NOT IN (SELECT "courseId" FROM blocked)
GROUP BY c.id, c.title
-- Topic học viên tự khai muốn học được ưu tiên trước: yếu sql nhưng không
-- quan tâm SQL thì không nên đẩy lên đầu.
ORDER BY hits_declared_goal DESC, weakest_score ASC, c."ratingAvg" DESC
LIMIT 10;

-- Biến thể: bài học cần ôn lại TRONG khoá đang học (§3.4 tầng 2, vế đầu).
-- $1 = userId, $2 = courseId
SELECT DISTINCT i.id, i.title, s.name AS topic, m.score
FROM user_topic_mastery m
JOIN topics s           ON s.id = m."topicId"
JOIN quiz_topics qt     ON qt."topicId" = m."topicId"
JOIN quizzes q          ON q.id = qt."quizId" AND q."courseId" = $2
JOIN curriculum_items i  ON i.id = q."itemId"
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
WHERE mv.course_id = $1 AND c.status = 'published'
ORDER BY mv.co_count DESC
LIMIT 5;

-- ---------------------------------------------------------------------------
--  TẦNG 4 — nội dung gần giống (pgvector, cosine)
--  $1 = embedding của khoá vừa học, $2 = courseId để loại chính nó
-- ---------------------------------------------------------------------------
SELECT c.id, c.title,
       1 - (c.embedding <=> $1::vector) AS similarity
FROM courses c
WHERE c.status = 'published'
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
