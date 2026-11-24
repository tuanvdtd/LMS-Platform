import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isStaff } from '../auth/auth.js';
import { CARD_SELECT, CatalogService } from '../catalog/catalog.service.js';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import type { ListPostsQuery } from './posts.schemas.js';
import { postNotFound } from './posts.service.js';

// Thẻ bài công khai. Chỉ liệt kê trường được phép lộ ra ngoài; KHÔNG có bodyHtml.
const CARD = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  autoExcerpt: true,
  coverUrl: true,
  readingMinutes: true,
  publishedAt: true,
  likeCount: true,
  commentCount: true,
  topics: { select: { topic: { select: { slug: true, name: true } } } },
  author: { select: { id: true, name: true, image: true, role: true } },
} satisfies Prisma.PostSelect;
type CardRow = Prisma.PostGetPayload<{ select: typeof CARD }>;

const ORDER: Prisma.PostOrderByWithRelationInput[] = [{ publishedAt: 'desc' }, { id: 'desc' }];
const POPULAR: Prisma.PostOrderByWithRelationInput[] = [{ likeCount: 'desc' }, { commentCount: 'desc' }, ...ORDER];
const HIGHLIGHT_DAYS = 30;
const BRAND = { id: null, name: 'Aolumi', image: null } as const;

// Tài khoản nghiệp vụ không có trang cá nhân → bài của admin đứng tên nền tảng, không lộ tài khoản.
const authorOf = (a: CardRow['author']) => (isStaff(a.role) ? BRAND : { id: a.id, name: a.name, image: a.image });

const toCard = (r: CardRow) => ({
  id: r.id,
  slug: r.slug,
  title: r.title,
  excerpt: r.excerpt || r.autoExcerpt,
  coverUrl: r.coverUrl,
  readingMinutes: r.readingMinutes,
  publishedAt: r.publishedAt,
  likeCount: r.likeCount,
  commentCount: r.commentCount,
  topics: r.topics.map((t) => t.topic),
  author: authorOf(r.author),
});

