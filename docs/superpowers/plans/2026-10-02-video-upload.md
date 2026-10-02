# Upload video bài giảng + video giới thiệu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đợt 3/4 flow giảng viên. Video bài giảng upload MP4 lên AWS S3 private, gắn vào bài giảng, chọn lại từ thư viện, giảng viên xem lại. Video giới thiệu upload lên R2 public, ghi `courses.promoVideoUrl`. Thời lượng lấy từ FE (`video.duration`, gửi kèm lúc ký upload) để checklist "≥30 phút video" chạy thật; BE kiểm cỡ khớp + cấu trúc MP4.

> Ghi chú: đổi trong lúc test tay — MP4 phân mảnh (fMP4) có `mvhd` duration = 0 nên BE không đo thời lượng nữa (spec V5).

**Architecture:** BE: `StorageService` có thêm bucket `video` chạy trên một `S3Client` AWS thứ hai. `presignGet` nhận thêm `bucket`, `read` đọc được theo khoảng `{ offset, length }`. `file-check.ts` có thêm hàm thuần `mp4Duration(readAt, size)`. Module `assets` có thêm `kind: 'video' | 'promo'`, `complete` kiểm tra cả video, thư viện lọc theo `kind`. `instructor-courses` có thêm `PUT/DELETE /:id/promo-video`, dùng chung cách xoá object cũ với ảnh bìa. `curriculum` có thêm `usableAsset(kinds)`, `setContent` nhận video, cây trả thêm key `video`. FE: dùng lại `putToStorage` qua `uploadVideo`/`uploadPromo`/`checkVideo`. `ContentPicker` có thêm prop `kind`. Panel bài giảng có thêm dòng video và dialog xem lại. Thêm component `PromoVideoUpload` vào form thông tin khoá học.

**Tech Stack:** NestJS 12, Prisma 6.19, zod 4, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` 3.x (đã có), vitest 4 + supertest; Next.js 16.3, React 19.2, shadcn `base-nova` (Base UI), axios, sonner, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-02-video-upload-design.md`

## Global Constraints

- **Không commit giữa các task, không push, không thêm Co-Authored-By.** Sếp chưa chọn chế độ commit cho task này, nên mặc định là hỏi trước mỗi commit. Plan gom **một** đề xuất commit ở Task 11 rồi chờ sếp duyệt. Không đưa `CLAUDE.md` vào `git add`.
- **Điều kiện trước khi code** (spec §9, sếp tự làm): S3 bucket, CORS, IAM (có `s3:ListBucket` **không điều kiện**), 4 biến `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_VIDEO_BUCKET` trong `back-end/.env`. Thiếu biến thì **mọi** e2e và `pnpm dev` của BE fail ở `requireEnv`, vì `StorageService` nằm trong `InfraModule` global. Thiếu thì DỪNG và báo sếp.
- Lệnh BE chạy từ `back-end/`, lệnh FE chạy từ `it-course-platform/`. Package manager là `pnpm`.
- BE là ESM: **import tương đối phải có đuôi `.js`**. Kiểu dùng trong tham số có decorator (`@Body() body: X`) phải `import type`.
- Test BE: unit `src/**/*.spec.ts` chạy bằng `pnpm test`; e2e `test/*.e2e-spec.ts` chạy bằng `pnpm test:e2e`, dùng DB dev thật (~1-2s/query), nên test nặng đặt timeout `SLOW = 120_000`.
- `tsc` của BE có sẵn **1 lỗi** ở `src/sentry-redact.spec.ts(64,19)`, không sửa lỗi này. "tsc sạch" nghĩa là không có lỗi nào khác.
- **Không migration.** Chỉ sửa **comment** `sizeBytes` trong `prisma/schema.prisma`, không đổi model.
- Không thêm dependency ở cả BE lẫn FE.
- FE: màu dùng token (`text-muted-foreground`, `bg-muted`, `text-destructive`…). shadcn `base-nova` dùng `render` prop thay cho `asChild`. Icon trong Button dùng `data-icon="inline-start"`. Copy UI tiếng Việt, key/enum tiếng Anh.

---

## File map

| File | Việc |
|---|---|
| `back-end/src/infra/storage.service.ts` | Sửa: bucket `video` (client AWS), `presignGet(bucket, …)`, `read(…, range?)` |
| `back-end/.env.example` | Sửa: 4 biến AWS |
| `back-end/test/fake-storage.ts` | Sửa: chữ ký `presignGet`, `read` mới |
| `back-end/test/fixtures/files.ts` | Sửa: thêm `mp4()` dựng MP4 giả |
| `back-end/src/assets/file-check.ts` (+ `.spec.ts`) | Sửa: `VIDEO_MAX_BYTES`, `PROMO_MAX_BYTES`, `mp4Duration` |
| `back-end/src/assets/assets.schemas.ts` | Sửa: `kind` `video`/`promo`, query `kind` |
| `back-end/src/assets/assets.service.ts` | Sửa: upload/complete/library/viewUrl cho video + promo |
| `back-end/src/assets/assets.controller.ts` | Sửa: truyền `query.kind` |
| `back-end/src/instructor-courses/instructor-courses.schemas.ts` | Sửa: đổi tên `setThumbnailSchema` → `mediaKeySchema` |
| `back-end/src/instructor-courses/instructor-courses.service.ts` | Sửa: `setPromoVideo`, `removePromoVideo`, `dropOldPublic` |
| `back-end/src/instructor-courses/instructor-courses.controller.ts` | Sửa: `PUT/DELETE :id/promo-video` |
| `back-end/src/curriculum/curriculum.service.ts` | Sửa: `usableAsset`, `setContent` video, cây có `video` |
| `back-end/prisma/schema.prisma` | Sửa: comment `video ≤1GB` |
| `back-end/test/curriculum.e2e-spec.ts` | Sửa: 2 test cũ coi video là sai |
| `back-end/test/video.e2e-spec.ts` | Tạo: e2e video + promo |
| `back-end/scripts/s3-check.ts`, `back-end/package.json` | Tạo script kiểm tra S3 thật, thêm lệnh `s3:check` |
| `it-course-platform/src/types/curriculum.ts` | Sửa: giới hạn, `AssetKind`, `LibraryAsset`, `CurriculumItem.video`, `formatDuration` |
| `it-course-platform/src/lib/api/assets.ts` | Sửa: `kind`, `listLibrary(q, kind)`, `setPromoVideo`, `removePromoVideo` |
| `it-course-platform/src/lib/upload.ts` | Sửa: `uploadVideo`, `uploadPromo`, `checkVideo` |
| `…/manage/_components/curriculum/content-picker.tsx` | Sửa: prop `kind`, trạng thái kiểm file / xử lý |
| `…/manage/_components/curriculum/video-preview-dialog.tsx` | Tạo: dialog xem video |
| `…/manage/_components/curriculum/lecture-detail-panel.tsx` | Sửa: nút Video, dòng nội dung chung, dialog |
| `…/manage/_components/curriculum/curriculum-editor.tsx` | Sửa: bỏ gợi ý "đợt 3" |
| `…/manage/_components/promo-video-upload.tsx` | Tạo: ô video giới thiệu |
| `…/manage/_components/basics-form.tsx` | Sửa: dùng `PromoVideoUpload`, bỏ `MediaPlaceholder` |

`…/manage/_components` = `it-course-platform/src/app/instructor/(manage)/courses/[id]/manage/_components`.

---

### Task 1: `StorageService` thêm bucket `video`, đổi chữ ký `presignGet` / `read`

**Files:**
- Modify: `back-end/src/infra/storage.service.ts`
- Modify: `back-end/src/assets/assets.service.ts` (2 chỗ gọi)
- Modify: `back-end/src/instructor-courses/instructor-courses.service.ts` (1 chỗ gọi, không đổi)
- Modify: `back-end/test/fake-storage.ts`
- Modify: `back-end/.env.example`

- [ ] **Step 1: Sửa `storage.service.ts`**

Thay khối từ `export type Bucket` tới hết `read(...)` bằng:

```ts
export type Bucket = 'public' | 'private' | 'video';
type Range = { offset: number; length: number };

// R2 cho ảnh bìa, PDF, video giới thiệu (spec curriculum-upload K1, K2); AWS S3 cho video bài giảng
// (spec video-upload V1). Cả hai qua S3 SDK, chọn client theo bucket.
@Injectable()
export class StorageService {
  // Mặc định SDK gắn x-amz-checksum-crc32 vào URL ký PUT; trình duyệt không gửi header đó → bị từ chối.
  private static readonly CHECKSUM = {
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  } as const;
  private readonly r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    ...StorageService.CHECKSUM,
  });
  private readonly s3 = new S3Client({
    region: requireEnv('AWS_REGION'),
    credentials: {
      accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
    },
    ...StorageService.CHECKSUM,
  });
  private readonly buckets: Record<Bucket, string> = {
    public: requireEnv('R2_PUBLIC_BUCKET'),
    private: requireEnv('R2_PRIVATE_BUCKET'),
    video: requireEnv('S3_VIDEO_BUCKET'),
  };
  private readonly publicBase = requireEnv('R2_PUBLIC_URL').replace(/\/+$/, '');

  private clientOf(bucket: Bucket) {
    return bucket === 'video' ? this.s3 : this.r2;
  }

  // Chữ ký gắn Content-Type + Content-Length: gửi file khác loại / khác cỡ → 403 (spec K4).
  presignPut(bucket: Bucket, key: string, contentType: string, size: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    return this.call(() =>
      getSignedUrl(this.clientOf(bucket), command, {
        expiresIn: 600,
        signableHeaders: new Set(['content-type', 'content-length']),
      }),
    );
  }

  presignGet(bucket: Bucket, key: string, ttlSec: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ResponseContentDisposition: 'inline',
    });
    return this.call(() => getSignedUrl(this.clientOf(bucket), command, { expiresIn: ttlSec }));
  }

  // Không có object → null (chưa upload xong / key sai), lỗi khác → 502.
  // S3 chỉ trả 404 khi IAM có s3:ListBucket (spec video-upload §9), không thì 403 → 502.
  async head(bucket: Bucket, key: string): Promise<{ size: number } | null> {
    try {
      const res = await this.clientOf(bucket).send(new HeadObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
      return { size: res.ContentLength ?? 0 };
    } catch (err) {
      if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) return null;
      throw this.fail(err);
    }
  }

  // range: chỉ đọc một khoảng (GET có Range), bỏ trống = cả object.
  read(bucket: Bucket, key: string, range?: Range): Promise<Buffer> {
    return this.call(async () => {
      const res = await this.clientOf(bucket).send(
        new GetObjectCommand({
          Bucket: this.buckets[bucket],
          Key: key,
          Range: range ? `bytes=${range.offset}-${range.offset + range.length - 1}` : undefined,
        }),
      );
      if (!res.Body) throw new Error(`Lưu trữ trả body rỗng cho ${key}`);
      return Buffer.from(await res.Body.transformToByteArray());
    });
  }
```

