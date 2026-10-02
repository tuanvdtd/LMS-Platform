# Cá nhân hoá kiểu Udemy: thay Track bằng Occupation + kỹ năng theo dõi

Ngày: 2026-10-02 · Trạng thái: đã duyệt thiết kế, chờ review spec

## 1. Bối cảnh & mục tiêu

Hiện tại "track" (enum 7 giá trị) nằm ở hai chỗ:
- `users.targetTrack`: mục tiêu nghề của học viên, khai báo lúc đăng ký.
- `courses.track`: giảng viên bắt buộc chọn 1 track cho khoá (checklist gửi duyệt).

Ba vấn đề:
1. Một khoá (SQL, Git, Docker) phục vụ nhiều nghề, ép 1 track là sai.
2. Enum quá thô: không có QA, ML, Game…; `other` vô nghĩa với gợi ý.
3. Trang `/onboarding` dùng dữ liệu cứng, hỏi "kỹ năng đã có" (sai câu) và không lưu gì.
   Bảng `user_target_topics` đã có nhưng chưa ai ghi.

Tham chiếu: flow `udemy.com/personalize` khảo sát ngày 2026-10-02 gồm 4 bước:
field (lĩnh vực) → occupation (nghề, ~22 nghề cho Phát triển phần mềm) → skills (chọn nhiều,
có ô tìm + chip "Phổ biến với học viên như bạn" theo nghề) → certifications. Có "Lưu rồi thoát"
mọi bước. Udemy **không** gắn nghề cho khoá học và **không** hỏi trình độ.

Mục tiêu: onboarding 3 bước lưu thật (nghề → kỹ năng muốn học → trình độ), bỏ trục track ở khoá
học, recommendation tầng 1 đi qua topic.

## 2. Quyết định đã chốt

| # | Quyết định | Lý do |
|---|---|---|
| P1 | **Bỏ hẳn `courses.track`** và enum `Track` | Khoá ↔ nghề là quan hệ nhiều-nhiều, đã thể hiện qua topic |
| P2 | `users.targetTrack` → `users.occupation` (enum `Occupation`, 12 giá trị) | Mịn hơn, khớp bước 2 Udemy. Enum vì danh sách ổn định, không cần CRUD admin |
| P3 | Bảng seed `occupation_topics` nối nghề → topic phổ biến | Nuôi chip onboarding **và** recommendation tầng 1 |
| P4 | Gộp bước "lĩnh vực" vào bước nghề, bỏ bước chứng chỉ | Nền tảng chỉ IT; chưa có dữ liệu chứng chỉ |
| P5 | Giữ bước trình độ (`users.level`), cho bỏ qua | Tầng 1 lọc theo level khi có |
| P6 | Recommendation giữ **4 tầng**, chỉ định nghĩa lại tầng 1 | Mỗi tầng một nguồn tín hiệu riêng (xem §6) |
| P7 | Không có ô "nghề khác, tự gõ" | Recommendation không dùng được text tự do. Chọn `other` là đủ |

## 3. Data model

### 3.1 Enum `Occupation`

