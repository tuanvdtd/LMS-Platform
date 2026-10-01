import { Controller, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';

const searchQuery = z.object({
  q: z.string().trim().min(1).max(50),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

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
}