Sửa `delete` thành `this.clientOf(bucket).send(...)`. Bỏ comment cũ "Video lên AWS S3 ở đợt 3 sẽ thêm client riêng."

- [ ] **Step 2: Sửa các chỗ gọi**

`back-end/src/assets/assets.service.ts`:
- `viewUrl`: `this.storage.presignGet(asset.storageKey, 300)` → `this.storage.presignGet('private', asset.storageKey, 300)`. Task 3 sẽ viết lại hàm này.
- `checkPdf`: `this.storage.read('private', key, 5)` → `this.storage.read('private', key, { offset: 0, length: 5 })`

`instructor-courses.service.ts` `checkThumbnail` gọi `read('public', key)` không có tham số thứ 3, nên giữ nguyên.

- [ ] **Step 3: Sửa `back-end/test/fake-storage.ts`**

```ts
  presignGet(bucket: Bucket, key: string) {
    return Promise.resolve(`https://fake.r2/${bucket}/${key}?signed=1`);
  }
```

```ts
  read(bucket: Bucket, key: string, range?: { offset: number; length: number }) {
    const body = this.objects.get(`${bucket}/${key}`);
    if (!body) return Promise.reject(new Error(`Không có ${bucket}/${key}`));
    return Promise.resolve(range ? body.subarray(range.offset, range.offset + range.length) : body);
  }
```

- [ ] **Step 4: Thêm vào `back-end/.env.example`** (ngay sau khối R2)

```
# AWS S3 video bài giảng (spec video-upload §9). IAM: Put/Get/DeleteObject trên videos/*, ListBucket trên bucket.
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_VIDEO_BUCKET=
```

- [ ] **Step 5: Kiểm tra**

Run: `pnpm exec tsc --noEmit -p tsconfig.json && pnpm test`
Expected: tsc chỉ còn lỗi có sẵn ở `sentry-redact.spec.ts(64,19)`; unit test PASS.

---

### Task 2: `mp4Duration` (TDD)

**Files:**
- Modify: `back-end/test/fixtures/files.ts`
- Modify: `back-end/src/assets/file-check.ts`
- Test: `back-end/src/assets/file-check.spec.ts`

- [ ] **Step 1: Thêm fixture MP4 vào `test/fixtures/files.ts`** (cuối file)

```ts
// MP4 tối thiểu cho mp4Duration (spec video-upload §4.2): ftyp + moov(mvhd) + mdat, không phát được.
const u64 = (n: number) => [...u32(Math.floor(n / 2 ** 32)), ...u32(n >>> 0)];
export const box = (type: string, payload: number[] | Buffer) => {
  const body = [...payload];
  return Buffer.from([...u32(8 + body.length), ...ascii(type), ...body]);
};
const ftyp = box('ftyp', [...ascii('isom'), ...u32(512), ...ascii('isomiso2avc1mp41')]);
export const mvhd = (seconds: number, { timescale = 1000, version = 0 } = {}) => {
  const duration = seconds * timescale;
  const head =
    version === 1
      ? [1, 0, 0, 0, ...u64(0), ...u64(0), ...u32(timescale), ...u64(duration)]
      : [0, 0, 0, 0, ...u32(0), ...u32(0), ...u32(timescale), ...u32(duration)];
  return box('mvhd', [...head, ...Array.from({ length: 80 }, () => 0)]);
};
type Mp4Options = { timescale?: number; version?: number; moovLast?: boolean; largeMdat?: boolean };
export const mp4 = (seconds: number, { moovLast = false, largeMdat = false, ...mv }: Mp4Options = {}) => {
  const moov = box('moov', mvhd(seconds, mv));
  const data = Array.from({ length: 64 }, () => 7);
  const mdat = largeMdat
    ? Buffer.from([...u32(1), ...ascii('mdat'), ...u64(16 + data.length), ...data])
    : box('mdat', data);
  return Buffer.concat(moovLast ? [ftyp, box('free', []), mdat, moov] : [ftyp, moov, mdat]);
};
```

- [ ] **Step 2: Viết test lỗi trong `src/assets/file-check.spec.ts`**

Sửa dòng import đầu file:

```ts
import { box, exe, jpg, mp4, mvhd, pdf, png, webp } from '../../test/fixtures/files.js';
import { imageInfo, isPdf, mp4Duration } from './file-check.js';
```

Thêm vào cuối file:

```ts
describe('mp4Duration', () => {
  const run = (buf: Buffer) =>
    mp4Duration((offset, length) => Promise.resolve(buf.subarray(offset, offset + length)), buf.length);
  const ftypOnly = mp4(1).subarray(0, 32); // ftyp của fixture dài 32 byte

  it('moov trước mdat → số giây làm tròn', async () => {
    expect(await run(mp4(754))).toBe(754);
    expect(await run(mp4(10, { timescale: 30000 }))).toBe(10);
  });
  it('moov sau mdat (kiểu OBS), mdat dùng largesize', async () => {
    expect(await run(mp4(125, { moovLast: true }))).toBe(125);
    expect(await run(mp4(90, { moovLast: true, largeMdat: true }))).toBe(90);
  });
  it('mvhd version 1 (64-bit)', async () => {
    expect(await run(mp4(3600, { version: 1 }))).toBe(3600);
  });
  it('box size 0 = tới cuối file', async () => {
    const moov = box('moov', mvhd(42));
    moov.writeUInt32BE(0, 0);
    expect(await run(Buffer.concat([ftypOnly, moov]))).toBe(42);
  });
  it('không phải MP4 / hỏng → null', async () => {
    expect(await run(pdf)).toBeNull();
    expect(await run(exe)).toBeNull();
    expect(await run(ftypOnly)).toBeNull(); // không có moov
    expect(await run(Buffer.concat([ftypOnly, box('moov', [])]))).toBeNull(); // moov không có mvhd
    expect(await run(mp4(10, { timescale: 0 }))).toBeNull();
    expect(await run(mp4(25 * 3600, { version: 1 }))).toBeNull(); // quá 24 giờ
    expect(await run(mp4(10).subarray(0, 60))).toBeNull(); // cắt cụt giữa moov
    expect(await run(Buffer.concat([ftypOnly, Buffer.from([0, 0, 0, 4, 0x66, 0x72, 0x65, 0x65])]))).toBeNull(); // size < 8
  });
  it('quá 20 box mà chưa gặp moov → null', async () => {
    const frees = Array.from({ length: 25 }, () => box('free', []));
    expect(await run(Buffer.concat([ftypOnly, ...frees, box('moov', mvhd(5))]))).toBeNull();
  });
});
```

- [ ] **Step 3: Chạy để xác nhận test fail**

Run: `pnpm test src/assets/file-check.spec.ts`
Expected: FAIL, `mp4Duration` is not exported.

- [ ] **Step 4: Viết hàm trong `src/assets/file-check.ts`**

Sửa comment và thêm hằng số ngay dưới `THUMBNAIL_MAX_BYTES`:

```ts
// Giới hạn upload (spec curriculum-upload §4.3, video-upload V4). FE dùng cùng số.
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const VIDEO_MAX_BYTES = 1024 ** 3;
export const PROMO_MAX_BYTES = 200 * 1024 ** 2;
```

Thêm vào cuối file:

```ts
type ReadAt = (offset: number, length: number) => Promise<Buffer>;
const MAX_BOXES = 20; // file độc hại không bắt server đọc mãi
const MOOV_SCAN = 64 * 1024; // mvhd thường là con đầu của moov
const MAX_DURATION_SEC = 24 * 3600; // video bài giảng ≤1 GB, hơn 24 giờ là khai sai

// Thời lượng (giây) từ moov/mvhd, moov ở đầu hay sau mdat đều được (spec video-upload §4.2).
// Box đầu không phải ftyp, hỏng, cắt cụt → null. Chỉ đọc vài header box, không tải cả file.
export async function mp4Duration(readAt: ReadAt, size: number): Promise<number | null> {
  let offset = 0;
  for (let i = 0; i < MAX_BOXES && offset + 8 <= size; i++) {
    const head = await readAt(offset, Math.min(16, size - offset));
    if (head.length < 8) return null;
    const type = head.toString('latin1', 4, 8);
    if (i === 0 && type !== 'ftyp') return null;
    let boxSize = head.readUInt32BE(0);
    let headerSize = 8;
    if (boxSize === 1) {
      if (head.length < 16) return null;
      boxSize = Number(head.readBigUInt64BE(8));
      headerSize = 16;
      if (boxSize < 16) return null;
    } else if (boxSize === 0) {
      boxSize = size - offset;
    } else if (boxSize < 8) {
      return null;
    }
    if (offset + boxSize > size) return null;
    if (type === 'moov') {
      // moov rỗng: không đọc (Range độ dài 0 không hợp lệ, S3 sẽ trả cả object).
      if (boxSize - headerSize < 8) return null;
      return mvhdSeconds(await readAt(offset + headerSize, Math.min(boxSize - headerSize, MOOV_SCAN)));
    }
    offset += boxSize;
  }
  return null;
}

