import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import type { CreateUploadInput } from './assets.schemas.js';
import { IMAGE_EXT, isPdf } from './file-check.js';

const LIBRARY_SELECT = {
  id: true,
  fileName: true,
  sizeBytes: true,
  createdAt: true,
} satisfies Prisma.AssetSelect;
type LibraryRow = Prisma.AssetGetPayload<{ select: typeof LIBRARY_SELECT }>;
const toLibraryAsset = (a: LibraryRow) => ({
  ...a,
  sizeBytes: Number(a.sizeBytes),
});

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
