# Tạo khoá học + Học viên mục tiêu + Trang tổng quan (đợt 1/4 flow giảng viên)

Ngày: 2026-09-30 · Trạng thái: đã duyệt thiết kế, chờ review spec · Phạm vi: API NestJS + FE `it-course-platform`

## 1. Bối cảnh & mục tiêu

Schema curriculum đã xong (PR #4, spec `2026-09-30-udemy-curriculum-schema-design.md`). Màn giảng viên hiện
tại (`instructor/courses/_components/course-builder.tsx`) là mock: không gọi API, enum lệch DB. BE chỉ có
module `categories`.

Flow tạo khoá chia 4 đợt, mỗi đợt một vòng spec → plan → code:

| Đợt | Nội dung |
|---|---|
| **1 (spec này)** | Nền API (zod), bật vai trò giảng viên, tạo khoá bằng modal, danh sách khoá của tôi, trang quản lý toàn màn hình với checklist, Học viên mục tiêu, Trang tổng quan (trừ ảnh/video) |
| 2 | Khung chương trình (section/mục, kéo thả) + upload PDF/ảnh (R2) |
| 3 | Upload video + worker HLS |
| 4 | Quiz, bài tập coding, định giá, coupon, gửi duyệt |

UI **dựng lại** theo flow (không vá mock cũ).

## 2. Quyết định đã chốt

| # | Quyết định |
|---|---|
| C1 | Không có wizard: nút "Tạo khoá học" mở **modal chỉ nhập tên** (≤60) → tạo → vào trang quản lý |
| C2 | `courses.categoryId`, `track`, `level` **cho NULL lúc nháp**; checklist gửi duyệt bắt buộc đủ |
| C3 | **Không autosave**: mỗi trang có nút **Lưu**, chỉ bật khi form có thay đổi; cảnh báo khi rời trang chưa lưu |
| C4 | Trang quản lý **toàn màn hình** kiểu Udemy (thanh trên + sidebar checklist), không dùng layout `/instructor` |
| C5 | Checklist tính ở **BE** (hàm thuần), đợt 4 dùng lại cho gửi duyệt |
| C6 | Học viên **tự bật** vai trò giảng viên (giống Udemy); chỉ bán có phí mới cần xác minh (spec schema D11) |
| C7 | Bỏ trang "Tin nhắn khoá học" → **drop** cột `welcomeMessage`, `congratsMessage` |
| C8 | Validation BE bằng **zod** (pipe tự viết), FE react-hook-form + zod; FE gọi API bằng axios `api` có sẵn, không thêm TanStack/Zustand |
| C9 | Mô tả khoá là **văn bản thường** (textarea) ở đợt này |
| C10 | API trả **cả `id` lẫn `slug`**; PATCH gửi `categoryId` / `primaryTopicId`. `GET /api/categories/tree` thêm `id` cho cấp 1, cấp 2 và topic (chỉ thêm trường, client cũ không vỡ) |

## 3. Màn hình

### 3.1 Danh sách khoá của tôi — `/instructor/courses` (dựng lại)

- Nút **"Tạo khoá học"** → `CreateCourseDialog`: ô "Tên khoá học" (≤60, bộ đếm), nút **Tạo** (disable khi rỗng
  hoặc đang gửi). Thành công → `router.push('/instructor/courses/{id}/manage/goals')`.
- Mỗi dòng: ảnh (`thumbnailUrl` hoặc placeholder), tên, badge trạng thái (Bản nháp / Chờ duyệt / Đang bán /
  Đã gỡ), thanh **"Hoàn thiện x/y mục"** (`progress`), "Sửa lần cuối …", nút "Chỉnh sửa" → `manage/goals`.
- Chưa có khoá: trạng thái trống + nút tạo.

### 3.2 Trang quản lý — `/instructor/courses/[id]/manage/{goals|basics}`

- **Thanh trên**: "← Quay lại khoá học" (về `/instructor/courses`), tên khoá, badge trạng thái, "Xem trước"
  (disabled, đợt sau).
- **Sidebar checklist**:
  - *Lên kế hoạch*: Học viên mục tiêu (`goals`)
  - *Tạo nội dung*: Khung chương trình — mờ, nhãn "Sắp có"
  - *Xuất bản*: Trang tổng quan (`basics`) · Định giá, Khuyến mại — mờ, "Sắp có"
  - Nút "Gửi đi để xem xét" — disabled, "Sắp có"
  - Mỗi mục có vòng tròn / dấu tick theo `checklist[key].done`. Mọi mục chưa xong đều liệt kê `missing`;
    bấm một dòng → chuyển tới trang của mục đó và cuộn tới `#anchor`.
- **`goals` — Học viên mục tiêu**: 3 `StringListEditor`
  - "Học viên sẽ học được gì?" (anchor `objectives`): mặc định hiện 4 ô, ≤160 ký tự/ô, bộ đếm, "+ Thêm câu
    trả lời" (tối đa 10), xoá từng ô.
  - "Yêu cầu hoặc điều kiện tiên quyết?" (`requirements`), "Khoá học dành cho đối tượng nào?"
    (`audience`): mặc định 1 ô, cùng quy tắc.
  - Nút **Lưu**.
- **`basics` — Trang tổng quan**: tiêu đề (`title`, ≤60), phụ đề (`subtitle`, ≤120), mô tả (`description`,
  textarea, hiển thị số từ, gợi ý ≥200), ngôn ngữ (`language`), cấp độ (`level`, 4 mức), track (`track`),
  category cấp 1 → cấp 2 (`category`, `CategoryPicker` nhận cây qua props từ trang server, §5.2), topic chính
  (`topic`, `TopicPicker`), ảnh bìa + video quảng cáo: khung "Sắp có (đợt 2)". Nút **Lưu**.

Tạo khoá tự sinh "Phần 1: Giới thiệu" + "Bài giảng 1: Giới thiệu" (lecture chưa có nội dung, chưa xuất bản);
đợt 1 không hiển thị khung chương trình.

## 4. API

Mọi route dưới prefix `/api` (có sẵn). Module mới `back-end/src/instructor-courses/`, `back-end/src/topics/`;
`POST /me/become-instructor` thêm vào `MeController`.

### 4.1 Endpoint

| Endpoint | Quyền | Việc |
|---|---|---|
| `POST /me/become-instructor` | đăng nhập | Thêm `instructor` vào `user.role` (chuỗi phẩy, ví dụ `student,instructor`; role null → `instructor`). Idempotent. **Ghi qua `(await auth.$context).internalAdapter.updateUser(id, { role })`**, không dùng `prisma.user.update`: better-auth cache `{session, user}` trong Redis (`secondaryStorage`), chỉ `internalAdapter` mới refresh cache — ghi thẳng Prisma thì guard vẫn thấy role cũ → 403. (`admin.setRole` không dùng được vì đòi quyền admin.) Trả user |
| `POST /instructor/courses` `{title}` | `@Roles('instructor')` | Transaction: tạo course (`status draft`, `instructorId = user.id`, `slug`), section position 1 "Giới thiệu", item lecture position 1 "Giới thiệu". `201 {id}` |
| `GET /instructor/courses` | instructor | Khoá của mình, `updatedAt DESC`: `{id, title, status, thumbnailUrl, updatedAt, progress: {done, total}}[]` |
| `GET /instructor/courses/:id` | instructor, chủ khoá | `CourseDetail` (§4.2) |
| `PATCH /instructor/courses/:id` | instructor, chủ khoá | Cập nhật các trường có mặt trong body (§4.3). Trả `CourseDetail` |
| `GET /topics?q=&limit=` | `@Public` | Tìm topic theo tên: `q` 1–50 ký tự, `limit` 1–20 (mặc định 10). `{id, slug, name}[]` |
| `GET /categories/tree` (có sẵn) | `@Public` | **Sửa**: thêm `id` vào node cấp 1, cấp 2 và topic. Cập nhật type `CategoryNode`/`SubcategoryNode`/`TopicLink` ở BE và FE |

Khoá không tồn tại hoặc không phải của user → **404** (không lộ khoá của người khác).

Slug: `slugify(title)` (bỏ dấu tiếng Việt, `[a-z0-9-]`, cắt 60) + `-` + 6 ký tự `[a-z0-9]` ngẫu nhiên; trùng
(P2002) → sinh lại hậu tố, thử 1 lần nữa. Slug **không đổi** khi sửa tiêu đề.

### 4.2 `CourseDetail`

```ts
{
  id, slug, status, title, subtitle, description, language, level, track,
  thumbnailUrl, promoVideoUrl,
  learningObjectives: string[], requirements: string[], targetAudience: string[],
  category: { id, slug, name, parent: { id, slug, name } } | null,
  primaryTopic: { id, slug, name } | null,
  updatedAt,
  checklist: ChecklistItem[]
}
ChecklistItem = { key: 'goals' | 'curriculum' | 'basics', done: boolean,
                  missing: { message: string, anchor: string }[] }
```

### 4.3 `PATCH` body (zod, mọi trường optional, `.strict()`)

| Trường | Luật |
|---|---|
| `title` | trim, 1–60 |
| `subtitle` | trim, ≤120; chuỗi rỗng → null |
| `description` | ≤5000 từ; chuỗi rỗng → null |
| `language` | một trong `vi`, `en` |
| `level` | `SkillLevel` hoặc null |
| `track` | `Track` hoặc null |
| `categoryId` | uuid category **cấp 2** hoặc null; không tồn tại / cấp 1 → 400 `path: ['categoryId']` |
| `primaryTopicId` | uuid topic hoặc null; không tồn tại → 400 `path: ['primaryTopicId']` |
| `learningObjectives`, `requirements`, `targetAudience` | mảng ≤10, mỗi phần tử trim ≤160; bỏ phần tử rỗng |

- Khoá `in_review` → **409** `{code: 'COURSE_LOCKED'}`. Trạng thái khác sửa được.
- `primaryTopicId`: một transaction — xoá dòng `course_topics` `isPrimary` cũ của khoá (nếu khác topic mới) rồi
  **upsert** `(courseId, topicId)` với `isPrimary: true` (PK là `(courseId, topicId)`, topic có thể đã gắn dạng
  không chính); null → chỉ xoá dòng primary. Topic không chính (nếu có) không động tới.
- Validation lỗi → **400** `{statusCode: 400, message: 'Dữ liệu không hợp lệ', errors: [{path: string[],
  message: string}]}` (message tiếng Việt).

### 4.4 Checklist — `back-end/src/instructor-courses/course-checklist.ts`

Hàm thuần `buildChecklist(input) → ChecklistItem[]`, `input` gồm các trường course + `hasPrimaryTopic`,
`categoryDepth` (1 hoặc 2 hoặc null), `publishedLectureCount`, `videoSeconds`. Đếm từ: tách theo khoảng trắng
sau trim, bỏ phần rỗng.

| key | Điều kiện `done` | `missing` (message → anchor) |
|---|---|---|
| `goals` | ≥4 mục tiêu, ≥1 yêu cầu, ≥1 đối tượng | "Cần thêm N mục tiêu học tập" → `objectives`; "Cần ít nhất 1 yêu cầu" → `requirements`; "Cần ít nhất 1 đối tượng học viên" → `audience` |
| `curriculum` | ≥5 lecture đã xuất bản, ≥30 phút video | "Cần thêm N bài giảng đã xuất bản" → `curriculum`; "Cần thêm N phút video" → `curriculum` |
| `basics` | đủ tiêu đề, phụ đề, mô tả ≥200 từ, cấp độ, track, category cấp 2, topic chính, ảnh bìa | lần lượt "Thiếu phụ đề" → `subtitle`, "Mô tả còn thiếu N từ" → `description`, "Chưa chọn cấp độ" → `level`, "Chưa chọn track" → `track`, "Chưa chọn thể loại con" → `category`, "Chưa chọn chủ đề chính" → `topic`, "Chưa có ảnh bìa" → `thumbnail` |

Các ngưỡng (4, 200, 5, 30 phút) là hằng số export, đợt 4 dùng lại khi gửi duyệt.
`progress` ở danh sách = `{done: số item done, total: số item}`. Định giá/khuyến mại thêm ở đợt 4.

### 4.5 Nền

- `back-end/src/common/zod.pipe.ts`: `ZodValidationPipe(schema)` → `schema.safeParse`, lỗi → `BadRequestException`
  với body §4.3. Thêm dependency `zod` (BE).
- Không thêm global filter; service tự bắt P2002 cho slug.

## 5. FE

### 5.1 Route

```
src/app/instructor/
  layout.tsx                      # passthrough + chặn quyền (§5.4)
  (dashboard)/layout.tsx          # SiteHeader + InstructorSidebar (chuyển từ layout cũ)
  (dashboard)/page.tsx, analytics/, messages/, problems/, profile/, qa/, questions/, verification/,
  (dashboard)/courses/page.tsx    # danh sách khoá (dựng lại)
  (manage)/courses/[id]/manage/layout.tsx   # CourseManageShell + CourseProvider
  (manage)/courses/[id]/manage/goals/page.tsx
  (manage)/courses/[id]/manage/basics/page.tsx
```
Các trang dashboard chuyển bằng `git mv` vào `(dashboard)/`, kèm `instructor/_components/` và `loading.tsx`
(để skeleton không bọc trang quản lý). **Sửa import tuyệt đối** `@/app/instructor/...` →
`@/app/instructor/(dashboard)/...` ở các file bị ảnh hưởng (ví dụ `revenue-chart`, `messages/_components`,
`profile`, `verification`); `tsc` phải sạch. Link `/instructor/courses/new` (ví dụ `instructor/page.tsx`) đổi
thành mở `CreateCourseDialog` hoặc trỏ `/instructor/courses`. Xoá `courses/new/`, `courses/[id]/edit/`,
`courses/_components/course-builder.tsx`. `/instructor/courses/[id]/manage` (không có mục) redirect → `goals`.
Route group không đổi URL; `(dashboard)/courses` và `(manage)/courses/[id]/manage` không đụng nhau.

### 5.2 Dữ liệu

- `src/lib/api/instructor-courses.ts`: `createCourse`, `listMyCourses`, `getCourse`, `updateCourse`,
  `becomeInstructor`, `searchTopics`, dùng axios `api` (`withCredentials`).
- `src/types/instructor-course.ts`: kiểu khớp §4.2, enum `CourseStatus`, `SkillLevel`, `Track` đúng giá trị DB
  + map nhãn tiếng Việt.
- `cacheComponents: true`: layout `manage` đọc `[id]` bằng `useParams` nên phần client phải bọc `<Suspense>`
  (giống `InstructorSidebar` hiện tại), nếu không prerender bị treo.
- `CategoryPicker` nhận cây category **qua props** từ trang `basics` (server component gọi `getCategoryTree()`
  có sẵn, dùng lại cache `'use cache'`), không gọi axios. Sau khi thêm `id` vào cây, cache cũ (`cacheLife('hours')`) chưa có `id` →
  khi test local phải restart dev server / xoá `.next`.
- `CourseProvider` (client, ở layout `manage`): gọi `getCourse` một lần, context gồm `course`,
  `setCourse` (sau khi lưu), `dirty` + `setDirty` (dùng cho chặn rời trang).

### 5.3 Form

- react-hook-form + zod với giới hạn giống §4.3.
- Nút **Lưu** disabled khi `!isDirty || isSubmitting`; đang gửi hiện "Đang lưu…"; thành công: `setCourse`,
  `reset(values)`, toast "Đã lưu".
- Rời trang khi `dirty`: `beforeunload`; link trong `ChecklistSidebar` và "← Quay lại" hỏi `confirm('Bỏ thay đổi
  chưa lưu?')`.
- 400 → `setError` theo `path`; 409 `COURSE_LOCKED` → banner "Khoá học đang chờ duyệt, không sửa được" và
  `disabled` toàn form; lỗi khác → toast "Lưu thất bại, thử lại", giữ nguyên dữ liệu form.

### 5.4 Vai trò giảng viên

- `instructor/layout.tsx` (client): `authClient.useSession()`; chưa đăng nhập → `/login?redirect=`; role không
  chứa `instructor` → màn "Trở thành giảng viên" (nút gọi `becomeInstructor` → `refetch` session).
- Nút "Chuyển sang Giảng viên" ở `header.tsx` và `mobile-nav.tsx` **giữ nguyên** (link `/instructor`): màn chặn ở
  layout đã lo việc bật vai trò, có nút xác nhận, một đường duy nhất.

### 5.5 Component (dưới `src/app/instructor/...//_components` hoặc `src/components/instructor/`)

`CreateCourseDialog`, `CourseManageShell`, `ChecklistSidebar`, `StringListEditor`, `GoalsForm`, `BasicsForm`,
`CategoryPicker`, `TopicPicker` (debounce 300ms). Thêm shadcn: `dialog`, `textarea`, `select`, `label`,
`sonner`.

## 6. Migration `course_draft_nullable`

Theo quy trình `back-end/README.md` mục "Sửa schema" (`migrate diff` → xoá 3 dòng `DROP INDEX uq_*_position`
→ `db:deploy`, **sếp chạy deploy**):

- `courses."categoryId"`, `"track"`, `"level"` → `DROP NOT NULL` (schema: `String?`, `Track?`, `SkillLevel?`,
  relation `category Category?`).
- `DROP COLUMN "welcomeMessage"`, `"congratsMessage"`.

## 7. Xử lý lỗi

| Trường hợp | BE | FE |
|---|---|---|
| Chưa đăng nhập | 401 (guard có sẵn) | interceptor có sẵn → `/login?redirect=` |
| Không có role giảng viên | 403 | màn "Trở thành giảng viên" |
| Khoá không tồn tại / không phải của mình | 404 | "Không tìm thấy khoá học" + link về danh sách |
| Dữ liệu sai | 400 `errors[{path, message}]` | lỗi dưới từng ô |
| Khoá đang chờ duyệt | 409 `COURSE_LOCKED` | banner, form chỉ xem |
| Trùng slug | sinh lại hậu tố, thử 1 lần | — |
| Mạng / 500 | Sentry có sẵn | toast "Lưu thất bại, thử lại", giữ dữ liệu |

## 8. Kiểm thử

- **BE unit** `course-checklist.spec.ts`: đếm từ (rỗng, nhiều khoảng trắng), từng điều kiện goals/basics/
  curriculum đúng/sai, nội dung `missing`. `slugify` (có dấu, ký tự đặc biệt, dài >60).
- **BE e2e** `test/instructor-courses.e2e-spec.ts` (đăng nhập theo pattern `test/auth.e2e-spec.ts`):
  tạo khoá → DB có section + lecture mặc định; danh sách chỉ khoá của mình; PATCH hợp lệ → checklist mới;
  PATCH sai → 400 có `path`; category cấp 1 → 400; đổi topic chính → đúng 1 dòng `isPrimary`; giảng viên khác
  → 404; học viên → 403; khoá `in_review` → 409; `become-instructor` gọi 2 lần → role chứa `instructor` đúng một
  lần, và **ngay sau đó cùng cookie** `GET /instructor/courses` → 200 (kiểm cache session được refresh); `GET /topics?q=`. Dọn: xoá course trước, user sau.
- **FE**: `tsc --noEmit`, lint; chạy app và đi lại flow bằng Chrome (tạo khoá, điền mục tiêu, lưu, checklist
  tick, rời trang khi chưa lưu, lỗi validation, khoá của người khác → 404).
