// back-end/src/recommendations/recommendations.service.ts
import { Injectable } from '@nestjs/common';
import { CARD_SELECT, CatalogService, type CourseCard } from '../catalog/catalog.service.js';
import { PrismaService } from '../infra/prisma.service.js';
import { masteryPct } from '../skills/skill-elo.js';
import { type GroupType, type Reason, type RecPick, recommend } from './recommend-rules.js';

const REF = { select: { id: true, slug: true, name: true } } as const;
export type RecommendedCourse = CourseCard & { reason: Reason };
export type RecommendationGroup = { type: GroupType; courses: RecommendedCourse[] };

// Gợi ý theo lỗ hổng kỹ năng đo được + topic học viên theo dõi + topic phổ biến của nghề. Tính mỗi lần gọi: vài query nhỏ.
@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  async groups(userId: string): Promise<RecommendationGroup[]> {
    const [user, targetRows, skillRows, edgeRows] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { occupation: true, level: true } }),
      // Lưu preferences tạo lại mọi dòng cùng lúc (cùng createdAt) → thêm tên topic cho thứ tự ổn định, như PreferencesService.get.
      this.prisma.userTargetTopic.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'asc' }, { topic: { name: 'asc' } }],
        select: { topicId: true },
      }),
      // answerCount = 0 là "chưa đo": rating khởi tạo không nói gì về năng lực.
      this.prisma.userTopicSkill.findMany({
        where: { userId, answerCount: { gt: 0 } },
        select: { topicId: true, rating: true },
      }),
      // Toàn bộ đồ thị tiên quyết: vài chục cạnh, duyệt trong bộ nhớ.
      this.prisma.topic.findMany({
        where: { prerequisites: { some: {} } },
        select: { id: true, prerequisites: { select: { id: true } } },
      }),
    ]);
    const skills = new Map(skillRows.map((r) => [r.topicId, masteryPct(r.rating)]));
    const prereqs = new Map(edgeRows.map((t) => [t.id, t.prerequisites.map((p) => p.id)]));
    const occupationTopics = user.occupation
      ? (
          await this.prisma.occupationTopic.findMany({
            where: { occupation: user.occupation },
            orderBy: { position: 'asc' },
            select: { topicId: true },
          })
        ).map((r) => r.topicId)
      : [];
    const targets = targetRows.map((r) => r.topicId);
    const related = [...new Set([...targets, ...occupationTopics, ...skills.keys()])];
    if (!related.length) return [];
    // Lý do của nhóm theo lỗ hổng nhắc cả topic tiên quyết trực tiếp chưa đo → cần tên của chúng.
    const refIds = [...new Set([...related, ...[...skills.keys()].flatMap((id) => prereqs.get(id) ?? [])])];

    const [topics, courses] = await Promise.all([
      this.prisma.topic.findMany({ where: { id: { in: refIds } }, ...REF }),
      this.prisma.course.findMany({
        where: {
          status: 'published',
          instructorId: { not: userId },
          enrollments: { none: { userId } },
          topics: { some: { topicId: { in: related } } },
        },
        // ratingAvg hay hoà (mặc định 0): cố định thứ tự đầu vào để khoá ở ranh giới 8/nhóm không đổi giữa các lần tải.
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          level: true,
          ratingAvg: true,
          topics: { where: { topicId: { in: related } }, select: { topicId: true, isPrimary: true } },
        },
      }),
    ]);
    const picked = recommend({
      topics: new Map(topics.map((t) => [t.id, t])),
      targets,
      occupation: user.occupation ? { value: user.occupation, topicIds: occupationTopics } : null,
      userLevel: user.level,
      courses: courses.map((c) => ({ ...c, ratingAvg: Number(c.ratingAvg) })),
      skills,
      prereqs,
    });
    return this.attachCards(picked);
  }

  private async attachCards(groups: { type: GroupType; picks: RecPick[] }[]): Promise<RecommendationGroup[]> {
    const ids = groups.flatMap((g) => g.picks.map((p) => p.courseId));
    if (!ids.length) return [];
    const rows = await this.prisma.course.findMany({ where: { id: { in: ids } }, select: CARD_SELECT });
    const cards = new Map((await this.catalog.toCards(rows)).map((c) => [c.id, c]));
    // Khoá có thể bị gỡ giữa hai query → bỏ qua thay vì trả card rỗng.
    return groups
      .map((g) => ({
        type: g.type,
        courses: g.picks.flatMap((p) => {
          const card = cards.get(p.courseId);
          return card ? [{ ...card, reason: p.reason }] : [];
        }),
      }))
      .filter((g) => g.courses.length);
  }
}
