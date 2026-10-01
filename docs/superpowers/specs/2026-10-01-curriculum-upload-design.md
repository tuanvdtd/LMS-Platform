# Khung chương trình + Upload PDF/ảnh lên R2 (đợt 2/4 flow giảng viên)

Ngày: 2026-10-01 · Trạng thái: đã duyệt thiết kế, đã review spec · Phạm vi: API NestJS + FE `it-course-platform`

## 1. Bối cảnh & mục tiêu

Đợt 1 (spec `2026-09-30-course-create-basics-design.md`, PR #5 + commit `59926a5`) đã có: tạo khoá, trang quản
lý với sidebar checklist, Học viên mục tiêu, Trang tổng quan (trừ ảnh/video). Schema curriculum có sẵn từ PR #4
(spec `2026-09-30-udemy-curriculum-schema-design.md`): `sections`, `curriculum_items`, `assets`,
`lecture_resources`. Repo chưa có S3/R2 SDK, chưa có thư viện kéo thả.

Đợt 2 làm:

- Trang **Khung chương trình**: thêm/sửa/xoá phần và mục (4 loại), kéo thả phần, mục, chuyển mục sang phần khác.
- Bài giảng: gắn **PDF** làm nội dung, mô tả, cho xem thử, cho tải xuống, **tài nguyên PDF** đính kèm.
- Upload PDF và **ảnh bìa** lên Cloudflare R2, thư viện file của giảng viên.

Ngoài phạm vi: video + S3 + HLS (đợt 3); trình soạn quiz / bài thi thử / coding, định giá, coupon, gửi duyệt
(đợt 4); học viên xem PDF; cron dọn file bỏ dở.

Bản phác thảo UI: canvas "Tạo khoá học — Giảng viên" (https://claude.ai/artifact/FJE6VP4eju6EBSJcgrwaiA), trang
Khung chương trình. Đợt 2 giữ bố cục đó, có các thay đổi ở §5.1.

## 2. Quyết định đã chốt

| # | Quyết định |
|---|---|
| K1 | Lưu trữ bằng **`@aws-sdk/client-s3`**: R2 cho ảnh bìa + PDF (đợt 2); video lên **AWS S3** bằng presigned URL (đợt 3, đợt 2 chỉ khai cấu hình tuỳ chọn). Bucket của asset suy ra từ `kind` (`document` → R2 private, `video` → S3), không thêm cột |
| K2 | **Hai bucket R2**: `public` (ảnh bìa, có domain công khai) và `private` (PDF, xem bằng presigned GET) |
| K3 | Ảnh bìa **không vào `assets`**: upload lên R2 public, ghi URL vào `courses.thumbnailUrl`. Không migration |
| K4 | Upload **trình duyệt → R2 bằng presigned PUT**. BE kiểm ở 2 lúc: ký URL (loại, dung lượng, key do BE sinh, chữ ký gắn `Content-Type` + `Content-Length`, hạn 10 phút) và `complete` (`HeadObject` + magic bytes, ảnh thêm kích thước) |
| K5 | Trang Khung chương trình **ghi ngay từng thao tác** (ngoại lệ của C3 đợt 1): không có thanh Lưu/Huỷ. Riêng cụm chi tiết bài giảng (mô tả, xem thử, cho tải) có nút Lưu riêng |
| K6 | Tạo được **cả 4 loại mục** bằng tiêu đề; trình soạn quiz/coding mờ "Sắp có (đợt 4)" |
| K7 | Thư viện: **tab "Thư viện" trong ô chọn file** (PDF `ready` của mình, tìm theo tên). Không trang quản lý, không xoá file |
| K8 | Kéo thả bằng **`@dnd-kit/core` + `@dnd-kit/sortable`** (chuột, cảm ứng, bàn phím); mỗi lần thả gọi **một API `move`** |
| K9 | Bài giảng **tự xuất bản** khi gắn nội dung, tự huỷ khi gỡ. Quiz/coding luôn chưa xuất bản tới đợt 4 |
| K10 | Tài nguyên đính kèm: tối đa 10, theo thứ tự thêm, không kéo thả |
| K11 | **Không cron dọn** asset bỏ dở ở đợt này (`ponytail:` trong code); làm khi có video (đợt 3) |
| K12 | Mọi API sửa khung chương trình trả `{ sections, checklist }` (cả cây + checklist) |

## 3. Data model

**Không migration.** Dùng nguyên schema PR #4:

- `sections(courseId, title, description?, position)` — unique `(courseId, position)` DEFERRABLE.
- `curriculum_items(sectionId, courseId, type, title, position, isPublished, lectureKind?, videoAssetId?,
  documentAssetId?, description?, isPreview, isDownloadable, durationSec)` — unique `(sectionId, position)`
  DEFERRABLE; `chk_item_payload`: chưa có nội dung thì 3 cột nội dung NULL và `isPublished = false`; `document`
  thì chỉ có `documentAssetId`.
- `assets(ownerId, kind, fileName, mimeType, sizeBytes, storageKey unique, status, …)` — `chk_asset_pdf`: kind
  `document` bắt buộc `application/pdf`. FK từ item/resource là Restrict.
- `lecture_resources(itemId, assetId, title, position)` — unique `(itemId, position)` thường (không DEFERRABLE).
- `courses.thumbnailUrl` — chuỗi URL.

Không ghi `sections.description` từ UI ở đợt này (API nhận, UI chưa có ô).

## 4. API

Mọi route dưới `/api`, `@Roles('instructor')`, validate bằng `ZodValidationPipe` có sẵn.

### 4.1 Module

| Module | Việc |
|---|---|
| `src/infra/storage.service.ts` (mới, đăng ký trong `InfraModule` global như Prisma/Redis) | `StorageService`: **một** `S3Client` R2 (endpoint `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, region `auto`, `requestChecksumCalculation: 'WHEN_REQUIRED'` — mặc định SDK thêm `x-amz-checksum-crc32` vào URL ký mà trình duyệt không gửi), 2 bucket `public`/`private` theo tên. Hàm: `presignPut(bucket, key, contentType, size)`, `presignGet(key, ttlSec)`, `head(bucket, key)` (404 → `null`), `read(bucket, key, bytes?)` (GET có `Range` khi có `bytes`), `delete(bucket, key)`, `publicUrl(key)`, `keyOfPublicUrl(url)`. Lỗi R2 → `Sentry.captureException` + 502. Không viết client S3 video ở đợt này |
| `src/assets/` (mới) | Ký URL upload, `complete`, thư viện, URL xem PDF, kiểm magic bytes (`file-check.ts`, hàm thuần) |
| `src/curriculum/` (mới) | CRUD phần/mục, `move`, chi tiết bài giảng, nội dung, tài nguyên. `reorder.ts` (hàm thuần) |
| `instructor-courses` (sửa) | Module thêm `exports: [InstructorCoursesService]`. Service: `findOwned` đổi thành public `assertOwned(courseId, userId)` (404 nếu không phải chủ khoá), thêm `assertEditable(courseId, userId)` (như trên + 409 `COURSE_LOCKED` khi `in_review`; `update()` chuyển sang dùng hàm này), `checklistOf` đổi thành public `checklistFor(course, stats)`; export `CourseRow`, `LectureStats`, `TX_OPTIONS`. Thêm `PUT /:id/thumbnail` |

Biến môi trường mới (`requireEnv`, thêm vào `.env.example`): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET`, `R2_PUBLIC_URL`, `R2_PRIVATE_BUCKET`. Thiếu → app không khởi động.

Dependency BE mới: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `image-size@2`.

Checklist của response tính **không thêm query**: dòng khoá đã đọc ở `assertEditable` + số bài giảng đã xuất bản /
giây video đếm từ cây vừa đọc (`checklistFor(course, stats)` public hoá từ `checklistOf`).

### 4.2 Khung chương trình — `/instructor/courses/:courseId/...`

| Endpoint | Body | Việc |
|---|---|---|
| `GET /curriculum` | — | Cây `sections[]` theo `position`, mỗi phần `items[]` theo `position` |
| `POST /sections` | `{ title: 1–80, description?: ≤200 }` | Thêm phần cuối |
| `PATCH /sections/:sid` | `{ title?, description? }` | Sửa phần |
| `DELETE /sections/:sid` | — | Xoá phần + mục bên trong (cascade) |
| `POST /sections/:sid/move` | `{ index: int ≥0 }` | Đổi chỗ phần |
| `POST /sections/:sid/items` | `{ type: CurriculumItemType, title: 1–80 }` | Thêm mục cuối phần, `isPublished = false` |
| `PATCH /items/:iid` | `{ title?, description?: ≤5000 \| null, isPreview?, isDownloadable? }` | 3 trường sau chỉ cho `lecture`, loại khác gửi → 400 |
| `DELETE /items/:iid` | — | Xoá mục (resource cascade) |
| `POST /items/:iid/move` | `{ sectionId: uuid, index: int ≥0 }` | Đổi chỗ trong phần hoặc sang phần khác **cùng khoá** |
| `PUT /items/:iid/content` | `{ assetId: uuid }` | Chỉ `lecture`. Asset của mình, `kind = document`, `status = ready`. Một câu `update`: `lectureKind = document`, `documentAssetId`, `videoAssetId = null`, `isPublished = true` |
| `DELETE /items/:iid/content` | — | 3 cột nội dung → null, `isPublished = false` |
| `POST /items/:iid/resources` | `{ assetId: uuid, title?: 1–80 }` | Chỉ `lecture`, asset như trên, tối đa 10. `title` mặc định `fileName` (cắt 80), `position = max + 1` |
| `DELETE /resources/:rid` | — | Xoá tài nguyên (để hở `position`) |

Mọi endpoint trừ `GET` bắt đầu bằng `assertEditable`; `GET` dùng `assertOwned`. Phần/mục/tài nguyên phải thuộc
`courseId` trong URL, không thì 404. id sai định dạng uuid → 404 (như `findOwned`).

**Trả về** (GET và mọi mutation):

```ts
type CurriculumResponse = {
  sections: {
    id: string; title: string; description: string | null; position: number;
    items: {
      id: string; type: CurriculumItemType; title: string; position: number; isPublished: boolean;
      // chỉ có nghĩa với lecture:
      lectureKind: 'video' | 'document' | null;
      description: string | null; isPreview: boolean; isDownloadable: boolean; durationSec: number;
      document: { id: string; fileName: string; sizeBytes: number } | null;
      resources: { id: string; title: string; asset: { id: string; fileName: string; sizeBytes: number } }[];
    }[];
  }[];
  checklist: ChecklistItem[]; // buildChecklist có sẵn
};
```

`sizeBytes` (BigInt) đổi sang `number` khi trả. Số "Bài giảng 3" FE tự đếm theo `type`.

**`move`**: trong một `$transaction` (`TX_OPTIONS` với `timeout` 30s — chuyển mục sang phần khác ~7 query trên DB dev chậm): đọc id của danh sách đích theo `position`, gọi
`reorder(ids, movedId, index)` (bỏ `movedId` nếu có rồi chèn tại `min(index, len)`), ghi `position = 0..n-1`
(và `sectionId` mới cho mục chuyển phần). Chuyển phần thì đánh số lại cả phần nguồn. Unique DEFERRABLE nên trùng
tạm trong transaction không lỗi.

**Khoá dòng**: mọi mutation chạy trong transaction bắt đầu bằng `SELECT 1 FROM courses WHERE id = … FOR UPDATE`
(một khoá cho cả khoá học, không deadlock), rồi mới tính `position = max + 1` hoặc đánh số lại. Đánh số lại bằng
**một câu** `UPDATE … FROM unnest($ids::uuid[]) WITH ORDINALITY` (DB dev ~1-2s/query, update từng dòng sẽ quá
`TX_OPTIONS.timeout`). Lưu ý: `createOnce` đợt 1 đánh `position` từ 1, `move` đánh lại từ 0 — test chỉ
kiểm **thứ tự**, không giả định số bắt đầu.

### 4.3 Upload & thư viện — `/instructor/assets`

| Endpoint | Body | Việc |
|---|---|---|
| `POST /uploads` | `{ kind: 'document' \| 'thumbnail', fileName: 1–255, mimeType, sizeBytes: int >0 }` | **document**: `mimeType = application/pdf`, ≤1 GB; tạo `Asset(kind document, status uploading)`, key `documents/{ownerId}/{uuid}.pdf` trên `private`. **thumbnail**: `image/jpeg \| image/png \| image/webp`, ≤5 MB; không tạo bản ghi, key `thumbnails/{ownerId}/{uuid}.{jpg\|png\|webp}` trên `public`. Trả `{ assetId: string \| null, key, uploadUrl, headers: { 'Content-Type' } }`, URL hạn 600s |
| `POST /:assetId/complete` | — | Asset của mình và đang `uploading`, không thì 404. `head`: `ContentLength = sizeBytes`; `read(5)` = `%PDF-`. Không kiểm `ContentType` của object: đã bị ký cố định lúc PUT, magic bytes kiểm nội dung thật. Đạt → `ready`, trả asset. Sai → `delete` object, `failed`, 400 kèm lý do |
| `GET /` | `?q=` (≤100) | PDF `ready` của mình, `fileName ILIKE %q%`, mới nhất trước, tối đa 50. Trả `{ id, fileName, sizeBytes, createdAt }[]` |
| `GET /:assetId/url` | — | Chủ asset, `ready` → `{ url }` presigned GET 300s, `ResponseContentDisposition: inline` |

**Ảnh bìa**: `PUT /instructor/courses/:id/thumbnail` `{ key }` (`assertEditable`):
key phải khớp `^thumbnails/{userId}/[0-9a-f-]{36}\.(jpg|png|webp)$` (400 nếu không); `head` (tồn tại, ≤5 MB); `read` **cả object** (≤5 MB, tránh JPEG có EXIF lớn đẩy SOF ra sau) → `imageInfo`: đúng chữ ký PNG/JPEG/WebP và ≥750×422. Đạt → ghi
`thumbnailUrl = R2_PUBLIC_URL/key`, xoá object ảnh cũ nếu URL cũ có tiền tố `R2_PUBLIC_URL` (lỗi xoá chỉ log,
không làm hỏng request). Sai → xoá object mới, 400. Trả `CourseDetail` như `PATCH` (FE `setCourse`).

`// ponytail:` ảnh upload xong mà không gọi `PUT /thumbnail` (đóng tab) và asset kẹt `uploading/failed` không
được dọn; thêm cron khi làm video (đợt 3).

**CORS R2** (sếp cấu hình): cả 2 bucket cho `PUT, GET` từ `FE_URL` (localhost + `https://learn.tuandt.me`),
header `Content-Type`.

### 4.4 Hàm kiểm file — `src/assets/file-check.ts`

- `isPdf(buf)`: 5 byte đầu là `%PDF-`.
- `imageInfo(buf)`: dùng `image-size` → `{ type: 'png' | 'jpg' | 'webp', width, height } | null`; loại khác,
  không đọc được hoặc `image-size` ném lỗi → `null`. Kiểm `type` khớp đuôi key.

## 5. FE

### 5.1 Trang `/instructor/courses/[id]/manage/curriculum`

Mới: `(manage)/courses/[id]/manage/curriculum/page.tsx`. `ChecklistSidebar` bỏ nhãn "Sắp có" ở mục Khung chương
trình và trỏ tới trang này: kiểu `Entry.page` thêm `'curriculum'`; trang có phần tử `id="curriculum"` (khối thanh
tiến độ) để `flashAnchor` nhảy tới.

So với bản phác thảo:

1. **Tay nắm kéo** ở đầu mỗi phần và mỗi mục: `<button aria-label="Kéo để đổi chỗ">` làm `listeners` của
   `useSortable` (chuột, cảm ứng, bàn phím Space + mũi tên, có announcements tiếng Việt).
2. **Bỏ thanh "Lưu / Huỷ thay đổi"**; góc trên hiện "Đang lưu…" khi có request, "Đã lưu" khi xong.
3. **Bấm bài giảng mở `LectureDetailPanel`** ngay dưới dòng:
   - Mô tả (textarea), "Cho xem thử", "Cho tải xuống", nút **Lưu** riêng (disabled khi `!isDirty || isSubmitting`).
   - Nội dung: chưa có → 2 nút "Tài liệu PDF" và "Video · đợt 3" (mờ); có → tên PDF, "Xem" (mở tab mới
     bằng `GET /assets/:id/url`), "Thay", "Gỡ".
   - Tài nguyên: danh sách tên + xoá, nút "+ Tài nguyên" (tắt khi đủ 10).
4. **`ContentPicker`** (panel dưới mục): tab *Tải lên* (chọn/kéo file vào, thanh %, nút Huỷ) và *Thư viện* (tìm
   debounce 300ms, danh sách PDF, bấm để chọn).

Quiz / bài thi thử / coding: sửa tên, xoá, kéo; nút "Soạn câu hỏi" / "Mở trình soạn" disabled "Sắp có (đợt 4)".
Thêm mục: chọn loại + tiêu đề, Enter thêm, Esc huỷ (như bản phác thảo). Xoá phần còn mục / xoá bài giảng có nội
dung → `AlertDialog` xác nhận.

Component dưới `manage/_components/curriculum/`: `CurriculumEditor` (`DndContext`, state `sections`),
`SectionCard`, `ItemRow`, `AddItemForm`/`AddSectionForm`, `InlineTitle`, `DragHandle`, `LectureDetailPanel` (gồm danh sách
tài nguyên), `ContentPicker`.

### 5.2 Dữ liệu

- `src/lib/api/curriculum.ts` (các hàm §4.2), `src/lib/api/assets.ts` (§4.3 + `setThumbnail`), dùng axios `api`.
- `src/types/curriculum.ts`: kiểu `CurriculumResponse`, map nhãn loại mục.
- `src/lib/upload.ts`: `uploadFile(file, kind, { onProgress, signal })` → `POST /uploads` → **`axios.put`
  trần** (không dùng instance `api`: không gửi cookie/`baseURL` sang R2) với `headers` đã ký, `signal`,
  `onUploadProgress` → `document`: `POST /:assetId/complete`, trả asset; `thumbnail`: trả `key`.
- `CurriculumEditor`: `GET /curriculum` khi vào trang. Mỗi mutation → `setSections(res.sections)` +
  `setCourse({ ...course, checklist: res.checklist })` của `CourseProvider` để sidebar cập nhật.
- **Kéo thả**: `onDragEnd` → `arrayMove` (hoặc chuyển giữa 2 mảng) trong state ngay, gọi `move`; lỗi → đặt lại
  cây trước khi kéo, toast "Không đổi được thứ tự". Mục kéo được giữa các phần (một `SortableContext` mỗi phần,
  xử lý `onDragOver` để chuyển phần).
- **`InlineTitle`**: Enter/blur → `PATCH` nếu khác và không rỗng; rỗng hoặc Esc → trả tên cũ; lỗi → toast (qua
  `run`) + dòng "Chưa lưu được tên" dưới ô, giữ nội dung đang gõ (FE đã chặn rỗng/>80 nên 400 hiếm).
- **Chặn rời trang**: **chỉ mở 1 `LectureDetailPanel` một lúc** (mở/đóng panel khi panel đang dirty → `window.confirm`
  "Bỏ thay đổi chưa lưu…"; mục có panel đang dirty không kéo được). Panel đăng ký với `useDirtySync` có sẵn: dirty khi form có thay đổi chưa lưu **hoặc** đang upload;
  `save` = submit form, trả `false` nếu đang upload (chưa rời được); `discard` = `reset()` + `ctrl.abort()` upload
  đang chạy. Dùng lại `beforeunload` + `GuardedLink` có sẵn.
- Dependency FE mới: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

### 5.3 Ảnh bìa ở `basics`

Khung ảnh bìa bỏ "Sắp có (đợt 2)": nút "Tải ảnh lên" / "Thay ảnh". FE kiểm loại (jpg/png/webp), ≤5 MB,
`naturalWidth/Height` ≥750×422 (đọc qua `createImageBitmap`) → `uploadFile(file, 'thumbnail')` →
`setThumbnail(courseId, key)` → `setCourse(updated)`. Ghi ngay, **không** theo nút
Lưu của form `basics`, không làm form `dirty`. Video quảng cáo giữ "Sắp có (đợt 3)".

## 6. Xử lý lỗi

| Trường hợp | BE | FE |
|---|---|---|
| Chưa đăng nhập / không phải giảng viên | 401 / 403 (guard có sẵn) | như đợt 1 |
| Khoá/phần/mục/tài nguyên không phải của mình hoặc không thuộc khoá; asset không phải của mình ở route `/instructor/assets/*` | 404 | toast "Không tìm thấy", gọi lại `GET /curriculum` |
| Khoá `in_review` | 409 `COURSE_LOCKED` | banner như đợt 1; tắt nút sửa, tay nắm kéo, upload |
| Dữ liệu sai | 400 `errors[{path, message}]` | `InlineTitle`: lỗi dưới ô; panel: `setError` |
| `move` sang phần khoá khác | 404 | trả thứ tự cũ, toast |
| Gắn asset không hợp lệ vào mục/tài nguyên (người khác, chưa `ready`, không phải PDF) | 400 `path: ['assetId']` | toast "File không dùng được" |
| Quá 10 tài nguyên | 400 | nút "+ Tài nguyên" tắt khi đủ 10 |
| Khai báo upload sai loại/dung lượng | 400 ở `POST /uploads` | FE chặn trước khi gọi |
| PUT lên R2 lỗi / mất mạng | — | "Tải lên thất bại" + nút Thử lại |
| `complete` / `thumbnail` thấy file sai | xoá object, `failed`, 400 kèm lý do | hiện lý do trong ô upload |
| Huỷ upload | — | `ctrl.abort()`, không gọi `complete` |
| R2 lỗi | 502 (Sentry có sẵn) | toast "Lưu trữ đang lỗi, thử lại" |
| Thiếu biến môi trường R2 | app không khởi động (`requireEnv`) | — |
| Hai tab cùng sửa | thao tác sau thắng, không khoá lạc quan; thêm/move khoá dòng (§4.2) nên không trùng `position` | mỗi response là cây mới nhất |

## 7. Kiểm thử

- **BE unit**: `reorder.spec.ts` (lên đầu, xuống cuối, `index` vượt độ dài, giữ nguyên chỗ, chèn vào danh sách
  khác); `file-check.spec.ts` với buffer tự dựng trong `test/fixtures/files.ts` (header PDF, PNG, JPEG, WebP đủ để
  nhận dạng; file exe đổi đuôi); ca ảnh <750×422 kiểm ở e2e.
- **BE e2e** `test/curriculum.e2e-spec.ts` (một file cho assets + ảnh bìa + khung chương trình; đăng nhập theo `auth.e2e-spec.ts`, DB thật,
  `overrideProvider(StorageService)` bằng fake lưu object trong `Map`):
  - tạo/sửa/xoá phần và mục, response có cây + checklist;
  - `move` trong phần và sang phần khác → `position` 0..n đúng ở cả 2 phần; sang phần khoá khác → 404;
  - gắn PDF `ready` → `isPublished = true`; gỡ → `false`; đủ 5 bài giảng có PDF → checklist hết dòng "bài giảng";
  - gắn asset người khác / `uploading` / `kind video` → 400; `PATCH` `isPreview` cho quiz → 400; quá 10 tài nguyên → 400;
  - `complete` sai magic bytes → 400, `failed`, object bị xoá khỏi fake; đúng → `ready`;
  - thumbnail: key của user khác → 400, ảnh nhỏ → 400, thay ảnh → object cũ bị xoá, `thumbnailUrl` mới;
  - khoá `in_review` → 409; giảng viên khác → 404.
  - Dọn: course → asset → user.
- **Kiểm R2 thật** (thủ công): script `pnpm r2:check` = `node --experimental-strip-types scripts/r2-check.ts`
  (tạo mới `back-end/scripts/`, file tự đứng, chỉ import `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` đã có, không thêm dependency) PUT → HEAD →
  DELETE file 1 KB trên cả 2 bucket, fetch qua domain công khai, và PUT qua **URL ký** (đúng đường trình duyệt
  dùng: header `content-type`/`content-length` đã ký, không checksum) để kiểm env.
- **FE**: `tsc --noEmit`, lint; chạy app đi lại flow bằng Chrome: thêm phần/mục, sửa tên (Enter/Esc/blur), kéo thả
  chuột và bàn phím, upload PDF có %, huỷ giữa chừng, chọn từ thư viện, xem PDF, tài nguyên, ảnh bìa (kể cả ảnh
  quá nhỏ), checklist tick, khoá `in_review` không sửa được.

## 8. Ghi chú cho đợt sau

- Đợt 4 (gửi duyệt): `mutate` kiểm `in_review` **trước** transaction; khi có chuyển trạng thái thì đọc lại
  `status` sau `SELECT … FOR UPDATE` và trả 409 nếu đã `in_review`.

## 9. Chuẩn bị (sếp, trước khi code)

- Tạo 2 bucket R2 (`public` gắn domain công khai, `private`) + API token Object Read & Write cho 2 bucket.
- CORS 2 bucket như §4.3. Điền 6 biến môi trường §4.1 vào `back-end/.env`.
