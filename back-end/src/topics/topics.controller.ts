import { Controller, Get, Query } from '@nestjs/common';
import { Occupation } from '@prisma/client';
import { z } from 'zod';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';

const searchQuery = z.object({
  q: z.string().trim().min(1).max(50),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

const popularQuery = z.object({ occupation: z.enum(Occupation) });

// Ô "Chủ đề chính" ở trang tổng quan (spec course-create-basics §4.1). ILIKE dùng được
// index idx_topics_name_trgm (gin_trgm_ops).
@Public()
@Controller('topics')
export class TopicsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  search(@Query(new ZodValidationPipe(searchQuery)) query: z.output<typeof searchQuery>) {
    return this.prisma.topic.findMany({
      where: { name: { contains: query.q, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: query.limit,
      select: { id: true, slug: true, name: true },
    });
  }

  // Chip "Phổ biến với học viên như bạn" ở bước 2 onboarding (spec personalize-occupation §4).
  @Get('popular')
  async popular(@Query(new ZodValidationPipe(popularQuery)) { occupation }: z.output<typeof popularQuery>) {
    const rows = await this.prisma.occupationTopic.findMany({
      where: { occupation },
      orderBy: { position: 'asc' },
      select: { topic: { select: { id: true, slug: true, name: true } } },
    });
    return rows.map((r) => r.topic);
  }
}
