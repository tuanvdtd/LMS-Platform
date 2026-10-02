import { Inject, Injectable } from '@nestjs/common';
import { AUTH, type Auth } from '../auth/auth.js';
import { validationError } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { UpdatePreferencesInput } from './preferences.schemas.js';

const REF = { select: { id: true, slug: true, name: true } } as const;

@Injectable()
export class PreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  // Đọc DB chứ không đọc user của session: ngay sau PATCH, session trong request vẫn là bản cũ.
  async get(userId: string) {
    const [user, rows] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { occupation: true, level: true } }),
      this.prisma.userTargetTopic.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'asc' }, { topic: { name: 'asc' } }],
        select: { topic: REF },
      }),
    ]);
    return { occupation: user.occupation, level: user.level, topics: rows.map((r) => r.topic) };
  }

  async update(userId: string, input: UpdatePreferencesInput) {
    const { topicIds, ...fields } = input;
    if (topicIds) {
      // Kiểm trước khi xoá để topic sai không làm mất danh sách cũ.
      const found = await this.prisma.topic.count({ where: { id: { in: topicIds } } });
      if (found !== topicIds.length) throw validationError([{ path: ['topicIds'], message: 'Topic không tồn tại' }]);
      await this.prisma.$transaction([
        this.prisma.userTargetTopic.deleteMany({ where: { userId } }),
        this.prisma.userTargetTopic.createMany({ data: topicIds.map((topicId) => ({ userId, topicId })) }),
      ]);
    }
    if (Object.keys(fields).length > 0) {
      // Qua internalAdapter để cache {session, user} trong Redis được làm mới (như become-instructor).
      const ctx = await this.auth.$context;
      await ctx.internalAdapter.updateUser(userId, fields);
    }
    return this.get(userId);
  }
}
