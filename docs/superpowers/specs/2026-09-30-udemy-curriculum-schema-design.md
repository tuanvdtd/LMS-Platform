# Schema kiểu Udemy: curriculum, quiz, bài tập coding, khoá học, tương tác

Ngày: 2026-09-30 · Trạng thái: đã duyệt thiết kế, chờ review spec · Phạm vi: **chỉ tầng DB**

## 1. Bối cảnh & mục tiêu

Schema hiện tại (`back-end/prisma/schema.prisma`) mô hình curriculum theo kiểu Section → Lesson với
`Lesson.type`, quiz/exercise trỏ ngược về `lessonId` (có thể null), câu hỏi nằm trong ngân hàng theo khoá,
và thiếu các trường trang giới thiệu, coupon, thông báo, ghi chú, hỏi đáp.

Mục tiêu: đưa model về gần Udemy, dựa trên khảo sát trực tiếp flow tạo khoá trên UI instructor của
Udemy (tài khoản thật, 2026-09-30):
- Curriculum là danh sách **mục** trong từng **phần**, mỗi mục có loại và trạng thái xuất bản riêng.
- Quiz, bài thi thử, bài tập coding là mục của curriculum, không phải bảng tự do.
- Trang giới thiệu có mục tiêu học tập, yêu cầu, đối tượng, lời chào, lời chúc.
- Giá theo bậc, coupon do giảng viên tạo, thông báo, ghi chú theo mốc video, hỏi đáp, trả lời đánh giá.

Ngoài phạm vi: API NestJS, UI, `types`/mock ở `it-course-platform` (làm ở các spec sau, theo flow Udemy đã
khảo sát). Không làm: assignment tự luận, nhiều giảng viên trên một khoá, link giới thiệu, phụ đề,
wishlist, chế độ khoá riêng tư.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| D1 | `lessons` → `curriculum_items`, một bảng cho mọi loại, cột riêng từng loại để nullable | Giữ pattern cũ (rẻ hơn bảng con + join) |
| D2 | Loại mục: `lecture`, `quiz`, `practice_test`, `coding_exercise` | Assignment thuộc nhóm để sau; thêm giá trị enum sau rất rẻ |
| D3 | Bài giảng chỉ có **video** hoặc **tài liệu PDF**. Không có bài viết HTML, không nhận Word | Trình duyệt không hiển thị được Word; không muốn thêm worker convert |
| D4 | Tài liệu đính kèm bài giảng cũng chỉ là file PDF (không link ngoài, không mã nguồn) | Cùng lý do D3 |
| D5 | Kéo thả đổi chỗ **section**, đổi chỗ **mục**, chuyển mục sang section khác | Unique `position` khai DEFERRABLE (§3.1) |
| D6 | Câu hỏi **thuộc quiz**, bỏ ngân hàng câu hỏi (`quiz_questions`) | Giống Udemy, UI soạn đơn giản |
| D7 | Giải thích gắn **từng đáp án**; mỗi câu gắn được một bài giảng liên quan | Giống Udemy |
| D8 | Bài tập coding **giữ nhiều ngôn ngữ** (`allowedLanguageIds[]`) | Chấm bằng stdin/stdout Judge0, bộ test không phụ thuộc ngôn ngữ. Udemy chỉ 1 ngôn ngữ vì chấm bằng unit test |
| D9 | Trạng thái khoá chỉ còn `draft`, `in_review`, `published`, `unpublished` | Yêu cầu của chủ dự án. Không có private/unlisted |
| D10 | Miễn phí / trả phí suy ra từ `priceAmount` (0 hay > 0), bậc giá là hằng số trong code | Không thêm bảng |
| D11 | Khoá trả phí đòi giảng viên đã xác minh; tạo và soạn khoá thì không cần | Udemy làm vậy qua "đơn giảng viên cao cấp" |
| D12 | Coupon rút gọn: `fixed_price` hoặc `free`, 3 coupon/tháng/khoá | Giống Udemy, bỏ % giảm và coupon toàn sàn |
| D13 | Hỏi đáp cơ bản, không upvote | Ít bảng |
| D14 | Một migration mới `udemy_curriculum`, drop bảng cũ đang rỗng rồi tạo lại | Đúng pattern các migration trước, không đụng user/taxonomy |

