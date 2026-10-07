import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isGuid, validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { TX_OPTIONS } from '../instructor-courses/instructor-courses.service.js';
import { vietQrUrl } from './bank.js';
import { isPeriodEnded, periodEnd } from './period.js';
import type { AdminPayoutsQuery, MarkPaidInput, PayoutAccountInput } from './revenue.schemas.js';

export const PAYOUT_MIN_VND = 200_000; // R7: dưới ngưỡng cộng dồn kỳ sau
const SHARE_KEY = 'revenue_share_pct';
const PAGE_SIZE = 20;
// Chỉ riêng chốt kỳ dùng Serializable (spec §3.3). KHÔNG sửa TX_OPTIONS dùng chung.
// ~6 query/tx, DB dev ~1-2s/query → timeout 30s như curriculum.service (15s không đủ).
// ponytail: ~3-4 query/giảng viên trong 1 tx 30s → chốt được ~5-7 giảng viên trên DB dev chậm; nhiều hơn thì gom insert/update theo lô hoặc nâng timeout (P2028 hiện ra 500).
const CLOSE_TX = { ...TX_OPTIONS, timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable };

// Item tính vào doanh thu giảng viên. Đợt hoàn tiền: đổi status thành { in: ['paid', 'partially_refunded'] }.
const earnedItems = (extra: Prisma.OrderItemWhereInput = {}): Prisma.OrderItemWhereInput => ({
  refundedAt: null,
  order: { status: 'paid' },
  ...extra,
});

