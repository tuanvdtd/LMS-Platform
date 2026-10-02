import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssetKind, Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import type { CreateUploadInput } from './assets.schemas.js';
import { IMAGE_EXT, isPdf, mp4Duration } from './file-check.js';

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
type LibraryRow = Prisma.AssetGetPayload<{ select: typeof LIBRARY_SELECT }>;
const toLibraryAsset = (a: LibraryRow) => ({
  ...a,
  sizeBytes: Number(a.sizeBytes),
});

// ponytail: không cron dọn (spec video-upload V10). PUT lỗi thì không có object; asset kẹt uploading/failed chỉ
// là dòng DB; video bị thay vẫn nằm trong thư viện để dùng lại. Thêm cron @nestjs/schedule khi rác đáng kể.
@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

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
        // Video: thời lượng client gửi (spec video-upload V5).
        durationSec: body.kind === 'video' ? body.durationSec : null,
      },
      select: { id: true },
    });
    const uploadUrl = await this.storage.presignPut(bucketOf(body.kind), key, body.mimeType, body.sizeBytes);
    return { assetId: id, key, uploadUrl, headers };
  }

  // Sau PUT: đúng cỡ đã khai + đúng loại (PDF magic bytes, video MP4 hợp lệ) → ready; sai → xoá object, failed, 400.
  // Thời lượng video đã lưu lúc createUpload từ client, không ghi đè ở đây (spec video-upload V5).
  async complete(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: { in: CONTENT_KINDS }, status: 'uploading' },
          select: { kind: true, storageKey: true, sizeBytes: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    const bucket = bucketOf(asset.kind);
    const problem =
      asset.kind === 'video'
        ? await this.checkVideo(asset.storageKey, Number(asset.sizeBytes))
        : await this.checkPdf(asset.storageKey, Number(asset.sizeBytes));
    if (problem) {
      await this.storage.delete(bucket, asset.storageKey);
      await this.prisma.asset.update({
        where: { id },
        data: { status: 'failed' },
      });
      throw validationError([{ path: ['file'], message: problem }]);
    }
    const ready = await this.prisma.asset.update({
      where: { id },
      data: { status: 'ready' },
      select: LIBRARY_SELECT,
    });
    return toLibraryAsset(ready);
  }

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

  private async checkPdf(key: string, size: number): Promise<string | null> {
    const head = await this.storage.head('private', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    const ok = isPdf(await this.storage.read('private', key, { offset: 0, length: 5 }));
    return ok ? null : 'File không phải PDF';
  }

  private async checkVideo(key: string, size: number): Promise<string | null> {
    const head = await this.storage.head('video', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    // Chỉ kiểm cấu trúc MP4; duration trong file bỏ qua (MP4 fragmented có mvhd = 0) — spec video-upload V5.
    const parsed = await mp4Duration((offset, length) => this.storage.read('video', key, { offset, length }), size);
    return parsed === null ? 'File không phải video MP4 hợp lệ' : null;
  }
}
