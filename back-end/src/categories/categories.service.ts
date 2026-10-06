import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';

// id để FE gửi PATCH categoryId/topics (spec course-create-basics C10). Chỉ thêm trường.
export type TopicLink = { id: string; slug: string; name: string };
export type SubcategoryNode = { id: string; slug: string; name: string; topics: TopicLink[] };
export type CategoryNode = { id: string; slug: string; name: string; children: SubcategoryNode[] };

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Một query: cấp 1 → cấp 2 → topic phổ biến, cả ba sắp theo position.
  async tree(): Promise<CategoryNode[]> {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        children: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            slug: true,
            name: true,
            popularTopics: {
              orderBy: { position: 'asc' },
              select: { topic: { select: { id: true, slug: true, name: true } } },
            },
          },
        },
      },
    });
    return roots.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      children: r.children.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        topics: c.popularTopics.map((p) => p.topic),
      })),
    }));
  }
}