const BANK = { bankBin: true, bankAccountNo: true, bankAccountName: true } as const;

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Tỷ lệ chia (R2) ----

  // Seed migration bảo đảm luôn có; sai dạng là lỗi hệ thống → 500 + Sentry (spec §6).
  async getSharePct() {
    const row = await this.prisma.platformSetting.findUniqueOrThrow({ where: { key: SHARE_KEY } });
    const pct = row.value;
    if (typeof pct !== 'number' || !Number.isInteger(pct) || pct < 0 || pct > 100) {
      throw new Error(`platform_settings.${SHARE_KEY} không hợp lệ: ${JSON.stringify(pct)}`);
    }
    return { sharePct: pct, updatedAt: row.updatedAt };
  }

  async setSharePct(sharePct: number, adminId: string) {
    await this.prisma.platformSetting.upsert({
      where: { key: SHARE_KEY },
      create: { key: SHARE_KEY, value: sharePct, updatedById: adminId },
      update: { value: sharePct, updatedById: adminId },
    });
    return this.getSharePct();
  }

  // ---- Giảng viên ----

  async getPayoutAccount(userId: string) {
    const p = await this.prisma.instructorProfile.findUnique({ where: { userId }, select: BANK });
    return { verified: !!p, account: p?.bankBin ? p : null };
  }

  // Không có DELETE (R10): khoá trả phí luôn cần TK.
  async setPayoutAccount(userId: string, input: PayoutAccountInput) {
    const res = await this.prisma.instructorProfile.updateMany({ where: { userId }, data: input });
    if (res.count === 0) {
      throw new ForbiddenException({ statusCode: 403, code: 'INSTRUCTOR_NOT_VERIFIED', message: 'Bạn chưa được xác minh giảng viên' });
    }
    return this.getPayoutAccount(userId);
  }

  async summary(userId: string) {
    const [{ sharePct }, unsettled, byStatus] = await Promise.all([
      this.getSharePct(),
      this.prisma.orderItem.aggregate({
        where: earnedItems({ instructorId: userId, payoutId: null }),
        _sum: { instructorEarnAmount: true },
      }),
      this.prisma.payout.groupBy({ by: ['status'], where: { instructorId: userId }, _sum: { amount: true } }),
    ]);
    const sumOf = (s: 'pending' | 'paid') => byStatus.find((r) => r.status === s)?._sum.amount ?? 0;
    return {
      sharePct,
      unsettled: unsettled._sum.instructorEarnAmount ?? 0,
      pending: sumOf('pending'),
      paid: sumOf('paid'),
    };
  }

  async myPayouts(userId: string, page: number) {
    const where = { instructorId: userId };
    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: [{ period: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: { id: true, period: true, amount: true, status: true, paidAt: true, bankTxnRef: true },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE_SIZE };
  }

  // ---- Admin: payout ----

  async adminPayouts(q: AdminPayoutsQuery) {
    const where: Prisma.PayoutWhereInput = { status: q.status, period: q.period };
    const [items, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: [{ period: 'desc' }, { createdAt: 'desc' }],
        skip: (q.page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          period: true,
          amount: true,
          status: true,
          paidAt: true,
          instructor: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: PAGE_SIZE };
  }

  async adminPayout(id: string) {
    const payout = isGuid(id)
      ? await this.prisma.payout.findUnique({
          where: { id },
          include: {
            instructor: { select: { id: true, name: true, email: true } },
            items: {
              orderBy: { order: { paidAt: 'asc' } },
              select: {
                id: true,
                unitPriceAmount: true,
                instructorEarnAmount: true,
                course: { select: { id: true, title: true } },
                order: { select: { paidAt: true } },
              },
            },
          },
        })
      : null;
    if (!payout) throw new NotFoundException();
    const { items, ...rest } = payout;
    return {
      ...rest,
      items: items.map(({ order, ...i }) => ({ ...i, paidAt: order.paidAt })),
      qrUrl: payout.status === 'pending' ? vietQrUrl(payout) : null,
    };
  }

  // Một câu UPDATE có điều kiện → bấm 2 lần / 2 admin cùng bấm chỉ một lần thành công.
  async markPaid(id: string, adminId: string, input: MarkPaidInput) {
    if (!isGuid(id)) throw new NotFoundException();
    const res = await this.prisma.payout.updateMany({
      where: { id, status: 'pending' },
      data: { status: 'paid', paidAt: new Date(), paidById: adminId, bankTxnRef: input.bankTxnRef },
    });
    if (res.count === 0) {
      const exists = await this.prisma.payout.count({ where: { id } });
      if (!exists) throw new NotFoundException();
      throw new ConflictException({ statusCode: 409, code: 'PAYOUT_ALREADY_PAID', message: 'Payout đã được trả' });
    }
    return this.adminPayout(id);
  }

  // ---- Admin: chốt kỳ (spec §3.3) ----

  async closePeriod(period: string) {
    if (!isPeriodEnded(period)) {
      throw validationError([{ path: ['period'], message: 'Chỉ chốt được tháng đã kết thúc' }]);
    }
    // Retry bọc NGOÀI transaction: lỗi serialize / trùng unique khi 2 lần chốt chạy song song.
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction((tx) => this.closeInTx(tx, period), CLOSE_TX);
      } catch (e) {
        const retryable =
          e instanceof Prisma.PrismaClientKnownRequestError && (e.code === 'P2034' || e.code === 'P2002');
        if (!retryable) throw e;
        if (attempt >= 1) {
          throw new ConflictException({ statusCode: 409, code: 'PERIOD_CLOSING', message: 'Kỳ đang được chốt, thử lại sau' });
        }
      }
    }
  }

  private async closeInTx(tx: Prisma.TransactionClient, period: string) {
    const base = earnedItems({ payoutId: null, order: { status: 'paid', paidAt: { lt: periodEnd(period) } } });
    const groups = await tx.orderItem.groupBy({
      by: ['instructorId'],
      where: base,
      _sum: { instructorEarnAmount: true },
    });
    const result = { created: 0, updated: 0, skippedBelowMin: 0, skippedNoBank: 0, skippedPaid: 0 };

    for (const g of groups) {
      const amount = g._sum.instructorEarnAmount ?? 0;
      if (amount < PAYOUT_MIN_VND) {
        result.skippedBelowMin++;
        continue;
      }
      const key = { instructorId_period: { instructorId: g.instructorId, period } };
      const existing = await tx.payout.findUnique({ where: key, select: { id: true, status: true } });
      if (existing?.status === 'paid') {
        result.skippedPaid++; // không sửa payout đã trả, dồn kỳ sau
        continue;
      }
      let payoutId: string;
      if (existing) {
        // Giữ nguyên snapshot ngân hàng của payout đang chờ.
        await tx.payout.update({ where: { id: existing.id }, data: { amount: { increment: amount } } });
        payoutId = existing.id;
        result.updated++;
      } else {
        const bank = await tx.instructorProfile.findUnique({ where: { userId: g.instructorId }, select: BANK });
        if (!bank?.bankBin || !bank.bankAccountNo || !bank.bankAccountName) {
          result.skippedNoBank++; // R10 chặn từ lúc đặt giá; chỉ gặp với dữ liệu cũ/seed tay
          continue;
        }
        const created = await tx.payout.create({
          data: {
            instructorId: g.instructorId,
            period,
            amount,
            bankBin: bank.bankBin,
            bankAccountNo: bank.bankAccountNo,
            bankAccountName: bank.bankAccountName,
          },
          select: { id: true },
        });
        payoutId = created.id;
        result.created++;
      }
      await tx.orderItem.updateMany({ where: { ...base, instructorId: g.instructorId }, data: { payoutId } });
    }
    return result;
  }
}