@Injectable()
export class PostsPublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async list(q: ListPostsQuery) {
    const empty = { items: [] as ReturnType<typeof toCard>[], total: 0, page: q.page, limit: q.limit, topic: null };
    const where: Prisma.PostWhereInput = { status: 'published' };
    let topic: { slug: string; name: string } | null = null;
    if (q.topic) {
      const t = await this.prisma.topic.findUnique({ where: { slug: q.topic }, select: { id: true, slug: true, name: true } });
      if (!t) return empty;
      topic = { slug: t.slug, name: t.name };
      where.topics = { some: { topicId: t.id } };
    }
    if (q.q) where.id = { in: await this.searchIds(q.q) };
    const [total, rows] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where, select: CARD, orderBy: q.sort === 'popular' ? POPULAR : ORDER, skip: (q.page - 1) * q.limit, take: q.limit,
      }),
    ]);
    return { items: rows.map(toCard), total, page: q.page, limit: q.limit, topic };
  }

  // Cột phải /blog: bài được thích nhiều trong 30 ngày + tác giả có tổng lượt thích cao nhất.
  // Tài khoản nghiệp vụ không có trang cá nhân → không vào bảng tác giả.
  async highlights() {
    const since = new Date(Date.now() - HIGHLIGHT_DAYS * 86_400_000);
    const [popular, groups] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: 'published', publishedAt: { gte: since } },
        select: { slug: true, title: true, likeCount: true, commentCount: true },
        orderBy: POPULAR,
        take: 5,
      }),
      this.prisma.post.groupBy({
        by: ['authorId'],
        where: { status: 'published' },
        _count: { _all: true },
        _sum: { likeCount: true },
        orderBy: { _sum: { likeCount: 'desc' } },
        take: 10,
      }),
    ]);
    const users = await this.prisma.user.findMany({
      where: { id: { in: groups.map((g) => g.authorId) } },
      select: { id: true, name: true, image: true, role: true, profile: { select: { headline: true } } },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    const authors = groups
      .flatMap((g) => {
        const u = byId.get(g.authorId);
        if (!u || isStaff(u.role)) return [];
        return [{ id: u.id, name: u.name, image: u.image, headline: u.profile?.headline ?? null, postCount: g._count._all, likeCount: g._sum.likeCount ?? 0 }];
      })
      .slice(0, 5);
    return { days: HIGHLIGHT_DAYS, popular, authors };
  }

  // Tìm không dấu trên tiêu đề, như catalog (unaccent đã bật ở migration catalog_unaccent).
  // ponytail: seq scan trên bài published; đủ cho quy mô hiện tại, chậm thì thêm index trgm.
  private async searchIds(q: string): Promise<string[]> {
    const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id::text AS id FROM posts
      WHERE status = 'published' AND unaccent(title) ILIKE unaccent(${pattern})`;
    return rows.map((r) => r.id);
  }

  // Hàng lọc chủ đề ở /blog: chỉ chủ đề đang có bài.
  async topics() {
    const groups = await this.prisma.postTopic.groupBy({
      by: ['topicId'],
      where: { post: { status: 'published' } },
      _count: { _all: true },
      orderBy: { _count: { topicId: 'desc' } },
      take: 12,
    });
    const names = await this.prisma.topic.findMany({
      where: { id: { in: groups.map((g) => g.topicId) } },
      select: { id: true, slug: true, name: true },
    });
    const byId = new Map(names.map((t) => [t.id, t]));
    return groups.flatMap((g) => {
      const t = byId.get(g.topicId);
      return t ? [{ slug: t.slug, name: t.name, count: g._count._all }] : [];
    });
  }

  async detail(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: 'published' },
      select: {
        ...CARD,
        bodyHtml: true,
        updatedAt: true,
        relatedCourseId: true,
        topics: { select: { topicId: true, topic: { select: { slug: true, name: true } } } },
        author: { select: { id: true, name: true, image: true, role: true, profile: { select: { headline: true, bio: true } } } },
      },
    });
    if (!post) throw postNotFound();
    const [course, fromAuthor, sameTopic] = await Promise.all([
      post.relatedCourseId
        ? this.prisma.course.findFirst({ where: { id: post.relatedCourseId, status: 'published' }, select: CARD_SELECT })
        : null,
      this.prisma.post.findMany({
        where: { status: 'published', authorId: post.author.id, id: { not: post.id } },
        select: CARD,
        orderBy: ORDER,
        take: 3,
      }),
      // Lấy dư để còn đủ 4 bài sau khi bỏ các bài đã hiện ở "bài khác của tác giả".
      this.prisma.post.findMany({
        where: {
          status: 'published',
          id: { not: post.id },
          topics: { some: { topicId: { in: post.topics.map((t) => t.topicId) } } },
        },
        select: CARD,
        orderBy: ORDER,
        take: 7,
      }),
    ]);
    const shown = new Set(fromAuthor.map((p) => p.id));
    const staff = isStaff(post.author.role);
    return {
      ...toCard(post),
      bodyHtml: post.bodyHtml,
      updatedAt: post.updatedAt,
      author: {
        ...authorOf(post.author),
        headline: staff ? 'Đội ngũ Aolumi' : (post.author.profile?.headline ?? null),
        bio: staff ? null : (post.author.profile?.bio ?? null),
      },
      // Khoá bị gỡ khỏi catalog sau khi gắn → bỏ thẻ khoá, bài vẫn đọc được.
      relatedCourse: course ? (await this.catalog.toCards([course]))[0] : null,
      fromAuthor: fromAuthor.map(toCard),
      more: sameTopic
        .filter((p) => !shown.has(p.id))
        .slice(0, 4)
        .map(toCard),
    };
  }

  // Tab "Bài viết" ở /u/:id. Staff không có trang cá nhân → luôn rỗng.
  async byAuthor(userId: string) {
    if (!isGuid(userId)) return [];
    const rows = await this.prisma.post.findMany({
      where: { authorId: userId, status: 'published' },
      select: CARD,
      orderBy: ORDER,
      take: 30,
    });
    return rows.filter((r) => !isStaff(r.author.role)).map(toCard);
  }
}