// Offset tính từ đầu payload mvhd (byte 0 = version). fMP4 có duration 0 → trả 0 (spec §4.2).
function mvhdSeconds(moov: Buffer): number | null {
  for (let p = 0; p + 8 <= moov.length; ) {
    const size = moov.readUInt32BE(p);
    if (size < 8) return null;
    if (moov.toString('latin1', p + 4, p + 8) === 'mvhd') {
      const payload = moov.subarray(p + 8, p + size);
      if (payload[0] > 1) return null;
      const v1 = payload[0] === 1;
      if (payload.length < (v1 ? 32 : 20)) return null;
      const timescale = payload.readUInt32BE(v1 ? 20 : 12);
      const duration = v1 ? Number(payload.readBigUInt64BE(24)) : payload.readUInt32BE(16);
      if (!timescale) return null;
      const seconds = Math.round(duration / timescale);
      return seconds <= MAX_DURATION_SEC ? seconds : null;
    }
    p += size;
  }
  return null;
}
```

- [ ] **Step 5: Chạy để xác nhận test pass**

Run: `pnpm test src/assets/file-check.spec.ts`
Expected: PASS hết, kể cả các test `isPdf` / `imageInfo` cũ.

---

### Task 3: Module `assets` nhận video + promo

**Files:**
- Modify: `back-end/src/assets/assets.schemas.ts`
- Modify: `back-end/src/assets/assets.service.ts`
- Modify: `back-end/src/assets/assets.controller.ts`
- Modify: `back-end/test/curriculum.e2e-spec.ts:167-201, ~245`
- Create: `back-end/test/video.e2e-spec.ts`

- [ ] **Step 1: Sửa test cũ `curriculum.e2e-spec.ts`**

Trong `it('khai báo sai loại / quá cỡ / kind lạ → 400'`, thay phần tử `{ kind: 'video', … sizeBytes: 10 }` (từ nay là hợp lệ) bằng:

```ts
        {
          kind: 'audio',
          fileName: 'a.mp3',
          mimeType: 'audio/mpeg',
          sizeBytes: 10,
        },
```

Trong `it('complete PDF thật → 200 ready; gọi lại / người khác → 404'` (dòng ~245), `complete` từ nay trả thêm
`kind` và `durationSec`, nên sửa assertion `toEqual` thành:

```ts
        expect(body).toEqual({
          id: ok.assetId,
          kind: 'document',
          fileName: 'bai.pdf',
          sizeBytes: pdf.length,
          durationSec: null,
          createdAt: expect.any(String),
        });
```

- [ ] **Step 2: Viết e2e lỗi `back-end/test/video.e2e-spec.ts`**

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { requireEnv } from '../src/env.js';
import { PrismaService } from '../src/infra/prisma.service.js';
import { StorageService } from '../src/infra/storage.service.js';
import { MailService } from '../src/mail/mail.service.js';
import { setupApp } from '../src/setup-app.js';
import { FakeStorage } from './fake-storage.js';
import { mp4, pdf } from './fixtures/files.js';

// spec video-upload §7. Bootstrap giống curriculum.e2e-spec.ts.
const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000;

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type VideoRef = { id: string; fileName: string; sizeBytes: number; durationSec: number | null };
type Item = { id: string; type: string; lectureKind: string | null; durationSec: number; video: VideoRef | null };
type Tree = {
  sections: { id: string; items: Item[] }[];
  checklist: { key: string; missing: { message: string }[] }[];
};

describe('Video bài giảng + video giới thiệu (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const emails: string[] = [];
  let alice: TestUser;
  let bob: TestUser;

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role: 'student,instructor' } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const newCourse = async (u: TestUser) =>
    (await call('post', '/api/instructor/courses', u.cookie, { title: 'Khoá e2e video' }).expect(201)).body
      .id as string;
  // Ký URL rồi "upload" thẳng vào FakeStorage (thay trình duyệt PUT).
  const uploaded = async (u: TestUser, kind: 'video' | 'promo', body: Buffer, sizeBytes = body.length) => {
    const res = await call('post', '/api/instructor/assets/uploads', u.cookie, {
      kind,
      fileName: kind === 'video' ? 'bai-giang.mp4' : 'gioi-thieu.mp4',
      mimeType: 'video/mp4',
      sizeBytes,
    }).expect(201);
    storage.put(kind === 'video' ? 'video' : 'public', res.body.key, body);
    return res.body as { assetId: string | null; key: string };
  };
  const readyVideo = (ownerId: string, durationSec: number) =>
    prisma.asset.create({
      data: {
        ownerId,
        kind: 'video',
        fileName: `v-${durationSec}.mp4`,
        mimeType: 'video/mp4',
        sizeBytes: 1000,
        storageKey: `videos/${ownerId}/${randomUUID()}.mp4`,
        status: 'ready',
        durationSec,
      },
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({ sendVerification: vi.fn(), sendResetPassword: vi.fn() })
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = moduleRef.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    [alice, bob] = await Promise.all([makeUser(), makeUser()]);
  }, SLOW);

  // Dọn: course trước (item → asset là Restrict), asset, rồi user.
  afterAll(async () => {
    const ids = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  describe('/api/instructor/assets', () => {
    it('ký upload video → asset uploading trên bucket video; promo → không tạo asset', async () => {
      const video = await uploaded(alice, 'video', mp4(10));
      expect(video.key).toMatch(new RegExp(`^videos/${alice.id}/[0-9a-f-]{36}\\.mp4$`));
      const asset = await prisma.asset.findUniqueOrThrow({ where: { id: video.assetId! } });
      expect(asset).toMatchObject({ kind: 'video', status: 'uploading', mimeType: 'video/mp4' });

      const before = await prisma.asset.count({ where: { ownerId: alice.id } });
      const promo = await uploaded(alice, 'promo', mp4(10));
      expect(promo.assetId).toBeNull();
      expect(promo.key).toMatch(new RegExp(`^promos/${alice.id}/[0-9a-f-]{36}\\.mp4$`));
      expect(await prisma.asset.count({ where: { ownerId: alice.id } })).toBe(before);
    });

    it('video > 1 GB, promo > 200 MB, MIME khác MP4 → 400', async () => {
      const bad = [
        { kind: 'video', fileName: 'a.mp4', mimeType: 'video/mp4', sizeBytes: 1024 ** 3 + 1 },
        { kind: 'video', fileName: 'a.mov', mimeType: 'video/quicktime', sizeBytes: 10 },
        { kind: 'promo', fileName: 'a.mp4', mimeType: 'video/mp4', sizeBytes: 200 * 1024 ** 2 + 1 },
        { kind: 'promo', fileName: 'a.webm', mimeType: 'video/webm', sizeBytes: 10 },
      ];
      for (const b of bad) await call('post', '/api/instructor/assets/uploads', alice.cookie, b).expect(400);
    });

    it(
      'complete video đúng → ready + durationSec; lệch cỡ / không phải MP4 → 400, failed, object bị xoá',
      async () => {
        const ok = await uploaded(alice, 'video', mp4(754, { moovLast: true }));
        const res = await call('post', `/api/instructor/assets/${ok.assetId}/complete`, alice.cookie).expect(200);
        expect(res.body).toMatchObject({ id: ok.assetId, kind: 'video', durationSec: 754 });

        const lied = await uploaded(alice, 'video', mp4(10), mp4(10).length + 1);
        await call('post', `/api/instructor/assets/${lied.assetId}/complete`, alice.cookie).expect(400);
        expect(storage.has('video', lied.key)).toBe(false);

        const fake = await uploaded(alice, 'video', pdf);
        const bad = await call('post', `/api/instructor/assets/${fake.assetId}/complete`, alice.cookie).expect(400);
        expect(bad.body.errors[0].message).toBe('File không phải video MP4 hợp lệ');
        expect(storage.has('video', fake.key)).toBe(false);
        expect((await prisma.asset.findUniqueOrThrow({ where: { id: fake.assetId! } })).status).toBe('failed');
      },
      SLOW,
    );

    it(
      'thư viện lọc theo kind; URL xem video ký trên bucket video; người khác → 404',
      async () => {
        const v = await readyVideo(alice.id, 30);
        const videos = await call('get', '/api/instructor/assets?kind=video', alice.cookie).expect(200);
        expect(videos.body.every((a: { kind: string }) => a.kind === 'video')).toBe(true);
        expect(videos.body.find((a: { id: string }) => a.id === v.id)).toMatchObject({ durationSec: 30 });
        const docs = await call('get', '/api/instructor/assets', alice.cookie).expect(200);
        expect(docs.body.some((a: { kind: string }) => a.kind === 'video')).toBe(false);

        const url = await call('get', `/api/instructor/assets/${v.id}/url`, alice.cookie).expect(200);
        expect(url.body.url).toBe(`https://fake.r2/video/${v.storageKey}?signed=1`);
        await call('get', `/api/instructor/assets/${v.id}/url`, bob.cookie).expect(404);
      },
      SLOW,
    );
  });
});
```

- [ ] **Step 3: Chạy để xác nhận test fail**

Run: `pnpm test:e2e test/video.e2e-spec.ts`
Expected: FAIL. `POST /uploads` với `kind: 'video'` trả 400 thay vì 201.

- [ ] **Step 4: Sửa `assets.schemas.ts`**

```ts
import { z } from 'zod';
import { PDF_MAX_BYTES, PROMO_MAX_BYTES, THUMBNAIL_MAX_BYTES, VIDEO_MAX_BYTES } from './file-check.js';