```prisma
// Trục NGHỀ NGHIỆP của học viên (bước 1 onboarding, kiểu /personalize/occupation của Udemy).
// Khoá học không gắn nghề: nghề → topic qua occupation_topics, topic → khoá qua course_topics.
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

### 3.2 Thay đổi bảng

| Bảng | Thay đổi |
|---|---|
| `users` (`User`) | Xoá `targetTrack Track?`, thêm `occupation Occupation?`. Giữ `level SkillLevel?` |
| `courses` (`Course`) | Xoá cột `track` và `@@index([status, track, level])`. Sửa comment "HAI TRỤC PHÂN LOẠI" còn một trục category |
| enum `Track` | Xoá |
| `occupation_topics` (mới, `OccupationTopic`) | `occupation Occupation`, `topicId Uuid` (FK `topics`, `onDelete: Cascade`), `position Int @default(0)`. PK `(occupation, topicId)`, index `(occupation, position)` |
| `user_target_topics` | Không đổi cột. Sửa comment "bước 3 onboarding" → "bước 2 onboarding", và dòng "Chip … = topic của các khoá có track = user.targetTrack" thành "Chip … = occupation_topics của users.occupation" |

`Topic` thêm relation ngược `occupations OccupationTopic[]`.

Migration: Prisma sinh DROP `targetTrack` + ADD `occupation` (không map dữ liệu, chưa có user thật).
Comment Better Auth ở đầu schema (ví dụ `additionalFields`) đổi `targetTrack` → `occupation`.

### 3.3 Seed `back-end/prisma/sql/06_occupation_topics.sql`

Idempotent: `INSERT … SELECT … FROM (VALUES …) JOIN topics ON slug ON CONFLICT DO NOTHING`.
Slug không tồn tại thì tự rơi khỏi JOIN. Cuối file: `DO $$` đếm, nghề nào (trừ `other`) < 5 topic
thì `RAISE NOTICE`. `position` theo thứ tự liệt kê dưới đây. Mọi slug đều có trong `04_taxonomy_seed.sql`.

Cách áp seed: theo tiền lệ `04` → `20260929153711_taxonomy_seed`, nội dung `06_occupation_topics.sql` được
chép nguyên văn vào **migration seed riêng** `<timestamp>_occupation_topics_seed/migration.sql`.

Quy trình migration theo `back-end/README.md` mục "Sửa schema" (**không** dùng `prisma migrate dev`):
1. Migration schema `<t1>_personalize_occupation`: `mkdir` tay, `prisma migrate diff --from-url DIRECT_URL
   --to-schema-datamodel … --script > migration.sql`, xoá 3 dòng `DROP INDEX uq_*_position`.
2. Migration seed `<t2>_occupation_topics_seed` với `t2 > t1`: `mkdir` tay, dán nội dung `06` (không diff).
3. `pnpm db:deploy`. DB mới và e2e có sẵn dữ liệu.

| Nghề | Topic (slug, theo thứ tự) |
|---|---|
| frontend_developer | html, css, javascript, typescript, react, nextjs, angular, web-development, git, user-interface |
| backend_developer | nodejs, java, spring-framework, python, fastapi, aspnet-core, sql, postgresql, docker, git |
| fullstack_developer | javascript, typescript, react, nextjs, nodejs, sql, postgresql, docker, git, web-development |
| mobile_developer | react-native, google-flutter, dart-programming-language, android-development, kotlin, ios-development, swift, swiftui, mobile-development |
| devops_engineer | docker, kubernetes, devops, linux, shell-scripting, amazon-aws, git, github, system-administration |
| data_engineer | python, sql, postgresql, data-engineering, apache-kafka, pandas, amazon-aws, docker |
| data_analyst | sql, python, pandas, data-analysis, data-science, mysql, postgresql |
| ml_engineer | python, machine-learning, deep-learning, pytorch, tensorflow, mlops, large-language-models, langchain, retrieval-augmented-generation |
| qa_engineer | automation-testing, playwright, selenium-webdriver, pytest, postman, istqb-certified-tester-foundation-level-ctfl, javascript, python |
| software_architect | software-architecture, system-design-interview, data-structures, algorithms, docker, kubernetes, amazon-aws, java |
| game_developer | unity, unreal-engine, godot, c-sharp, c-plus-plus, game-development, blender, 3d-modeling |
| other | (không seed) |

### 3.4 Better Auth

`auth.ts` `user.additionalFields`: `targetTrack` → `occupation`. Cả `occupation` và `level` đặt
`input: false`: client gửi kèm lúc sign-up / `updateUser` thì Better Auth trả 400 (`FIELD_NOT_ALLOWED`).
FE register hiện không gửi hai field này nên không ảnh hưởng. Hai field chỉ ghi qua
`PATCH /me/preferences` (có validate).

## 4. API

| Endpoint | Auth | Việc |
|---|---|---|
| `GET /topics/popular?occupation=<Occupation>` | Public | `occupation_topics` của nghề, `ORDER BY position`, trả `[{id, slug, name}]`. Đặt trong `TopicsController` hiện có |
| `GET /me/preferences` | Đăng nhập | `{ occupation, level, topics: [{id, slug, name}] }` (topics sắp theo `user_target_topics.createdAt`) |
| `PATCH /me/preferences` | Đăng nhập | Body `{ occupation?, level?, topicIds? }`, trả cùng dạng `GET` |

Zod cho `PATCH`:
- `occupation`: `z.enum(Occupation).nullable().optional()`.
- `level`: `z.enum(['beginner', 'intermediate', 'advanced']).nullable().optional()` — `all_levels` bị 400
  (là thuộc tính khoá, không phải trình độ học viên).
- `topicIds`: `z.array(z.uuid()).max(30)` + refine không trùng, optional.
- Body rỗng `{}` hợp lệ (không đổi gì, trả trạng thái hiện tại).

Xử lý `PATCH`:
1. Nếu có `topicIds`: `count(topics where id in topicIds)` ≠ độ dài → 400 `Topic không tồn tại`
   (kiểm **trước** khi xoá, không mất danh sách cũ).
2. Nếu có `topicIds`: transaction `deleteMany user_target_topics where userId` + `createMany`.
3. Nếu có `occupation`/`level`: `ctx.internalAdapter.updateUser(user.id, {…})` như
   `become-instructor`, để cache `{session, user}` trong Redis được refresh.

Code đặt trong module mới `back-end/src/preferences/` (controller + service), route `me/preferences`;
`/topics/popular` thêm vào `TopicsController`.

## 5. FE

### 5.1 Onboarding `/onboarding` (viết lại `onboarding-view.tsx`)

| Bước | Nội dung | Kiểu chọn | "Tiếp theo" |
|---|---|---|---|
| 1/3 Nghề | "Bạn đang học để làm nghề gì?", 12 nghề | Chọn 1, bắt buộc | `PATCH { occupation }` |
| 2/3 Kỹ năng | Ô tìm topic (`GET /topics?q=`) + chip checkbox "Phổ biến với học viên như bạn" (`GET /topics/popular`). Topic chọn từ ô tìm hiện thêm thành chip đã tick | Chọn nhiều, được trống | `PATCH { topicIds }` |
| 3/3 Trình độ | 3 mức `beginner`, `intermediate`, `advanced` (**không** hiện `all_levels`, đó là thuộc tính khoá), có "Bỏ qua" | Chọn 1, không bắt buộc | `PATCH { level }` (Bỏ qua: không gửi `level`), rồi về `/` |

- Header riêng: logo trái, **"Lưu rồi thoát"** phải (PATCH phần đã chọn của bước hiện tại rồi về `/`).
  Bỏ nút "Bỏ qua" cũ. Thanh tiến trình "Bước x/3".
- Mở trang gọi `GET /me/preferences` để điền sẵn → trang này cũng là trang chỉnh sửa.
- Đang PATCH khoá nút; lỗi → toast, giữ bước và lựa chọn. `GET` lỗi → form trống, không chặn.
- **Chưa đăng nhập:** `/onboarding` không nằm trong matcher của `proxy.ts`. `GET /me/preferences` hoặc
  bất kỳ PATCH nào trả 401 → `router.replace('/login?redirect=/onboarding')` (login đã dùng `safeRedirect`).
- Nghề `other` → bước 2 chỉ có ô tìm (popular trả rỗng).
- API client mới `it-course-platform/src/lib/api/preferences.ts` theo pattern `lib/api/categories.ts`.
- `OCCUPATION_LABEL` (key tiếng Anh → label tiếng Việt) đặt trong file mới `it-course-platform/src/types/preferences.ts`
  (cùng type `Occupation`). `SKILL_LEVEL_LABEL` giữ nguyên ở `types/instructor-course.ts`, onboarding import từ đó.

**Code FE bằng skill `/evon:ui-ux`** với prompt:

```
Dựng lại màn /onboarding (it-course-platform/src/app/onboarding) — wizard cá nhân hoá 3 bước kiểu
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
```

### 5.2 Trang cài đặt

`app/(student)/settings/page.tsx`: thêm dòng "Sở thích học tập" + link "Chỉnh sửa" → `/onboarding`.
Không làm form riêng.

### 5.3 Gỡ track phía giảng viên

- FE `basics-form.tsx`: bỏ ô Track, field `track` trong zod/defaults/useWatch, badge Track ở xem trước.
- FE `types/instructor-course.ts`: bỏ `TRACK_LABEL`, `Track`, `track` trong type khoá.
- BE `instructor-courses.schemas.ts`, `instructor-courses.service.ts` (select), `course-checklist.ts`
  (bỏ mục "Chưa chọn track"): bỏ `track`.

### 5.4 Ngoài phạm vi

Trang học viên còn dùng mock (`featured-courses`, `categories/[track]`, `skills`, type `Track` trong
`types/index.ts`): không sửa, làm khi nối API thật cho các trang đó.

## 6. Recommendation (hợp đồng, không code endpoint trong spec này)

| Tầng | Nguồn | Cách tính |
|---|---|---|
| 1. Theo nghề | `users.occupation` → `occupation_topics` → `course_topics` | Khoá khớp nhiều topic của nghề nhất, lọc level, rồi rating |
| 2. Theo lỗ hổng | `user_target_topics` trừ `user_topic_mastery` | Topic muốn học mà `score < 0.6` hoặc chưa có điểm; tiên quyết bằng `WITH RECURSIVE` (giữ nguyên) |
| 3. Hành vi chung | `enrollments` | Co-enrollment, materialized view (giữ nguyên) |
| 4. Nội dung | `courses.embedding` | pgvector (giữ nguyên) |

Tầng 1 là **suy ra** (chạy được khi học viên bỏ qua bước kỹ năng), tầng 2 là **tự khai** trừ phần đã giỏi.

```sql
SELECT c.id FROM courses c
JOIN course_topics ct ON ct."courseId" = c.id
JOIN occupation_topics ot ON ot."topicId" = ct."topicId" AND ot.occupation = $1
WHERE c.status = 'published'
  AND ($2::"SkillLevel" IS NULL OR c.level IN ($2, 'all_levels'))
