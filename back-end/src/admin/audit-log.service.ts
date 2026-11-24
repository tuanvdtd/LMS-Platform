import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../infra/prisma.service.js';

// Ai làm gì, với ai, lúc nào. Gọi SAU khi thao tác thành công.
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(e: { actorId: string; action: AuditAction; targetId: string; data?: Prisma.InputJsonObject }) {
    return this.prisma.auditLog.create({
      data: { actorId: e.actorId, action: e.action, targetId: e.targetId, data: e.data ?? {} },
    });
  }

  async forTarget(targetId: string, take = 20) {
    const rows = await this.prisma.auditLog.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, action: true, data: true, createdAt: true, actor: { select: { name: true } } },
    });
    return rows.map(({ actor, ...r }) => ({ ...r, actorName: actor?.name ?? null }));
  }
}
