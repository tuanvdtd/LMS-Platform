# Khung chương trình + Upload PDF/ảnh lên R2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đợt 2/4 flow giảng viên: trang Khung chương trình (thêm/sửa/xoá/kéo thả phần và mục, ghi ngay từng thao tác), bài giảng gắn PDF + mô tả/xem thử/cho tải + tài nguyên PDF, thư viện file, upload PDF và ảnh bìa lên Cloudflare R2 bằng presigned PUT.

**Architecture:** BE: `StorageService` (một `S3Client` R2, 2 bucket `public`/`private`) đăng ký trong `InfraModule` global; module `assets` (ký URL, `complete` kiểm magic bytes, thư viện, URL xem PDF); module `curriculum` (CRUD phần/mục, `move` đánh số lại bằng một câu SQL, nội dung, tài nguyên; mọi mutation khoá dòng `courses` và trả `{ sections, checklist }`); `instructor-courses` export `assertOwned`/`assertEditable`/`checklistFor` và thêm `PUT /:id/thumbnail`. FE: trang `manage/curriculum` với `@dnd-kit` (chuột, cảm ứng, bàn phím), `run()` gọi API → thay cây + checklist; upload bằng `axios.put` trần lên URL đã ký; ảnh bìa ở `basics` ghi ngay.