// spec curriculum-upload §4.3, video-upload §4.3. kind lạ → 400.
const fileName = z.string().trim().min(1).max(255);
const mp4 = z.literal('video/mp4', 'Chỉ nhận video MP4');
```

Thêm 2 nhánh vào `discriminatedUnion` (sau `thumbnail`):

```ts
  z
    .object({
      kind: z.literal('video'),
      fileName,
      mimeType: mp4,
      sizeBytes: z.int().min(1).max(VIDEO_MAX_BYTES, 'Video tối đa 1 GB'),
    })
    .strict(),
  z
    .object({
      kind: z.literal('promo'),
      fileName,
      mimeType: mp4,
      sizeBytes: z.int().min(1).max(PROMO_MAX_BYTES, 'Video giới thiệu tối đa 200 MB'),
    })
    .strict(),
```

Sửa query thư viện:

```ts
export const libraryQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  kind: z.enum(['document', 'video']).default('document'),
});
```

- [ ] **Step 5: Sửa `assets.controller.ts`**

```ts
    return this.assets.library(user.id, query.kind, query.q);
```

- [ ] **Step 6: Sửa `assets.service.ts`**

Import:

```ts
import type { AssetKind, Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import type { CreateUploadInput } from './assets.schemas.js';
import { IMAGE_EXT, isPdf, mp4Duration } from './file-check.js';
```

`LIBRARY_SELECT` thêm 2 trường:

```ts
const LIBRARY_SELECT = {
  id: true,
  kind: true,
  fileName: true,
  sizeBytes: true,
  durationSec: true,
  createdAt: true,
} satisfies Prisma.AssetSelect;
const CONTENT_KINDS: AssetKind[] = ['document', 'video'];
// Asset document ở R2 private, video ở S3 (spec curriculum-upload K1). Bucket suy từ kind, không có cột riêng.
const bucketOf = (kind: AssetKind) => (kind === 'video' ? 'video' : 'private');
```

Thay comment `ponytail:` bằng:

```ts
// ponytail: không cron dọn (spec video-upload V10). PUT lỗi thì không có object; asset kẹt uploading/failed chỉ
// là dòng DB; video bị thay vẫn nằm trong thư viện để dùng lại. Thêm cron @nestjs/schedule khi rác đáng kể.
```

Thay `createUpload`:

```ts
  // Key do BE sinh (người dùng không chọn đường dẫn), URL ký hạn 10 phút (spec K4).
  async createUpload(ownerId: string, body: CreateUploadInput) {
    const headers = { 'Content-Type': body.mimeType };
    if (body.kind === 'thumbnail' || body.kind === 'promo') {
      // Ảnh bìa, video giới thiệu: R2 public, không vào assets (spec K3, video-upload V7).
      const key =
        body.kind === 'thumbnail'
          ? `thumbnails/${ownerId}/${randomUUID()}.${IMAGE_EXT[body.mimeType]}`
          : `promos/${ownerId}/${randomUUID()}.mp4`;
      const uploadUrl = await this.storage.presignPut('public', key, body.mimeType, body.sizeBytes);
      return { assetId: null, key, uploadUrl, headers };
    }
    const key =
      body.kind === 'video' ? `videos/${ownerId}/${randomUUID()}.mp4` : `documents/${ownerId}/${randomUUID()}.pdf`;
    const { id } = await this.prisma.asset.create({
      data: {
        ownerId,
        kind: body.kind,
        fileName: body.fileName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        storageKey: key,
      },
      select: { id: true },
    });
    const uploadUrl = await this.storage.presignPut(bucketOf(body.kind), key, body.mimeType, body.sizeBytes);
    return { assetId: id, key, uploadUrl, headers };
  }
```

Thay `complete`:

```ts
  // Sau PUT: đúng cỡ đã khai + đúng loại (PDF magic bytes, video có mvhd) → ready; sai → xoá object, failed, 400.
  async complete(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: { in: CONTENT_KINDS }, status: 'uploading' },
          select: { kind: true, storageKey: true, sizeBytes: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    const bucket = bucketOf(asset.kind);
    const checked =
      asset.kind === 'video'
        ? await this.checkVideo(asset.storageKey, Number(asset.sizeBytes))
        : await this.checkPdf(asset.storageKey, Number(asset.sizeBytes));
    if (typeof checked === 'string') {
      await this.storage.delete(bucket, asset.storageKey);
      await this.prisma.asset.update({ where: { id }, data: { status: 'failed' } });
      throw validationError([{ path: ['file'], message: checked }]);
    }
    const ready = await this.prisma.asset.update({
      where: { id },
      data: { status: 'ready', durationSec: checked.durationSec },
      select: LIBRARY_SELECT,
    });
    return toLibraryAsset(ready);
  }
```

Thay `library` và `viewUrl`:

```ts
  async library(ownerId: string, kind: AssetKind, q?: string) {
    const rows = await this.prisma.asset.findMany({
      where: {
        ownerId,
        kind,
        status: 'ready',
        ...(q ? { fileName: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: LIBRARY_SELECT,
    });
    return rows.map(toLibraryAsset);
  }

  // Giảng viên xem lại PDF / video của mình (học viên xem ở đợt trang học). Video hạn 1 giờ cho bài dài.
  async viewUrl(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: { in: CONTENT_KINDS }, status: 'ready' },
          select: { kind: true, storageKey: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    const ttl = asset.kind === 'video' ? 3600 : 300;
    return { url: await this.storage.presignGet(bucketOf(asset.kind), asset.storageKey, ttl) };
  }
```

Thay `checkPdf` và thêm `checkVideo`. Cả hai trả câu lỗi, hoặc `{ durationSec }` khi đạt:

```ts
  private async checkPdf(key: string, size: number): Promise<string | { durationSec: null }> {
    const head = await this.storage.head('private', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    const ok = isPdf(await this.storage.read('private', key, { offset: 0, length: 5 }));
    return ok ? { durationSec: null } : 'File không phải PDF';
  }

  private async checkVideo(key: string, size: number): Promise<string | { durationSec: number }> {
    const head = await this.storage.head('video', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    const durationSec = await mp4Duration((offset, length) => this.storage.read('video', key, { offset, length }), size);
    return durationSec === null ? 'File không phải video MP4 hợp lệ' : { durationSec };
  }
```

- [ ] **Step 7: Chạy e2e**

Run: `pnpm test:e2e test/video.e2e-spec.ts test/curriculum.e2e-spec.ts`
Expected: `video.e2e-spec.ts` PASS. Ở `curriculum.e2e-spec.ts`, test `'gắn asset không hợp lệ / gắn cho quiz → 400'` có thể vẫn PASS ở bước này vì `setContent` chưa nhận video; Task 5 sẽ sửa nó. Mọi test khác PASS.

---

### Task 4: Video giới thiệu `PUT/DELETE /instructor/courses/:id/promo-video`

**Files:**
- Modify: `back-end/src/instructor-courses/instructor-courses.schemas.ts:39-40`
- Modify: `back-end/src/instructor-courses/instructor-courses.controller.ts`
- Modify: `back-end/src/instructor-courses/instructor-courses.service.ts`
- Test: `back-end/test/video.e2e-spec.ts`

- [ ] **Step 1: Viết e2e lỗi**

Thêm vào `video.e2e-spec.ts`, trong `describe` gốc, sau `describe('/api/instructor/assets')`:

```ts
  describe('/api/instructor/courses/:id/promo-video', () => {
    let courseId: string;
    const put = (u: TestUser, key: string) =>
      call('put', `/api/instructor/courses/${courseId}/promo-video`, u.cookie, { key });

    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it(
      'gắn video → promoVideoUrl; thay → object cũ bị xoá; gỡ → null + xoá object',
      async () => {
        const first = await uploaded(alice, 'promo', mp4(90));
        const a = await put(alice, first.key).expect(200);
        expect(a.body.promoVideoUrl).toBe(`${FakeStorage.PUBLIC}/${first.key}`);

        const second = await uploaded(alice, 'promo', mp4(60));
        const b = await put(alice, second.key).expect(200);
        expect(b.body.promoVideoUrl).toBe(`${FakeStorage.PUBLIC}/${second.key}`);
        expect(storage.has('public', first.key)).toBe(false);

        const c = await call('delete', `/api/instructor/courses/${courseId}/promo-video`, alice.cookie).expect(200);
        expect(c.body.promoVideoUrl).toBeNull();
        expect(storage.has('public', second.key)).toBe(false);
      },
      SLOW,
    );

    it(
      'key của người khác / không phải MP4 → 400 (object lỗi bị xoá); khoá in_review → 409',
      async () => {
        const bobs = await uploaded(bob, 'promo', mp4(30));
        await put(alice, bobs.key).expect(400);

        const fake = await uploaded(alice, 'promo', pdf);
        const res = await put(alice, fake.key).expect(400);
        expect(res.body.errors[0].message).toBe('File không phải video MP4 hợp lệ');
        expect(storage.has('public', fake.key)).toBe(false);

        const ok = await uploaded(alice, 'promo', mp4(30));
        await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
        await put(alice, ok.key).expect(409);
        await call('delete', `/api/instructor/courses/${courseId}/promo-video`, alice.cookie).expect(409);
        await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
      },
      SLOW,
    );
  });
```

- [ ] **Step 2: Chạy để xác nhận test fail**

Run: `pnpm test:e2e test/video.e2e-spec.ts`
Expected: FAIL. Route chưa có nên trả 404.

- [ ] **Step 3: Đổi tên schema trong `instructor-courses.schemas.ts`**

```ts
// Key do POST /instructor/assets/uploads sinh: ảnh bìa, video giới thiệu.
export const mediaKeySchema = z.object({ key: z.string().max(200) }).strict();
export type MediaKeyInput = z.output<typeof mediaKeySchema>;
```

- [ ] **Step 4: Sửa `instructor-courses.controller.ts`**

```ts
import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createCourseSchema, mediaKeySchema, updateCourseSchema } from './instructor-courses.schemas.js';
import type { CreateCourseInput, MediaKeyInput, UpdateCourseInput } from './instructor-courses.schemas.js';
```

Sửa route thumbnail để dùng `mediaKeySchema` / `MediaKeyInput`, và thêm sau nó:

```ts
  @Put(':id/promo-video')
  setPromoVideo(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mediaKeySchema)) body: MediaKeyInput,
  ) {
    return this.courses.setPromoVideo(id, user.id, body.key);
  }

  @Delete(':id/promo-video')
  removePromoVideo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.courses.removePromoVideo(id, user.id);
  }
```

- [ ] **Step 5: Sửa `instructor-courses.service.ts`**

Import:

```ts
import { imageInfo, mp4Duration, PROMO_MAX_BYTES, THUMBNAIL_MAX_BYTES, THUMBNAIL_MIN } from '../assets/file-check.js';
```

Trong `setThumbnail`, thay 7 dòng (gồm 2 dòng comment) từ `const oldKey = …` tới `if (oldKey && …)` bằng:

```ts
    await this.dropOldPublic(id, { thumbnailUrl: course.thumbnailUrl }, key);
```

Thêm sau `setThumbnail`:

```ts
  // Video giới thiệu (spec video-upload §4.4): như ảnh bìa, file đã nằm trên R2 public, không vào assets.
  async setPromoVideo(id: string, instructorId: string, key: string) {
    const course = await this.assertEditable(id, instructorId);
    if (!new RegExp(`^promos/${instructorId}/[0-9a-f-]{36}\\.mp4$`).test(key)) {
      throw validationError([{ path: ['key'], message: 'Video không hợp lệ' }]);
    }
    const problem = await this.checkPromo(key);
    if (problem) {
      await this.storage.delete('public', key);
      throw validationError([{ path: ['key'], message: problem }]);
    }
    await this.prisma.course.update({
      where: { id },
      data: { promoVideoUrl: this.storage.publicUrl(key), updatedAt: new Date() },
    });
    await this.dropOldPublic(id, { promoVideoUrl: course.promoVideoUrl }, key);
    return this.detail(id, instructorId);
  }

  async removePromoVideo(id: string, instructorId: string) {
    const course = await this.assertEditable(id, instructorId);
    await this.prisma.course.update({ where: { id }, data: { promoVideoUrl: null, updatedAt: new Date() } });
    await this.dropOldPublic(id, { promoVideoUrl: course.promoVideoUrl }, null);
    return this.detail(id, instructorId);
  }

  // Xoá object cũ trên R2 public: chỉ khi là file của mình, khác key mới, và không khoá nào khác dùng cùng URL.
  // Lỗi xoá chỉ để lại rác, không làm hỏng request (StorageService đã gửi Sentry).
  private async dropOldPublic(
    id: string,
    old: { thumbnailUrl: string | null } | { promoVideoUrl: string | null },
    newKey: string | null,
  ) {
    const url = Object.values(old)[0];
    const oldKey = this.storage.keyOfPublicUrl(url);
    if (!oldKey || oldKey === newKey) return;
    const shared = await this.prisma.course.count({ where: { ...old, id: { not: id } } });
    if (shared === 0) await this.storage.delete('public', oldKey).catch(() => undefined);
  }
```

Thêm sau `checkThumbnail`:

```ts
  private async checkPromo(key: string): Promise<string | null> {
    const head = await this.storage.head('public', key);
    if (!head) return 'Chưa tải video lên';
    if (head.size > PROMO_MAX_BYTES) return 'Video giới thiệu tối đa 200 MB';
    const seconds = await mp4Duration((offset, length) => this.storage.read('public', key, { offset, length }), head.size);
    return seconds === null ? 'File không phải video MP4 hợp lệ' : null;
  }
```

- [ ] **Step 6: Chạy e2e**

Run: `pnpm test:e2e test/video.e2e-spec.ts test/curriculum.e2e-spec.ts`
Expected: PASS. Các test thumbnail cũ, kể cả test "ảnh dùng chung không bị xoá", vẫn PASS nhờ `dropOldPublic`.

---

### Task 5: Curriculum nhận video

**Files:**
- Modify: `back-end/src/curriculum/curriculum.service.ts`
- Modify: `back-end/test/curriculum.e2e-spec.ts` (test `'gắn asset không hợp lệ / gắn cho quiz → 400'`)
- Test: `back-end/test/video.e2e-spec.ts`

- [ ] **Step 1: Sửa test cũ**

Trong `curriculum.e2e-spec.ts`, test `'gắn asset không hợp lệ / gắn cho quiz → 400'`: bỏ `video.id` khỏi mảng `for (const assetId of [bobs.id, uploading.id, video.id, randomUUID()])`, rồi thêm ngay sau vòng `for`:

```ts
        // Video gắn làm nội dung được (spec video-upload §4.5), nhưng không làm tài nguyên đính kèm.
        await as('post', `/items/${lecture.id}/resources`, { assetId: video.id }).expect(400);
```

- [ ] **Step 2: Viết e2e lỗi**

Thêm vào `video.e2e-spec.ts`, trong `describe` gốc:

```ts
  describe('curriculum: gắn video', () => {
    let courseId: string;
    let tree: Tree;
    const as = (method: Method, path: string, body?: object) =>
      call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
    const minutesMissing = () =>
      tree.checklist.find((c) => c.key === 'curriculum')!.missing.some((m) => m.message.includes('phút video'));

    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it(
      'gắn video → lectureKind video, durationSec chép từ asset; 5 bài × 6 phút → checklist hết dòng phút video',
      async () => {
        tree = (await as('get', '/curriculum').expect(200)).body as Tree;
        const sectionId = tree.sections[0].id;
        for (let i = 0; i < 4; i++) {
          await as('post', `/sections/${sectionId}/items`, { type: 'lecture', title: `Bài ${i + 2}` }).expect(201);
        }
        tree = (await as('get', '/curriculum').expect(200)).body as Tree;
        const lectures = tree.sections[0].items.filter((i) => i.type === 'lecture');
        expect(lectures).toHaveLength(5);
        expect(minutesMissing()).toBe(true);

        for (const lecture of lectures) {
          const v = await readyVideo(alice.id, 360);
          tree = (await as('put', `/items/${lecture.id}/content`, { assetId: v.id }).expect(200)).body as Tree;
        }
        const first = tree.sections[0].items.find((i) => i.id === lectures[0].id)!;
        expect(first).toMatchObject({
          lectureKind: 'video',
          durationSec: 360,
          video: { fileName: 'v-360.mp4', sizeBytes: 1000, durationSec: 360 },
        });
        expect(minutesMissing()).toBe(false);

        tree = (await as('delete', `/items/${lectures[0].id}/content`).expect(200)).body as Tree;
        expect(tree.sections[0].items.find((i) => i.id === lectures[0].id)).toMatchObject({
          lectureKind: null,
          durationSec: 0,
          video: null,
        });
      },
      SLOW,
    );
  });
```

- [ ] **Step 3: Chạy để xác nhận test fail**

Run: `pnpm test:e2e test/video.e2e-spec.ts`
Expected: FAIL. `PUT /content` với asset video trả 400.

- [ ] **Step 4: Sửa `curriculum.service.ts`**

Import kiểu:

```ts
import type { AssetKind, Prisma } from '@prisma/client';
```

`ITEM_SELECT` thêm `videoAsset` (sau `documentAsset`):

```ts
  videoAsset: { select: { id: true, fileName: true, sizeBytes: true, durationSec: true } },
```

Thay `setContent`:

```ts
  setContent(courseId: string, userId: string, itemId: string, assetId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      const asset = await this.usableAsset(tx, userId, assetId, ['document', 'video']);
      // Video: thời lượng BE đã đo lúc complete, chép vào bài để checklist cộng (spec video-upload §4.5).
      const content =
        asset.kind === 'video'
          ? { lectureKind: 'video' as const, videoAssetId: assetId, durationSec: asset.durationSec ?? 0 }
          : { lectureKind: 'document' as const, documentAssetId: assetId };
      // Một câu update: luôn thoả chk_item_payload; bài giảng có nội dung tự xuất bản (K9).
      await tx.curriculumItem.update({
        where: { id: itemId },
        data: { ...NO_CONTENT, ...content, isPublished: true },
      });
    });
  }