## 3. Data model

### 3.1 Curriculum

**`sections`** (giữ bảng)

| Cột | Thay đổi |
|---|---|
| `courseId`, `title`, `position` | giữ |
| `description String?` | **mới**, ô "mục tiêu của phần" |

Bỏ `@@unique([courseId, position])` trong Prisma; unique này tạo bằng SQL dạng
`DEFERRABLE INITIALLY DEFERRED` (§5).

**`curriculum_items`** (mới, thay `lessons`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid v7 | |
| `sectionId` | uuid FK sections, Cascade | |
| `courseId` | uuid FK courses, Cascade | denormalized, như `lessons.courseId` cũ |
| `type` | enum `CurriculumItemType` | `lecture` \| `quiz` \| `practice_test` \| `coding_exercise` |
| `title` | String | ≤80 ký tự (service) |
| `position` | Int | thứ tự trong section, đánh chung cho mọi loại |
| `isPublished` | Boolean @default(false) | |
| `lectureKind` | enum `LectureKind`? | `video` \| `document`; chỉ lecture; null = chưa chọn nội dung (không được xuất bản) |
| `videoAssetId` | uuid? FK assets, Restrict | lecture video |
| `documentAssetId` | uuid? FK assets, Restrict | lecture document |
| `description` | String? | chỉ lecture |
| `isPreview` | Boolean @default(false) | xem thử không cần mua |
| `isDownloadable` | Boolean @default(false) | |
| `durationSec` | Int @default(0) | lecture video: từ asset; document: service ước lượng |
| `createdAt`, `updatedAt` | | |

Index: `(courseId)`, `(sectionId)`. Unique `(sectionId, position)` tạo bằng SQL, DEFERRABLE (§5).

Số hiển thị "Phần 1", "Bài giảng 3", "Trắc nghiệm 1" **tính lúc đọc** (`ROW_NUMBER() OVER (PARTITION BY
type ORDER BY section.position, item.position)`), không lưu, nên kéo thả xong tự đúng.

Kéo thả (hợp đồng cho service sau này), mỗi thao tác là **một transaction**:
- Đổi chỗ / di chuyển section: cập nhật `position` các section bị ảnh hưởng. Mục đi theo section vì trỏ
  `sectionId`, không phải sửa dòng nào trong `curriculum_items`.
- Di chuyển mục trong section: cập nhật `position` các mục bị ảnh hưởng.
- Chuyển mục sang section khác: đổi `sectionId`, đánh lại `position` ở cả section cũ và mới.

**`assets`** (mới) — thư viện file của giảng viên

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid v7 | |
| `ownerId` | uuid FK user, Restrict | giảng viên sở hữu |
| `kind` | enum `AssetKind` | `video` \| `document` |
| `fileName` | String | tên gốc |
| `mimeType` | String | `document` bắt buộc `application/pdf` (CHECK, §5) |
| `sizeBytes` | BigInt | video ≤4GB, PDF ≤1GB (service) |
| `storageKey` | String @unique | key trên S3 |
| `hlsKey` | String? | video sau khi transcode |
| `status` | enum `AssetStatus` @default(uploading) | `uploading` \| `processing` \| `ready` \| `failed` |
| `durationSec` | Int? | video |
| `createdAt`, `updatedAt` | | |

Index `(ownerId, createdAt)`. "Thêm từ thư viện" = `assets WHERE ownerId = me AND status = 'ready'`.
FK từ `curriculum_items`/`lecture_resources` là **Restrict**: không xoá được asset đang dùng.

**`lecture_resources`** (thay `lesson_resources`)

| Cột | Ghi chú |
|---|---|
| `id` | |
| `itemId` | FK curriculum_items, Cascade; phải là lecture (service) |
| `assetId` | FK assets, Restrict; asset `kind = document` (service) |
| `title` | |
| `position` | |

Unique `(itemId, position)`, index `(assetId)`.

**Tiến độ và thống kê**
- `lesson_progress` → **`item_progress`**: khoá `(enrollmentId, itemId)`, các cột `watchedSec`,
  `lastPositionSec`, `completedAt`, `updatedAt` giữ nguyên. Index `(itemId)`.
- `stat_video_buckets.lessonId` → `itemId`.
- `courses.lessonCount` → `lectureCount` (đếm lecture đã xuất bản); `totalDurationSec` giữ.
- MV `mv_lesson_dropoff` → `mv_item_dropoff` (§5).

### 3.2 Quiz và bài thi thử

**`quizzes`** — dùng chung cho item `quiz` và `practice_test`; loại lấy từ `curriculum_items.type`

| Cột | Thay đổi |
|---|---|
| `itemId` | **mới**, uuid **bắt buộc**, `@unique`, FK curriculum_items Cascade |
| `lessonId`, `title` | **bỏ** (tiêu đề nằm trên item) |
| `courseId`, `description`, `timeLimitSec`, `passScorePct`, `maxAttempts`, `shuffle`, `isFinal`, timestamps | giữ |

Luật ở service: `practice_test` bắt buộc `timeLimitSec > 0`. CHECK `chk_pass_score`, index
`idx_quizzes_final`, `uq_one_final_quiz_per_course` giữ nguyên.

**`questions`**

| Cột | Thay đổi |
|---|---|
| `quizId` | **mới**, thay `courseId`; FK quizzes Cascade |
| `position` | **mới**; unique `(quizId, position)` tạo bằng SQL, DEFERRABLE |
| `type` | enum `QuestionType` còn `single_choice` \| `multiple_choice` (**bỏ `true_false`**) |
| `stem` → `stemHtml` | đổi tên |
| `relatedItemId` | **mới**, uuid? FK curriculum_items, SetNull; phải là lecture cùng khoá (service) |
| `explanation`, `createdById` | **bỏ** |
| `points`, `archivedAt`, timestamps | giữ |

Index `(quizId)`.

**`question_options`**: thêm `explanation String?` (≤600 ký tự, service). Tối đa 15 đáp án (service).
`@@unique([questionId, position])` giữ.

**Xoá** `quiz_questions`. **`stat_questions`**: khoá chính rút về `questionId` (bỏ cột `quizId`).
`quiz_topics`, `quiz_attempts`, `quiz_answers` giữ nguyên.

### 3.3 Bài tập coding

**`exercises`**

| Cột | Thay đổi |
|---|---|
| `itemId` | **mới**, uuid bắt buộc `@unique`, FK curriculum_items Cascade |
| `lessonId`, `title` | **bỏ** |
| `statement` → `instructionsHtml` | đổi tên |
| `referenceSolution` | **bỏ**, chuyển sang `exercise_starter_codes.solutionCode` |
| `learningObjective` | **mới**, String? (≤200 ký tự, service) |
| `hints` | **mới**, String[] @default([]) |
| `solutionExplanation` | **mới**, String? |
| `relatedItemId` | **mới**, uuid? FK curriculum_items, SetNull |
| `courseId`, `difficulty`, `timeLimitMs`, `memoryLimitKb`, `allowedLanguageIds`, `totalPoints`, timestamps | giữ |

CHECK `coalesce(cardinality("allowedLanguageIds"), 0) >= 1` (§5); `chk_exercise_limits` giữ.

**`exercise_starter_codes`**: thêm `solutionCode String?` (lời giải mẫu từng ngôn ngữ, để giảng viên
chạy thử bộ test trước khi xuất bản). Service kiểm: mỗi `languageId` trong `allowedLanguageIds` có đúng
một dòng; `submissions.languageId` phải thuộc `allowedLanguageIds`.

`exercise_test_cases`, `exercise_topics`, `submissions`, `submission_results`, `stat_exercises` giữ nguyên.

### 3.4 Khoá học

**Cột mới trên `courses`**

| Cột | Kiểu | Luật (kiểm lúc gửi duyệt, service) |
|---|---|---|
| `learningObjectives` | String[] @default([]) | ≥4 mục, mỗi mục ≤160 ký tự |
| `requirements` | String[] @default([]) | ≥1 mục, mỗi mục ≤160 ký tự |
| `targetAudience` | String[] @default([]) | ≥1 mục, mỗi mục ≤160 ký tự |
| `welcomeMessage` | String? | ≤1000 ký tự |
| `congratsMessage` | String? | ≤1000 ký tự |
| `qaEnabled` | Boolean @default(true) | |

Đổi tên: `lessonCount` → `lectureCount`.

**`CourseStatus`**: `draft` \| `in_review` \| `published` \| `unpublished`
(bỏ `pending_review`, `approved`, `rejected`, `unlisted`, `archived`).

| Chuyển | Ai | Ghi chú |
|---|---|---|
| `draft` → `in_review` | giảng viên | chỉ khi checklist đủ (dưới đây); tạo dòng `course_approvals` |
| `in_review` → `published` | admin | ghi `publishedAt` nếu null |
| `in_review` → `draft` | admin | từ chối, lý do ở `course_approvals.reason` |
| `published` → `unpublished` | giảng viên hoặc admin (vi phạm) | học viên cũ vẫn học; người mới không thấy |
| `unpublished` → `in_review` | giảng viên | **luôn phải duyệt lại**, không bật thẳng |

Xoá khoá: chỉ khi chưa có `enrollments` (service). `course_approvals.status` (`ApprovalStatus`) giữ nguyên.

**Checklist gửi duyệt** (service trả về danh sách mục còn thiếu để UI hiển thị):
tiêu đề, phụ đề, mô tả ≥200 từ, `level`, `categoryId` cấp 2, đúng 1 topic chính, `thumbnailUrl`,
`learningObjectives`/`requirements`/`targetAudience` như bảng trên, **≥5 lecture đã xuất bản**, **tổng
video ≥30 phút**. Hai ngưỡng cuối là hằng số trong code.

**Giá**
- `priceAmount` (VND) giữ. Hằng số `PRICE_TIERS_VND` trong code; service chỉ nhận `0` hoặc giá trong danh
  sách. CHECK `priceAmount >= 0` (§5).
- `priceAmount = 0` (miễn phí): tổng video ≤2 giờ và không có item `practice_test`.
- `priceAmount > 0`: giảng viên phải có `instructor_profiles` (đã xác minh). `instructor_applications`
  giữ nguyên, chỉ còn chặn bước đặt giá.

### 3.5 Coupon

**`coupons`** (mới)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid v7 | |
| `courseId` | FK courses, Cascade | |
| `createdById` | FK user, Restrict | |
| `code` | String | `^[A-Z0-9_-]{6,20}$` (CHECK); unique `(courseId, code)` |
| `type` | enum `CouponType` | `fixed_price` \| `free` |
| `priceAmount` | Int? | CHECK: `fixed_price` → `> 0`, `free` → null. Service: là bậc giá thấp hơn giá khoá |
| `startsAt`, `endsAt` | DateTime | CHECK `endsAt > startsAt`. Service: tối đa 31 ngày (`fixed_price`), 5 ngày (`free`) |
| `maxRedemptions` | Int? | CHECK: `free` → bắt buộc có, `> 0` |
| `redeemedCount` | Int @default(0) | CHECK `>= 0` và `<= maxRedemptions` khi có |
| `disabledAt` | DateTime? | tắt sớm |
| `createdAt` | | |

Index `(courseId, createdAt)`. Luật service: tối đa 3 coupon tạo trong cùng tháng dương lịch mỗi khoá;
không tạo coupon cho khoá đang miễn phí.

Dùng coupon (hợp đồng cho service): trừ lượt bằng một câu atomic, không đọc rồi ghi
```sql
UPDATE coupons SET "redeemedCount" = "redeemedCount" + 1
WHERE id = $1 AND "disabledAt" IS NULL AND now() BETWEEN "startsAt" AND "endsAt"
  AND ("maxRedemptions" IS NULL OR "redeemedCount" < "maxRedemptions")
RETURNING id;
```
Không có dòng trả về = coupon hết lượt / hết hạn.

Ghi nhận:
- `order_items`: thêm `couponId uuid?` (FK coupons, SetNull) và `listPriceAmount Int` (giá gốc lúc mua).
  Giảm giá = `listPriceAmount - unitPriceAmount`. CHECK `listPriceAmount >= unitPriceAmount` (§5).
- Coupon `free` **không tạo order**: ghi danh luôn với `enrollments.couponId` (mới, FK coupons, SetNull).
  Mỗi người dùng một lần nhờ unique `(userId, courseId)` sẵn có của `enrollments`.

### 3.6 Thông báo, ghi chú, hỏi đáp, trả lời đánh giá

**`announcements`** (mới): `id`, `courseId` (Cascade), `authorId` (FK user), `title`, `bodyHtml`,
`createdAt`, `updatedAt`. Index `(courseId, createdAt DESC)`. Email cho học viên ghi `email_logs` với
`template = 'announcement'`.

**`notes`** (mới, riêng từng học viên): `id`, `enrollmentId` (Cascade), `itemId` (Cascade), `positionSec`
(CHECK `>= 0`), `body` (≤1000 ký tự, service), `createdAt`, `updatedAt`. Index
`(enrollmentId, itemId, positionSec)`.

**Hỏi đáp** — chỉ hoạt động khi `courses.qaEnabled` (service)
- `course_questions`: `id`, `courseId` (Cascade), `itemId?` (FK curriculum_items, SetNull), `userId`
  (Cascade), `title` (≤255), `bodyHtml?`, `answerCount Int @default(0)`, `instructorAnsweredAt?`,
  `createdAt`, `updatedAt`. Index `(courseId, createdAt)`, `(itemId)`; partial index câu hỏi chưa có giảng
  viên trả lời (§5).
- `course_answers`: `id`, `questionId` (Cascade), `userId` (Cascade), `bodyHtml`, `isInstructor Boolean`
  (chụp lúc trả lời: người trả lời có phải giảng viên của khoá), `createdAt`, `updatedAt`. Index
  `(questionId, createdAt)`.
- Insert câu trả lời và cập nhật `answerCount`, `instructorAnsweredAt` (khi `isInstructor` và đang null)
  trong **cùng một transaction**.
- `ReportTargetType` đổi thành `course` \| `item` \| `review` \| `quiz_question` \| `qa_question` \|
  `qa_answer` (`lesson` → `item`, `question` → `quiz_question` cho khỏi nhầm với hỏi đáp).

**`course_reviews`**: thêm `instructorReply String?`, `instructorRepliedAt DateTime?`.

## 4. Tổng hợp thay đổi bảng / enum

| Loại | Tên |
|---|---|
| Bảng mới | `curriculum_items`, `assets`, `lecture_resources`, `item_progress`, `coupons`, `announcements`, `notes`, `course_questions`, `course_answers` |
| Bảng xoá | `lessons`, `lesson_resources`, `lesson_progress`, `quiz_questions` |
| Bảng sửa cột | `sections`, `courses`, `quizzes`, `questions`, `question_options`, `stat_questions`, `exercises`, `exercise_starter_codes`, `stat_video_buckets`, `order_items`, `enrollments`, `course_reviews` |
| Enum mới | `CurriculumItemType`, `LectureKind`, `AssetKind`, `AssetStatus`, `CouponType` |
| Enum xoá | `LessonType` |
| Enum sửa | `CourseStatus`, `QuestionType`, `ReportTargetType` |

`Question` và `Exercise` có **hai** relation tới `CurriculumItem` (`itemId`/`quizId` qua quiz, và
`relatedItemId`), nên phải đặt tên relation, ví dụ `@relation("ExerciseItem")` và
`@relation("ExerciseRelatedLecture")`, `@relation("QuestionRelatedLecture")`.

Relation field trên `User`/`Course` đổi theo (ví dụ `Course.lessons` → `items`, `User.questionsCreated`
bỏ, thêm `User.assets`, `User.notes`… qua enrollment, `User.qaQuestions`, `User.qaAnswers`,
`User.announcements`, `User.couponsCreated`).

## 5. SQL bổ sung — `prisma/sql/05_udemy_curriculum.sql`

Dán vào cuối `migration.sql` của `udemy_curriculum`, như 01/03.

1. **Unique DEFERRABLE** (không khai `@@unique` trong Prisma vì Prisma không tạo được constraint deferrable):
   ```sql
   ALTER TABLE sections ADD CONSTRAINT uq_sections_position
     UNIQUE ("courseId", position) DEFERRABLE INITIALLY DEFERRED;
   ALTER TABLE curriculum_items ADD CONSTRAINT uq_items_position
     UNIQUE ("sectionId", position) DEFERRABLE INITIALLY DEFERRED;
   ALTER TABLE questions ADD CONSTRAINT uq_questions_position
     UNIQUE ("quizId", position) DEFERRABLE INITIALLY DEFERRED;
   ```
2. **CHECK**
   - `chk_item_payload` trên `curriculum_items`. Lecture có 3 trạng thái hợp lệ: **chưa có nội dung**
     (`lectureKind`, `videoAssetId`, `documentAssetId` đều null và `isPublished = false`; giống Udemy tạo
     bài giảng chỉ với tiêu đề rồi mới chọn nội dung), `video` (chỉ có `videoAssetId`), `document` (chỉ
     có `documentAssetId`). `type <> 'lecture'` → ba cột trên đều null. So sánh enum dùng
     `IS NOT DISTINCT FROM` để NULL không lọt CHECK.
   - `chk_asset_pdf` trên `assets`: `kind <> 'document' OR "mimeType" = 'application/pdf'`.
   - `chk_exercise_languages`: `coalesce(cardinality("allowedLanguageIds"), 0) >= 1` (không coalesce thì NULL lọt).
   - `chk_course_price`: `"priceAmount" >= 0`.
   - `chk_coupon_code`, `chk_coupon_price`, `chk_coupon_window`, `chk_coupon_redemptions` theo §3.5.
   - `chk_order_item_list_price`: `"listPriceAmount" >= "unitPriceAmount"`.
   - `chk_note_position`: `"positionSec" >= 0`.
3. **Partial index**
   - `idx_courses_embedding ... WHERE status = 'published'` (tạo lại, bị drop ở đầu migration).
   - `idx_qa_unanswered ON course_questions ("courseId", "createdAt") WHERE "instructorAnsweredAt" IS NULL`.
4. **MV** `mv_item_dropoff` (thay `mv_lesson_dropoff`): như cũ nhưng `FROM curriculum_items i LEFT JOIN
   item_progress p ON p."itemId" = i.id JOIN sections s ON s.id = i."sectionId" WHERE i.type = 'lecture'`
   (`GROUP BY i.id, i."courseId", s.position, i.position`), cột `item_id`, `course_id`,
   `section_position`, `position`. Unique index `(item_id)`, index `(course_id, section_position, position)`.
   Tạo lại `refresh_analytics_views()` (giữ tên, job pg_cron không đổi) và refresh lần đầu.
5. Header của `05` chứa danh sách **CẢNH BÁO drift** đầy đủ, thay cho danh sách ở `03` (03 đã nằm trong
   migration, không sửa): `idx_courses_embedding`, `uq_course_primary_topic`, `uq_sections_position`,
   `uq_items_position`, `uq_questions_position`, `idx_qa_unanswered`, cùng các CHECK ở §5.2. Bỏ các mục đã
   lỗi thời: `idx_courses_search`, `idx_courses_title_trgm`, `searchTsv` (đã drop ở `drop_pg_fulltext`),
   `idx_topics_name_trgm` (Prisma đã quản lý).

`01_post_migrate.sql`: thêm ghi chú `[2026-09-30]` trỏ sang `05` tại `chk_lesson_payload`,
`mv_lesson_dropoff`, `refresh_analytics_views`, `idx_courses_embedding` (không sửa nội dung, file đã nằm
trong migration `init`).

## 6. Migration

1. Sửa `schema.prisma` theo §3–§4.
2. `pnpm prisma migrate dev --create-only --name udemy_curriculum`.
3. Sửa tay `migration.sql`:
   - **Đầu file:** `DROP MATERIALIZED VIEW IF EXISTS mv_lesson_dropoff;` và
     `DROP INDEX IF EXISTS idx_courses_embedding;` (MV phụ thuộc `lessons`; index có điều kiện trên giá
     trị enum `approved` sắp bị xoá).
   - Xoá mọi câu Prisma sinh ra động tới object viết tay trong danh sách drift. **Giữ lại**
     `DROP INDEX "sections_courseId_position_key"` do bỏ `@@unique` trên `sections`, vì `05` tạo lại nó
     dạng constraint DEFERRABLE.
   - **Cuối file:** dán `05_udemy_curriculum.sql`.
4. Trước khi apply: `SELECT count(*)` trên `lessons`, `lesson_progress`, `quizzes`, `questions`,
   `exercises`, `courses`, `order_items`, `enrollments`. Bảng nào khác 0 thì **dừng, hỏi chủ dự án**.
5. `pnpm prisma migrate deploy` (không dùng `migrate dev` để áp dụng, tránh Prisma tự sinh/áp lệnh drift).

## 7. Xử lý lỗi

Service kiểm trước để trả thông báo dễ hiểu; CHECK/unique trong DB là lớp chặn cuối. Quy ước cho các spec
API sau: unique (Prisma `P2002`) → 409, CHECK (SQLSTATE `23514`) → 400, coupon hết lượt (câu UPDATE §3.5
không trả dòng) → 409 với mã `COUPON_EXHAUSTED`.

## 8. Kiểm tra

1. `pnpm prisma validate` và `pnpm prisma migrate deploy` chạy sạch.
2. `pnpm prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma
   --shadow-database-url …` chỉ còn các object viết tay đã có trong danh sách drift.
3. `back-end/test/udemy-curriculum.e2e-spec.ts` (vitest e2e, cùng pattern `taxonomy.e2e-spec.ts`: mỗi
   test chạy trong transaction PrismaClient rồi rollback; máy dev không có `psql`), kiểm:
   - mỗi CHECK ở §5.2 từ chối một dòng sai, và một dòng hợp lệ đi qua (đối chứng fixture);
   - đổi chỗ hai section (và hai item) trong một transaction thành công nhờ DEFERRABLE (ép kiểm bằng
     `SET CONSTRAINTS ALL IMMEDIATE`, vì transaction test bị rollback nên không tới bước COMMIT);
   - coupon `maxRedemptions = 1`: câu UPDATE §3.5 chạy lần 2 trả 0 dòng;
   - xoá asset đang được item dùng bị chặn (Restrict).

## 9. Tài liệu

- `schema-database.md`: cập nhật nhóm khoá học & nội dung, trắc nghiệm, bài tập, thương mại, thêm nhóm
  tương tác; sơ đồ quan hệ.
- `de-xuat-do-an.md` §3.3: "Ngân hàng câu hỏi" → "Câu hỏi soạn trong từng quiz"; §3.1 bổ sung coupon,
  thông báo, ghi chú, hỏi đáp.

## 10. Ghi chú thực thi (2026-09-30)

- `migrate dev --create-only` không chạy được trong môi trường không tương tác → `migration.sql` của
  `udemy_curriculum` sinh bằng `prisma migrate diff --from-url <DB dev> --to-schema-datamodel`, rồi sửa như
  §6.3 và áp bằng `migrate deploy`. Quy trình này ghi ở `back-end/README.md` mục "Sửa schema".
- Review phát hiện `chk_exercise_languages` bản đầu (`cardinality(...) >= 1`) để lọt NULL → vá bằng migration
  riêng `exercise_languages_not_null` (dùng `coalesce`), không sửa migration đã áp.
- Diff DB ↔ schema sau khi áp chỉ còn `DROP INDEX` của 3 unique DEFERRABLE (drift có chủ đích).
