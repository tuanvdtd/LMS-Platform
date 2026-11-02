import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssetKind, Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import type { CreateUploadInput } from './assets.schemas.js';
import { hlsPrefix } from '../hls/hls-job.js';
import { HlsService } from '../hls/hls.service.js';
import { IMAGE_EXT, isPdf, mp4Duration, type Mp4Size, mp4Size, videoSizeProblem } from './file-check.js';

const LIBRARY_SELECT = {
  id: true,
  kind: true,
  fileName: true,
  sizeBytes: true,
  durationSec: true,
  status: true,
  createdAt: true,
} satisfies Prisma.AssetSelect;
const CONTENT_KINDS: AssetKind[] = ['document', 'video'];
// Asset document ở R2 private, video ở S3. Bucket suy từ kind, không có cột riêng.
export const bucketOf = (kind: AssetKind) => (kind === 'video' ? 'video' : 'private');
const HLS_TTL = 600;
const MP4_TTL = 3600;
// Có HLS → ký cả thư mục 10 phút (player tự đổi chữ ký trước khi hết, link lộ ra sống ngắn).
// Chưa có HLS / CloudFront bị tắt → MP4 1 giờ (player MP4 hết hạn phải tải lại video nên để dài).
export function videoUrl(storage: StorageService, a: { id: string; storageKey: string; hlsKey: string | null }) {
  return a.hlsKey && storage.hasCdn
    ? storage.signVideoPrefix(hlsPrefix(a.id), a.hlsKey, HLS_TTL)
    : storage.presignGet('video', a.storageKey, MP4_TTL);
}
type LibraryRow = Prisma.AssetGetPayload<{ select: typeof LIBRARY_SELECT }>;
const toLibraryAsset = (a: LibraryRow) => ({
  ...a,
  sizeBytes: Number(a.sizeBytes),
});

// ponytail: không cron dọn. PUT lỗi thì không có object; asset kẹt uploading/failed chỉ
// là dòng DB; video bị thay vẫn nằm trong thư viện để dùng lại. Thêm cron @nestjs/schedule khi rác đáng kể.
@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly hls: HlsService,
  ) {}

  // Key do BE sinh (người dùng không chọn đường dẫn), URL ký hạn 10 phút.
  async createUpload(ownerId: string, body: CreateUploadInput) {
    const headers = { 'Content-Type': body.mimeType };
    if (body.kind === 'thumbnail' || body.kind === 'avatar' || body.kind === 'promo') {
      // Ảnh bìa, ảnh hồ sơ, video giới thiệu: R2 public, không vào assets.
      const key =
        body.kind === 'promo'
          ? `promos/${ownerId}/${randomUUID()}.mp4`
          : `${body.kind === 'avatar' ? 'avatars' : 'thumbnails'}/${ownerId}/${randomUUID()}.${IMAGE_EXT[body.mimeType]}`;
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
        // Video: thời lượng client gửi.
        durationSec: body.kind === 'video' ? body.durationSec : null,
      },
      select: { id: true },
    });
    const uploadUrl = await this.storage.presignPut(bucketOf(body.kind), key, body.mimeType, body.sizeBytes);
    return { assetId: id, key, uploadUrl, headers };
  }

  // Sau PUT: đúng cỡ đã khai + đúng loại (PDF magic bytes, video MP4 ngang ≥720p) → ready (video có HLS: processing tới khi job xong); sai → xoá object, failed, 400.
  // Thời lượng video đã lưu lúc createUpload từ client, không ghi đè ở đây.
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
      await this.prisma.asset.update({
        where: { id },
        data: { status: 'failed' },
      });
      throw validationError([{ path: ['file'], message: checked }]);
    }
    // Video + HLS bật: gửi job trước (lỗi → 502, asset vẫn uploading để bấm lại), rồi processing.
    // Điều kiện uploading: bấm complete 2 lần song song thì lần sau 404; job thừa vô hại (webhook không tìm thấy asset).
    if (checked && this.hls.enabled) {
      const hlsJobId = await this.hls.submit({ id, storageKey: asset.storageKey }, checked);
      const { count } = await this.prisma.asset.updateMany({
        where: { id, status: 'uploading' },
        data: { status: 'processing', hlsJobId },
      });
      if (count === 0) throw new NotFoundException();
      return toLibraryAsset(await this.prisma.asset.findUniqueOrThrow({ where: { id }, select: LIBRARY_SELECT }));
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

  // Giảng viên xem lại PDF / video của mình.
  async viewUrl(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: { in: CONTENT_KINDS }, status: 'ready' },
          select: { id: true, kind: true, storageKey: true, hlsKey: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    if (asset.kind === 'video') return { url: await videoUrl(this.storage, asset) };
    return { url: await this.storage.presignGet('private', asset.storageKey, 300) };
  }

  private async checkPdf(key: string, size: number): Promise<string | null> {
    const head = await this.storage.head('private', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    const ok = isPdf(await this.storage.read('private', key, { offset: 0, length: 5 }));
    return ok ? null : 'File không phải PDF';
  }

  private async checkVideo(key: string, size: number): Promise<string | Mp4Size> {
    const head = await this.storage.head('video', key);
    if (!head) return 'Chưa tải file lên';
    if (head.size !== size) return 'Kích thước file không khớp lúc khai báo';
    const read = (offset: number, length: number) => this.storage.read('video', key, { offset, length });
    // Chỉ kiểm cấu trúc MP4; duration trong file bỏ qua (MP4 fragmented có mvhd = 0).
    if ((await mp4Duration(read, size)) === null) return 'File không phải video MP4 hợp lệ';
    const dims = await mp4Size(read, size);
    if (!dims) return 'File không phải video MP4 hợp lệ';
    return videoSizeProblem(dims) ?? dims;
  }
}