**Tech Stack:** NestJS 12, Prisma 6.19, zod 4, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` 3.x, `image-size` 2, vitest 4 + supertest; Next.js 16.3 (`cacheComponents`), React 19.2, shadcn `base-nova`, react-hook-form + zod, axios, sonner, `@dnd-kit/core` 6 + `@dnd-kit/sortable` 10 + `@dnd-kit/utilities` 3.

**Spec:** `docs/superpowers/specs/2026-10-01-curriculum-upload-design.md`

## Global Constraints

- **Không commit giữa các task, không push, không thêm Co-Authored-By.** Sếp chưa chọn chế độ commit cho task này → mặc định hỏi trước mỗi commit; plan gom **một** đề xuất commit ở Task 13 và chờ duyệt.
- **Điều kiện trước khi code** (spec §8, sếp làm): 2 bucket R2 + token + CORS, 6 biến `R2_*` trong `back-end/.env`. Thiếu biến → **mọi** e2e và `pnpm dev` BE fail ở `requireEnv` (StorageService nằm trong `InfraModule` global). Thiếu thì DỪNG, báo sếp.
- `back-end/package.json` đang có thay đổi chưa commit của sếp (script `dev:tunnel`): giữ nguyên dòng đó, chỉ thêm dependency/script mới.
- Lệnh BE chạy từ `back-end/` (`.env` trỏ DB + Redis **dev**), lệnh FE chạy từ `it-course-platform/`. Package manager `pnpm`.
- BE là ESM (`"type": "module"`, `module: nodenext`): **import tương đối phải có đuôi `.js`**. Kiểu dùng trong tham số có decorator (`@Body() body: X`) phải `import type`.
- Test BE: unit `src/**/*.spec.ts` (`pnpm test`), e2e `test/*.e2e-spec.ts` (`pnpm test:e2e`, DB dev thật, ~1-2s/query → test nặng đặt timeout 120s). Pattern đăng nhập/bootstrap: `test/instructor-courses.e2e-spec.ts`.
- `tsc` BE baseline có **1 lỗi sẵn** ở `src/sentry-redact.spec.ts(64,19)` — không sửa; "tsc sạch" = không lỗi nào khác.
- **Không migration** ở đợt này. Không sửa `prisma/schema.prisma`, migration cũ, `prisma/sql/0*.sql`.
- FE: không thêm Zustand/TanStack. Màu dùng token (`text-muted-foreground`, `bg-muted`, `text-destructive`…). shadcn `base-nova` (Base UI): `render` prop thay `asChild`; `cn` từ `@/lib/utils`. Icon trong Button dùng `data-icon="inline-start|inline-end"` như code hiện có.
- Đọc trước khi viết FE dnd: README `node_modules/@dnd-kit/sortable` (mục multiple containers) sau khi cài ở Task 8.

---

## File map

| File | Việc |
|---|---|
| `back-end/package.json` | Sửa: deps `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `image-size@2`; script `r2:check` |
| `back-end/.env.example` | Sửa: 6 biến `R2_*` |
| `back-end/src/infra/storage.service.ts` | Tạo: `StorageService` |
| `back-end/src/infra/infra.module.ts` | Sửa: provide/export `StorageService` |
| `back-end/scripts/r2-check.ts` | Tạo: kiểm R2 thật |
| `back-end/src/common/zod.pipe.ts` | Sửa: export `isGuid` |
| `back-end/src/assets/file-check.ts` (+ `.spec.ts`) | Tạo: hằng số giới hạn, `isPdf`, `imageInfo` |
| `back-end/test/fixtures/files.ts` | Tạo: dựng buffer PDF/PNG/JPEG/WebP/exe cho test |
| `back-end/test/fake-storage.ts` | Tạo: `FakeStorage` cho e2e |
| `back-end/src/curriculum/reorder.ts` (+ `.spec.ts`) | Tạo: `reorder` |
| `back-end/src/instructor-courses/instructor-courses.{service,controller,module,schemas}.ts` | Sửa: `assertOwned`/`assertEditable`/`checklistFor`/`TX_OPTIONS` export, `setThumbnail`, `PUT /:id/thumbnail` |
| `back-end/src/assets/assets.{schemas,service,controller,module}.ts` | Tạo |
| `back-end/src/curriculum/curriculum.{schemas,service,controller,module}.ts` | Tạo |
| `back-end/src/app.module.ts` | Sửa: import `AssetsModule`, `CurriculumModule` |
| `back-end/test/curriculum.e2e-spec.ts` | Tạo: e2e assets + ảnh bìa + khung chương trình (một file, chung bootstrap) |
| `it-course-platform/package.json` | Sửa: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| `it-course-platform/src/types/curriculum.ts` | Tạo |
| `it-course-platform/src/lib/api/{curriculum,assets}.ts` | Tạo |
| `it-course-platform/src/lib/upload.ts` | Tạo: `uploadDocument`, `uploadThumbnail`, `uploadErrorMessage` |
| `…/manage/_components/course-provider.tsx` | Sửa: `patchCourse` |
| `…/manage/_components/checklist-sidebar.tsx` | Sửa: bật mục Khung chương trình |
| `…/manage/curriculum/page.tsx` | Tạo |
| `…/manage/_components/curriculum/{curriculum-context,curriculum-editor,section-card,item-row,drag-handle,inline-title,add-forms,lecture-detail-panel,content-picker}.tsx` | Tạo |
| `…/manage/_components/thumbnail-upload.tsx` | Tạo |
| `…/manage/_components/basics-form.tsx` | Sửa: dùng `ThumbnailUpload` |

`…/manage` = `it-course-platform/src/app/instructor/(manage)/courses/[id]/manage`.

Lệch nhỏ so với spec (đã cập nhật spec): `StorageService` ở `src/infra/` thay vì `src/storage/`; e2e gộp một file; FE tách `uploadDocument`/`uploadThumbnail` thay cho một `uploadFile(kind)`.

---

### Task 1: Dependency, env, `StorageService`, script `r2:check`

**Files:**
- Modify: `back-end/package.json`, `back-end/.env.example`, `back-end/src/infra/infra.module.ts`
- Create: `back-end/src/infra/storage.service.ts`, `back-end/scripts/r2-check.ts`

- [ ] **Step 1: Kiểm env có đủ chưa**

```bash
cd back-end && for v in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PUBLIC_BUCKET R2_PUBLIC_URL R2_PRIVATE_BUCKET; do grep -q "^$v=." .env && echo "ok $v" || echo "THIẾU $v"; done
```

Expected: 6 dòng `ok`. Có `THIẾU` → DỪNG, báo sếp điền (spec §8).

- [ ] **Step 2: Cài dependency**

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner image-size@2
```

Expected: `package.json` có 3 dep mới; dòng `dev:tunnel` vẫn còn.

- [ ] **Step 3: Thêm biến vào `.env.example`** — chèn ngay trước dòng `# Không bắt buộc`:

```
# Cloudflare R2 (spec curriculum-upload §4.1). Token Object Read & Write cho 2 bucket.
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
# bucket công khai (ảnh bìa) + domain công khai của nó, không có / cuối
R2_PUBLIC_BUCKET=
R2_PUBLIC_URL=
# bucket riêng tư (PDF), xem bằng presigned GET
R2_PRIVATE_BUCKET=

```

- [ ] **Step 4: Viết `back-end/src/infra/storage.service.ts`**

```ts
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadGatewayException, Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { requireEnv } from '../env.js';

export type Bucket = 'public' | 'private';

// R2 qua S3 SDK (spec curriculum-upload K1, K2): một client, 2 bucket theo tên.
// Video lên AWS S3 ở đợt 3 sẽ thêm client riêng.
@Injectable()
export class StorageService {
  private readonly client = new S3Client({
    region: 'auto',
    endpoint: `https://${requireEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
    },
    // Mặc định SDK gắn x-amz-checksum-crc32 vào URL ký PUT; trình duyệt không gửi header đó → R2 từ chối.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  private readonly buckets: Record<Bucket, string> = {
    public: requireEnv('R2_PUBLIC_BUCKET'),
    private: requireEnv('R2_PRIVATE_BUCKET'),
  };
  private readonly publicBase = requireEnv('R2_PUBLIC_URL').replace(/\/+$/, '');

  // Chữ ký gắn Content-Type + Content-Length: gửi file khác loại / khác cỡ → R2 trả 403 (spec K4).
  presignPut(bucket: Bucket, key: string, contentType: string, size: number): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.buckets[bucket],
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });
    return this.call(() =>
      getSignedUrl(this.client, command, {
        expiresIn: 600,
        signableHeaders: new Set(['content-type', 'content-length']),
      }),
    );
  }

  presignGet(key: string, ttlSec: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.buckets.private,
      Key: key,
      ResponseContentDisposition: 'inline',
    });
    return this.call(() => getSignedUrl(this.client, command, { expiresIn: ttlSec }));
  }

  // Không có object → null (chưa upload xong / key sai), lỗi khác → 502.
  async head(bucket: Bucket, key: string): Promise<{ size: number } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
      return { size: res.ContentLength ?? 0 };
    } catch (err) {
      if (err instanceof S3ServiceException && err.$metadata.httpStatusCode === 404) return null;
      throw this.fail(err);
    }
  }

  // bytes: chỉ đọc n byte đầu (GET có Range), bỏ trống = cả object.
  read(bucket: Bucket, key: string, bytes?: number): Promise<Buffer> {
    return this.call(async () => {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.buckets[bucket],
          Key: key,
          Range: bytes ? `bytes=0-${bytes - 1}` : undefined,
        }),
      );
      if (!res.Body) throw new Error(`R2 trả body rỗng cho ${key}`);
      return Buffer.from(await res.Body.transformToByteArray());
    });
  }

  delete(bucket: Bucket, key: string): Promise<void> {
    return this.call(async () => {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.buckets[bucket], Key: key }));
    });
  }

  publicUrl(key: string): string {
    return `${this.publicBase}/${key}`;
  }

  // URL ảnh bìa do mình sinh → key để xoá; URL ngoài (seed, Unsplash…) → null.
  keyOfPublicUrl(url: string | null): string | null {
    const prefix = `${this.publicBase}/`;
    return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  private async call<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      throw this.fail(err);
    }
  }

  // 502 là HttpException nên SentryGlobalFilter bỏ qua → tự gửi Sentry trước.
  private fail(err: unknown) {
    Sentry.captureException(err);
    return new BadGatewayException({ statusCode: 502, message: 'Lưu trữ đang lỗi, thử lại' });
  }
}
```

- [ ] **Step 5: Đăng ký trong `back-end/src/infra/infra.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { RedisService } from './redis.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  providers: [PrismaService, RedisService, StorageService],
  exports: [PrismaService, RedisService, StorageService],
})
export class InfraModule {}
```

- [ ] **Step 6: Viết `back-end/scripts/r2-check.ts`** (file tự đứng, không import code app)

```ts
// pnpm r2:check — kiểm env + quyền + domain công khai của R2 thật (spec curriculum-upload §7).
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

process.loadEnvFile();
const env = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
};

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

for (const [name, bucket] of [
  ['public', env('R2_PUBLIC_BUCKET')],
  ['private', env('R2_PRIVATE_BUCKET')],
] as const) {
  const Key = `r2-check/${Date.now()}.txt`;
  await client.send(new PutObjectCommand({ Bucket: bucket, Key, Body: 'x'.repeat(1024), ContentType: 'text/plain' }));
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key }));
  if (name === 'public') {
    const res = await fetch(`${env('R2_PUBLIC_URL').replace(/\/+$/, '')}/${Key}`);
    if (!res.ok) throw new Error(`Domain công khai trả ${res.status} — kiểm R2_PUBLIC_URL / bật public access`);
  }
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key }));
  console.log(`✓ ${name} (${bucket}): PUT → HEAD (${head.ContentLength} bytes) → DELETE OK`);
}
```

- [ ] **Step 7: Thêm script vào `package.json`** (sau dòng `"db:deploy"`, nhớ dấu phẩy):

```json
    "r2:check": "node --experimental-strip-types scripts/r2-check.ts"
```

- [ ] **Step 8: Chạy kiểm**

```bash
pnpm r2:check && pnpm exec tsc --noEmit -p tsconfig.json
```

Expected: 2 dòng `✓ public …` và `✓ private …`; `tsc` chỉ còn lỗi baseline. `r2:check` lỗi → DỪNG, báo sếp kèm thông báo lỗi (thường do token/bucket/public access).

---

### Task 2: `isGuid`, kiểm file (`file-check.ts`) + fixture

**Files:**
- Modify: `back-end/src/common/zod.pipe.ts`
- Create: `back-end/test/fixtures/files.ts`, `back-end/src/assets/file-check.ts`, `back-end/src/assets/file-check.spec.ts`

- [ ] **Step 1: Export `isGuid`** — thêm cuối `back-end/src/common/zod.pipe.ts`:

```ts
// id trên URL sai định dạng → Postgres ném lỗi uuid; service coi như không tồn tại (404).
export const isGuid = (id: string) => z.guid().safeParse(id).success;
```

- [ ] **Step 2: Viết fixture `back-end/test/fixtures/files.ts`** (đã kiểm với `image-size@2.0.4`)

```ts
// Buffer tối thiểu đủ để isPdf / image-size nhận dạng (spec curriculum-upload §7). Không phải file mở được.
const u16 = (n: number) => [n >> 8, n & 255];
const u32 = (n: number) => [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255];
const u32le = (n: number) => u32(n).reverse();
const u24le = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255];
const ascii = (s: string) => [...Buffer.from(s, 'latin1')];

export const pdf = Buffer.from('%PDF-1.7\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n%%EOF\n', 'latin1');

// File thực thi Windows đổi đuôi .pdf / .png.
export const exe = Buffer.from([...ascii('MZ'), 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]);

export const png = (w: number, h: number) =>
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...u32(13), ...ascii('IHDR'), ...u32(w), ...u32(h), 8, 2, 0, 0, 0, 0, 0, 0, 0]);

// SOI + APP0 (JFIF) + SOF0 + EOI.
export const jpg = (w: number, h: number) =>
  Buffer.from([
    0xff, 0xd8,
    0xff, 0xe0, ...u16(16), ...ascii('JFIF\0'), 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xff, 0xc0, ...u16(17), 8, ...u16(h), ...u16(w), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
    0xff, 0xd9,
  ]);

// RIFF/WEBP với chunk VP8X (kích thước canvas - 1, 24 bit LE).
export const webp = (w: number, h: number) => {
  const body = [...ascii('WEBP'), ...ascii('VP8X'), ...u32le(10), 0, 0, 0, 0, ...u24le(w - 1), ...u24le(h - 1)];
  return Buffer.from([...ascii('RIFF'), ...u32le(body.length), ...body]);
};
```

- [ ] **Step 3: Viết test `back-end/src/assets/file-check.spec.ts`**

```ts
import { exe, jpg, pdf, png, webp } from '../../test/fixtures/files.js';
import { imageInfo, isPdf } from './file-check.js';

describe('isPdf', () => {
  it('nhận file bắt đầu bằng %PDF-', () => expect(isPdf(pdf)).toBe(true));
  it('chỉ cần 5 byte đầu', () => expect(isPdf(pdf.subarray(0, 5))).toBe(true));
  it('từ chối exe đổi đuôi, ảnh, buffer rỗng', () => {
    expect(isPdf(exe)).toBe(false);
    expect(isPdf(png(800, 450))).toBe(false);
    expect(isPdf(Buffer.alloc(0))).toBe(false);
  });
});

describe('imageInfo', () => {
  it('đọc loại + kích thước PNG, JPEG, WebP', () => {
    expect(imageInfo(png(800, 450))).toEqual({ type: 'png', width: 800, height: 450 });
    expect(imageInfo(jpg(1280, 720))).toEqual({ type: 'jpg', width: 1280, height: 720 });
    expect(imageInfo(webp(750, 422))).toEqual({ type: 'webp', width: 750, height: 422 });
  });
  it('file không phải ảnh / buffer cắt cụt → null (không ném)', () => {
    expect(imageInfo(exe)).toBeNull();
    expect(imageInfo(pdf)).toBeNull();
    expect(imageInfo(Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x10, 0x00]))).toBeNull();
  });
});
```

- [ ] **Step 4: Chạy để thấy fail**

Run: `pnpm test src/assets/file-check.spec.ts`
Expected: FAIL — `Cannot find module './file-check.js'`.

- [ ] **Step 5: Viết `back-end/src/assets/file-check.ts`**

```ts
import { imageSize } from 'image-size';

// Giới hạn upload (spec curriculum-upload §4.3). FE dùng cùng số.
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const THUMBNAIL_MIN = { width: 750, height: 422 } as const;
export const IMAGE_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
export type ImageExt = (typeof IMAGE_EXT)[keyof typeof IMAGE_EXT];

const EXTS: readonly string[] = Object.values(IMAGE_EXT);

// Magic bytes: đổi đuôi .exe → .pdf vẫn bị chặn (spec K4).
export function isPdf(buf: Uint8Array): boolean {
  return Buffer.from(buf.subarray(0, 5)).toString('latin1') === '%PDF-';
}

// Loại thật + kích thước từ header ảnh; loại khác, hỏng hoặc image-size ném lỗi → null.
export function imageInfo(buf: Uint8Array): { type: ImageExt; width: number; height: number } | null {
  try {
    const { type, width, height } = imageSize(buf);
    if (!type || !EXTS.includes(type) || !width || !height) return null;
    return { type: type as ImageExt, width, height };
  } catch {
    return null;
  }
}
```

- [ ] **Step 6: Chạy test**

Run: `pnpm test src/assets/file-check.spec.ts`
Expected: PASS (5 test).

---

### Task 3: `reorder` (hàm thuần)

**Files:**
- Create: `back-end/src/curriculum/reorder.ts`, `back-end/src/curriculum/reorder.spec.ts`

- [ ] **Step 1: Viết test**

```ts
import { reorder } from './reorder.js';

describe('reorder', () => {
  const ids = ['a', 'b', 'c', 'd'];
  it('đưa lên đầu', () => expect(reorder(ids, 'c', 0)).toEqual(['c', 'a', 'b', 'd']));
  it('đưa xuống cuối', () => expect(reorder(ids, 'a', 3)).toEqual(['b', 'c', 'd', 'a']));
  it('index vượt độ dài → kẹp về cuối', () => expect(reorder(ids, 'b', 99)).toEqual(['a', 'c', 'd', 'b']));
  it('giữ nguyên chỗ', () => expect(reorder(ids, 'b', 1)).toEqual(ids));
  it('chèn id từ danh sách khác', () => expect(reorder(['a', 'b'], 'x', 1)).toEqual(['a', 'x', 'b']));
  it('chèn vào danh sách rỗng', () => expect(reorder([], 'x', 5)).toEqual(['x']));
  it('không đổi mảng đầu vào', () => {
    const input = [...ids];
    reorder(input, 'd', 0);
    expect(input).toEqual(ids);
  });
});
```

- [ ] **Step 2: Chạy để thấy fail**

Run: `pnpm test src/curriculum/reorder.spec.ts`
Expected: FAIL — `Cannot find module './reorder.js'`.

- [ ] **Step 3: Viết `back-end/src/curriculum/reorder.ts`**

```ts
// Thứ tự mới sau khi đặt `id` vào vị trí `index` (spec curriculum-upload §4.2). `id` có thể chưa có trong `ids`
// (mục chuyển từ phần khác). index vượt độ dài → cuối.
export function reorder(ids: readonly string[], id: string, index: number): string[] {
  const rest = ids.filter((x) => x !== id);
  rest.splice(Math.min(index, rest.length), 0, id);
  return rest;
}
```

- [ ] **Step 4: Chạy test**

Run: `pnpm test src/curriculum/reorder.spec.ts`
Expected: PASS (7 test).

---

### Task 4: `InstructorCoursesService` mở hàm dùng chung + ảnh bìa

**Files:**
- Modify: `back-end/src/instructor-courses/instructor-courses.service.ts`, `instructor-courses.controller.ts`, `instructor-courses.module.ts`, `instructor-courses.schemas.ts`

- [ ] **Step 1: Sửa phần đầu `instructor-courses.service.ts`** — import + export kiểu/hằng số:

Thay khối import và 3 dòng `type CourseRow…`, `type LectureStats…`, `const TX_OPTIONS…` bằng:

```ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { imageInfo, THUMBNAIL_MAX_BYTES, THUMBNAIL_MIN } from '../assets/file-check.js';
import { type FieldError, isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { buildChecklist } from './course-checklist.js';
import type { UpdateCourseInput } from './instructor-courses.schemas.js';
import { courseSlug } from './slugify.js';
```

(giữ nguyên `REF`, `COURSE_SELECT`), rồi:

```ts
export type CourseRow = Prisma.CourseGetPayload<{ select: typeof COURSE_SELECT }>;
export type LectureStats = { published: number; videoSeconds: number };

// DB dev là pooler Supabase ở xa (~1-2s/query): mặc định 5s của interactive transaction không đủ.
export const TX_OPTIONS = { maxWait: 10_000, timeout: 15_000 };
```

Bỏ import `z` khỏi `zod` (thay bằng `isGuid`).

- [ ] **Step 2: Constructor nhận `StorageService`**

```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}
```

- [ ] **Step 3: Đổi `update()` sang dùng `assertEditable`** — thay 8 dòng đầu thân hàm (`const course = await this.findOwned…` tới hết khối `if (course.status === 'in_review') {…}`) bằng:

```ts
    await this.assertEditable(id, instructorId);
```

và trong `detail()` đổi `this.findOwned(id, instructorId)` → `this.assertOwned(id, instructorId)`, `this.checklistOf(` → `this.checklistFor(`; trong `list()` đổi `this.checklistOf(` → `this.checklistFor(`.

- [ ] **Step 4: Thay hàm `findOwned` (private) bằng 2 hàm public + `setThumbnail`**

```ts
  // Không phải chủ khoá cũng trả 404 để không lộ khoá của người khác (spec course-create-basics §4.1).
  // Module curriculum dùng lại (spec curriculum-upload §4.1).
  async assertOwned(id: string, instructorId: string): Promise<CourseRow> {
    const course = isGuid(id)
      ? await this.prisma.course.findFirst({ where: { id, instructorId }, select: COURSE_SELECT })
      : null;
    if (!course) throw new NotFoundException();
    return course;
  }

  // Như assertOwned + khoá đang chờ duyệt thì không sửa được (409 COURSE_LOCKED).
  async assertEditable(id: string, instructorId: string): Promise<CourseRow> {
    const course = await this.assertOwned(id, instructorId);
    if (course.status === 'in_review') {
      throw new ConflictException({
        statusCode: 409,
        code: 'COURSE_LOCKED',
        message: 'Khoá học đang chờ duyệt, không sửa được',
      });
    }
    return course;
  }

  // Ảnh bìa (spec curriculum-upload §4.3): key do POST /instructor/assets/uploads sinh, ảnh đã nằm trên R2 public.
  async setThumbnail(id: string, instructorId: string, key: string) {
    const course = await this.assertEditable(id, instructorId);
    const ext = new RegExp(`^thumbnails/${instructorId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`).exec(key)?.[1];
    if (!ext) throw validationError([{ path: ['key'], message: 'Ảnh không hợp lệ' }]);
    const problem = await this.checkThumbnail(key, ext);
    if (problem) {
      await this.storage.delete('public', key);
      throw validationError([{ path: ['key'], message: problem }]);
    }
    await this.prisma.course.update({
      where: { id },
      data: { thumbnailUrl: this.storage.publicUrl(key), updatedAt: new Date() },
    });
    const oldKey = this.storage.keyOfPublicUrl(course.thumbnailUrl);
    // Xoá ảnh cũ lỗi chỉ để lại rác trên R2, không làm hỏng request (StorageService đã gửi Sentry).
    if (oldKey && oldKey !== key) await this.storage.delete('public', oldKey).catch(() => undefined);
    return this.detail(id, instructorId);
  }
```

- [ ] **Step 5: Đổi `checklistOf` (private) thành `checklistFor` (public) + thêm `checkThumbnail`**

```ts
  checklistFor(c: CourseRow, s: LectureStats | undefined) {
    return buildChecklist({
      ...c,
      hasPrimaryTopic: c.topics.length > 0,
      categoryDepth: c.category ? (c.category.parent ? 2 : 1) : null,
      publishedLectureCount: s?.published ?? 0,
      videoSeconds: s?.videoSeconds ?? 0,
    });
  }

  private async checkThumbnail(key: string, ext: string): Promise<string | null> {
    const head = await this.storage.head('public', key);
    if (!head) return 'Chưa tải ảnh lên';
    if (head.size > THUMBNAIL_MAX_BYTES) return 'Ảnh tối đa 5 MB';
    // Đọc cả ảnh (≤5 MB): JPEG có EXIF lớn có thể đặt kích thước sau 64 KB đầu.
    const info = imageInfo(await this.storage.read('public', key));
    if (!info || info.type !== ext) return 'File không phải ảnh JPG, PNG hoặc WebP';
    if (info.width < THUMBNAIL_MIN.width || info.height < THUMBNAIL_MIN.height) {
      return `Ảnh tối thiểu ${THUMBNAIL_MIN.width}×${THUMBNAIL_MIN.height} px`;
    }
    return null;
  }
```

- [ ] **Step 6: Schema + route** — cuối `instructor-courses.schemas.ts`:

```ts
export const setThumbnailSchema = z.object({ key: z.string().max(200) }).strict();
export type SetThumbnailInput = z.output<typeof setThumbnailSchema>;
```

`instructor-courses.controller.ts`: import thêm `Put` từ `@nestjs/common`, `setThumbnailSchema` và `type SetThumbnailInput`; thêm cuối class:

```ts
  @Put(':id/thumbnail')
  setThumbnail(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setThumbnailSchema)) body: SetThumbnailInput,
  ) {
    return this.courses.setThumbnail(id, user.id, body.key);
  }
```

- [ ] **Step 7: Export service** — `instructor-courses.module.ts`:

```ts
@Module({
  controllers: [InstructorCoursesController],
  providers: [InstructorCoursesService],
  exports: [InstructorCoursesService],
})
export class InstructorCoursesModule {}
```

- [ ] **Step 8: Không vỡ đợt 1**

```bash
pnpm exec tsc --noEmit -p tsconfig.json && pnpm test && pnpm test:e2e test/instructor-courses.e2e-spec.ts
```

Expected: tsc chỉ lỗi baseline; unit PASS; e2e `instructor-courses` PASS nguyên như cũ (refactor không đổi hành vi). Test ảnh bìa viết ở Task 6.

---

### Task 5: Module `assets`

**Files:**
- Create: `back-end/src/assets/assets.schemas.ts`, `assets.service.ts`, `assets.controller.ts`, `assets.module.ts`
- Modify: `back-end/src/app.module.ts`

- [ ] **Step 1: `assets.schemas.ts`**

```ts
import { z } from 'zod';
import { PDF_MAX_BYTES, THUMBNAIL_MAX_BYTES } from './file-check.js';

// spec curriculum-upload §4.3. kind lạ (vd 'video' trước đợt 3) → 400.
const fileName = z.string().trim().min(1).max(255);

export const createUploadSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('document'),
      fileName,
      mimeType: z.literal('application/pdf', 'Chỉ nhận file PDF'),
      sizeBytes: z.int().min(1).max(PDF_MAX_BYTES, 'PDF tối đa 1 GB'),
    })
    .strict(),
  z
    .object({
      kind: z.literal('thumbnail'),
      fileName,
      mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp'], 'Chỉ nhận ảnh JPG, PNG hoặc WebP'),
      sizeBytes: z.int().min(1).max(THUMBNAIL_MAX_BYTES, 'Ảnh tối đa 5 MB'),
    })
    .strict(),
]);
export type CreateUploadInput = z.output<typeof createUploadSchema>;

export const libraryQuerySchema = z.object({ q: z.string().trim().max(100).optional() });
export type LibraryQuery = z.output<typeof libraryQuerySchema>;
```

- [ ] **Step 2: `assets.service.ts`**

```ts
import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import type { CreateUploadInput } from './assets.schemas.js';
import { IMAGE_EXT, isPdf } from './file-check.js';

const LIBRARY_SELECT = { id: true, fileName: true, sizeBytes: true, createdAt: true } satisfies Prisma.AssetSelect;
type LibraryRow = Prisma.AssetGetPayload<{ select: typeof LIBRARY_SELECT }>;
const toLibraryAsset = (a: LibraryRow) => ({ ...a, sizeBytes: Number(a.sizeBytes) });

// ponytail: asset kẹt uploading/failed và ảnh bìa upload xong mà không gắn không được dọn (spec K11);
// thêm cron @nestjs/schedule khi có video ở đợt 3.
@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Key do BE sinh (người dùng không chọn đường dẫn), URL ký hạn 10 phút (spec K4).
  async createUpload(ownerId: string, body: CreateUploadInput) {
    const headers = { 'Content-Type': body.mimeType };
    if (body.kind === 'thumbnail') {
      const key = `thumbnails/${ownerId}/${randomUUID()}.${IMAGE_EXT[body.mimeType]}`;
      const uploadUrl = await this.storage.presignPut('public', key, body.mimeType, body.sizeBytes);
      return { assetId: null, key, uploadUrl, headers };
    }
    const key = `documents/${ownerId}/${randomUUID()}.pdf`;
    const { id } = await this.prisma.asset.create({
      data: {
        ownerId,
        kind: 'document',
        fileName: body.fileName,
        mimeType: body.mimeType,
        sizeBytes: body.sizeBytes,
        storageKey: key,
      },
      select: { id: true },
    });
    const uploadUrl = await this.storage.presignPut('private', key, body.mimeType, body.sizeBytes);
    return { assetId: id, key, uploadUrl, headers };
  }

  // Sau PUT lên R2: đúng cỡ đã khai + magic bytes PDF → ready; sai → xoá object, failed, 400.
  async complete(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: 'document', status: 'uploading' },
          select: { storageKey: true, sizeBytes: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    const problem = await this.checkPdf(asset.storageKey, Number(asset.sizeBytes));
    if (problem) {
      await this.storage.delete('private', asset.storageKey);
      await this.prisma.asset.update({ where: { id }, data: { status: 'failed' } });
      throw validationError([{ path: ['file'], message: problem }]);
    }
    const ready = await this.prisma.asset.update({ where: { id }, data: { status: 'ready' }, select: LIBRARY_SELECT });
    return toLibraryAsset(ready);
  }

  async library(ownerId: string, q?: string) {
    const rows = await this.prisma.asset.findMany({
      where: {
        ownerId,
        kind: 'document',
        status: 'ready',
        ...(q ? { fileName: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: LIBRARY_SELECT,
    });
    return rows.map(toLibraryAsset);
  }

  // Giảng viên xem PDF của mình (học viên xem ở đợt sau).
  async viewUrl(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: 'document', status: 'ready' },
          select: { storageKey: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    return { url: await this.storage.presignGet(asset.storageKey, 300) };
  }

  private async checkPdf(key: string, size: number): Promise<string | null> {
    const head = await this.storage.head('private', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    return isPdf(await this.storage.read('private', key, 5)) ? null : 'File không phải PDF';
  }
}
```

- [ ] **Step 3: `assets.controller.ts`**

```ts
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createUploadSchema, libraryQuerySchema } from './assets.schemas.js';
import type { CreateUploadInput, LibraryQuery } from './assets.schemas.js';
import { AssetsService } from './assets.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Post('uploads')
  createUpload(@CurrentUser() user: User, @Body(new ZodValidationPipe(createUploadSchema)) body: CreateUploadInput) {
    return this.assets.createUpload(user.id, body);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assets.complete(user.id, id);
  }

  @Get()
  library(@CurrentUser() user: User, @Query(new ZodValidationPipe(libraryQuerySchema)) query: LibraryQuery) {
    return this.assets.library(user.id, query.q);
  }

  @Get(':id/url')
  viewUrl(@CurrentUser() user: User, @Param('id') id: string) {
    return this.assets.viewUrl(user.id, id);
  }
}
```

- [ ] **Step 4: `assets.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

@Module({ controllers: [AssetsController], providers: [AssetsService] })
export class AssetsModule {}
```

- [ ] **Step 5: `app.module.ts`** — import `AssetsModule` (`./assets/assets.module.js`), thêm vào `imports` sau `InstructorCoursesModule`.

- [ ] **Step 6: tsc**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: chỉ lỗi baseline. E2E viết ở Task 6.

---

### Task 6: E2E assets + ảnh bìa (`FakeStorage`)

**Files:**
- Create: `back-end/test/fake-storage.ts`, `back-end/test/curriculum.e2e-spec.ts`

- [ ] **Step 1: `back-end/test/fake-storage.ts`**

```ts
import type { Bucket, StorageService } from '../src/infra/storage.service.js';

type StoragePort = Pick<
  StorageService,
  'presignPut' | 'presignGet' | 'head' | 'read' | 'delete' | 'publicUrl' | 'keyOfPublicUrl'
>;

// Thay R2 trong e2e (spec curriculum-upload §7): object nằm trong Map, URL ký là chuỗi giả.
// Test "upload" bằng put() thay cho trình duyệt PUT lên URL ký.
export class FakeStorage implements StoragePort {
  private readonly objects = new Map<string, Buffer>();
  static readonly PUBLIC = 'https://cdn.test';

  put(bucket: Bucket, key: string, body: Buffer) {
    this.objects.set(`${bucket}/${key}`, body);
  }
  has(bucket: Bucket, key: string) {
    return this.objects.has(`${bucket}/${key}`);
  }

  presignPut(bucket: Bucket, key: string) {
    return Promise.resolve(`https://fake.r2/${bucket}/${key}`);
  }
  presignGet(key: string) {
    return Promise.resolve(`https://fake.r2/private/${key}?signed=1`);
  }
  head(bucket: Bucket, key: string) {
    const body = this.objects.get(`${bucket}/${key}`);
    return Promise.resolve(body ? { size: body.length } : null);
  }
  read(bucket: Bucket, key: string, bytes?: number) {
    const body = this.objects.get(`${bucket}/${key}`);
    if (!body) return Promise.reject(new Error(`Không có ${bucket}/${key}`));
    return Promise.resolve(bytes ? body.subarray(0, bytes) : body);
  }
  delete(bucket: Bucket, key: string) {
    this.objects.delete(`${bucket}/${key}`);
    return Promise.resolve();
  }
  publicUrl(key: string) {
    return `${FakeStorage.PUBLIC}/${key}`;
  }
  keyOfPublicUrl(url: string | null) {
    const prefix = `${FakeStorage.PUBLIC}/`;
    return url?.startsWith(prefix) ? url.slice(prefix.length) : null;
  }
}
```

- [ ] **Step 2: Khung `back-end/test/curriculum.e2e-spec.ts` + test assets + ảnh bìa**

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
import { exe, jpg, pdf, png } from './fixtures/files.js';

const FE_URL = requireEnv('FE_URL');
const PASSWORD = 'Password123!';
const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
const SLOW = 120_000; // DB dev ~1-2s/query, mỗi mutation curriculum ~8-10 query

type TestUser = { id: string; cookie: string };
type Method = 'get' | 'post' | 'patch' | 'put' | 'delete';
type Item = {
  id: string;
  type: string;
  title: string;
  isPublished: boolean;
  lectureKind: string | null;
  description: string | null;
  isPreview: boolean;
  document: { id: string } | null;
  resources: { id: string; title: string }[];
};
type Tree = {
  sections: { id: string; title: string; items: Item[] }[];
  checklist: { key: string; missing: { message: string }[] }[];
};

describe('Assets + ảnh bìa + khung chương trình (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const storage = new FakeStorage();
  const emails: string[] = [];
  let alice: TestUser; // giảng viên chính
  let bob: TestUser; // giảng viên khác

  const call = (method: Method, path: string, cookie?: string, body?: object) => {
    const r = request(app.getHttpServer())[method](path).set('Origin', FE_URL).set('X-Forwarded-For', randomIp());
    const withCookie = cookie ? r.set('Cookie', cookie) : r;
    return body ? withCookie.send(body) : withCookie;
  };
  const cookieOf = (res: Response) =>
    (res.headers['set-cookie'] as unknown as string[]).map((c) => c.split(';')[0]).join('; ');
  const makeUser = async (role: string): Promise<TestUser> => {
    const email = `e2e-${randomUUID()}@example.com`;
    emails.push(email);
    await call('post', '/api/auth/sign-up/email', undefined, { name: 'E2E', email, password: PASSWORD }).expect(200);
    await prisma.user.update({ where: { email }, data: { emailVerified: true, role } });
    const res = await call('post', '/api/auth/sign-in/email', undefined, { email, password: PASSWORD }).expect(200);
    return { id: res.body.user.id as string, cookie: cookieOf(res) };
  };
  const newCourse = async (u: TestUser) =>
    (await call('post', '/api/instructor/courses', u.cookie, { title: 'Khoá e2e curriculum' }).expect(201)).body
      .id as string;
  const readyAsset = (ownerId: string, fileName = 'tai-lieu.pdf') =>
    prisma.asset.create({
      data: {
        ownerId,
        kind: 'document',
        fileName,
        mimeType: 'application/pdf',
        sizeBytes: 1000,
        storageKey: `documents/${ownerId}/${randomUUID()}.pdf`,
        status: 'ready',
      },
    });
  // Ký URL rồi "upload" thẳng vào FakeStorage.
  const uploaded = async (u: TestUser, kind: 'document' | 'thumbnail', body: Buffer, mimeType: string, sizeBytes = body.length) => {
    const res = await call('post', '/api/instructor/assets/uploads', u.cookie, {
      kind,
      fileName: kind === 'document' ? 'bai.pdf' : 'bia.png',
      mimeType,
      sizeBytes,
    }).expect(201);
    storage.put(kind === 'document' ? 'private' : 'public', res.body.key, body);
    return res.body as { assetId: string | null; key: string };
  };

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
    [alice, bob] = await Promise.all([makeUser('student,instructor'), makeUser('student,instructor')]);
  }, SLOW);

  // Dọn: course trước (section/item/resource cascade; item → asset là Restrict), asset, rồi user.
  afterAll(async () => {
    const ids = [alice, bob].filter(Boolean).map((u) => u.id);
    await prisma?.course.deleteMany({ where: { instructorId: { in: ids } } });
    await prisma?.asset.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma?.user.deleteMany({ where: { email: { in: emails } } });
    await app?.close();
  });

  describe('/api/instructor/assets', () => {
    it('ký upload PDF → asset uploading, key do BE sinh, URL bucket private', async () => {
      const { body } = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
        kind: 'document',
        fileName: 'bai-1.pdf',
        mimeType: 'application/pdf',
        sizeBytes: pdf.length,
      }).expect(201);
      expect(body.key).toMatch(new RegExp(`^documents/${alice.id}/[0-9a-f-]{36}\\.pdf$`));
      expect(body).toEqual({
        assetId: expect.any(String),
        key: body.key,
        uploadUrl: `https://fake.r2/private/${body.key}`,
        headers: { 'Content-Type': 'application/pdf' },
      });
      const asset = await prisma.asset.findUniqueOrThrow({ where: { id: body.assetId } });
      expect(asset).toMatchObject({ ownerId: alice.id, kind: 'document', status: 'uploading', storageKey: body.key });
    });

    it('ký upload ảnh bìa → không tạo asset, key thumbnails/{me}/…', async () => {
      const { body } = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
        kind: 'thumbnail',
        fileName: 'bia.webp',
        mimeType: 'image/webp',
        sizeBytes: 100,
      }).expect(201);
      expect(body.assetId).toBeNull();
      expect(body.key).toMatch(new RegExp(`^thumbnails/${alice.id}/[0-9a-f-]{36}\\.webp$`));
    });

    it('khai báo sai loại / quá cỡ / kind lạ → 400', async () => {
      const bad = [
        { kind: 'document', fileName: 'a.pdf', mimeType: 'image/png', sizeBytes: 10 },
        { kind: 'document', fileName: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 1024 ** 3 + 1 },
        { kind: 'thumbnail', fileName: 'a.gif', mimeType: 'image/gif', sizeBytes: 10 },
        { kind: 'thumbnail', fileName: 'a.png', mimeType: 'image/png', sizeBytes: 5 * 1024 ** 2 + 1 },
        { kind: 'video', fileName: 'a.mp4', mimeType: 'video/mp4', sizeBytes: 10 },
      ];
      for (const b of bad) await call('post', '/api/instructor/assets/uploads', alice.cookie, b).expect(400);
    });

    it('complete: chưa upload / sai cỡ / exe đổi đuôi → 400, failed, object bị xoá', async () => {
      const missing = await call('post', '/api/instructor/assets/uploads', alice.cookie, {
        kind: 'document',
        fileName: 'a.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      }).expect(201);
      await call('post', `/api/instructor/assets/${missing.body.assetId}/complete`, alice.cookie).expect(400);

      const wrongSize = await uploaded(alice, 'document', pdf, 'application/pdf', pdf.length + 1);
      const r1 = await call('post', `/api/instructor/assets/${wrongSize.assetId}/complete`, alice.cookie).expect(400);
      expect(r1.body.errors[0]).toMatchObject({ path: ['file'], message: 'Kích thước file không khớp lúc khai báo' });

      const fake = await uploaded(alice, 'document', exe, 'application/pdf');
      const r2 = await call('post', `/api/instructor/assets/${fake.assetId}/complete`, alice.cookie).expect(400);
      expect(r2.body.errors[0].message).toBe('File không phải PDF');
      expect(storage.has('private', fake.key)).toBe(false);

      const statuses = await prisma.asset.findMany({
        where: { id: { in: [missing.body.assetId, wrongSize.assetId!, fake.assetId!] } },
        select: { status: true },
      });
      expect(statuses.every((a) => a.status === 'failed')).toBe(true);
    }, SLOW);

    it('complete PDF thật → 200 ready; gọi lại / người khác → 404', async () => {
      const ok = await uploaded(alice, 'document', pdf, 'application/pdf');
      const other = await uploaded(alice, 'document', pdf, 'application/pdf');
      await call('post', `/api/instructor/assets/${other.assetId}/complete`, bob.cookie).expect(404);
      const { body } = await call('post', `/api/instructor/assets/${ok.assetId}/complete`, alice.cookie).expect(200);
      expect(body).toEqual({ id: ok.assetId, fileName: 'bai.pdf', sizeBytes: pdf.length, createdAt: expect.any(String) });
      await call('post', `/api/instructor/assets/${ok.assetId}/complete`, alice.cookie).expect(404);
      await call('post', '/api/instructor/assets/abc/complete', alice.cookie).expect(404);
    }, SLOW);

    it('thư viện: chỉ PDF ready của mình, lọc theo tên; URL xem chỉ chủ file', async () => {
      const mine = await readyAsset(alice.id, 'Slide Docker Compose.pdf');
      await readyAsset(bob.id, 'Slide Docker của Bob.pdf');
      const all = (await call('get', '/api/instructor/assets', alice.cookie).expect(200)).body as { id: string }[];
      expect(all.map((a) => a.id)).toContain(mine.id);
      const filtered = (await call('get', '/api/instructor/assets?q=docker', alice.cookie).expect(200)).body as {
        fileName: string;
      }[];
      expect(filtered.map((a) => a.fileName)).toEqual(['Slide Docker Compose.pdf']);
      const url = await call('get', `/api/instructor/assets/${mine.id}/url`, alice.cookie).expect(200);
      expect(url.body.url).toBe(`https://fake.r2/private/${mine.storageKey}?signed=1`);
      await call('get', `/api/instructor/assets/${mine.id}/url`, bob.cookie).expect(404);
    }, SLOW);
  });

  describe('PUT /api/instructor/courses/:id/thumbnail', () => {
    let courseId: string;
    const put = (key: string, u = alice) => call('put', `/api/instructor/courses/${courseId}/thumbnail`, u.cookie, { key });
    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it('ảnh hợp lệ → thumbnailUrl mới, checklist hết dòng ảnh bìa; thay ảnh → ảnh cũ bị xoá', async () => {
      const first = await uploaded(alice, 'thumbnail', png(800, 450), 'image/png');
      const r1 = await put(first.key).expect(200);
      expect(r1.body.thumbnailUrl).toBe(`${FakeStorage.PUBLIC}/${first.key}`);
      const basics = (r1.body.checklist as Tree['checklist']).find((c) => c.key === 'basics')!;
      expect(basics.missing.map((m) => m.message)).not.toContain('Chưa có ảnh bìa');

      const second = await uploaded(alice, 'thumbnail', jpg(1280, 720), 'image/jpeg');
      const r2 = await put(second.key).expect(200);
      expect(r2.body.thumbnailUrl).toBe(`${FakeStorage.PUBLIC}/${second.key}`);
      expect(storage.has('public', first.key)).toBe(false);
      expect(storage.has('public', second.key)).toBe(true);
    }, SLOW);

    it('ảnh nhỏ / exe đổi đuôi → 400, object bị xoá, ảnh cũ giữ nguyên', async () => {
      const before = (await call('get', `/api/instructor/courses/${courseId}`, alice.cookie).expect(200)).body
        .thumbnailUrl;
      const small = await uploaded(alice, 'thumbnail', png(700, 400), 'image/png');
      const r1 = await put(small.key).expect(400);
      expect(r1.body.errors[0]).toEqual({ path: ['key'], message: 'Ảnh tối thiểu 750×422 px' });
      expect(storage.has('public', small.key)).toBe(false);
      const fake = await uploaded(alice, 'thumbnail', exe, 'image/png');
      await put(fake.key).expect(400);
      const after = (await call('get', `/api/instructor/courses/${courseId}`, alice.cookie).expect(200)).body
        .thumbnailUrl;
      expect(after).toBe(before);
    }, SLOW);

    it('key của người khác / chưa upload / sai mẫu → 400; khoá của người khác → 404', async () => {
      const bobs = await uploaded(bob, 'thumbnail', png(800, 450), 'image/png');
      await put(bobs.key).expect(400);
      await put(`thumbnails/${alice.id}/${randomUUID()}.png`).expect(400);
      await put('../../etc/passwd').expect(400);
      await put(bobs.key, bob).expect(404);
    }, SLOW);

    it('khoá in_review → 409', async () => {
      await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
      const img = await uploaded(alice, 'thumbnail', png(800, 450), 'image/png');
      const res = await put(img.key).expect(409);
      expect(res.body.code).toBe('COURSE_LOCKED');
      await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
    }, SLOW);
  });

  // Task 7 thêm describe khung chương trình ở đây.
});
```

- [ ] **Step 3: Chạy**

Run: `pnpm test:e2e test/curriculum.e2e-spec.ts`
Expected: PASS toàn bộ 2 describe. Lỗi `Thiếu biến môi trường R2_*` → chưa có env (xem Global Constraints).

---

### Task 7: Module `curriculum` + e2e

**Files:**
- Create: `back-end/src/curriculum/curriculum.schemas.ts`, `curriculum.service.ts`, `curriculum.controller.ts`, `curriculum.module.ts`
- Modify: `back-end/src/app.module.ts`, `back-end/test/curriculum.e2e-spec.ts`

- [ ] **Step 1: Viết test e2e trước** — thay dòng `// Task 7 thêm describe khung chương trình ở đây.` bằng:

```ts
  describe('/api/instructor/courses/:id/curriculum…', () => {
    let courseId: string;
    let tree: Tree;
    const as = (method: Method, path: string, body?: object) =>
      call(method, `/api/instructor/courses/${courseId}${path}`, alice.cookie, body);
    const save = (res: Response) => {
      tree = res.body as Tree;
      return tree;
    };
    const sectionTitles = () => tree.sections.map((s) => s.title);
    const itemTitles = (sectionId: string) => tree.sections.find((s) => s.id === sectionId)!.items.map((i) => i.title);
    const lectureMissing = () =>
      tree.checklist.find((c) => c.key === 'curriculum')!.missing.some((m) => m.message.includes('bài giảng'));

    beforeAll(async () => {
      courseId = await newCourse(alice);
    }, SLOW);

    it('GET: phần + bài giảng mặc định, kèm checklist', async () => {
      save(await as('get', '/curriculum').expect(200));
      expect(tree.sections).toHaveLength(1);
      expect(tree.sections[0]).toMatchObject({
        title: 'Giới thiệu',
        items: [{ type: 'lecture', title: 'Giới thiệu', isPublished: false, document: null, resources: [] }],
      });
      expect(tree.checklist.map((c) => c.key)).toEqual(['goals', 'curriculum', 'basics']);
    });

    it('thêm / đổi tên phần; dữ liệu sai → 400', async () => {
      await as('post', '/sections', { title: 'Docker cơ bản' }).expect(201);
      save(await as('post', '/sections', { title: 'Compose' }).expect(201));
      expect(sectionTitles()).toEqual(['Giới thiệu', 'Docker cơ bản', 'Compose']);
      const compose = tree.sections[2].id;
      save(await as('patch', `/sections/${compose}`, { title: '  Docker Compose ' }).expect(200));
      expect(sectionTitles()[2]).toBe('Docker Compose');
      const bad = await as('patch', `/sections/${compose}`, { title: '' }).expect(400);
      expect(bad.body.errors[0].path).toEqual(['title']);
      await as('post', '/sections', { title: 'x'.repeat(81) }).expect(400);
      await as('patch', `/sections/${randomUUID()}`, { title: 'A' }).expect(404);
    }, SLOW);

    it('thêm mục 4 loại; loại lạ → 400; isPreview cho quiz → 400, cho lecture → OK', async () => {
      const docker = tree.sections[1].id;
      for (const [type, title] of [
        ['lecture', 'Cài Docker'],
        ['quiz', 'Ôn tập Docker'],
        ['practice_test', 'Thi thử'],
        ['coding_exercise', 'Viết Dockerfile'],
      ]) {
        save(await as('post', `/sections/${docker}/items`, { type, title }).expect(201));
      }
      expect(itemTitles(docker)).toEqual(['Cài Docker', 'Ôn tập Docker', 'Thi thử', 'Viết Dockerfile']);
      await as('post', `/sections/${docker}/items`, { type: 'assignment', title: 'X' }).expect(400);
      const [lecture, quiz] = tree.sections[1].items;
      const bad = await as('patch', `/items/${quiz.id}`, { isPreview: true }).expect(400);
      expect(bad.body.errors[0].path).toEqual(['isPreview']);
      save(await as('patch', `/items/${lecture.id}`, { description: ' Cài trên Ubuntu ', isPreview: true }).expect(200));
      expect(tree.sections[1].items[0]).toMatchObject({ description: 'Cài trên Ubuntu', isPreview: true });
    }, SLOW);

    it('move phần: lên đầu, index quá lớn → cuối', async () => {
      const [intro, docker, compose] = tree.sections.map((s) => s.id);
      save(await as('post', `/sections/${compose}/move`, { index: 0 }).expect(200));
      expect(tree.sections.map((s) => s.id)).toEqual([compose, intro, docker]);
      save(await as('post', `/sections/${compose}/move`, { index: 99 }).expect(200));
      expect(tree.sections.map((s) => s.id)).toEqual([intro, docker, compose]);
      const db = await prisma.section.findMany({ where: { courseId }, orderBy: { position: 'asc' }, select: { id: true } });
      expect(db.map((s) => s.id)).toEqual([intro, docker, compose]);
    }, SLOW);

    it('move mục trong phần và sang phần khác; DB đánh số liền mạch', async () => {
      const docker = tree.sections[1];
      const compose = tree.sections[2];
      const [lec, quiz, test, code] = docker.items.map((i) => i.id);
      save(await as('post', `/items/${code}/move`, { sectionId: docker.id, index: 0 }).expect(200));
      expect(tree.sections[1].items.map((i) => i.id)).toEqual([code, lec, quiz, test]);
      save(await as('post', `/items/${quiz}/move`, { sectionId: compose.id, index: 0 }).expect(200));
      expect(tree.sections[1].items.map((i) => i.id)).toEqual([code, lec, test]);
      expect(tree.sections[2].items.map((i) => i.id)).toEqual([quiz]);
      for (const sectionId of [docker.id, compose.id]) {
        const rows = await prisma.curriculumItem.findMany({ where: { sectionId }, orderBy: { position: 'asc' } });
        expect(rows.map((r) => r.position)).toEqual(rows.map((_, i) => i));
      }
    }, SLOW);

    it('move sang phần của khoá khác / id sai → 404', async () => {
      const bobCourse = await newCourse(bob);
      const bobSection = await prisma.section.findFirstOrThrow({ where: { courseId: bobCourse } });
      const item = tree.sections[1].items[0].id;
      await as('post', `/items/${item}/move`, { sectionId: bobSection.id, index: 0 }).expect(404);
      await as('post', `/items/${item}/move`, { sectionId: randomUUID(), index: 0 }).expect(404);
      await as('post', '/items/abc/move', { sectionId: tree.sections[0].id, index: 0 }).expect(404);
      await as('post', `/items/${item}/move`, { sectionId: 'abc', index: 0 }).expect(400);
    }, SLOW);

    it('gắn PDF → xuất bản; đủ 5 bài giảng → checklist hết dòng bài giảng; gỡ → chưa xuất bản', async () => {
      const intro = tree.sections[0].id;
      for (const title of ['Bài 2', 'Bài 3', 'Bài 4']) {
        save(await as('post', `/sections/${intro}/items`, { type: 'lecture', title }).expect(201));
      }
      const lectures = tree.sections.flatMap((s) => s.items).filter((i) => i.type === 'lecture');
      expect(lectures).toHaveLength(5);
      for (const lecture of lectures) {
        const asset = await readyAsset(alice.id);
        save(await as('put', `/items/${lecture.id}/content`, { assetId: asset.id }).expect(200));
      }
      const published = tree.sections.flatMap((s) => s.items).filter((i) => i.type === 'lecture');
      expect(published.every((i) => i.isPublished && i.lectureKind === 'document' && i.document)).toBe(true);
      expect(lectureMissing()).toBe(false);

      save(await as('delete', `/items/${lectures[0].id}/content`).expect(200));
      const removed = tree.sections.flatMap((s) => s.items).find((i) => i.id === lectures[0].id)!;
      expect(removed).toMatchObject({ isPublished: false, lectureKind: null, document: null });
      expect(lectureMissing()).toBe(true);
    }, 300_000);

    it('gắn asset không hợp lệ / gắn cho quiz → 400', async () => {
      const lecture = tree.sections.flatMap((s) => s.items).find((i) => i.type === 'lecture')!;
      const quiz = tree.sections.flatMap((s) => s.items).find((i) => i.type === 'quiz')!;
      const bobs = await readyAsset(bob.id);
      const uploading = await prisma.asset.create({
        data: {
          ownerId: alice.id,
          kind: 'document',
          fileName: 'x.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1,
          storageKey: `documents/${alice.id}/${randomUUID()}.pdf`,
        },
      });
      const video = await prisma.asset.create({
        data: {
          ownerId: alice.id,
          kind: 'video',
          fileName: 'v.mp4',
          mimeType: 'video/mp4',
          sizeBytes: 1,
          storageKey: `videos/${alice.id}/${randomUUID()}.mp4`,
          status: 'ready',
        },
      });
      for (const assetId of [bobs.id, uploading.id, video.id, randomUUID()]) {
        const res = await as('put', `/items/${lecture.id}/content`, { assetId }).expect(400);
        expect(res.body.errors[0].path).toEqual(['assetId']);
      }
      const mine = await readyAsset(alice.id);
      await as('put', `/items/${quiz.id}/content`, { assetId: mine.id }).expect(400);
    }, SLOW);

    it('tài nguyên: tiêu đề mặc định = tên file, tối đa 10, xoá được', async () => {
      const lecture = tree.sections.flatMap((s) => s.items).find((i) => i.type === 'lecture')!;
      const asset = await readyAsset(alice.id, 'Cheat sheet.pdf');
      save(await as('post', `/items/${lecture.id}/resources`, { assetId: asset.id }).expect(201));
      const added = tree.sections.flatMap((s) => s.items).find((i) => i.id === lecture.id)!.resources;
      expect(added).toEqual([{ id: expect.any(String), title: 'Cheat sheet.pdf', asset: expect.objectContaining({ id: asset.id }) }]);
      // Có sẵn 1 → seed thêm 9 thẳng DB cho nhanh → cái thứ 11 bị chặn.
      await prisma.lectureResource.createMany({
        data: Array.from({ length: 9 }, (_, i) => ({ itemId: lecture.id, assetId: asset.id, title: `R${i}`, position: i + 1 })),
      });
      const full = await as('post', `/items/${lecture.id}/resources`, { assetId: asset.id }).expect(400);
      expect(full.body.errors[0].message).toBe('Tối đa 10 tài nguyên mỗi bài giảng');
      save(await as('delete', `/resources/${added[0].id}`).expect(200));
      expect(tree.sections.flatMap((s) => s.items).find((i) => i.id === lecture.id)!.resources).toHaveLength(9);
    }, SLOW);

    it('xoá mục; xoá phần kéo theo mục bên trong', async () => {
      const compose = tree.sections[2];
      const itemIds = compose.items.map((i) => i.id);
      save(await as('delete', `/items/${tree.sections[1].items[0].id}`).expect(200));
      save(await as('delete', `/sections/${compose.id}`).expect(200));
      expect(tree.sections.map((s) => s.id)).not.toContain(compose.id);
      expect(await prisma.curriculumItem.count({ where: { id: { in: itemIds } } })).toBe(0);
    }, SLOW);

    it('khoá in_review → mutation 409, GET 200; giảng viên khác → 404', async () => {
      await prisma.course.update({ where: { id: courseId }, data: { status: 'in_review' } });
      const res = await as('post', '/sections', { title: 'Mới' }).expect(409);
      expect(res.body.code).toBe('COURSE_LOCKED');
      await as('get', '/curriculum').expect(200);
      await prisma.course.update({ where: { id: courseId }, data: { status: 'draft' } });
      await call('get', `/api/instructor/courses/${courseId}/curriculum`, bob.cookie).expect(404);
      await call('post', `/api/instructor/courses/${courseId}/sections`, bob.cookie, { title: 'X' }).expect(404);
    }, SLOW);
  });
```

- [ ] **Step 2: Chạy để thấy fail**

Run: `pnpm test:e2e test/curriculum.e2e-spec.ts -t "curriculum"`
Expected: FAIL — các route `/curriculum`, `/sections`… trả 404.

- [ ] **Step 3: `curriculum.schemas.ts`**

```ts
import { CurriculumItemType } from '@prisma/client';
import { z } from 'zod';

// spec curriculum-upload §4.2. FE dùng cùng giới hạn.
const title = z.string().trim().min(1, 'Nhập tiêu đề').max(80, 'Tối đa 80 ký tự');
const emptyToNull = (s: string) => (s === '' ? null : s);
const index = z.int().min(0);

export const createSectionSchema = z
  .object({ title, description: z.string().trim().max(200, 'Tối đa 200 ký tự').transform(emptyToNull).optional() })
  .strict();
export type CreateSectionInput = z.output<typeof createSectionSchema>;

export const updateSectionSchema = createSectionSchema.partial();
export type UpdateSectionInput = z.output<typeof updateSectionSchema>;

export const moveSectionSchema = z.object({ index }).strict();
export type MoveSectionInput = z.output<typeof moveSectionSchema>;

export const createItemSchema = z.object({ type: z.enum(CurriculumItemType), title }).strict();
export type CreateItemInput = z.output<typeof createItemSchema>;

export const updateItemSchema = z
  .object({
    title,
    description: z.string().trim().max(5000, 'Tối đa 5000 ký tự').transform(emptyToNull).nullable(),
    isPreview: z.boolean(),
    isDownloadable: z.boolean(),
  })
  .partial()
  .strict();
export type UpdateItemInput = z.output<typeof updateItemSchema>;

export const moveItemSchema = z.object({ sectionId: z.guid(), index }).strict();
export type MoveItemInput = z.output<typeof moveItemSchema>;

export const setContentSchema = z.object({ assetId: z.guid() }).strict();
export type SetContentInput = z.output<typeof setContentSchema>;

export const addResourceSchema = z.object({ assetId: z.guid(), title: title.optional() }).strict();
export type AddResourceInput = z.output<typeof addResourceSchema>;
```

- [ ] **Step 4: `curriculum.service.ts`**

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import {
  type CourseRow,
  InstructorCoursesService,
  TX_OPTIONS,
} from '../instructor-courses/instructor-courses.service.js';
import type {
  AddResourceInput,
  CreateItemInput,
  CreateSectionInput,
  UpdateItemInput,
  UpdateSectionInput,
} from './curriculum.schemas.js';
import { reorder } from './reorder.js';

type Tx = Prisma.TransactionClient;
export const MAX_RESOURCES = 10;
// moveItem sang phần khác ~7 query trong transaction; DB dev ~1-2s/query → 15s của TX_OPTIONS không đủ.
const MUTATE_TX = { ...TX_OPTIONS, timeout: 30_000 };

const ASSET_REF = { select: { id: true, fileName: true, sizeBytes: true } } as const;
const ITEM_SELECT = {
  id: true,
  type: true,
  title: true,
  position: true,
  isPublished: true,
  lectureKind: true,
  description: true,
  isPreview: true,
  isDownloadable: true,
  durationSec: true,
  documentAsset: ASSET_REF,
  resources: { orderBy: { position: 'asc' }, select: { id: true, title: true, asset: ASSET_REF } },
} satisfies Prisma.CurriculumItemSelect;
const LECTURE_ONLY = ['description', 'isPreview', 'isDownloadable'] as const;
// chk_item_payload: lecture chưa có nội dung thì 3 cột nội dung NULL và không xuất bản.
const NO_CONTENT = {
  lectureKind: null,
  videoAssetId: null,
  documentAssetId: null,
  durationSec: 0,
  isPublished: false,
} as const;

const toRef = (a: { id: string; fileName: string; sizeBytes: bigint }) => ({
  id: a.id,
  fileName: a.fileName,
  sizeBytes: Number(a.sizeBytes),
});

// Khung chương trình (spec curriculum-upload §4.2): mỗi thao tác ghi ngay (K5), trả cây + checklist (K12).
@Injectable()
export class CurriculumService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: InstructorCoursesService,
  ) {}

  async get(courseId: string, userId: string) {
    return this.tree(await this.courses.assertOwned(courseId, userId));
  }

  addSection(courseId: string, userId: string, body: CreateSectionInput) {
    return this.mutate(courseId, userId, async (tx) => {
      const { _max } = await tx.section.aggregate({ where: { courseId }, _max: { position: true } });
      await tx.section.create({ data: { courseId, ...body, position: (_max.position ?? -1) + 1 } });
    });
  }

  updateSection(courseId: string, userId: string, sectionId: string, body: UpdateSectionInput) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      await tx.section.update({ where: { id: sectionId }, data: body });
    });
  }

  deleteSection(courseId: string, userId: string, sectionId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      await tx.section.delete({ where: { id: sectionId } });
    });
  }

  moveSection(courseId: string, userId: string, sectionId: string, index: number) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      const rows = await tx.section.findMany({ where: { courseId }, orderBy: { position: 'asc' }, select: { id: true } });
      const ids = reorder(rows.map((r) => r.id), sectionId, index);
      // Một câu cho cả danh sách (DB dev ~1-2s/query); unique DEFERRABLE nên trùng tạm không lỗi.
      await tx.$executeRaw`
        UPDATE sections s SET position = (v.ord - 1)::int
        FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord)
        WHERE s.id = v.id`;
    });
  }

  addItem(courseId: string, userId: string, sectionId: string, body: CreateItemInput) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.section(tx, courseId, sectionId);
      const { _max } = await tx.curriculumItem.aggregate({ where: { sectionId }, _max: { position: true } });
      await tx.curriculumItem.create({
        data: { sectionId, courseId, ...body, position: (_max.position ?? -1) + 1 },
      });
    });
  }

  updateItem(courseId: string, userId: string, itemId: string, body: UpdateItemInput) {
    return this.mutate(courseId, userId, async (tx) => {
      const item = await this.item(tx, courseId, itemId);
      if (item.type !== 'lecture') {
        const bad = LECTURE_ONLY.filter((k) => body[k] !== undefined);
        if (bad.length) {
          throw validationError(bad.map((k) => ({ path: [k], message: 'Chỉ áp dụng cho bài giảng' })));
        }
      }
      await tx.curriculumItem.update({ where: { id: itemId }, data: body });
    });
  }

  deleteItem(courseId: string, userId: string, itemId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.item(tx, courseId, itemId);
      await tx.curriculumItem.delete({ where: { id: itemId } });
    });
  }

  moveItem(courseId: string, userId: string, itemId: string, sectionId: string, index: number) {
    return this.mutate(courseId, userId, async (tx) => {
      const item = await this.item(tx, courseId, itemId);
      await this.section(tx, courseId, sectionId);
      const target = await tx.curriculumItem.findMany({
        where: { sectionId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      await this.renumberItems(tx, sectionId, reorder(target.map((r) => r.id), itemId, index));
      if (item.sectionId !== sectionId) {
        // Mục đã sang phần mới → đánh số lại phần nguồn cho liền mạch.
        const source = await tx.curriculumItem.findMany({
          where: { sectionId: item.sectionId },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        await this.renumberItems(tx, item.sectionId, source.map((r) => r.id));
      }
    });
  }

  setContent(courseId: string, userId: string, itemId: string, assetId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      await this.usableDocument(tx, userId, assetId);
      // Một câu update: luôn thoả chk_item_payload; bài giảng có nội dung tự xuất bản (K9).
      await tx.curriculumItem.update({
        where: { id: itemId },
        data: { ...NO_CONTENT, lectureKind: 'document', documentAssetId: assetId, isPublished: true },
      });
    });
  }

  removeContent(courseId: string, userId: string, itemId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      await tx.curriculumItem.update({ where: { id: itemId }, data: NO_CONTENT });
    });
  }

  addResource(courseId: string, userId: string, itemId: string, body: AddResourceInput) {
    return this.mutate(courseId, userId, async (tx) => {
      await this.lecture(tx, courseId, itemId);
      const asset = await this.usableDocument(tx, userId, body.assetId);
      const agg = await tx.lectureResource.aggregate({
        where: { itemId },
        _count: { _all: true },
        _max: { position: true },
      });
      if (agg._count._all >= MAX_RESOURCES) {
        throw validationError([{ path: ['assetId'], message: `Tối đa ${MAX_RESOURCES} tài nguyên mỗi bài giảng` }]);
      }
      await tx.lectureResource.create({
        data: {
          itemId,
          assetId: body.assetId,
          title: body.title ?? asset.fileName.slice(0, 80),
          position: (agg._max.position ?? -1) + 1,
        },
      });
    });
  }

  removeResource(courseId: string, userId: string, resourceId: string) {
    return this.mutate(courseId, userId, async (tx) => {
      const found = isGuid(resourceId)
        ? await tx.lectureResource.findFirst({ where: { id: resourceId, item: { courseId } }, select: { id: true } })
        : null;
      if (!found) throw new NotFoundException();
      await tx.lectureResource.delete({ where: { id: resourceId } });
    });
  }

  // Mọi mutation: chủ khoá + không in_review, rồi transaction khoá dòng courses (một khoá cho cả khoá học,
  // không deadlock) để max+1 / đánh số lại không đụng nhau giữa 2 tab.
  private async mutate(courseId: string, userId: string, fn: (tx: Tx) => Promise<void>) {
    const course = await this.courses.assertEditable(courseId, userId);
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM courses WHERE id = ${courseId}::uuid FOR UPDATE`;
      await fn(tx);
    }, MUTATE_TX);
    return this.tree(course);
  }

  // Cây + checklist. Checklist không query thêm: dòng khoá đã có, số bài giảng/giây video đếm từ cây.
  private async tree(course: CourseRow) {
    const sections = await this.prisma.section.findMany({
      where: { courseId: course.id },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        position: true,
        items: { orderBy: { position: 'asc' }, select: ITEM_SELECT },
      },
    });
    let published = 0;
    let videoSeconds = 0;
    const out = sections.map((s) => ({
      ...s,
      items: s.items.map(({ documentAsset, resources, ...item }) => {
        if (item.type === 'lecture' && item.isPublished) {
          published++;
          if (item.lectureKind === 'video') videoSeconds += item.durationSec;
        }
        return {
          ...item,
          document: documentAsset && toRef(documentAsset),
          resources: resources.map((r) => ({ id: r.id, title: r.title, asset: toRef(r.asset) })),
        };
      }),
    }));
    return { sections: out, checklist: this.courses.checklistFor(course, { published, videoSeconds }) };
  }

  private renumberItems(tx: Tx, sectionId: string, ids: string[]) {
    return tx.$executeRaw`
      UPDATE curriculum_items i SET "sectionId" = ${sectionId}::uuid, position = (v.ord - 1)::int
      FROM unnest(${ids}::uuid[]) WITH ORDINALITY AS v(id, ord)
      WHERE i.id = v.id`;
  }

  private async section(tx: Tx, courseId: string, id: string) {
    const found = isGuid(id) ? await tx.section.findFirst({ where: { id, courseId }, select: { id: true } }) : null;
    if (!found) throw new NotFoundException();
    return found;
  }

  private async item(tx: Tx, courseId: string, id: string) {
    const found = isGuid(id)
      ? await tx.curriculumItem.findFirst({ where: { id, courseId }, select: { type: true, sectionId: true } })
      : null;
    if (!found) throw new NotFoundException();
    return found;
  }

  private async lecture(tx: Tx, courseId: string, id: string) {
    const item = await this.item(tx, courseId, id);
    if (item.type !== 'lecture') {
      throw validationError([{ path: [], message: 'Chỉ bài giảng mới có nội dung và tài nguyên' }]);
    }
    return item;
  }

  private async usableDocument(tx: Tx, userId: string, assetId: string) {
    const asset = await tx.asset.findFirst({
      where: { id: assetId, ownerId: userId, kind: 'document', status: 'ready' },
      select: { fileName: true },
    });
    if (!asset) throw validationError([{ path: ['assetId'], message: 'File không dùng được' }]);
    return asset;
  }
}
```

- [ ] **Step 5: `curriculum.controller.ts`**

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import {
  addResourceSchema,
  createItemSchema,
  createSectionSchema,
  moveItemSchema,
  moveSectionSchema,
  setContentSchema,
  updateItemSchema,
  updateSectionSchema,
} from './curriculum.schemas.js';
import type {
  AddResourceInput,
  CreateItemInput,
  CreateSectionInput,
  MoveItemInput,
  MoveSectionInput,
  SetContentInput,
  UpdateItemInput,
  UpdateSectionInput,
} from './curriculum.schemas.js';
import { CurriculumService } from './curriculum.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses/:courseId')
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get('curriculum')
  get(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.curriculum.get(courseId, user.id);
  }

  @Post('sections')
  addSection(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Body(new ZodValidationPipe(createSectionSchema)) body: CreateSectionInput,
  ) {
    return this.curriculum.addSection(courseId, user.id, body);
  }

  @Patch('sections/:sectionId')
  updateSection(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body(new ZodValidationPipe(updateSectionSchema)) body: UpdateSectionInput,
  ) {
    return this.curriculum.updateSection(courseId, user.id, sectionId, body);
  }

  @Delete('sections/:sectionId')
  deleteSection(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('sectionId') sectionId: string) {
    return this.curriculum.deleteSection(courseId, user.id, sectionId);
  }

  @Post('sections/:sectionId/move')
  @HttpCode(200)
  moveSection(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body(new ZodValidationPipe(moveSectionSchema)) body: MoveSectionInput,
  ) {
    return this.curriculum.moveSection(courseId, user.id, sectionId, body.index);
  }

  @Post('sections/:sectionId/items')
  addItem(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('sectionId') sectionId: string,
    @Body(new ZodValidationPipe(createItemSchema)) body: CreateItemInput,
  ) {
    return this.curriculum.addItem(courseId, user.id, sectionId, body);
  }

  @Patch('items/:itemId')
  updateItem(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: UpdateItemInput,
  ) {
    return this.curriculum.updateItem(courseId, user.id, itemId, body);
  }

  @Delete('items/:itemId')
  deleteItem(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.curriculum.deleteItem(courseId, user.id, itemId);
  }

  @Post('items/:itemId/move')
  @HttpCode(200)
  moveItem(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(moveItemSchema)) body: MoveItemInput,
  ) {
    return this.curriculum.moveItem(courseId, user.id, itemId, body.sectionId, body.index);
  }

  @Put('items/:itemId/content')
  setContent(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(setContentSchema)) body: SetContentInput,
  ) {
    return this.curriculum.setContent(courseId, user.id, itemId, body.assetId);
  }

  @Delete('items/:itemId/content')
  removeContent(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.curriculum.removeContent(courseId, user.id, itemId);
  }

  @Post('items/:itemId/resources')
  addResource(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(addResourceSchema)) body: AddResourceInput,
  ) {
    return this.curriculum.addResource(courseId, user.id, itemId, body);
  }

  @Delete('resources/:resourceId')
  removeResource(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('resourceId') resourceId: string,
  ) {
    return this.curriculum.removeResource(courseId, user.id, resourceId);
  }
}
```

- [ ] **Step 6: `curriculum.module.ts` + `app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { CurriculumController } from './curriculum.controller.js';
import { CurriculumService } from './curriculum.service.js';

@Module({ imports: [InstructorCoursesModule], controllers: [CurriculumController], providers: [CurriculumService] })
export class CurriculumModule {}
```

`app.module.ts`: import `CurriculumModule` (`./curriculum/curriculum.module.js`), thêm vào `imports` sau `AssetsModule`.

- [ ] **Step 7: Chạy**

```bash
pnpm exec tsc --noEmit -p tsconfig.json && pnpm test:e2e test/curriculum.e2e-spec.ts
```

Expected: tsc chỉ lỗi baseline; e2e PASS toàn bộ (assets, ảnh bìa, khung chương trình). Nếu `$executeRaw` báo lỗi kiểu mảng (`could not determine data type`), đổi `${ids}::uuid[]` → `${ids}::text[]::uuid[]`.

---

### Task 8: FE nền: dependency, type, API, upload, `patchCourse`

**Files:**
- Modify: `it-course-platform/package.json`, `…/manage/_components/course-provider.tsx`
- Create: `it-course-platform/src/types/curriculum.ts`, `src/lib/api/curriculum.ts`, `src/lib/api/assets.ts`, `src/lib/upload.ts`

- [ ] **Step 1: Cài dnd-kit**

```bash
cd ../it-course-platform && pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected: `@dnd-kit/core@^6.3`, `@dnd-kit/sortable@^10`, `@dnd-kit/utilities@^3.2`. Đọc `node_modules/@dnd-kit/sortable/README.md` (multiple containers).

- [ ] **Step 2: `src/types/curriculum.ts`**

```ts
import type { ChecklistItem } from './instructor-course';

// Khớp API back-end/src/curriculum + assets (spec 2026-10-01-curriculum-upload §4). Giới hạn giống BE.
export const ITEM_TYPE_LABEL = {
  lecture: 'Bài giảng',
  quiz: 'Trắc nghiệm',
  practice_test: 'Bài thi thử',
  coding_exercise: 'Bài tập coding',
} as const;
export type ItemType = keyof typeof ITEM_TYPE_LABEL;

export const MAX_TITLE = 80;
export const MAX_RESOURCES = 10;
export const MIN_PUBLISHED_LECTURES = 5;
export const MIN_VIDEO_MINUTES = 30;
export const PDF_MAX_BYTES = 1024 ** 3;
export const THUMBNAIL_MAX_BYTES = 5 * 1024 ** 2;
export const THUMBNAIL_MIN = { width: 750, height: 422 } as const;

export interface AssetRef {
  id: string;
  fileName: string;
  sizeBytes: number;
}

export interface LibraryAsset extends AssetRef {
  createdAt: string;
}

export interface CurriculumItem {
  id: string;
  type: ItemType;
  title: string;
  position: number;
  isPublished: boolean;
  lectureKind: 'video' | 'document' | null;
  description: string | null;
  isPreview: boolean;
  isDownloadable: boolean;
  durationSec: number;
  document: AssetRef | null;
  resources: { id: string; title: string; asset: AssetRef }[];
}

export interface CurriculumSection {
  id: string;
  title: string;
  description: string | null;
  position: number;
  items: CurriculumItem[];
}

export interface CurriculumResponse {
  sections: CurriculumSection[];
  checklist: ChecklistItem[];
}

export interface UpdateItemPayload {
  title?: string;
  description?: string | null;
  isPreview?: boolean;
  isDownloadable?: boolean;
}

export function formatBytes(n: number): string {
  if (n < 1024 ** 2) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
```

- [ ] **Step 3: `src/lib/api/curriculum.ts`**

```ts
import { api } from '@/lib/api/client';
import type { CurriculumResponse, ItemType, UpdateItemPayload } from '@/types/curriculum';

// API khung chương trình (spec 2026-10-01-curriculum-upload §4.2). Mọi mutation trả cây mới + checklist.
const base = (courseId: string) => `/instructor/courses/${courseId}`;
const tree = (req: Promise<{ data: CurriculumResponse }>) => req.then((r) => r.data);

export const getCurriculum = (courseId: string) => tree(api.get(`${base(courseId)}/curriculum`));

export const addSection = (courseId: string, title: string) =>
  tree(api.post(`${base(courseId)}/sections`, { title }));

export const renameSection = (courseId: string, sectionId: string, title: string) =>
  tree(api.patch(`${base(courseId)}/sections/${sectionId}`, { title }));

export const deleteSection = (courseId: string, sectionId: string) =>
  tree(api.delete(`${base(courseId)}/sections/${sectionId}`));

export const moveSection = (courseId: string, sectionId: string, index: number) =>
  tree(api.post(`${base(courseId)}/sections/${sectionId}/move`, { index }));

export const addItem = (courseId: string, sectionId: string, type: ItemType, title: string) =>
  tree(api.post(`${base(courseId)}/sections/${sectionId}/items`, { type, title }));

export const updateItem = (courseId: string, itemId: string, body: UpdateItemPayload) =>
  tree(api.patch(`${base(courseId)}/items/${itemId}`, body));

export const deleteItem = (courseId: string, itemId: string) => tree(api.delete(`${base(courseId)}/items/${itemId}`));

export const moveItem = (courseId: string, itemId: string, sectionId: string, index: number) =>
  tree(api.post(`${base(courseId)}/items/${itemId}/move`, { sectionId, index }));

export const setContent = (courseId: string, itemId: string, assetId: string) =>
  tree(api.put(`${base(courseId)}/items/${itemId}/content`, { assetId }));

export const removeContent = (courseId: string, itemId: string) =>
  tree(api.delete(`${base(courseId)}/items/${itemId}/content`));

export const addResource = (courseId: string, itemId: string, assetId: string) =>
  tree(api.post(`${base(courseId)}/items/${itemId}/resources`, { assetId }));

export const removeResource = (courseId: string, resourceId: string) =>
  tree(api.delete(`${base(courseId)}/resources/${resourceId}`));
```

- [ ] **Step 4: `src/lib/api/assets.ts`**

```ts
import { api } from '@/lib/api/client';
import type { LibraryAsset } from '@/types/curriculum';
import type { CourseDetail } from '@/types/instructor-course';

// spec 2026-10-01-curriculum-upload §4.3.
export interface UploadTicket {
  assetId: string | null;
  key: string;
  uploadUrl: string;
  headers: Record<string, string>;
}

export interface CreateUploadPayload {
  kind: 'document' | 'thumbnail';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const createUpload = (body: CreateUploadPayload) =>
  api.post<UploadTicket>('/instructor/assets/uploads', body).then((r) => r.data);

export const completeUpload = (assetId: string) =>
  api.post<LibraryAsset>(`/instructor/assets/${assetId}/complete`).then((r) => r.data);

export const listLibrary = (q: string, signal?: AbortSignal) =>
  api.get<LibraryAsset[]>('/instructor/assets', { params: q ? { q } : {}, signal }).then((r) => r.data);

export const getAssetUrl = (assetId: string) =>
  api.get<{ url: string }>(`/instructor/assets/${assetId}/url`).then((r) => r.data);

export const setThumbnail = (courseId: string, key: string) =>
  api.put<CourseDetail>(`/instructor/courses/${courseId}/thumbnail`, { key }).then((r) => r.data);
```

- [ ] **Step 5: `src/lib/upload.ts`**

```ts
import axios from 'axios';
import { completeUpload, createUpload } from '@/lib/api/assets';
import type { LibraryAsset } from '@/types/curriculum';

type Options = { onProgress?: (percent: number) => void; signal?: AbortSignal };

// Ký URL → PUT thẳng lên R2 (spec K4). axios trần, KHÔNG dùng instance `api`: không gửi cookie/baseURL của BE
// sang R2. Content-Length do trình duyệt tự đặt = file.size (khớp chữ ký). Huỷ bằng AbortSignal.
async function putToStorage(file: File, kind: 'document' | 'thumbnail', { onProgress, signal }: Options) {
  const ticket = await createUpload({ kind, fileName: file.name, mimeType: file.type, sizeBytes: file.size });
  await axios.put(ticket.uploadUrl, file, {
    headers: ticket.headers,
    signal,
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / (e.total ?? file.size)) * 100)),
  });
  return ticket;
}

export async function uploadDocument(file: File, options: Options = {}): Promise<LibraryAsset> {
  const ticket = await putToStorage(file, 'document', options);
  return completeUpload(ticket.assetId!);
}

// Trả key; gắn vào khoá bằng setThumbnail (BE kiểm ảnh ở bước đó).
export async function uploadThumbnail(file: File, options: Options = {}): Promise<string> {
  return (await putToStorage(file, 'thumbnail', options)).key;
}

// Câu báo lỗi cho ô upload; null = người dùng tự huỷ (không hiện gì).
export function uploadErrorMessage(err: unknown): string | null {
  if (axios.isCancel(err)) return null;
  const res = axios.isAxiosError(err) ? err.response : undefined;
  const first = (res?.data as { errors?: { message: string }[] } | undefined)?.errors?.[0]?.message;
  if (res?.status === 400 && first) return first;
  if (res?.status === 409) return 'Khoá học đang chờ duyệt, không sửa được';
  if (res?.status === 502) return 'Lưu trữ đang lỗi, thử lại';
  return 'Tải lên thất bại, thử lại';
}
```

- [ ] **Step 6: `patchCourse` trong `course-provider.tsx`**

Trong type `CourseContextValue` thêm sau `setCourse`:

```ts
  patchCourse: (patch: Partial<CourseDetail>) => void; // ghi đè vài trường (checklist sau khi sửa khung chương trình, status khi 409)
```

Trong `CourseProvider`, sau dòng `const router = useRouter();`:

```ts
  const patchCourse = useCallback(
    (patch: Partial<CourseDetail>) => setCourse((c) => (c ? { ...c, ...patch } : c)),
    [],
  );
```

và sửa `value`:

```ts
  const value = useMemo(
    () =>
      course
        ? { course, setCourse, patchCourse, dirty, setDirty, saveRef, discardRef, requestLeave: setPendingHref }
        : null,
    [course, dirty, patchCourse],
  );
```

- [ ] **Step 7: tsc**

Run: `pnpm exec tsc --noEmit`
Expected: sạch.

---

### Task 9: Trang Khung chương trình: khung, phần, mục, sửa tên (chưa kéo thả)

**Files:**
- Modify: `…/manage/_components/checklist-sidebar.tsx`
- Create: `…/manage/curriculum/page.tsx`, `…/manage/_components/curriculum/{curriculum-context,curriculum-editor,section-card,item-row,drag-handle,inline-title,add-forms}.tsx`
- Create (tạm, Task 11 viết thật): `…/manage/_components/curriculum/lecture-detail-panel.tsx`

- [ ] **Step 1: Bật mục trong sidebar** — `checklist-sidebar.tsx`:

```ts
type Entry = { label: string; key?: ChecklistKey; page?: "goals" | "curriculum" | "basics" };
```

và đổi entry "Khung chương trình":

```ts
    entries: [{ label: "Khung chương trình", key: "curriculum", page: "curriculum" }],
```

Sửa comment `// Mục không có page = "Sắp có" (đợt 2–4).` → `// Mục không có page = "Sắp có" (đợt 4).`

- [ ] **Step 2: `…/manage/curriculum/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { CurriculumEditor } from '../_components/curriculum/curriculum-editor';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Khung chương trình | SkillPath' };

export default function CurriculumPage() {
  return <CurriculumEditor />;
}
```

- [ ] **Step 3: `curriculum/curriculum-context.tsx`**

```tsx
'use client';

import { createContext, use } from 'react';
import type { CurriculumResponse } from '@/types/curriculum';

export type CurriculumContextValue = {
  courseId: string;
  locked: boolean; // khoá in_review
  // Gọi API → thay cây + checklist; lỗi → toast/khoá form/tải lại. Trả true nếu thành công.
  run: (fn: () => Promise<CurriculumResponse>, failMessage?: string) => Promise<boolean>;
  openItemId: string | null; // chỉ mở 1 LectureDetailPanel một lúc (spec §5.2)
  toggleItem: (id: string) => void;
  confirm: (message: string, action: () => void) => void;
};

export const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function useCurriculum(): CurriculumContextValue {
  const value = use(CurriculumContext);
  if (!value) throw new Error('useCurriculum phải nằm trong CurriculumEditor');
  return value;
}
```

- [ ] **Step 4: `curriculum/drag-handle.tsx`**

```tsx
'use client';

import { GripVertical } from 'lucide-react';

// Tay nắm kéo: nút thật (Tab tới được, Space nhấc/thả bằng KeyboardSensor). Nhận listeners/attributes của useSortable.
export function DragHandle({ label, ...props }: React.ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      {...props}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
```

- [ ] **Step 5: `curriculum/inline-title.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { MAX_TITLE } from '@/types/curriculum';

// Sửa tên tại chỗ (spec §5.2): Enter / rời ô → lưu nếu khác; rỗng → trả tên cũ; Esc → trả tên cũ.
export function InlineTitle({
  value,
  label,
  disabled,
  onSave,
}: {
  value: string;
  label: string;
  disabled?: boolean;
  onSave: (title: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const [failed, setFailed] = useState(false);
  // Tên mới từ server (lưu xong / tải lại cây) → cập nhật ô (adjust state khi prop đổi, không dùng effect).
  if (synced !== value) {
    setSynced(value);
    setDraft(value);
  }

  async function commit() {
    const title = draft.trim();
    if (!title || title === value) {
      setDraft(value);
      setFailed(false);
      return;
    }
    setFailed(!(await onSave(title)));
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Input
        value={draft}
        aria-label={label}
        maxLength={MAX_TITLE}
        disabled={disabled}
        aria-invalid={failed || undefined}
        className="h-8 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-input dark:bg-transparent"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setDraft(value);
            setFailed(false);
          }
        }}
      />
      {failed && <p className="px-2 text-xs text-destructive">Chưa lưu được tên, sửa rồi thử lại</p>}
    </div>
  );
}
```

- [ ] **Step 6: `curriculum/add-forms.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addItem, addSection } from '@/lib/api/curriculum';
import { ITEM_TYPE_LABEL, type ItemType, MAX_TITLE } from '@/types/curriculum';
import { useCurriculum } from './curriculum-context';

// Thêm mục: chọn loại + tiêu đề, Enter thêm, Esc huỷ (như bản phác thảo).
export function AddItemForm({ sectionId }: { sectionId: string }) {
  const { courseId, locked, run } = useCurriculum();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ItemType>('lecture');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setBusy(true);
    const ok = await run(() => addItem(courseId, sectionId, type, value));
    setBusy(false);
    if (ok) {
      setTitle('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" disabled={locked} onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        Mục trong chương trình
      </Button>
    );
  }
  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
      className="flex flex-col gap-2.5 rounded-lg border border-dashed bg-background p-3"
    >
      <div role="radiogroup" aria-label="Loại mục" className="flex flex-wrap gap-1.5">
        {(Object.keys(ITEM_TYPE_LABEL) as ItemType[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            role="radio"
            aria-checked={type === t}
            variant={type === t ? 'secondary' : 'outline'}
            onClick={() => setType(t)}
          >
            {ITEM_TYPE_LABEL[t]}
          </Button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          autoFocus
          value={title}
          maxLength={MAX_TITLE}
          placeholder={`Tiêu đề ${ITEM_TYPE_LABEL[type].toLowerCase()}`}
          aria-label="Tiêu đề mục"
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={!title.trim() || busy}>
            Thêm
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
        </div>
      </div>
    </form>
  );
}

export function AddSectionForm() {
  const { courseId, locked, run } = useCurriculum();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setBusy(true);
    const ok = await run(() => addSection(courseId, value));
    setBusy(false);
    if (ok) {
      setTitle('');
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <div>
        <Button variant="outline" disabled={locked} onClick={() => setOpen(true)}>
          <Plus data-icon="inline-start" />
          Thêm phần
        </Button>
      </div>
    );
  }
  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
      className="flex flex-col gap-2 rounded-xl border border-dashed bg-card p-3 sm:flex-row sm:items-center"
    >
      <Input
        autoFocus
        value={title}
        maxLength={MAX_TITLE}
        placeholder="Tên phần, ví dụ: Cài đặt môi trường"
        aria-label="Tên phần mới"
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim() || busy}>
          Thêm phần
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Huỷ
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 7: `curriculum/lecture-detail-panel.tsx` tạm** (Task 11 thay bằng bản thật)

```tsx
'use client';

import type { CurriculumItem } from '@/types/curriculum';

export function LectureDetailPanel({ item }: { item: CurriculumItem }) {
  return <div className="border-t px-4 py-3 text-sm text-muted-foreground">Chi tiết bài giảng {item.title}</div>;
}
```

- [ ] **Step 8: `curriculum/item-row.tsx`** (đã có `useSortable`; kéo thả chạy khi Task 10 thêm `DndContext`)

```tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteItem, updateItem } from '@/lib/api/curriculum';
import { cn } from '@/lib/utils';
import type { CurriculumItem } from '@/types/curriculum';
import { useCurriculum } from './curriculum-context';
import { DragHandle } from './drag-handle';
import { InlineTitle } from './inline-title';
import { LectureDetailPanel } from './lecture-detail-panel';

const DONE = 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300';

function chipOf(item: CurriculumItem): { text: string; className: string } {
  if (item.type !== 'lecture') return { text: 'Chưa xuất bản', className: 'bg-muted text-muted-foreground' };
  if (item.lectureKind === 'video') return { text: `Video · ${Math.round(item.durationSec / 60)} phút`, className: DONE };
  if (item.lectureKind === 'document') return { text: 'PDF', className: DONE };
  return { text: 'Chưa có nội dung', className: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
}

// label: "Bài giảng 3" — đánh số theo loại trên cả khoá, tính ở CurriculumEditor.
export function ItemRow({ item, label }: { item: CurriculumItem; label: string }) {
  const { courseId, locked, run, openItemId, toggleItem, confirm } = useCurriculum();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: 'item' },
    disabled: locked,
  });
  const open = openItemId === item.id;
  const chip = chipOf(item);

  const remove = () => {
    const go = () => void run(() => deleteItem(courseId, item.id));
    if (item.lectureKind || item.resources.length) {
      confirm(`Xoá "${label}: ${item.title}"? File PDF vẫn còn trong thư viện.`, go);
    } else go();
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('rounded-lg border bg-background', isDragging && 'relative z-10 opacity-70 shadow-lg')}
    >
      <div className="flex flex-wrap items-center gap-2 px-2 py-1.5 sm:flex-nowrap">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${label}`} disabled={locked} {...attributes} {...listeners} />
        <span className="shrink-0 text-sm font-semibold">{label}:</span>
        <InlineTitle
          value={item.title}
          label={`Tên ${label}`}
          disabled={locked}
          onSave={(title) => run(() => updateItem(courseId, item.id, { title }))}
        />
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', chip.className)}>
          {chip.text}
        </span>
        {item.type === 'lecture' ? (
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => toggleItem(item.id)}>
            Nội dung
            <ChevronDown data-icon="inline-end" className={cn('transition-transform', open && 'rotate-180')} />
          </Button>
        ) : (
          <Button variant="outline" size="xs" disabled title="Sắp có (đợt 4)">
            {item.type === 'coding_exercise' ? 'Mở trình soạn' : 'Soạn câu hỏi'} · đợt 4
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" aria-label={`Xoá ${label}`} disabled={locked} onClick={remove}>
          <Trash2 />
        </Button>
      </div>
      {open && <LectureDetailPanel item={item} />}
    </li>
  );
}
```

- [ ] **Step 9: `curriculum/section-card.tsx`**

```tsx
'use client';

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSection, renameSection } from '@/lib/api/curriculum';
import { cn } from '@/lib/utils';
import type { CurriculumSection } from '@/types/curriculum';
import { AddItemForm } from './add-forms';
import { useCurriculum } from './curriculum-context';
import { DragHandle } from './drag-handle';
import { InlineTitle } from './inline-title';
import { ItemRow } from './item-row';

export function SectionCard({
  section,
  index,
  labels,
}: {
  section: CurriculumSection;
  index: number;
  labels: Map<string, string>;
}) {
  const { courseId, locked, run, confirm } = useCurriculum();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
    disabled: locked,
  });
  const name = `Phần ${index + 1}`;

  const remove = () => {
    const go = () => void run(() => deleteSection(courseId, section.id));
    if (section.items.length) confirm(`Xoá "${name}" cùng ${section.items.length} mục bên trong?`, go);
    else go();
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={name}
      className={cn('flex flex-col gap-2 rounded-xl border bg-card p-3', isDragging && 'relative z-10 opacity-70 shadow-xl')}
    >
      <div className="flex items-center gap-2">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${name}`} disabled={locked} {...attributes} {...listeners} />
        <span className="shrink-0 text-sm font-bold">{name}:</span>
        <InlineTitle
          value={section.title}
          label={`Tên ${name}`}
          disabled={locked}
          onSave={(title) => run(() => renameSection(courseId, section.id, title))}
        />
        <Button variant="ghost" size="icon-sm" aria-label={`Xoá ${name}`} disabled={locked} onClick={remove}>
          <Trash2 />
        </Button>
      </div>
      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-10 flex-col gap-1.5 sm:pl-7">
          {section.items.map((item) => (
            <ItemRow key={item.id} item={item} label={labels.get(item.id) ?? ''} />
          ))}
        </ul>
      </SortableContext>
      <div className="sm:pl-7">
        <AddItemForm sectionId={section.id} />
      </div>
    </section>
  );
}
```

- [ ] **Step 10: `curriculum/curriculum-editor.tsx`** (chưa có `DndContext` — Task 10 thêm)

```tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
import { Skeleton } from '@/components/ui/skeleton';
import { getCurriculum } from '@/lib/api/curriculum';
import {
  type CurriculumResponse,
  type CurriculumSection,
  ITEM_TYPE_LABEL,
  type ItemType,
  MIN_PUBLISHED_LECTURES,
  MIN_VIDEO_MINUTES,
} from '@/types/curriculum';
import { useCourse } from '../course-provider';
import { PageHeader } from '../form-save';
import { AddSectionForm } from './add-forms';
import { CurriculumContext, type CurriculumContextValue } from './curriculum-context';
import { SectionCard } from './section-card';

// Trang Khung chương trình (spec curriculum-upload §5): ghi ngay từng thao tác (K5), không có thanh Lưu.
export function CurriculumEditor() {
  const { course, patchCourse, dirty } = useCourse();
  const courseId = course.id;
  const locked = course.status === 'in_review';
  const [sections, setSections] = useState<CurriculumSection[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [pending, setPending] = useState(0);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ message: string; action: () => void } | null>(null);

  const apply = useCallback(
    (res: CurriculumResponse) => {
      setSections(res.sections);
      patchCourse({ checklist: res.checklist });
    },
    [patchCourse],
  );

  const reload = useCallback(
    () =>
      getCurriculum(courseId).then(
        (res) => {
          apply(res);
          setLoadFailed(false);
        },
        () => setLoadFailed(true),
      ),
    [courseId, apply],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Lỗi theo spec §6: 409 → khoá trang (banner ở shell); 404 → tải lại cây; 400 → câu lỗi đầu; còn lại → toast.
  const run = useCallback<CurriculumContextValue['run']>(
    async (fn, failMessage = 'Lưu thất bại, thử lại') => {
      setPending((n) => n + 1);
      try {
        apply(await fn());
        return true;
      } catch (err) {
        const res = axios.isAxiosError(err) ? err.response : undefined;
        if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') patchCourse({ status: 'in_review' });
        else if (res?.status === 404) {
          toast.error('Không tìm thấy, đã tải lại khung chương trình');
          void reload();
        } else if (res?.status === 400) toast.error(res.data?.errors?.[0]?.message ?? 'Dữ liệu không hợp lệ');
        else toast.error(res?.status === 502 ? 'Lưu trữ đang lỗi, thử lại' : failMessage);
        return false;
      } finally {
        setPending((n) => n - 1);
      }
    },
    [apply, patchCourse, reload],
  );

  // Panel đang có thay đổi chưa lưu (dirty do useDirtySync của panel báo lên) → hỏi trước khi đóng/đổi panel.
  const toggleItem = useCallback(
    (id: string) => {
      if (dirty && !window.confirm('Bỏ thay đổi chưa lưu ở bài giảng đang mở?')) return;
      setOpenItemId((cur) => (cur === id ? null : id));
    },
    [dirty],
  );

  const ctx = useMemo<CurriculumContextValue>(
    () => ({
      courseId,
      locked,
      run,
      openItemId,
      toggleItem,
      confirm: (message, action) => setPendingConfirm({ message, action }),
    }),
    [courseId, locked, run, openItemId, toggleItem],
  );

  // "Bài giảng 3" — đếm theo loại trên cả khoá, theo thứ tự hiển thị.
  const labels = useMemo(() => {
    const count: Partial<Record<ItemType, number>> = {};
    const map = new Map<string, string>();
    for (const s of sections ?? []) {
      for (const it of s.items) {
        count[it.type] = (count[it.type] ?? 0) + 1;
        map.set(it.id, `${ITEM_TYPE_LABEL[it.type]} ${count[it.type]}`);
      }
    }
    return map;
  }, [sections]);

  const stats = useMemo(() => {
    let lectures = 0;
    let seconds = 0;
    for (const s of sections ?? []) {
      for (const it of s.items) {
        if (it.type !== 'lecture' || !it.isPublished) continue;
        lectures++;
        if (it.lectureKind === 'video') seconds += it.durationSec;
      }
    }
    return { lectures, minutes: Math.floor(seconds / 60) };
  }, [sections]);

  if (loadFailed) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">Không tải được khung chương trình.</p>
        <Button onClick={() => void reload()}>Thử lại</Button>
      </div>
    );
  }
  if (!sections) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const list = (
    <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
      <div className="flex flex-col gap-4">
        {sections.map((s, i) => (
          <SectionCard key={s.id} section={s} index={i} labels={labels} />
        ))}
      </div>
    </SortableContext>
  );

  return (
    <CurriculumContext value={ctx}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Khung chương trình"
            description="Chia khoá thành các phần, mỗi phần gồm bài giảng, trắc nghiệm, bài thi thử hoặc bài tập coding. Mọi thay đổi được lưu ngay."
          />
          <span className="shrink-0 pt-2 text-xs text-muted-foreground" aria-live="polite">
            {pending > 0 ? 'Đang lưu…' : 'Đã lưu'}
          </span>
        </div>
        <div
          id="curriculum"
          className="grid scroll-mt-20 gap-4 rounded-xl border bg-card p-4 transition-shadow sm:grid-cols-2"
        >
          <Meter label="Bài giảng đã có nội dung" value={stats.lectures} goal={MIN_PUBLISHED_LECTURES} unit="bài giảng" />
          <Meter
            label="Tổng thời lượng video"
            value={stats.minutes}
            goal={MIN_VIDEO_MINUTES}
            unit="phút"
            hint="Tải video có ở đợt 3"
          />
        </div>
        {list}
        <AddSectionForm />
      </div>
      <AlertDialog open={!!pendingConfirm} onOpenChange={(open) => !open && setPendingConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận</AlertDialogTitle>
            <AlertDialogDescription>{pendingConfirm?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost">Huỷ</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                pendingConfirm?.action();
                setPendingConfirm(null);
              }}
            >
              Đồng ý
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CurriculumContext>
  );
}

function Meter({ label, value, goal, unit, hint }: { label: string; value: number; goal: number; unit: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between gap-2 text-sm">
        <span className="font-semibold">
          {label} · cần ≥ {goal}
        </span>
        <span className="shrink-0 text-muted-foreground">
          {value}/{goal} {unit}
        </span>
      </div>
      <Progress
        value={Math.min(100, (value / goal) * 100)}
        aria-label={label}
        className="[&_[data-slot=progress-indicator]]:bg-green-500"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
```

Ghi chú cho Step 10: biến `list` tách riêng để Task 10 bọc `DndContext` quanh nó.

Dialog dùng chung cho xoá phần/mục và gỡ PDF (Task 11) nên tiêu đề là "Xác nhận", nút "Đồng ý".

- [ ] **Step 11: tsc + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch (warning `react-hooks/exhaustive-deps` về ref cleanup ở Task 11 là chấp nhận được, lỗi thì không).

---

### Task 10: Kéo thả bằng `@dnd-kit`

**Files:**
- Modify: `…/manage/_components/curriculum/curriculum-editor.tsx`

- [ ] **Step 1: Import** — thêm vào đầu file:

```tsx
import { useRef } from 'react';
import {
  type Announcements,
  closestCenter,
  closestCorners,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { moveItem, moveSection } from '@/lib/api/curriculum';
```

(gộp `useRef` vào import `react` sẵn có; gộp `arrayMove`, `sortableKeyboardCoordinates` vào import `@dnd-kit/sortable` sẵn có; gộp `moveItem`, `moveSection` vào import `@/lib/api/curriculum`).

- [ ] **Step 2: Hằng số + helper ngoài component** (đặt trên `export function CurriculumEditor`)

```tsx
// Kéo phần: chỉ va chạm với phần. Kéo mục: va chạm cả mục lẫn phần (thả được vào phần rỗng).
const collision: CollisionDetection = (args) =>
  args.active.data.current?.type === 'section'
    ? closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'section'),
      })
    : closestCorners(args);

const findSection = (list: CurriculumSection[], id: string) =>
  list.find((s) => s.id === id || s.items.some((i) => i.id === id));

const screenReaderInstructions = {
  draggable: 'Nhấn Space để nhấc lên. Dùng phím mũi tên để di chuyển, Space để thả, Esc để huỷ.',
};
const announcements: Announcements = {
  onDragStart: () => 'Đã nhấc lên.',
  onDragOver: ({ over }) => (over ? 'Đang ở vị trí mới.' : 'Ngoài vùng thả.'),
  onDragEnd: ({ over }) => (over ? 'Đã thả, đang lưu.' : 'Đã huỷ, trả về chỗ cũ.'),
  onDragCancel: () => 'Đã huỷ, trả về chỗ cũ.',
};
```

- [ ] **Step 3: Sensors + ref** — trong component, ngay sau `const [pendingConfirm, …] = useState…`:

```tsx
  const beforeDrag = useRef<CurriculumSection[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
```

- [ ] **Step 4: Handler** — đặt sau 2 khối `if (loadFailed)` / `if (!sections)` (lúc này `sections` khác null), trước `const list = …`:

```tsx
  const current = sections;

  // Kéo mục sang phần khác: chuyển ngay trong state để danh sách đích mở chỗ.
  function onDragOver({ active, over }: DragOverEvent) {
    if (active.data.current?.type !== 'item' || !over) return;
    setSections((prev) => {
      if (!prev) return prev;
      const from = findSection(prev, String(active.id));
      const to =
        over.data.current?.type === 'section' ? prev.find((s) => s.id === over.id) : findSection(prev, String(over.id));
      if (!from || !to || from.id === to.id) return prev;
      const item = from.items.find((i) => i.id === active.id);
      if (!item) return prev;
      const overIndex = to.items.findIndex((i) => i.id === over.id);
      const at = overIndex < 0 ? to.items.length : overIndex;
      return prev.map((s) => {
        if (s.id === from.id) return { ...s, items: s.items.filter((i) => i.id !== active.id) };
        if (s.id === to.id) return { ...s, items: [...s.items.slice(0, at), item, ...s.items.slice(at)] };
        return s;
      });
    });
  }

  // Thả: cập nhật state ngay (optimistic) rồi gọi move; lỗi → trả cây trước khi kéo (spec §5.2).
  function onDragEnd({ active, over }: DragEndEvent) {
    const before = beforeDrag.current;
    beforeDrag.current = null;
    if (!before) return;
    if (!over) {
      setSections(before);
      return;
    }
    const id = String(active.id);
    let next: CurriculumSection[];
    let call: () => Promise<CurriculumResponse>;
    if (active.data.current?.type === 'section') {
      const from = current.findIndex((s) => s.id === id);
      const to = current.findIndex((s) => s.id === over.id);
      if (to < 0 || from === to) return;
      next = arrayMove(current, from, to);
      call = () => moveSection(courseId, id, to);
    } else {
      const section = findSection(current, id);
      const origin = findSection(before, id);
      if (!section || !origin) return;
      const from = section.items.findIndex((i) => i.id === id);
      const overIndex = section.items.findIndex((i) => i.id === over.id);
      const to = overIndex < 0 ? from : overIndex;
      if (origin.id === section.id && origin.items.findIndex((i) => i.id === id) === to) {
        setSections(before);
        return;
      }
      next = current.map((s) => (s.id === section.id ? { ...s, items: arrayMove(s.items, from, to) } : s));
      call = () => moveItem(courseId, id, section.id, to);
    }
    setSections(next);
    void run(call, 'Không đổi được thứ tự').then((ok) => {
      if (!ok) setSections(before);
    });
  }
```

- [ ] **Step 5: Bọc `list` trong `DndContext`** — thay `const list = (…)` bằng:

```tsx
  const list = (
    <DndContext
      id="curriculum-dnd"
      sensors={sensors}
      collisionDetection={collision}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={() => {
        beforeDrag.current = current;
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        if (beforeDrag.current) setSections(beforeDrag.current);
        beforeDrag.current = null;
      }}
    >
      <SortableContext items={current.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4">
          {current.map((s, i) => (
            <SectionCard key={s.id} section={s} index={i} labels={labels} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
```

- [ ] **Step 6: tsc + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch. Kiểm tay kéo thả ở Task 13.

---

### Task 11: Chi tiết bài giảng, ô chọn file, tài nguyên

**Files:**
- Create: `…/manage/_components/curriculum/content-picker.tsx`
- Modify (viết lại): `…/manage/_components/curriculum/lecture-detail-panel.tsx`

- [ ] **Step 1: `curriculum/content-picker.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FileUp, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { listLibrary } from '@/lib/api/assets';
import { uploadDocument, uploadErrorMessage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { formatBytes, type LibraryAsset, PDF_MAX_BYTES } from '@/types/curriculum';

type Props = {
  onPick: (asset: LibraryAsset) => Promise<boolean>;
  onClose: () => void;
  // Đang tải: truyền hàm huỷ lên panel (dùng cho "Bỏ thay đổi" khi rời trang); xong / huỷ → null.
  onUploadingChange: (abort: (() => void) | null) => void;
};

// Ô chọn PDF (spec K7, §5.1): tab Tải lên / Thư viện. Cả 2 tab luôn mount (ẩn tab kia) để đổi tab không huỷ upload.
export function ContentPicker({ onPick, onClose, onUploadingChange }: Props) {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center gap-1.5">
        {(['upload', 'library'] as const).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? 'secondary' : 'ghost'}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t === 'upload' ? 'Tải lên' : 'Thư viện'}
          </Button>
        ))}
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Đóng ô chọn file" onClick={onClose}>
          <X />
        </Button>
      </div>
      <div hidden={tab !== 'upload'}>
        <UploadTab onPick={onPick} onUploadingChange={onUploadingChange} />
      </div>
      <div hidden={tab !== 'library'}>
        <LibraryTab onPick={onPick} />
      </div>
    </div>
  );
}

function UploadTab({ onPick, onUploadingChange }: Omit<Props, 'onClose'>) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);
  // Đóng ô chọn / thu gọn bài giảng / rời trang khi đang tải → huỷ PUT (spec §6).
  useEffect(() => () => ctrlRef.current?.abort(), []);

  async function start(file: File | undefined) {
    if (!file || ctrlRef.current) return;
    setError(null);
    if (file.type !== 'application/pdf') return setError('Chỉ nhận file PDF');
    if (file.size > PDF_MAX_BYTES) return setError('PDF tối đa 1 GB');
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    onUploadingChange(() => ctrl.abort());
    setProgress(0);
    try {
      const asset = await uploadDocument(file, { signal: ctrl.signal, onProgress: setProgress });
      await onPick(asset);
    } catch (err) {
      setError(uploadErrorMessage(err));
    } finally {
      ctrlRef.current = null;
      setProgress(null);
      onUploadingChange(null);
    }
  }

  if (progress !== null) {
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
  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void start(e.dataTransfer.files[0]);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-background px-4 py-6 text-center text-sm has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
          over && 'border-primary bg-primary/5',
        )}
      >
        <FileUp className="size-5 text-muted-foreground" />
        <span className="font-semibold">Chọn file PDF hoặc kéo thả vào đây</span>
        <span className="text-xs text-muted-foreground">Tối đa 1 GB</span>
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => {
            void start(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function LibraryTab({ onPick }: Pick<Props, 'onPick'>) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<LibraryAsset[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);

  // Tìm debounce 300ms, huỷ request cũ khi gõ tiếp.
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      listLibrary(q.trim(), ctrl.signal).then(
        (list) => {
          setItems(list);
          setFailed(false);
        },
        (err: unknown) => {
          if (!axios.isCancel(err)) setFailed(true);
        },
      );
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  async function choose(asset: LibraryAsset) {
    setPicking(asset.id);
    await onPick(asset);
    setPicking(null);
  }

  let body: React.ReactNode;
  if (failed) body = <p className="text-sm text-destructive">Không tải được thư viện.</p>;
  else if (items === null) body = <p className="text-sm text-muted-foreground">Đang tải…</p>;
  else if (items.length === 0) {
    body = (
      <p className="text-sm text-muted-foreground">
        {q.trim() ? 'Không có file khớp.' : 'Thư viện trống. Hãy tải file lên.'}
      </p>
    );
  } else {
    body = (
      <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
        {items.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              disabled={picking !== null}
              onClick={() => void choose(a)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <span className="min-w-0 flex-1 truncate">{a.fileName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(a.sizeBytes)} · {new Date(a.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          maxLength={100}
          placeholder="Tìm theo tên file"
          aria-label="Tìm trong thư viện"
          className="pl-8"
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {body}
    </div>
  );
}
```

- [ ] **Step 2: Viết lại `curriculum/lecture-detail-panel.tsx`**

```tsx
'use client';

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
  type CurriculumItem,
  type CurriculumResponse,
  formatBytes,
  type LibraryAsset,
  MAX_RESOURCES,
} from '@/types/curriculum';
import { useDirtySync } from '../course-provider';
import { submitToPromise } from '../form-save';
import { ContentPicker } from './content-picker';
import { useCurriculum } from './curriculum-context';

const schema = z.object({
  description: z.string().max(5000, 'Tối đa 5000 ký tự'),
  isPreview: z.boolean(),
  isDownloadable: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toValues = (item: CurriculumItem): Values => ({
  description: item.description ?? '',
  isPreview: item.isPreview,
  isDownloadable: item.isDownloadable,
});

// Mở tab trước khi await để trình duyệt không chặn popup, rồi trỏ tới URL ký (hạn 5 phút).
async function viewPdf(assetId: string) {
  const tab = window.open('', '_blank');
  try {
    const { url } = await getAssetUrl(assetId);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    }
  } catch {
    tab?.close();
    toast.error('Không mở được file');
  }
}

// Chi tiết bài giảng (spec §5.1): nội dung PDF + tài nguyên ghi ngay; mô tả / xem thử / cho tải có nút Lưu riêng (C3).
export function LectureDetailPanel({ item }: { item: CurriculumItem }) {
  const { courseId, locked, run, confirm } = useCurriculum();
  const [picker, setPicker] = useState<'content' | 'resource' | null>(null);
  const [abortUpload, setAbortUpload] = useState<(() => void) | null>(null);
  const uploading = abortUpload !== null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(item) });

  async function onSubmit(values: Values): Promise<boolean> {
    if (uploading) {
      toast.info('Đang tải file lên, chờ xong rồi lưu');
      return false;
    }
    const ok = await run(() =>
      updateItem(courseId, item.id, { ...values, description: values.description.trim() || null }),
    );
    if (ok) {
      reset(values);
      toast.success('Đã lưu');
    }
    return ok;
  }

  // Dirty khi form chưa lưu HOẶC đang upload (spec §5.2); "Bỏ thay đổi" = reset + huỷ upload.
  useDirtySync(isDirty || uploading, submitToPromise(handleSubmit, onSubmit), () => {
    abortUpload?.();
    reset();
  });

  const onUploadingChange = (abort: (() => void) | null) => setAbortUpload(() => abort);
  const pickWith = (call: (assetId: string) => Promise<CurriculumResponse>) => async (asset: LibraryAsset) => {
    const ok = await run(() => call(asset.id));
    if (ok) setPicker(null);
    return ok;
  };
  const doc = item.document;

  return (
    <fieldset disabled={locked} className="flex min-w-0 flex-col gap-5 border-t px-4 py-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Nội dung</p>
        {doc ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
            <FileText className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{doc.fileName}</span>
            <span className="text-xs text-muted-foreground">{formatBytes(doc.sizeBytes)}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void viewPdf(doc.id)}>
              <Eye data-icon="inline-start" />
              Xem
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPicker('content')}>
              <RefreshCw data-icon="inline-start" />
              Thay
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                confirm('Gỡ PDF khỏi bài giảng? Bài giảng sẽ thành chưa xuất bản; file vẫn còn trong thư viện.', () =>
                  void run(() => removeContent(courseId, item.id)),
                )
              }
            >
              <X data-icon="inline-start" />
              Gỡ
            </Button>
          </div>
        ) : (
          picker !== 'content' && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPicker('content')}>
                <FileText data-icon="inline-start" />
                Tài liệu PDF
              </Button>
              <Button type="button" variant="outline" size="sm" disabled title="Sắp có (đợt 3)">
                <Video data-icon="inline-start" />
                Video · đợt 3
              </Button>
            </div>
          )
        )}
        {picker === 'content' && (
          <ContentPicker
            onPick={pickWith((assetId) => setContent(courseId, item.id, assetId))}
            onClose={() => setPicker(null)}
            onUploadingChange={onUploadingChange}
          />
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        <Field data-invalid={!!errors.description || undefined}>
          <FieldLabel htmlFor={`desc-${item.id}`}>Mô tả bài giảng</FieldLabel>
          <Textarea
            id={`desc-${item.id}`}
            rows={3}
            placeholder="Học viên sẽ học được gì trong bài này?"
            aria-invalid={!!errors.description}
            {...register('description')}
          />
          {errors.description && <FieldError>{errors.description.message}</FieldError>}
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-primary" {...register('isPreview')} />
          Cho xem thử (không cần mua khoá)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-primary" {...register('isDownloadable')} />
          Cho tải xuống file PDF
        </label>
        <div>
          <Button type="submit" size="sm" disabled={!isDirty || isSubmitting}>
            {isSubmitting ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">
          Tài nguyên đính kèm{' '}
          <span className="font-normal text-muted-foreground">
            ({item.resources.length}/{MAX_RESOURCES})
          </span>
        </p>
        {item.resources.length > 0 && (
          <ul className="flex flex-col gap-1">
            {item.resources.map((r) => (
              <li key={r.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(r.asset.sizeBytes)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xoá tài nguyên ${r.title}`}
                  onClick={() => void run(() => removeResource(courseId, r.id))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {picker === 'resource' ? (
          <ContentPicker
            onPick={pickWith((assetId) => addResource(courseId, item.id, assetId))}
            onClose={() => setPicker(null)}
            onUploadingChange={onUploadingChange}
          />
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={item.resources.length >= MAX_RESOURCES}
              onClick={() => setPicker('resource')}
            >
              <Plus data-icon="inline-start" />
              Tài nguyên
            </Button>
          </div>
        )}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 3: tsc + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch (cho phép warning exhaustive-deps ở cleanup `ctrlRef.current?.abort()` — ref giữ AbortController, không phải DOM, cố ý đọc giá trị lúc unmount).

---

### Task 12: Ảnh bìa ở `basics`

**Files:**
- Create: `…/manage/_components/thumbnail-upload.tsx`
- Modify: `…/manage/_components/basics-form.tsx`

- [ ] **Step 1: `thumbnail-upload.tsx`**

```tsx
'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { setThumbnail } from '@/lib/api/assets';
import { uploadErrorMessage, uploadThumbnail } from '@/lib/upload';
import { THUMBNAIL_MAX_BYTES, THUMBNAIL_MIN } from '@/types/curriculum';
import { useCourse } from './course-provider';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Kiểm ở FE trước cho nhanh; BE kiểm lại magic bytes + kích thước (spec §4.3).
async function checkImage(file: File): Promise<string | null> {
  if (!TYPES.includes(file.type)) return 'Chỉ nhận ảnh JPG, PNG hoặc WebP';
  if (file.size > THUMBNAIL_MAX_BYTES) return 'Ảnh tối đa 5 MB';
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    if (width >= THUMBNAIL_MIN.width && height >= THUMBNAIL_MIN.height) return null;
    return `Ảnh ${width}×${height} px, cần tối thiểu ${THUMBNAIL_MIN.width}×${THUMBNAIL_MIN.height} px`;
  } catch {
    return 'Không đọc được ảnh';
  }
}

// Ảnh bìa ghi ngay khi tải xong (spec §5.3), không đi theo nút Lưu và không làm form basics dirty.
export function ThumbnailUpload({ disabled }: { disabled: boolean }) {
  const { course, setCourse, patchCourse } = useCourse();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function start(file: File | undefined) {
    if (!file) return;
    setError(null);
    const problem = await checkImage(file);
    if (problem) return setError(problem);
    setProgress(0);
    try {
      const key = await uploadThumbnail(file, { onProgress: setProgress });
      setCourse(await setThumbnail(course.id, key));
      toast.success('Đã cập nhật ảnh bìa');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) patchCourse({ status: 'in_review' });
      else setError(uploadErrorMessage(err));
    } finally {
      setProgress(null);
    }
  }

  return (
    <div id="thumbnail" className="grid scroll-mt-20 gap-4 rounded-lg transition-shadow sm:grid-cols-2">
      {course.thumbnailUrl ? (
        <Image
          src={course.thumbnailUrl}
          alt="Ảnh bìa hiện tại"
          width={375}
          height={211}
          unoptimized
          className="aspect-video w-full rounded-lg border object-cover"
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-muted text-[13px] text-muted-foreground">
          <ImageIcon />
          750 × 422 px
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold">Ảnh bìa</p>
        <p className="text-[13px]/relaxed text-muted-foreground">
          JPG, PNG hoặc WebP, tối thiểu 750×422 px, tối đa 5 MB, không chèn chữ quá nhiều. Ảnh hiển thị ở trang khoá và
          thẻ tìm kiếm.
        </p>
        {progress !== null ? (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" aria-label="Tiến độ tải ảnh" />
            <span className="w-10 text-right text-xs tabular-nums">{progress}%</span>
          </div>
        ) : (
          <div>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
              <Upload data-icon="inline-start" />
              {course.thumbnailUrl ? 'Thay ảnh' : 'Tải ảnh lên'}
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            void start(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Dùng trong `basics-form.tsx`**

Import: `import { ThumbnailUpload } from './thumbnail-upload';`. Thay **trọn** khối từ `<div id="thumbnail" …>` tới thẻ `</div>` đóng của nó (ngay trước khối `<div className="grid gap-4 sm:grid-cols-2">` của video quảng cáo), hiện là:

```tsx
              <div id="thumbnail" className="grid scroll-mt-20 gap-4 rounded-lg transition-shadow sm:grid-cols-2">
                <MediaPlaceholder icon={<ImageIcon />} caption="750 × 422 px" />
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold">Ảnh bìa</p>
                  <p className="text-[13px]/relaxed text-muted-foreground">
                    JPG/PNG, tối thiểu 750×422 px, không chèn chữ quá nhiều. Ảnh hiển thị ở trang khoá và thẻ tìm kiếm.
                  </p>
                  <span className="text-xs text-muted-foreground">Tải ảnh lên · sắp có (đợt 2)</span>
                </div>
              </div>
```

bằng:

```tsx
              <ThumbnailUpload disabled={locked} />
```

`MediaPlaceholder` vẫn dùng cho video quảng cáo; `ImageIcon` vẫn dùng ở thẻ xem trước — giữ import.

- [ ] **Step 3: tsc + lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: sạch.

---

### Task 13: Kiểm tra toàn bộ, kiểm tay bằng Chrome, đề xuất commit

**Files:** không tạo file mới.

- [ ] **Step 1: BE**

```bash
cd ../back-end && pnpm test && pnpm test:e2e && pnpm exec tsc --noEmit -p tsconfig.json; pnpm lint; pnpm r2:check
```

Expected: unit PASS (gồm `file-check`, `reorder` mới); e2e PASS toàn bộ (cũ + `curriculum`); tsc chỉ lỗi baseline; lint sạch; `r2:check` 2 dòng ✓.

- [ ] **Step 2: FE tĩnh**

```bash
cd ../it-course-platform && pnpm exec tsc --noEmit && pnpm lint && pnpm build
```

Expected: sạch; build xong (route `/instructor/courses/[id]/manage/curriculum` có trong danh sách).

- [ ] **Step 3: Chạy app** — BE `cd back-end && pnpm dev`; FE `cd it-course-platform && pnpm dev`.

- [ ] **Step 4: Kiểm tay bằng Chrome DevTools** (chụp màn hình từng mục)

1. Mở một khoá nháp → sidebar "Khung chương trình" không còn "Sắp có", bấm vào → `/manage/curriculum`: tiêu đề, "Đã lưu", 2 thanh tiến độ (0/5, 0/30 phút), "Phần 1: Giới thiệu" + "Bài giảng 1: Giới thiệu" chip "Chưa có nội dung"; không có thanh Lưu/Huỷ.
2. "+ Thêm phần" → gõ tên, Enter → phần mới cuối, "Đang lưu…" rồi "Đã lưu". Esc huỷ form.
3. "+ Mục trong chương trình": chọn từng loại (Bài giảng/Trắc nghiệm/Bài thi thử/Bài tập coding), Enter → mục mới, số thứ tự đúng theo loại ("Trắc nghiệm 1"). Quiz/coding có nút "… · đợt 4" disabled.
4. Sửa tên tại chỗ: đổi tên phần → Enter → lưu (Network 1 `PATCH`); đổi tên mục → bấm ra ngoài → lưu; gõ rồi Esc → tên cũ, không request; xoá hết rồi blur → tên cũ, không request.
5. Kéo thả chuột: kéo phần lên đầu; kéo mục trong phần; kéo mục sang phần khác (kể cả phần rỗng). Mỗi lần thả đúng **1** request `move`, tải lại trang thứ tự còn nguyên. Network "Offline" rồi kéo → toast "Không đổi được thứ tự", thứ tự trả về cũ.
6. Kéo thả bàn phím: Tab tới tay nắm ⠿ → Space → mũi tên xuống 2 lần → Space → mục đổi chỗ, lưu; Esc giữa chừng → trả chỗ cũ.
7. Bài giảng → "Nội dung ▾" → "Tài liệu PDF" → tab Tải lên: chọn file PNG → "Chỉ nhận file PDF"; chọn PDF ~20 MB → thanh % chạy (Network: `POST uploads` → `PUT` lên `*.r2.cloudflarestorage.com` không mang cookie → `POST complete` → `PUT content`), chip thành "PDF", thanh "bài giảng" tăng 1. Bấm "Huỷ" giữa chừng một lần khác → dừng, không gọi `complete`.
8. "Xem" → tab mới mở PDF (URL ký). "Thay" → tab Thư viện: gõ tên → ~300ms sau 1 request `GET /assets?q=` → chọn → đổi file. "Gỡ" → hộp xác nhận → chip "Chưa có nội dung".
9. Mô tả + "Cho xem thử": nút Lưu bật khi sửa → Lưu → toast "Đã lưu". Sửa mô tả rồi bấm "Trang tổng quan" ở sidebar → dialog "Rời trang khi chưa lưu?" (Ở lại / Bỏ thay đổi / Lưu & tiếp tục đều đúng). Sửa mô tả rồi mở bài giảng khác → `confirm` hỏi.
10. Tài nguyên: "+ Tài nguyên" → chọn từ thư viện → hiện tên + dung lượng; xoá được; đủ 10 → nút tắt.
11. Đủ 5 bài giảng có PDF → sidebar "Khung chương trình" chỉ còn dòng thiếu "… phút video".
12. Xoá phần còn mục → hộp xác nhận → phần biến mất.
13. `basics`: "Tải ảnh lên" với ảnh 600×400 → báo cỡ, không request; ảnh 1280×720 → % → ảnh hiện ngay ở khung và thẻ xem trước, toast; checklist bỏ dòng "Chưa có ảnh bìa"; form basics không thành "Có thay đổi chưa lưu". "Thay ảnh" → ảnh mới. Danh sách `/instructor/courses` hiện ảnh bìa.
14. (Tuỳ chọn, cần sếp đồng ý vì ghi DB dev) đặt khoá `in_review` (lệnh ở plan đợt 1 Task 13 bước 12) → trang khung chương trình: banner, mọi nút sửa/tay nắm/upload disabled; đặt lại `draft`.
15. 390×844: phần/mục xếp gọn, không tràn ngang, kéo bằng cảm ứng (DevTools emulate touch) chạy.

- [ ] **Step 5: Đề xuất commit (KHÔNG tự commit)**

Trình `git status` + `git diff --stat` cho sếp, lưu ý `back-end/package.json` có cả thay đổi `dev:tunnel` của sếp. Đề xuất:

```
feat: khung chương trình + upload PDF/ảnh bìa lên R2 (đợt 2 flow giảng viên)

- BE: StorageService (R2 qua S3 SDK, 2 bucket public/private), script r2:check
- BE: module assets (presigned PUT, complete kiểm magic bytes, thư viện, URL xem PDF)
- BE: module curriculum (CRUD phần/mục, move đánh số lại 1 câu SQL, nội dung PDF, tài nguyên)
- BE: PUT /instructor/courses/:id/thumbnail (kiểm ảnh ≥750×422, xoá ảnh cũ)
- FE: trang Khung chương trình với dnd-kit (chuột, cảm ứng, bàn phím), chi tiết bài giảng, ô chọn file + thư viện
- FE: upload ảnh bìa ở Trang tổng quan
```

Chờ sếp duyệt trước khi chạy `git commit`. Không push, không thêm Co-Authored-By.
