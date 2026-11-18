import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { AssetKind, Prisma } from '@prisma/client';
import { tooManyRequests } from '../common/http.js';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, incrBy, rateLimit } from '../infra/redis.js';
import { type Bucket, StorageService } from '../infra/storage.service.js';
import type { CreateUploadInput } from './assets.schemas.js';
import { hlsPrefix } from '../hls/hls-job.js';
import { HlsService } from '../hls/hls.service.js';
import { IMAGE_EXT, isPdf, mp4Duration, type Mp4Size, mp4Size, videoSizeProblem } from './file-check.js';
import {
  STALE_UPLOAD_MS,
  UPLOADS_PER_HOUR,
  VIDEO_COUNTER_TTL_SEC,
  storageFullMessage,
  videoMinutesFullMessage,
  videoMonthKey,
} from './limits.js';
import { StorageUsageService } from './usage.service.js';

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

// Dòng uploading / failed bỏ lại và video giới thiệu không dùng do AssetsCleanupService dọn định kỳ.
// Video bị thay vẫn nằm trong thư viện để dùng lại; giảng viên tự xoá khi cần chỗ.
@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly hls: HlsService,
    private readonly redis: RedisService,
    private readonly usage: StorageUsageService,
  ) {}

  // Key do BE sinh (người dùng không chọn đường dẫn), URL ký hạn 10 phút.
  async createUpload(ownerId: string, body: CreateUploadInput) {
    if (!(await rateLimit(this.redis, `rl:upload:${ownerId}`, UPLOADS_PER_HOUR, 3600))) throw tooManyRequests();
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
    // ponytail: hai lượt xin link song song có thể cùng lọt (vượt tối đa một file); cần chặt hơn thì khoá theo người dùng.
    const limits = await this.usage.limitsOf(ownerId);
    const used = await this.usage.usedBytes(ownerId);
    if (used + body.sizeBytes > limits.storageBytes) {
      throw validationError([{ path: ['file'], message: storageFullMessage(used, limits.storageBytes) }]);
    }
    // Chỉ đọc bộ đếm: báo sớm để người dùng khỏi tải cả file rồi mới biết. Cộng thật ở complete.
    // ponytail: thời lượng do trình duyệt gửi; cần chặt hơn thì đọc từ file ở complete (mp4Duration).
    if (body.kind === 'video' && this.hls.enabled) {
      const seconds = await this.usage.videoSecondsUsed(ownerId);
      if (seconds + body.durationSec > limits.videoSecondsPerMonth) {
        throw validationError([
          { path: ['file'], message: videoMinutesFullMessage(seconds, limits.videoSecondsPerMonth) },
        ]);
      }
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
          select: { kind: true, storageKey: true, sizeBytes: true, createdAt: true, durationSec: true },
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
    const limits = await this.usage.limitsOf(ownerId);
    // Tải lâu hơn 1 giờ: dòng đã không còn được tính vào dung lượng lúc người khác xin link → kiểm lại trước khi nhận.
    if (asset.createdAt.getTime() < Date.now() - STALE_UPLOAD_MS) {
      const used = await this.usage.usedBytes(ownerId);
      if (used + Number(asset.sizeBytes) > limits.storageBytes) {
        throw await this.reject(id, bucket, asset.storageKey, storageFullMessage(used, limits.storageBytes));
      }
    }
    // Video + HLS bật: cộng phút, gửi job (lỗi → 502, asset vẫn uploading để bấm lại), rồi processing.
    if (checked && this.hls.enabled) {
      const seconds = asset.durationSec ?? 0;
      const counterKey = videoMonthKey(ownerId);
      const total = await incrBy(this.redis, counterKey, seconds, VIDEO_COUNTER_TTL_SEC);
      const refund = () => incrBy(this.redis, counterKey, -seconds, VIDEO_COUNTER_TTL_SEC);
      if (total > limits.videoSecondsPerMonth) {
        await refund();
        throw await this.reject(
          id,
          bucket,
          asset.storageKey,
          videoMinutesFullMessage(total - seconds, limits.videoSecondsPerMonth),
        );
      }
      try {
        const hlsJobId = await this.hls.submit({ id, storageKey: asset.storageKey }, checked);
        // Điều kiện uploading: bấm complete 2 lần song song thì lần sau 404 (và hoàn phút ở catch); job thừa vô hại (webhook không tìm thấy asset).
        const { count } = await this.prisma.asset.updateMany({
          where: { id, status: 'uploading' },
          data: { status: 'processing', hlsJobId },
        });
        if (count === 0) throw new NotFoundException();
        return toLibraryAsset(await this.prisma.asset.findUniqueOrThrow({ where: { id }, select: LIBRARY_SELECT }));
      } catch (err) {
        await refund();
        throw err;
      }
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

  // Giảng viên xem lại PDF / video của mình. download: link tải về với tên file gốc (video là bản MP4 gốc, không phải HLS).
  async viewUrl(ownerId: string, id: string, download = false) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: { in: CONTENT_KINDS }, status: 'ready' },
          select: { id: true, kind: true, fileName: true, storageKey: true, hlsKey: true },
        })
      : null;
    if (!asset) throw new NotFoundException();
    if (download) {
      return {
        url: await this.storage.presignGet(bucketOf(asset.kind), asset.storageKey, 300, { fileName: asset.fileName }),
      };
    }
    if (asset.kind === 'video') return { url: await videoUrl(this.storage, asset) };
    return { url: await this.storage.presignGet('private', asset.storageKey, 300) };
  }

  // Từ chối file đã tải lên vì hết hạn mức: bỏ object (xoá lỗi chỉ để lại rác, job dọn sẽ xoá sau), đánh dấu lỗi, trả 400.
  private async reject(id: string, bucket: Bucket, storageKey: string, message: string) {
    await this.storage.delete(bucket, storageKey).catch(() => undefined);
    await this.prisma.asset.update({ where: { id }, data: { status: 'failed' } });
    return validationError([{ path: ['file'], message }]);
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