```

Trong `addResource`: `this.usableDocument(tx, userId, body.assetId)` → `this.usableAsset(tx, userId, body.assetId, ['document'])`.

Trong `tree()`, sửa map item:

```ts
      items: s.items.map(({ documentAsset, videoAsset, resources, ...item }) => {
        if (item.type === 'lecture' && item.isPublished) {
          published++;
          if (item.lectureKind === 'video') videoSeconds += item.durationSec;
        }
        return {
          ...item,
          document: documentAsset && toRef(documentAsset),
          video: videoAsset && { ...toRef(videoAsset), durationSec: videoAsset.durationSec },
          resources: resources.map((r) => ({ id: r.id, title: r.title, asset: toRef(r.asset) })),
        };
      }),
```

Thay `usableDocument`:

```ts
  // Asset của mình, đã ready, đúng loại. Tài nguyên đính kèm chỉ nhận document (spec video-upload §4.5).
  private async usableAsset(tx: Tx, userId: string, assetId: string, kinds: AssetKind[]) {
    const asset = await tx.asset.findFirst({
      where: { id: assetId, ownerId: userId, kind: { in: kinds }, status: 'ready' },
      select: { kind: true, fileName: true, durationSec: true },
    });
    if (!asset) throw validationError([{ path: ['assetId'], message: 'File không dùng được' }]);
    return asset;
  }
