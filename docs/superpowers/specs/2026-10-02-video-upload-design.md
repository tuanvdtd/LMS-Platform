# Upload video bài giảng + video giới thiệu (đợt 3/4 flow giảng viên)

Ngày: 2026-10-02 · Trạng thái: đã duyệt thiết kế · Phạm vi: API NestJS + FE `it-course-platform`, chạy local

## 1. Bối cảnh & mục tiêu

Đợt 2 (spec `2026-10-01-curriculum-upload-design.md`, PR #6) đã có: khung chương trình, upload PDF + ảnh bìa lên R2
bằng presigned PUT (`StorageService`, `assets` module, `src/lib/upload.ts`), thư viện PDF trong ô chọn file.
Nút "Video · đợt 3" và "Video quảng cáo · sắp có (đợt 3)" đang mờ.

Đợt 3 làm:

- **Video bài giảng**: upload MP4 lên **AWS S3 private**, gắn làm nội dung bài giảng, chọn lại từ thư viện, giảng
  viên xem lại.
- **Video giới thiệu**: upload MP4 lên **R2 public**, ghi `courses.promoVideoUrl`, xem ngay trong form.
- Thời lượng video do **FE đo** (`video.duration`) gửi lên lúc ký upload, chép vào bài giảng → checklist "≥30 phút video" chạy thật (xem V5).

Ngoài phạm vi (đợt sau):

- **HLS / chọn độ phân giải** (MediaConvert + CloudFront). Đợt này phát MP4 gốc bằng HTTP Range.
- **Multipart upload**, tạm dừng / tiếp tục sau F5.
- **Học viên xem video** (API kiểm tra đã mua / `isPreview`) và **player tuỳ biến** (Media Chrome): làm cùng đợt
  nối trang học `learn/[courseSlug]` với dữ liệu thật (trang đó đang mock).
- **BE cho trang File Library** `/instructor/library` (đang chạy mock theo `types/library.ts`).
- Cron dọn asset bỏ dở.

## 2. Quyết định đã chốt

| # | Quyết định |
|---|---|
| V1 | Video bài giảng → **AWS S3** (bucket private, `ap-southeast-1`); video giới thiệu → **R2 public** (chung bucket ảnh bìa). Chạy local, không EC2 |
| V2 | **Không MediaConvert, không CloudFront** ở đợt này. Phát MP4 gốc qua presigned GET; trình duyệt tua bằng Range request. **Giữ file MP4 gốc** trên S3 (đầu vào cho HLS sau này); `assets.hlsKey` để `null` |
| V3 | Upload **presigned PUT một lần** (không multipart), dùng lại `putToStorage` (axios, `onUploadProgress`, `AbortSignal`). URL ký gắn `Content-Type` + `Content-Length`, hạn 10 phút |
| V4 | Giới hạn: bài giảng **≤ 1 GB**, giới thiệu **≤ 200 MB**; chỉ **`video/mp4`**; không giới hạn thời lượng |
| V5 | Thời lượng **FE đo** bằng `video.duration` (làm tròn giây) ở `checkVideo`, gửi `durationSec` trong `POST /uploads` (zod `0..24 giờ`), BE lưu luôn vào asset. BE ở `complete` chỉ kiểm cỡ khớp + đúng cấu trúc MP4 (`mp4Duration` ≠ `null`), **không đo / không ghi đè** thời lượng. Lý do: MP4 phân mảnh (video stock, OBS "Fragmented MP4") có `mvhd` duration = 0 → BE đo ra 0. Rủi ro chấp nhận (sếp đã chốt): client có thể khai sai thời lượng |
| V6 | **Không chặn file thiếu faststart** (`moov` sau `mdat`, mặc định của OBS): trình duyệt tự Range tới cuối file đọc `moov` |
| V7 | Video bài giảng **vào thư viện** (tab Thư viện của ô chọn, lọc theo `kind`), dùng lại cho bài khác. Video giới thiệu **không vào `assets`** (như ảnh bìa, K3 đợt 2) |
| V8 | Giảng viên xem lại bằng `<video controls>` gốc trong `Dialog`. Player tuỳ biến để đợt trang học |
| V9 | Một module `assets` + một `StorageService` (thêm bucket `video` dùng client AWS riêng), không tách module video |
| V10 | Vẫn **không cron dọn** (`ponytail:` cập nhật lý do): PUT lỗi thì không có object; video bị thay vẫn nằm trong thư viện |

## 3. Data model

**Không migration.** Dùng cột có sẵn:

- `assets`: `kind = video`, `mimeType = 'video/mp4'`, `sizeBytes`, `storageKey` (`videos/{ownerId}/{uuid}.mp4`),
  `status` (`uploading` → `ready` | `failed`), **`durationSec`** (client gửi, ghi lúc `POST /uploads`), `hlsKey` = `null`.
- `curriculum_items`: `lectureKind = video`, `videoAssetId`, **`durationSec`** (chép từ asset lúc gắn).
  `chk_item_payload` đã cho phép `video` + `videoAssetId`.
- `courses.promoVideoUrl`: chuỗi URL R2 public.

Sửa comment `schema.prisma`: `sizeBytes // video ≤4GB` → `video ≤1GB`.

## 4. API

Mọi route dưới `/api`, `@Roles('instructor')`, `ZodValidationPipe`.

### 4.1 `StorageService` (`src/infra/storage.service.ts`)

- `Bucket = 'public' | 'private' | 'video'`. `video` dùng `S3Client` thứ hai: `region = AWS_REGION`, credentials
  `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, `requestChecksumCalculation` + `responseChecksumValidation:
  'WHEN_REQUIRED'` như client R2. Chọn client theo bucket bằng một hàm nội bộ.
- `presignGet(bucket, key, ttlSec)`: thêm tham số `bucket` (gọi cũ truyền `'private'`).
- `read(bucket, key, range?)`: `range = { offset, length }` → `Range: bytes=offset-(offset+length-1)`. Gọi cũ
  `read(b, k, 5)` đổi sang `{ offset: 0, length: 5 }`.
- Env mới, **bắt buộc** (thiếu → app không khởi động): `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
  `S3_VIDEO_BUCKET`. Thêm vào `.env.example`.
- Lỗi S3 → `Sentry.captureException` + 502 như R2. Câu lỗi "R2 trả body rỗng" → "Lưu trữ trả body rỗng".

### 4.2 Hàm kiểm file (`src/assets/file-check.ts`)

```ts
export const VIDEO_MAX_BYTES = 1024 ** 3;
export const PROMO_MAX_BYTES = 200 * 1024 ** 2;
type ReadAt = (offset: number, length: number) => Promise<Buffer>;
export async function mp4Duration(readAt: ReadAt, size: number): Promise<number | null>
```

- Đọc header box `min(16, size - offset)` byte tại `offset` (bắt đầu 0; box cuối có thể chỉ 8 byte, vd `free`):
  `size32` + `type`; `size32 = 1` → `largesize` 64-bit ở byte 8–15 (`largesize < 16` → `null`); `size32 = 0` → box
  tới cuối file. Box đầu tiên phải là `ftyp`, không thì `null`.
- Gặp `moov`: đọc tối đa 64 KB đầu nội dung `moov`, tìm box con `mvhd`. Offset tính **từ đầu payload của `mvhd`**
  (ngay sau 8 byte size + type; byte 0 là `version`, 1–3 là `flags`). Version 0: `timescale` u32 @12, `duration`
  u32 @16; version 1: `timescale` u32 @20, `duration` u64 @24. Trả `Math.round(duration / timescale)`;
  `timescale = 0`, thiếu `mvhd`, `version > 1` hoặc **quá 24 giờ** (chặn số khổng lồ làm tràn cột `Int`) → `null`. MP4 phân mảnh (fMP4) có `duration = 0` → trả `0`, coi là
  MP4 hợp lệ (fMP4 phổ biến: video stock, OBS "Fragmented MP4" — vì vậy thời lượng lấy từ FE, xem V5).
- Box khác (`free`, `mdat`, `uuid`…) → nhảy `offset += boxSize`.
- Dừng và trả `null` khi: quá **20 box**, box size < 8, vượt `size` của file, hết file mà chưa gặp `moov`.
- Hàm thuần nhận `readAt` → unit test bằng buffer tự dựng, không cần S3.
- Dùng làm **kiểm cấu trúc MP4** (`null` = không hợp lệ); giá trị thời lượng trả về không dùng (V5).

### 4.3 Upload & thư viện — `/instructor/assets`

| Route | Body / query | Hành vi |
|---|---|---|
| `POST /uploads` | thêm 2 nhánh vào `discriminatedUnion`: `{ kind: 'video', fileName, mimeType: 'video/mp4', sizeBytes, durationSec }`, `{ kind: 'promo', fileName, mimeType: 'video/mp4', sizeBytes }` | **video**: ≤ `VIDEO_MAX_BYTES` ("Video tối đa 1 GB"); `durationSec` int bắt buộc, `0..24 giờ` ("Video tối đa 24 giờ"); tạo `Asset(kind video, status uploading, durationSec)`, key `videos/{ownerId}/{uuid}.mp4` trên bucket `video`. **promo**: ≤ `PROMO_MAX_BYTES` ("Video giới thiệu tối đa 200 MB"); không tạo bản ghi, key `promos/{ownerId}/{uuid}.mp4` trên `public`. MIME khác → "Chỉ nhận video MP4". Trả như cũ `{ assetId, key, uploadUrl, headers }` |
| `POST /:id/complete` | — | Nhận asset `kind ∈ {document, video}`, `status = uploading`, của mình. **video**: `head('video')` → không có object "Chưa tải file lên"; lệch cỡ "Kích thước file không khớp lúc khai báo"; `mp4Duration` → `null` "File không phải video MP4 hợp lệ". Lỗi → xoá object, `failed`, 400. Đạt → `ready` (không ghi `durationSec`, đã có từ client — V5). Trả `LibraryAsset` (có `kind`, `durationSec`) |
| `GET /` | `?q&kind=document\|video` (mặc định `document`) | Như cũ, lọc thêm `kind`; select thêm `kind`, `durationSec` |
| `GET /:id/url` | — | Asset `ready` của mình, `document` hoặc `video`. Video: `presignGet('video', key, 3600)`; PDF giữ 300s trên `private` |

Comment `assets.schemas.ts` "kind lạ (vd 'video' trước đợt 3) → 400" → bỏ phần "vd 'video'".

### 4.4 Video giới thiệu — `/instructor/courses/:id`

Làm như `PUT /:id/thumbnail` có sẵn trong `instructor-courses`:

| Route | Body | Hành vi |
|---|---|---|
| `PUT /:id/promo-video` | `{ key }` | `assertEditable` (404 / 409 `COURSE_LOCKED`). Key phải bắt đầu `promos/{userId}/` và đuôi `.mp4`, không thì 400. `head('public')` → không có → 400; > `PROMO_MAX_BYTES` hoặc `mp4Duration` → `null` → **xoá object**, 400 ("Video giới thiệu tối đa 200 MB" / "File không phải video MP4 hợp lệ"). Đạt → `promoVideoUrl = publicUrl(key)`; object cũ (`keyOfPublicUrl`) chỉ xoá khi khác key mới **và không khoá nào khác dùng cùng URL** (đếm như `shared` của `setThumbnail`), lỗi xoá chỉ log. Trả `CourseDetail` |
| `DELETE /:id/promo-video` | — | `assertEditable`; `promoVideoUrl = null`, xoá object cũ với cùng điều kiện `shared`. Trả `CourseDetail` |

### 4.5 Curriculum

- `usableDocument(tx, userId, assetId)` → `usableAsset(tx, userId, assetId, kinds: AssetKind[])`: asset của mình,
  `ready`, `kind ∈ kinds` (khác → 400 như cũ); select thêm `kind`, `durationSec`.
  - `setContent` gọi với `['document', 'video']`, một câu `update`:
    - document: như cũ.
    - video: `{ ...NO_CONTENT, lectureKind: 'video', videoAssetId, durationSec: asset.durationSec ?? 0, isDownloadable: false, isPublished: true }` (video không cho tải xuống).
  - `addResource` gọi với `['document']`: tài nguyên đính kèm vẫn chỉ PDF.
- Cây curriculum: select thêm `videoAsset { id, fileName, sizeBytes, durationSec }`; output thêm key **`video`**
  (cùng kiểu đặt tên với `document`) = `videoAsset && toVideoRef(videoAsset)`, trong đó `toVideoRef` = `toRef` +
  `durationSec`. Bỏ `videoAsset` khỏi `...item` như đang làm với `documentAsset` (BigInt `sizeBytes` làm hỏng JSON).
- Checklist đã cộng `durationSec` của item `lectureKind = video` (`curriculum.service.ts` dòng ~236), không sửa.

## 5. FE

### 5.1 `src/lib/upload.ts`, `src/lib/api/assets.ts`, types

- `putToStorage(file, kind: 'document' | 'thumbnail' | 'video' | 'promo', opts)`; thêm:
  - `uploadVideo(file, durationSec, opts): Promise<LibraryAsset>`: ký upload kèm `durationSec` → PUT → `throwIfAborted` → `completeUpload`.
    `putToStorage` nhận thêm `extra?: { durationSec?: number }` trộn vào payload.
  - `uploadPromo(file, opts): Promise<string>`: trả `key`.
  - `checkVideo(file, maxBytes, maxLabel): Promise<{ problem: string | null; durationSec: number }>`: `type !== 'video/mp4'` → "Chỉ nhận video MP4";
    quá cỡ → "Video tối đa {maxLabel}"; tạo `<video preload="metadata">` từ `URL.createObjectURL`, chờ
    `loadedmetadata` tối đa 10 giây; `error` hoặc hết giờ → "Trình duyệt không phát được file này. Hãy xuất lại
    MP4 (H.264)". Luôn `revokeObjectURL`. Đạt → `durationSec = Math.round(video.duration)` (không hữu hạn → 0), đọc
    trước khi dọn (`video.load()` reset); lỗi → `durationSec: 0`.
- `lib/api/assets.ts`: `CreateUploadPayload.kind` thêm `'video' | 'promo'`, thêm `durationSec?: number`; `listLibrary(q, kind, signal)`;
  `setPromoVideo(courseId, key)`, `removePromoVideo(courseId)`.
- `types/curriculum.ts`: `VIDEO_MAX_BYTES`, `PROMO_MAX_BYTES` (khớp BE), `formatDuration(sec)` → `m:ss` / `h:mm:ss`;
  `LibraryAsset` thêm `kind`, `durationSec: number | null`; `CurriculumItem` thêm
  `video: (AssetRef & { durationSec: number | null }) | null`.
- `uploadErrorMessage` giữ nguyên.

### 5.2 Panel bài giảng (`lecture-detail-panel.tsx`, `content-picker.tsx`)

Bố cục giữ khuôn PDF hiện có.

- Chưa có nội dung: nút "Video · đợt 3" (mờ) → nút **Video** (icon `Video`, `variant="outline" size="sm"`), mở
  `ContentPicker kind="video"`.
- `ContentPicker` nhận `kind: 'document' | 'video'`. Theo `kind`: `accept`, câu ô kéo thả ("Chọn file MP4 hoặc kéo
  thả vào đây" / "Tối đa 1 GB"), hàm kiểm (`checkVideo` hoặc kiểm PDF cũ), hàm upload, `listLibrary(q, kind)`.
  Giữ nguyên UI tiến trình, Huỷ, Thử lại, tab, kéo thả.
- Trạng thái trong tab Tải lên (video), thay nhau tại chỗ ô kéo thả:
  1. Đang kiểm file: "Đang kiểm tra file…" (chữ `text-sm text-muted-foreground`, icon `Loader2` xoay).
  2. Đang tải: `Progress` + `%` + nút Huỷ (như PDF).
  3. Đã tải 100%, chờ `complete`: "Đang xử lý video…" + `Loader2`, không nút Huỷ.
  4. Lỗi: câu lỗi `role="alert"` + "Thử lại" chỉ khi không phải 400 (như PDF); lỗi `checkVideo` không có Thử lại.
- Tab Thư viện (video): mỗi dòng `tên file` + `{formatDuration} · {formatBytes} · {ngày}`.
- Bài đã có video: một dòng như dòng PDF (`rounded-lg border bg-background px-3 py-2 text-sm`): icon `Video`,
  tên file `truncate`, `{formatDuration} · {formatBytes}` (`text-xs text-muted-foreground`), nút **Xem / Thay /
  Gỡ** (`ghost sm`, icon `Eye`, `RefreshCw`, `X`). **Thay** mở `ContentPicker` cùng loại với nội dung hiện tại
  (video → `kind="video"`, PDF → `kind="document"`); muốn đổi video ↔ PDF thì Gỡ rồi chọn nút loại kia. Gỡ có `confirm`: "Gỡ video khỏi bài giảng? Bài giảng sẽ thành
  chưa xuất bản; file vẫn còn trong thư viện."
- **Xem** → `Dialog` `max-w-3xl`, tiêu đề = tên file, thân `<video controls autoPlay className="aspect-video w-full
  rounded-lg bg-black">` với URL từ `getAssetUrl`. Đang lấy URL: khung `aspect-video` `Skeleton`; lỗi: "Không mở
  được video. Đóng rồi mở lại để thử." (dialog không có nút thử lại).
- Checkbox "Cho tải xuống file PDF" chỉ hiện khi `lectureKind = 'document'`.
- Gợi ý "Tải video có ở đợt 3" (`curriculum-editor.tsx:317`) → bỏ phần đợt 3.

### 5.3 Video giới thiệu (`basics-form.tsx` + mới `promo-video-upload.tsx`)

Thay `MediaPlaceholder` + "Tải video lên · sắp có (đợt 3)" bằng `PromoVideoUpload`, cùng khuôn `ThumbnailUpload`
(`grid gap-4 sm:grid-cols-2`, `id="promo-video"`):

- Cột trái: có video → `<video controls preload="metadata" src={promoVideoUrl} className="aspect-video w-full
  rounded-lg border bg-black">`; chưa có → khung nét đứt `aspect-video` như placeholder ảnh bìa, icon `Video`, chữ
  "MP4 · tối đa 200 MB".
- Cột phải: "Video quảng cáo (không bắt buộc)", mô tả "1–2 phút giới thiệu khoá. Học viên xem video này dễ đăng
  ký hơn.", nút **Tải video lên** / **Thay video** (`outline sm`, icon `Upload`) và **Gỡ** (`ghost sm`, chỉ khi
  có video, `AlertDialog` xác nhận).
- Trạng thái như §5.2 (kiểm file, `Progress` + `%` + Huỷ, "Đang xử lý video…" khi chờ `PUT promo-video`, lỗi +
  Thử lại). Ghi ngay khi xong, không đi theo nút Lưu, không làm form `dirty`. 409 → `patchCourse({ status:
  'in_review' })` như ảnh bìa.

Phong cách flat theo dự án, dùng token `globals.css` sẵn có, không thêm màu. Không làm dark mode riêng.

## 6. Xử lý lỗi

| Tình huống | Hiển thị | Thử lại |
|---|---|---|
| Sai định dạng, quá 1 GB / 200 MB | Báo ngay, không gọi API | Không |
| Trình duyệt không đọc được metadata (HEVC, ProRes, file hỏng) | "Trình duyệt không phát được file này. Hãy xuất lại MP4 (H.264)" | Không |
| PUT rớt mạng, 502 | "Tải lên thất bại, thử lại" / "Lưu trữ đang lỗi, thử lại" | Có |
| `complete` / `PUT promo-video` → 400 | Câu lỗi BE | Không |
| 409 khoá `in_review` | Khoá UI như ảnh bìa | Không |
| Người dùng Huỷ / rời panel | Không hiện gì (`uploadErrorMessage` → `null`); không gọi `complete` | — |

- URL ký hạn 10 phút: S3 chỉ kiểm hạn lúc **bắt đầu** request, upload 1 GB chậm không bị cắt.
- Huỷ giữa chừng: asset `uploading`, không có object → không tốn tiền (V10).
- Gỡ video khỏi bài → `isPublished = false`, video còn trong thư viện. Asset đang gắn không xoá được (FK Restrict).

## 7. Kiểm thử

- **Unit `file-check.spec.ts`** — `mp4Duration` với buffer tự dựng:
  - `ftyp` + `moov(mvhd v0)` + `mdat` → đúng giây;
  - `ftyp` + `free` + `mdat` + `moov` (kiểu OBS) → đúng giây;
  - `mvhd` version 1 (64-bit); `mdat` dùng `largesize` (`size32 = 1`); box `size32 = 0` ở cuối;
  - thiếu `ftyp`, thiếu `mvhd`, `timescale = 0`, file cắt cụt, box size < 8, > 20 box → `null`.
- **E2E** (`test/*.e2e-spec.ts`, `FakeStorage` thêm bucket `video`, `read` có `offset`, `presignGet` nhận `bucket` (theo chữ ký mới §4.1), dựng MP4 giả bằng helper
  dùng chung với unit test):
  - `POST /uploads` video: > 1 GB → 400, MIME khác → 400, `durationSec` > 24 giờ → 400, thiếu `durationSec` → 400; promo > 200 MB → 400, không tạo asset;
  - `complete` video: đúng → `ready` + `durationSec` **client gửi** (file 10 giây, khai 754 → 754: BE không tự đo); lệch cỡ / không phải MP4 → 400, `failed`, object bị xoá;
  - `GET /assets?kind=video` chỉ trả video; mặc định chỉ PDF;
  - `setContent` video → `lectureKind = video`, `durationSec` = asset; đủ 5 bài × ≥ 6 phút → checklist hết dòng phút video;
  - promo: key của user khác → 400; không phải MP4 → 400; thay video → object cũ bị xoá; `DELETE` → `null`;
    khoá `in_review` → 409;
  - `GET /:id/url` video của mình → URL; của người khác → 404.
- **Kiểm S3 thật** (thủ công): thêm `scripts/s3-check.ts` cùng kiểu `r2-check.ts`, object thử nằm dưới `videos/`
  (khớp IAM) — PUT qua URL ký → HEAD → GET `Range: bytes=0-15` → DELETE, và **HEAD một key không tồn tại phải ra
  404** (sai quyền `ListBucket` thì S3 trả 403 → `complete` thành 502).
- **FE**: `tsc --noEmit`, lint; chạy app bằng Chrome: upload video 100–500 MB có %, Huỷ giữa chừng, file `.mov` /
  HEVC bị chặn trước khi tải, chọn từ thư viện, Xem trong dialog và tua, video OBS (`moov` ở cuối) phát được, video
  giới thiệu tải / thay / gỡ, checklist cộng phút; thử phát trên Safari.

## 8. Ghi chú cho đợt sau

- **HLS**: `complete` gọi MediaConvert `CreateJob` → `processing`; polling `GetJob` (không webhook vì chạy local) →
  ghi `hlsKey`; script chạy lại cho asset `hlsKey = null`. Phát qua CloudFront + signed URL wildcard (`hls.js`
  `xhrSetup` gắn chữ ký), không signed cookie (localhost khác domain).
- **Trang học**: API học viên kiểm `Enrollment` hoặc `isPreview` → presigned GET; player Media Chrome
  (`<video>` → `<hls-video>` + `<media-rendition-menu>` khi có HLS).
- **Multipart** khi cần file > 1 GB hoặc tiếp tục upload: `@uppy/aws-s3`, lifecycle huỷ multipart dở sau 1 ngày,
  CORS `ExposeHeaders: ETag`.

## 9. Chuẩn bị (sếp, trước khi code)

1. AWS: tạo bucket S3 `ap-southeast-1`, **bật Block Public Access**.
2. CORS bucket:
   ```json
   [{ "AllowedOrigins": ["http://localhost:3000"], "AllowedMethods": ["PUT", "GET", "HEAD"],
      "AllowedHeaders": ["content-type"], "MaxAgeSeconds": 3600 }]
   ```
3. IAM user, tạo access key, policy:
   - `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` trên `arn:aws:s3:::<bucket>/videos/*`;
   - `s3:ListBucket` trên `arn:aws:s3:::<bucket>`, **không điều kiện** (HEAD không gửi `prefix` nên điều kiện
     `s3:prefix` không khớp; bucket chỉ chứa video nên quyền rộng không mất gì). Thiếu quyền này thì S3 trả
     **403** thay vì 404 khi HEAD key chưa có, `StorageService.head` (chỉ coi 404 là "chưa có") sẽ báo 502.
4. Điền `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_VIDEO_BUCKET` vào `back-end/.env`.
5. Bật AWS Budget cảnh báo $50.
6. R2 public: không cần thêm (CORS PUT từ localhost đã có cho ảnh bìa).
