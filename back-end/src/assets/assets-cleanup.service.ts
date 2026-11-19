import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../infra/prisma.service.js';
import { StorageService } from '../infra/storage.service.js';
import { removeAssetObjects } from './library.service.js';

const INTERVAL_MS = 6 * 3_600_000;
const MAX_AGE_MS = 24 * 3_600_000;

// Dọn những thứ không ai còn dùng được: file tải dở / lỗi, video giới thiệu không gắn vào khoá nào,
// và ảnh bài viết không còn bài nào dùng.
// File đã sẵn sàng mà chưa dùng thì không đụng tới: giảng viên tự xoá trong thư viện.
@Injectable()
export class AssetsCleanupService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(AssetsCleanupService.name);
  private timer: NodeJS.Timeout | undefined;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Máy chủ bật theo nhu cầu nên chạy ngay lúc khởi động, rồi lặp khi app còn sống.
  // Test e2e dùng lưu trữ giả trên DB thật: tự chạy sẽ xoá dòng thật mà không xoá file thật.
  onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'test') return;
    this.runInBackground();
    this.timer = setInterval(() => this.runInBackground(), INTERVAL_MS).unref();
  }

  onApplicationShutdown() {
    clearInterval(this.timer);
  }

  // Không chặn app; lượt trước chưa xong thì bỏ qua lượt này.
  private runInBackground() {
    if (this.running) return;
    this.running = true;
    this.run()
      .catch((err: unknown) => this.report('Dọn file lỗi', err))
      .finally(() => {
        this.running = false;
      });
  }

  async run(): Promise<void> {
    const assets = await this.purgeStaleUploads();
    const promos = await this.purgeUnusedPromos();
    const images = await this.purgeOrphanPostImages();
    if (assets + promos + images > 0) {
      this.logger.log(
        `Đã dọn ${assets} file tải dở / lỗi, ${promos} video giới thiệu không dùng, ${images} ảnh bài viết không dùng`,
      );
    }
  }

  // Dòng uploading / failed không thể được gắn vào bài giảng (chỉ nhận ready, processing) nên không tranh chấp với lúc dọn.
  // scope: giới hạn phạm vi cho test.
  async purgeStaleUploads(scope: Prisma.AssetWhereInput = {}): Promise<number> {
    const rows = await this.prisma.asset.findMany({
      where: {
        AND: [
          scope,
          {
            status: { in: ['uploading', 'failed'] },
            createdAt: { lt: new Date(Date.now() - MAX_AGE_MS) },
            videoItems: { none: {} },
            documentItems: { none: {} },
            resources: { none: {} },
          },
        ],
      },
      select: { id: true, kind: true, storageKey: true },
    });
    let removed = 0;
    for (const asset of rows) {
      try {
        // Xoá file trước: lưu trữ lỗi thì giữ dòng để lượt sau thử lại, không để file mồ côi.
        await removeAssetObjects(this.storage, asset);
        await this.prisma.asset.delete({ where: { id: asset.id } });
        removed++;
      } catch (err) {
        this.report(`Dọn file ${asset.id} lỗi`, err);
      }
    }
    return removed;
  }

  // Video giới thiệu không có dòng trong DB: đối chiếu thẳng object trên lưu trữ với các khoá đang trỏ tới.
  // prefix: giới hạn phạm vi cho test.
  async purgeUnusedPromos(prefix = 'promos/'): Promise<number> {
    const cutoff = Date.now() - MAX_AGE_MS;
    const old = (await this.storage.list('public', prefix)).filter((o) => o.lastModified.getTime() < cutoff);
    if (old.length === 0) return 0;
    const urlOf = (key: string) => this.storage.publicUrl(key);
    const inUse = new Set(
      (
        await this.prisma.course.findMany({
          where: { promoVideoUrl: { in: old.map((o) => urlOf(o.key)) } },
          select: { promoVideoUrl: true },
        })
      ).map((c) => c.promoVideoUrl),
    );
    let removed = 0;
    for (const { key } of old) {
      if (inUse.has(urlOf(key))) continue;
      try {
        await this.storage.delete('public', key);
        removed++;
      } catch (err) {
        this.report(`Dọn ${key} lỗi`, err);
      }
    }
    return removed;
  }

  // Ảnh bài viết không bài nào dùng quá 24 giờ. Chỉ đọc bảng post_images (theo index orphanedAt), không liệt kê R2.
  // Xoá dòng có điều kiện trước rồi mới xoá file: ảnh vừa được dán lại thì lệnh xoá dòng không khớp → giữ.
  // Xoá file lỗi thì trả dòng lại (skipDuplicates: lần lưu bài chen vào có thể đã tạo lại) để lượt sau thử.
  // prefix: giới hạn phạm vi cho test.
  async purgeOrphanPostImages(prefix = 'posts/'): Promise<number> {
    const cutoff = new Date(Date.now() - MAX_AGE_MS);
    const stale = { orphanedAt: { lt: cutoff }, uses: { none: {} } } satisfies Prisma.PostImageWhereInput;
    const rows = await this.prisma.postImage.findMany({
      where: { key: { startsWith: prefix }, ...stale },
      select: { key: true, orphanedAt: true },
    });
    let removed = 0;
    for (const { key, orphanedAt } of rows) {
      const { count } = await this.prisma.postImage.deleteMany({ where: { key, ...stale } }).catch((err: unknown) => {
        // Bài vừa thêm cặp dùng đúng lúc này → khoá ngoại chặn xoá: giữ ảnh.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') return { count: 0 };
        throw err;
      });
      if (count === 0) continue;
      try {
        await this.storage.delete('public', key);
        removed++;
      } catch (err) {
        await this.prisma.postImage.createMany({ data: [{ key, orphanedAt }], skipDuplicates: true });
        this.report(`Dọn ảnh bài viết ${key} lỗi`, err);
      }
    }
    return removed;
  }

  private report(message: string, err: unknown) {
    this.logger.error(`${message}: ${String(err)}`);
    Sentry.captureException(err);
  }
}