```

`assetId` không phải GUID thì Prisma báo lỗi kiểu uuid. Code cũ cũng truyền thẳng, còn schema `setContentSchema` / `addResourceSchema` đã có `z.uuid()`, nên giữ nguyên như cũ.

- [ ] **Step 5: Sửa comment `prisma/schema.prisma`**

`sizeBytes   BigInt // video ≤4GB, PDF ≤1GB — kiểm ở service upload` → `sizeBytes   BigInt // video ≤1GB, PDF ≤1GB — kiểm ở service upload`

- [ ] **Step 6: Chạy toàn bộ test BE**

Run: `pnpm exec tsc --noEmit -p tsconfig.json && pnpm lint && pnpm test && pnpm test:e2e`
Expected: tsc chỉ còn lỗi có sẵn; lint sạch; unit test và mọi e2e PASS.

---

### Task 6: Script kiểm tra S3 thật

**Files:**
- Create: `back-end/scripts/s3-check.ts`
- Modify: `back-end/package.json` (scripts)

- [ ] **Step 1: Tạo `back-end/scripts/s3-check.ts`**

```ts
// pnpm s3:check — kiểm env, quyền IAM và đường presigned PUT của bucket video S3 thật (spec video-upload §7).
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

process.loadEnvFile();
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const Bucket = env('S3_VIDEO_BUCKET');
const client = new S3Client({
  region: env('AWS_REGION'),
  credentials: { accessKeyId: env('AWS_ACCESS_KEY_ID'), secretAccessKey: env('AWS_SECRET_ACCESS_KEY') },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

// Object thử nằm dưới videos/ cho khớp policy IAM.
const Key = `videos/s3-check/${Date.now()}.bin`;
const body = 'x'.repeat(1024);
const url = await getSignedUrl(
  client,
  new PutObjectCommand({ Bucket, Key, ContentType: 'video/mp4', ContentLength: body.length }),
  { expiresIn: 60, signableHeaders: new Set(['content-type', 'content-length']) },
);
const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'video/mp4' }, body });
if (!put.ok) throw new Error(`Presigned PUT trả ${put.status}: ${await put.text()}`);
const head = await client.send(new HeadObjectCommand({ Bucket, Key }));
const range = await client.send(new GetObjectCommand({ Bucket, Key, Range: 'bytes=0-15' }));
const got = (await range.Body!.transformToByteArray()).length;
if (got !== 16) throw new Error(`GET Range trả ${got} byte, cần 16`);
await client.send(new DeleteObjectCommand({ Bucket, Key }));
console.log(`✓ ${Bucket}: presigned PUT → HEAD (${head.ContentLength} bytes) → GET Range 16 byte → DELETE OK`);

// Key chưa có phải ra 404; 403 = thiếu s3:ListBucket → complete sẽ báo 502 thay vì 400.
let missingStatus: number | undefined = 200;
try {
  await client.send(new HeadObjectCommand({ Bucket, Key: `videos/s3-check/khong-co-${Date.now()}` }));
} catch (err) {
  missingStatus = err instanceof S3ServiceException ? err.$metadata.httpStatusCode : undefined;
}
if (missingStatus !== 404) {
  throw new Error(`HEAD key không tồn tại trả ${missingStatus}, cần 404 — thêm s3:ListBucket cho IAM`);
}
console.log('✓ HEAD key không tồn tại → 404');
```

- [ ] **Step 2: Thêm script vào `back-end/package.json`**

Ngay sau dòng `"r2:check": …`, thêm dấu phẩy rồi:

```json
    "s3:check": "node --experimental-strip-types scripts/s3-check.ts"
```

- [ ] **Step 3: Chạy**

Run: `pnpm s3:check`
Expected: 2 dòng `✓`. Nếu fail thì báo sếp kiểm tra lại spec §9, không sửa code cho qua.

---

### Task 7: FE types, API, upload helpers

**Files:**
- Modify: `it-course-platform/src/types/curriculum.ts`
- Modify: `it-course-platform/src/lib/api/assets.ts`
- Modify: `it-course-platform/src/lib/upload.ts`

- [ ] **Step 1: `types/curriculum.ts`**

Sửa comment đầu file thành `// Khớp API back-end/src/curriculum + assets (spec curriculum-upload §4, video-upload §4). Giới hạn giống BE.`

Sau `THUMBNAIL_MIN` thêm:

```ts
export const VIDEO_MAX_BYTES = 1024 ** 3;
export const PROMO_MAX_BYTES = 200 * 1024 ** 2;
```

Thay `LibraryAsset` và thêm `VideoRef`:

```ts
export type AssetKind = 'document' | 'video';

export interface LibraryAsset extends AssetRef {
  kind: AssetKind;
  durationSec: number | null;
  createdAt: string;
}

export interface VideoRef extends AssetRef {
  durationSec: number | null;
}
```

Trong `CurriculumItem`, thêm sau `document: AssetRef | null;`:

```ts
  video: VideoRef | null;
```

Cuối file:

```ts
export function formatDuration(sec: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
```

- [ ] **Step 2: `lib/api/assets.ts`**

```ts
import { api } from '@/lib/api/client';
import type { AssetKind, LibraryAsset } from '@/types/curriculum';
import type { CourseDetail } from '@/types/instructor-course';

// spec 2026-10-01-curriculum-upload §4.3, 2026-10-02-video-upload §4.3–4.4.
export interface UploadTicket {
  assetId: string | null;
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
}

export interface CreateUploadPayload {
  kind: 'document' | 'thumbnail' | 'video' | 'promo';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
```

Thay `listLibrary` và thêm 2 hàm cuối file:

```ts
export const listLibrary = (q: string, kind: AssetKind, signal?: AbortSignal) =>
  api
    .get<LibraryAsset[]>('/instructor/assets', { params: q ? { q, kind } : { kind }, signal })
    .then((r) => r.data);
```

```ts
export const setPromoVideo = (courseId: string, key: string) =>
  api.put<CourseDetail>(`/instructor/courses/${courseId}/promo-video`, { key }).then((r) => r.data);

export const removePromoVideo = (courseId: string) =>
  api.delete<CourseDetail>(`/instructor/courses/${courseId}/promo-video`).then((r) => r.data);
```

- [ ] **Step 3: `lib/upload.ts`**

Đổi chữ ký `putToStorage`:

```ts
async function putToStorage(file: File, kind: CreateUploadPayload['kind'], { onProgress, signal }: Options) {
```

kèm import `import { completeUpload, createUpload, type CreateUploadPayload } from '@/lib/api/assets';`. Sửa comment `// Ký URL → PUT thẳng lên R2 (spec K4).` thành `// Ký URL → PUT thẳng lên R2 / S3 (spec K4, video-upload V3).`

Thêm sau `uploadThumbnail`:

```ts
// Video bài giảng lên S3; complete = BE kiểm cỡ + đọc thời lượng (spec video-upload §4.3).
export async function uploadVideo(file: File, options: Options = {}): Promise<LibraryAsset> {
  const ticket = await putToStorage(file, 'video', options);
  options.signal?.throwIfAborted();
  return completeUpload(ticket.assetId!, options.signal);
}

// Video giới thiệu lên R2 public; trả key để gắn bằng setPromoVideo (BE kiểm ở bước đó).
export async function uploadPromo(file: File, options: Options = {}): Promise<string> {
  return (await putToStorage(file, 'promo', options)).key;
}

const UNPLAYABLE = 'Trình duyệt không phát được file này. Hãy xuất lại MP4 (H.264)';

// Kiểm ở FE trước khi tải (spec video-upload §5.1): loại, cỡ, trình duyệt đọc được metadata và có hình.
// Thời lượng thật do BE đọc từ file, FE không gửi.
export function checkVideo(file: File, maxBytes: number, maxLabel: string): Promise<string | null> {
  if (file.type !== 'video/mp4') return Promise.resolve('Chỉ nhận video MP4');
  if (file.size > maxBytes) return Promise.resolve(`Video tối đa ${maxLabel}`);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (problem: string | null) => {
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(problem);
    };
    const timer = setTimeout(() => done(UNPLAYABLE), 10_000);
    video.preload = 'metadata';
    // videoWidth 0 = có tiếng mà không giải mã được hình (vd HEVC trên trình duyệt không hỗ trợ).
    video.onloadedmetadata = () => done(video.videoWidth ? null : UNPLAYABLE);
    video.onerror = () => done(UNPLAYABLE);
    video.src = url;
  });
}
```

- [ ] **Step 4: Kiểm tra**

Run: `pnpm exec tsc --noEmit`
Expected: báo lỗi ở `content-picker.tsx` vì `listLibrary` thiếu `kind`. Lỗi này đúng như dự kiến, Task 8 sẽ sửa. Ngoài ra không có lỗi nào khác.

---

### Task 8: `ContentPicker` theo `kind`

**Files:**
- Modify: `…/manage/_components/curriculum/content-picker.tsx`

- [ ] **Step 1: Sửa import và kiểu**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FileUp, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { listLibrary } from '@/lib/api/assets';
import { checkVideo, uploadDocument, uploadErrorMessage, uploadVideo } from '@/lib/upload';
import { cn } from '@/lib/utils';
import {
  type AssetKind,
  formatBytes,
  formatDuration,
  type LibraryAsset,
  PDF_MAX_BYTES,
  VIDEO_MAX_BYTES,
} from '@/types/curriculum';
import { useCurriculum } from './curriculum-context';

type Props = {
  kind?: AssetKind; // mặc định PDF (nội dung PDF, tài nguyên đính kèm)
  onPick: (asset: LibraryAsset) => Promise<boolean>;
  onClose: () => void;
  // Đang tải: truyền hàm huỷ lên panel (dùng cho "Bỏ thay đổi" khi rời trang); xong / huỷ → null.
  onUploadingChange: (abort: (() => void) | null) => void;
};

