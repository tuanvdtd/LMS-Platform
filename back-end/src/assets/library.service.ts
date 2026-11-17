import { Injectable, NotFoundException } from '@nestjs/common';
import { type AssetKind, Prisma } from '@prisma/client';
import { conflict } from '../common/http.js';
import { isGuid } from '../common/zod.pipe.js';
import { hlsPrefix } from '../hls/hls-job.js';
import { HlsService } from '../hls/hls.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import type { LibraryPageQuery } from './assets.schemas.js';
import { bucketOf } from './assets.service.js';
import { STALE_UPLOAD_MS } from './limits.js';
import { StorageUsageService } from './usage.service.js';

const CONTENT_KINDS: AssetKind[] = ['document', 'video'];
const staleBefore = () => new Date(Date.now() - STALE_UPLOAD_MS);
// Hỏng: xử lý lỗi, hoặc tải lên bỏ dở quá 1 giờ.
const broken = (): Prisma.AssetWhereInput => ({
  OR: [{ status: 'failed' }, { status: 'uploading', createdAt: { lt: staleBefore() } }],
});
const REFERENCED: Prisma.AssetWhereInput = {
  OR: [{ videoItems: { some: {} } }, { documentItems: { some: {} } }, { resources: { some: {} } }],
};
const IN_USE = () => conflict('ASSET_IN_USE', 'File đang được dùng ở bài giảng, gỡ khỏi bài giảng trước');

// Xoá file gốc và, với video, cả thư mục HLS. Ném lỗi khi lưu trữ lỗi để nơi gọi tự quyết bỏ qua hay thử lại.
export async function removeAssetObjects(
  storage: StorageService,
  asset: { id: string; kind: AssetKind; storageKey: string },
) {
  await storage.delete(bucketOf(asset.kind), asset.storageKey);
  if (asset.kind === 'video') await storage.deletePrefix('video', hlsPrefix(asset.id));
}

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly hls: HlsService,
    private readonly usage: StorageUsageService,
  ) {}

  async page(ownerId: string, query: LibraryPageQuery) {
    const base: Prisma.AssetWhereInput = {
      ownerId,
      kind: { in: CONTENT_KINDS },
      ...(query.q ? { fileName: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    // Ba nhóm không chồng nhau: hỏng (dù có được dùng hay không), đang dùng, chưa dùng.
    const groups = {
      failed: broken(),
      used: { AND: [{ NOT: broken() }, REFERENCED] },
      unused: { AND: [{ NOT: broken() }, { NOT: REFERENCED }] },
    } satisfies Record<string, Prisma.AssetWhereInput>;
    const where: Prisma.AssetWhereInput = query.filter === 'all' ? base : { AND: [base, groups[query.filter]] };
    const count = (extra?: Prisma.AssetWhereInput) =>
      this.prisma.asset.count({ where: extra ? { AND: [base, extra] } : base });
    const [rows, total, all, used, failed, totalBytes, limits, videoSeconds] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy: [{ createdAt: query.order }, { id: query.order }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          kind: true,
          fileName: true,
          sizeBytes: true,
          status: true,
          createdAt: true,
          videoItems: { select: { id: true } },
          documentItems: { select: { id: true } },
          resources: { select: { itemId: true } },
        },
      }),
      this.prisma.asset.count({ where }),
      count(),
      count(groups.used),
      count(groups.failed),
      this.usage.usedBytes(ownerId),
      this.usage.limitsOf(ownerId),
      this.hls.enabled ? this.usage.videoSecondsUsed(ownerId) : null,
    ]);
    const stale = staleBefore();
    return {
      items: rows.map((a) => ({
        id: a.id,
        kind: a.kind,
        fileName: a.fileName,
        sizeBytes: Number(a.sizeBytes),
        status: a.status === 'uploading' && a.createdAt < stale ? ('failed' as const) : a.status,
        createdAt: a.createdAt,
        // Một bài có thể dùng cùng file làm nội dung chính lẫn tài nguyên → đếm theo bài, không theo lượt gắn.
        usageCount: new Set([
          ...a.videoItems.map((i) => i.id),
          ...a.documentItems.map((i) => i.id),
          ...a.resources.map((r) => r.itemId),
        ]).size,
      })),
      total,
      counts: { all, used, unused: all - used - failed, failed },
      totalBytes,
      quotaBytes: limits.storageBytes,
      videoSecondsUsed: videoSeconds,
      videoSecondsLimit: this.hls.enabled ? limits.videoSecondsPerMonth : null,
    };
  }

  async usages(ownerId: string, id: string) {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({ where: { id, ownerId, kind: { in: CONTENT_KINDS } }, select: { id: true } })
      : null;
    if (!asset) throw new NotFoundException();
    const items = await this.prisma.curriculumItem.findMany({
      where: { OR: [{ videoAssetId: id }, { documentAssetId: id }, { resources: { some: { assetId: id } } }] },
      orderBy: [{ course: { title: 'asc' } }, { section: { position: 'asc' } }, { position: 'asc' }],
      select: {
        id: true,
        title: true,
        courseId: true,
        course: { select: { title: true } },
        section: { select: { title: true } },
      },
    });
    return items.map((i) => ({
      itemId: i.id,
      courseId: i.courseId,
      courseTitle: i.course.title,
      sectionTitle: i.section.title,
      lectureTitle: i.title,
    }));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const asset = isGuid(id)
      ? await this.prisma.asset.findFirst({
          where: { id, ownerId, kind: { in: CONTENT_KINDS } },
          select: {
            id: true,
            kind: true,
            storageKey: true,
            status: true,
            hlsJobId: true,
            hlsKey: true,
            _count: { select: { videoItems: true, documentItems: true, resources: true } },
          },
        })
      : null;
    if (!asset) throw new NotFoundException();
    const { videoItems, documentItems, resources } = asset._count;
    if (videoItems + documentItems + resources > 0) throw IN_USE();
    // Job chuyển mã còn chạy (upload mới hoặc video cũ đang bổ sung HLS) sẽ ghi tiếp vào thư mục HLS sau khi xoá.
    if (asset.status === 'processing' || (asset.hlsJobId !== null && asset.hlsKey === null)) {
      throw conflict('ASSET_PROCESSING', 'Video đang xử lý, đợi xử lý xong rồi xoá');
    }
    try {
      await this.prisma.asset.delete({ where: { id } });
    } catch (err) {
      // Vừa được gắn vào bài giảng giữa lúc kiểm và lúc xoá: khoá ngoại chặn.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') throw IN_USE();
      throw err;
    }
    // Dòng đã xoá: lưu trữ lỗi chỉ để lại rác (StorageService đã báo Sentry), không trả lỗi cho người dùng.
    await removeAssetObjects(this.storage, asset).catch(() => undefined);
  }
}