GROUP BY c.id
ORDER BY COUNT(*) DESC, (c.level = $2) DESC, c."ratingAvg" DESC
LIMIT 12;
```

**Đồng bộ level khoá ↔ trình độ học viên.** Hai bên dùng chung enum `SkillLevel` và label
`SKILL_LEVEL_LABEL`. `all_levels` chỉ là thuộc tính khoá ("hợp với mọi trình độ"), học viên chọn 3 mức.

| Học viên ↓ / Khoá → | beginner | intermediate | advanced | all_levels |
|---|---|---|---|---|
| beginner | ✅ | – | – | ✅ |
| intermediate | – | ✅ | – | ✅ |
| advanced | – | – | ✅ | ✅ |
| chưa chọn | ✅ | ✅ | ✅ | ✅ |

Ưu tiên: số topic khớp nghề → khoá đúng level đứng trước `all_levels` → rating. Không gợi ý khoá cao hơn
một bậc; học tiếp lên là việc của tầng 2 (mastery + đồ thị tiên quyết).

Cập nhật tài liệu: dòng tầng 1 ở `de-xuat-do-an.md` (§4.6) và mọi chỗ nhắc `track`/`targetTrack`
trong `de-xuat-do-an.md`, `schema-database.md` — gồm dòng "Hai trục phân loại" (~dòng 33) và khối SQL
tầng 1 + chip (~dòng 1831-1867, đang dùng `c.track = $1::"Track"`).

## 7. Xử lý lỗi

| Trường hợp | Xử lý |
|---|---|
| Enum sai, `topicIds` không phải uuid / trùng / > 30 | 400 (`ZodValidationPipe`) |
| `topicIds` có id không tồn tại | 400 `Topic không tồn tại`, danh sách cũ giữ nguyên |
| Chưa đăng nhập gọi `/me/preferences` | 401 (guard sẵn có); FE chuyển `/login?redirect=/onboarding` |
| `level = all_levels` | 400 |
| `GET /topics/popular` nghề sai enum | 400; `other` → `[]` |
| FE PATCH lỗi / GET lỗi | Toast + giữ bước / form trống |
| Seed slug thiếu | Tự bỏ qua; `RAISE NOTICE` nếu nghề < 5 topic |

## 8. Kiểm tra

- E2E mới `back-end/test/preferences.e2e-spec.ts` (pattern `taxonomy.e2e-spec.ts`):
  - PATCH từng field riêng → GET trả đúng; body `{}` không đổi gì.
  - PATCH `topicIds` hai lần → lần sau thay hẳn lần trước.
  - Topic không tồn tại → 400, danh sách cũ còn nguyên.
  - Enum sai / `level = all_levels` / quá 30 topic → 400; chưa đăng nhập → 401.
  - Sign-up gửi kèm `occupation` → 400 `occupation is not allowed to be set` (Better Auth `input: false`).
  - `GET /topics/popular?occupation=frontend_developer` trả đúng thứ tự `position`; `other` → `[]`.
- Sửa test cũ bỏ `track`: `course-checklist.spec.ts`, `instructor-courses.e2e-spec.ts`,
  `taxonomy.e2e-spec.ts`, `udemy-curriculum.e2e-spec.ts`.
- FE: `tsc --noEmit` + lint. Chạy tay: đủ 3 bước; "Lưu rồi thoát" ở bước 2 → mở lại thấy điền sẵn;
  form basics giảng viên không còn ô Track, checklist không còn mục track.