const COPY = {
  document: { accept: 'application/pdf', title: 'Chọn file PDF hoặc kéo thả vào đây', hint: 'Tối đa 1 GB', processing: 'Đang xử lý file…' },
  video: { accept: 'video/mp4', title: 'Chọn file MP4 hoặc kéo thả vào đây', hint: 'MP4 (H.264), tối đa 1 GB', processing: 'Đang xử lý video…' },
} as const;

async function checkFile(kind: AssetKind, file: File): Promise<string | null> {
  if (kind === 'video') return checkVideo(file, VIDEO_MAX_BYTES, '1 GB');
  if (file.type !== 'application/pdf') return 'Chỉ nhận file PDF';
  if (file.size > PDF_MAX_BYTES) return 'PDF tối đa 1 GB';
  return null;
}
```

- [ ] **Step 2: `ContentPicker` truyền `kind` xuống**

```tsx
// Ô chọn PDF / video (spec curriculum-upload K7, video-upload §5.2): tab Tải lên / Thư viện. Thư viện mount khi
// mở lần đầu, sau đó giữ cả 2 (ẩn tab kia) để đổi tab không huỷ upload.
export function ContentPicker({ kind = 'document', onPick, onClose, onUploadingChange }: Props) {
```

Thay `<UploadTab onPick=… />` bằng `<UploadTab kind={kind} onPick={onPick} onUploadingChange={onUploadingChange} />` và `<LibraryTab onPick={onPick} />` bằng `<LibraryTab kind={kind} onPick={onPick} />`.

- [ ] **Step 3: Thay `UploadTab`** (đến hết `return` của ô kéo thả)

```tsx
function UploadTab({ kind, onPick, onUploadingChange }: Omit<Props, 'onClose'> & { kind: AssetKind }) {
  const { locked } = useCurriculum();
  const [phase, setPhase] = useState<'checking' | 'uploading' | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null); // file PUT lỗi → nút "Thử lại" (spec §6)
  const [over, setOver] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  const copy = COPY[kind];
  // Đóng ô chọn / thu gọn bài giảng / rời trang khi đang tải → huỷ PUT (spec §6).
  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function start(file: File | undefined) {
    if (!file || ctrlRef.current || locked) return;
    setError(null);
    setFailedFile(null);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    onUploadingChange(() => ctrl.abort());
    setPhase('checking');
    try {
      const problem = await checkFile(kind, file);
      if (ctrl.signal.aborted) return;
      if (problem) return setError(problem);
      setProgress(0);
      setPhase('uploading');
      const upload = kind === 'video' ? uploadVideo : uploadDocument;
      const asset = await upload(file, { signal: ctrl.signal, onProgress: setProgress });
      if (!ctrl.signal.aborted) await onPick(asset);
    } catch (err) {
      const message = uploadErrorMessage(err);
      setError(message);
      // 400 = BE từ chối chính file này → thử lại cũng vô ích.
      if (message && !(axios.isAxiosError(err) && err.response?.status === 400)) setFailedFile(file);
    } finally {
      ctrlRef.current = null;
      setPhase(null);
      onUploadingChange(null);
    }
  }

  // 100% = PUT đã gửi xong, chờ BE complete → ẩn Huỷ (rời panel / Bỏ thay đổi vẫn huỷ qua signal).
  if (phase === 'checking' || (phase === 'uploading' && progress === 100)) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {phase === 'checking' ? 'Đang kiểm tra file…' : copy.processing}
      </p>
    );
  }
  if (phase === 'uploading') {
    return (
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" aria-label="Tiến độ tải lên" />
        <span className="w-10 text-right text-xs tabular-nums">{progress}%</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => ctrlRef.current?.abort()}>
          Huỷ
        </Button>
      </div>
    );
  }
