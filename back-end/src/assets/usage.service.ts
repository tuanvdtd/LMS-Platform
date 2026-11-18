import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService } from '../infra/redis.js';
import { LIMITS, STALE_UPLOAD_MS, type TierLimits, tierOf, videoMonthKey } from './limits.js';

// Hạn mức và mức đã dùng của một giảng viên; dùng chung cho bước xin link, complete và trang thư viện.
@Injectable()
export class StorageUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async limitsOf(ownerId: string): Promise<TierLimits> {
    const profile = await this.prisma.instructorProfile.findUnique({ where: { userId: ownerId }, select: { userId: true } });
    return LIMITS[tierOf(profile !== null)];
  }

  // File đang chiếm chỗ: đã sẵn sàng, đang xử lý, hoặc đang tải lên trong 1 giờ gần đây (bỏ dở và lỗi không tính).
  async usedBytes(ownerId: string): Promise<number> {
    const { _sum } = await this.prisma.asset.aggregate({
      where: {
        ownerId,
        OR: [
          { status: { in: ['ready', 'processing'] } },
          { status: 'uploading', createdAt: { gte: new Date(Date.now() - STALE_UPLOAD_MS) } },
        ],
      },
      _sum: { sizeBytes: true },
    });
    return Number(_sum.sizeBytes ?? 0);
  }

  // Giây video đã gửi chuyển mã trong tháng này. Hoàn lại sau khi key hết hạn có thể để lại số âm → coi là 0.
  async videoSecondsUsed(ownerId: string): Promise<number> {
    return Math.max(0, Number(await this.redis.get(videoMonthKey(ownerId))) || 0);
  }
}