```

Phần `return (<div className="flex flex-col gap-2"> <label …>` giữ nguyên, chỉ thay 3 chỗ:
- `<span className="font-semibold">Chọn file PDF hoặc kéo thả vào đây</span>` → `<span className="font-semibold">{copy.title}</span>`
- `<span className="text-xs text-muted-foreground">Tối đa 1 GB</span>` → `<span className="text-xs text-muted-foreground">{copy.hint}</span>`
- `accept="application/pdf"` → `accept={copy.accept}`

- [ ] **Step 4: `LibraryTab` lọc theo `kind`, có thời lượng**

```tsx
function LibraryTab({ kind, onPick }: Pick<Props, 'onPick'> & { kind: AssetKind }) {
```

Trong effect: `listLibrary(q.trim(), kind, ctrl.signal)` và deps `[q, kind]`. Dòng meta của mỗi mục:

```tsx
              <span className="shrink-0 text-xs text-muted-foreground">
                {a.durationSec != null && `${formatDuration(a.durationSec)} · `}
                {formatBytes(a.sizeBytes)} · {new Date(a.createdAt).toLocaleDateString('vi-VN')}
              </span>
```

- [ ] **Step 5: Kiểm tra**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch.

---

### Task 9: Panel bài giảng, dòng video, dialog xem lại

**Files:**
- Create: `…/manage/_components/curriculum/video-preview-dialog.tsx`
- Modify: `…/manage/_components/curriculum/lecture-detail-panel.tsx`
- Modify: `…/manage/_components/curriculum/curriculum-editor.tsx:317`

- [ ] **Step 1: Tạo `video-preview-dialog.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getAssetUrl } from '@/lib/api/assets';
import type { AssetRef } from '@/types/curriculum';

// Giảng viên xem lại video đã gắn (spec video-upload V8, §5.2): <video> gốc, URL ký hạn 1 giờ.
export function VideoPreviewDialog({ asset, onClose }: { asset: AssetRef | null; onClose: () => void }) {
  return (
    <Dialog open={!!asset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{asset?.fileName}</DialogTitle>
        </DialogHeader>
        {/* key: đổi video → mount lại, state URL bắt đầu từ null. */}
        {asset && <Player key={asset.id} assetId={asset.id} />}
      </DialogContent>
    </Dialog>
  );
}

function Player({ assetId }: { assetId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    getAssetUrl(assetId).then(
      (r) => alive && setUrl(r.url),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [assetId]);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Không mở được video. Đóng rồi mở lại để thử.
      </p>
    );
  }
  if (!url) return <Skeleton className="aspect-video w-full rounded-lg" />;
  return <video src={url} controls autoPlay className="aspect-video w-full rounded-lg bg-black" />;
}
```

- [ ] **Step 2: Sửa `lecture-detail-panel.tsx`, phần import và state**

Import:

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, FileText, Plus, RefreshCw, Trash2, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { getAssetUrl } from '@/lib/api/assets';
import { addResource, removeContent, removeResource, setContent, updateItem } from '@/lib/api/curriculum';
import {
  type AssetKind,
  type AssetRef,
  type CurriculumItem,
  type CurriculumResponse,
  formatBytes,
  formatDuration,
  type LibraryAsset,
  MAX_RESOURCES,
} from '@/types/curriculum';
import { useDirtySync } from '../course-provider';
import { submitToPromise } from '../form-save';
import { ContentPicker } from './content-picker';
import { useCurriculum } from './curriculum-context';
import { VideoPreviewDialog } from './video-preview-dialog';
```

Đổi state picker và thêm state preview:

```tsx
  const [picker, setPicker] = useState<AssetKind | 'resource' | null>(null);
  const [preview, setPreview] = useState<AssetRef | null>(null);
```

Thay `const doc = item.document;` bằng:

```tsx
  const contentPicker = picker === 'document' || picker === 'video' ? picker : null;
  const removeText = (what: string) =>
    `Gỡ ${what} khỏi bài giảng? Bài giảng sẽ thành chưa xuất bản; file vẫn còn trong thư viện.`;
```

- [ ] **Step 3: Thay khối "Nội dung"** (từ `<div className="flex flex-col gap-2">` có `<p …>Nội dung</p>` tới hết `{picker === 'content' && (…)}`)

```tsx
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Nội dung</p>
        {item.document && (
          <ContentRow
            icon={<FileText className="size-4 shrink-0 text-muted-foreground" />}
            name={item.document.fileName}
            meta={formatBytes(item.document.sizeBytes)}
            disabled={noPick}
            onView={() => void viewPdf(item.document!.id)}
            onReplace={() => setPicker('document')}
            onRemove={() =>
              confirm(removeText('PDF'), () => void run(() => removeContent(courseId, item.id)))
            }
          />
        )}
        {item.video && (
          <ContentRow
            icon={<Video className="size-4 shrink-0 text-muted-foreground" />}
            name={item.video.fileName}
            meta={`${item.video.durationSec != null ? `${formatDuration(item.video.durationSec)} · ` : ''}${formatBytes(item.video.sizeBytes)}`}
            disabled={noPick}
            onView={() => setPreview(item.video)}
            onReplace={() => setPicker('video')}
            onRemove={() =>
              confirm(removeText('video'), () => void run(() => removeContent(courseId, item.id)))
            }
          />
        )}
        {!item.document && !item.video && !contentPicker && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={noPick} onClick={() => setPicker('document')}>
              <FileText data-icon="inline-start" />
              Tài liệu PDF
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={noPick} onClick={() => setPicker('video')}>
              <Video data-icon="inline-start" />
              Video
            </Button>
          </div>
        )}
        {contentPicker && (
          <ContentPicker
            kind={contentPicker}
            onPick={pickWith((assetId) => setContent(courseId, item.id, assetId))}
            onClose={() => setPicker(null)}
            onUploadingChange={onUploadingChange}
          />
        )}
      </div>
```

- [ ] **Step 4: Checkbox "Cho tải xuống" chỉ hiện với PDF, gắn dialog**

Bọc `<label>` "Cho tải xuống file PDF" bằng `{item.lectureKind === 'document' && ( … )}`.

Trước thẻ `</div>` cuối cùng của component (sau `</fieldset>`), thêm:

```tsx
      <VideoPreviewDialog asset={preview} onClose={() => setPreview(null)} />
```

- [ ] **Step 5: Thêm `ContentRow`** ở cuối file

```tsx
// Một dòng nội dung đã gắn (PDF / video): Xem nằm ngoài khoá sửa, Thay / Gỡ theo `disabled`.
function ContentRow({
  icon,
  name,
  meta,
  disabled,
  onView,
  onReplace,
  onRemove,
}: {
  icon: React.ReactNode;
  name: string;
  meta: string;
  disabled: boolean;
  onView: () => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
      {icon}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="text-xs text-muted-foreground tabular-nums">{meta}</span>
      <Button type="button" variant="ghost" size="sm" onClick={onView}>
        <Eye data-icon="inline-start" />
        Xem
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onReplace}>
        <RefreshCw data-icon="inline-start" />
        Thay
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
        <X data-icon="inline-start" />
        Gỡ
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Bỏ gợi ý "đợt 3" ở `curriculum-editor.tsx:317`**

Xoá dòng `hint="Tải video có ở đợt 3"` khỏi `<Meter label="Tổng thời lượng video" …>`. Nếu `hint` là prop bắt buộc của `Meter` thì đổi nó thành tuỳ chọn trong định nghĩa `Meter`.

- [ ] **Step 7: Kiểm tra**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch. Nếu còn import thừa (`Video`, `Trash2`…) thì bỏ đúng dòng đó.

---

### Task 10: Video giới thiệu trong form thông tin khoá học

**Files:**
- Create: `…/manage/_components/promo-video-upload.tsx`
- Modify: `…/manage/_components/basics-form.tsx:211-230, 264-271`

- [ ] **Step 1: Tạo `promo-video-upload.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Loader2, Upload, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { removePromoVideo, setPromoVideo } from '@/lib/api/assets';
import { checkVideo, uploadErrorMessage, uploadPromo } from '@/lib/upload';
import { PROMO_MAX_BYTES } from '@/types/curriculum';
import { useCourse } from './course-provider';

// Video giới thiệu (spec video-upload §5.3): cùng khuôn ảnh bìa, ghi ngay khi xong, không làm form basics dirty.
export function PromoVideoUpload({ disabled }: { disabled: boolean }) {
  const { course, setCourse, patchCourse } = useCourse();
  const [phase, setPhase] = useState<'checking' | 'uploading' | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null); // lỗi mạng → nút "Thử lại"
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  useEffect(() => () => ctrlRef.current?.abort(), []);

  function fail(err: unknown, file?: File) {
    if (axios.isAxiosError(err) && err.response?.status === 409) return patchCourse({ status: 'in_review' });
    const message = uploadErrorMessage(err);
    setError(message);
    // 400 = BE từ chối chính file này → thử lại cũng vô ích.
    if (file && message && !(axios.isAxiosError(err) && err.response?.status === 400)) setFailedFile(file);
  }

  async function start(file: File | undefined) {
    if (!file || ctrlRef.current || disabled) return;
    setError(null);
    setFailedFile(null);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPhase('checking');
    try {
      const problem = await checkVideo(file, PROMO_MAX_BYTES, '200 MB');
      if (ctrl.signal.aborted) return;
      if (problem) return setError(problem);
      setProgress(0);
      setPhase('uploading');
      const key = await uploadPromo(file, { signal: ctrl.signal, onProgress: setProgress });
      ctrl.signal.throwIfAborted();
      setCourse(await setPromoVideo(course.id, key));
      toast.success('Đã cập nhật video giới thiệu');
    } catch (err) {
      fail(err, file);
    } finally {
      ctrlRef.current = null;
      setPhase(null);
    }
  }

  async function remove() {
    setError(null);
    setFailedFile(null);
    setRemoving(true);
    try {
      setCourse(await removePromoVideo(course.id));
      toast.success('Đã gỡ video giới thiệu');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) patchCourse({ status: 'in_review' });
      else toast.error('Gỡ video thất bại, thử lại');
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  }

  let action: React.ReactNode;
  if (phase === 'checking' || (phase === 'uploading' && progress === 100)) {
    action = (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {phase === 'checking' ? 'Đang kiểm tra file…' : 'Đang xử lý video…'}
      </p>
    );
  } else if (phase === 'uploading') {
    action = (
      <div className="flex items-center gap-2">
        <Progress value={progress} className="flex-1" aria-label="Tiến độ tải video" />
        <span className="w-10 text-right text-xs tabular-nums">{progress}%</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => ctrlRef.current?.abort()}>
          Huỷ
        </Button>
      </div>
    );
  } else {
    action = (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          <Upload data-icon="inline-start" />
          {course.promoVideoUrl ? 'Thay video' : 'Tải video lên'}
        </Button>
        {course.promoVideoUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setConfirmRemove(true)}>
            <X data-icon="inline-start" />
            Gỡ
          </Button>
        )}
      </div>
    );
  }

  return (
    <div id="promo-video" className="grid scroll-mt-20 gap-4 rounded-lg transition-shadow sm:grid-cols-2">
      {course.promoVideoUrl ? (
        <video
          key={course.promoVideoUrl}
          src={course.promoVideoUrl}
          controls
          preload="metadata"
          aria-label="Video giới thiệu hiện tại"
          className="aspect-video w-full rounded-lg border bg-black"
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-muted text-[13px] text-muted-foreground">
          <Video />
          MP4 · tối đa 200 MB
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold">
          Video quảng cáo <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
        </p>
        <p className="text-[13px]/relaxed text-muted-foreground">
          1–2 phút giới thiệu khoá. Học viên xem video này dễ đăng ký hơn.
        </p>
        {action}
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4"
          className="hidden"
          onChange={(e) => {
            void start(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {error && (
          <div className="flex items-center gap-2">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            {failedFile && (
              <Button type="button" variant="outline" size="xs" disabled={disabled} onClick={() => void start(failedFile)}>
                Thử lại
              </Button>
            )}
          </div>
        )}
      </div>
      <AlertDialog open={confirmRemove} onOpenChange={(open) => !open && !removing && setConfirmRemove(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ video giới thiệu?</AlertDialogTitle>
            <AlertDialogDescription>Video sẽ bị xoá khỏi trang khoá học và không khôi phục được.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" disabled={removing}>
              Huỷ
            </AlertDialogCancel>
            <Button variant="destructive" disabled={removing} onClick={() => void remove()}>
              {removing && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {removing ? 'Đang gỡ…' : 'Gỡ video'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

- [ ] **Step 2: Sửa `basics-form.tsx`**

Thay khối:

```tsx
              <div className="grid gap-4 sm:grid-cols-2">
                <MediaPlaceholder icon={<Video />} />
                …
                  <span className="text-xs text-muted-foreground">Tải video lên · sắp có (đợt 3)</span>
                </div>
              </div>
```

bằng:

```tsx
              <PromoVideoUpload disabled={locked} />
```

Thêm `import { PromoVideoUpload } from './promo-video-upload';` cạnh import `ThumbnailUpload`. Xoá hàm `MediaPlaceholder` (dòng ~264) nếu không còn chỗ nào dùng (`grep -n MediaPlaceholder` để kiểm tra), và bỏ `Video` khỏi import `lucide-react` nếu không còn dùng.

- [ ] **Step 3: Kiểm tra**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch.

---

### Task 11: Kiểm tra toàn bộ, kiểm tay, đề xuất commit

- [ ] **Step 1: BE**

Run (trong `back-end/`): `pnpm exec tsc --noEmit -p tsconfig.json && pnpm lint && pnpm test && pnpm test:e2e && pnpm s3:check`
Expected: tsc chỉ còn lỗi có sẵn; mọi lệnh khác PASS.

- [ ] **Step 2: FE**

Run (trong `it-course-platform/`): `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: sạch, build OK.

- [ ] **Step 3: Kiểm tay bằng Chrome** (`pnpm dev` ở cả 2 bên, đăng nhập giảng viên, mở một khoá nháp)

1. Khung chương trình: bài giảng → **Video**. Upload MP4 100–500 MB, thấy "Đang kiểm tra file…", rồi %, rồi "Đang xử lý video…". Xong thì có dòng video với `m:ss · MB`, chip của item ghi "Video · N phút", Meter phút video tăng.
2. Bấm **Huỷ** giữa chừng: không có lỗi nào hiện, ô kéo thả quay lại.
3. File `.mov`, file HEVC: báo lỗi ngay, không upload. File > 1 GB: báo "Video tối đa 1 GB".
4. **Xem**: dialog phát được, tua được. Thử thêm một file OBS (`moov` ở cuối file) vẫn phát và tua được.
5. **Thay** → tab Thư viện có video vừa tải, kèm thời lượng → chọn → dòng cập nhật. **Gỡ** → bài thành chưa xuất bản.
6. Thông tin khoá học: video giới thiệu **Tải video lên** → phát được ngay tại chỗ. **Thay video** → video mới. **Gỡ** → hộp xác nhận → khung trống.
7. Khoá `in_review` (sửa tay trong DB): các nút bị khoá, **Xem** vẫn dùng được.
8. Mở lại một video trên Safari.

- [ ] **Step 4: Đề xuất commit (KHÔNG tự commit)**

Gửi sếp danh sách file đã đổi (`git status`), **không** gồm `CLAUDE.md`, kèm message đề xuất:

```
feat: upload video bài giảng lên S3 + video giới thiệu lên R2 (đợt 3 flow giảng viên)
```

Chờ sếp duyệt rồi mới chạy `git commit`. Không push, không thêm Co-Authored-By.
