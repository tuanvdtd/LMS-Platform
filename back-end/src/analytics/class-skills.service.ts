import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service.js';
import { masteryPct } from '../skills/skill-elo.js';
import { AnalyticsCoursesService } from './analytics-courses.service.js';
import { SKILL_MIN_GROUP, topicGain } from './skill-gain.js';

// Năng lực lớp: CHỈ từ bài đánh giá kỹ năng Elo của nền tảng (PRODUCT.md) — không dùng quiz/bài code trong khoá.
// Riêng tư: chỉ trả số tổng hợp ẩn danh khi đủ SKILL_MIN_GROUP người; không trả điểm của từng học viên.
@Injectable()
export class ClassSkillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: AnalyticsCoursesService,
  ) {}

  async course(courseId: string, instructorId: string) {
    await this.courses.owned(courseId, instructorId);
    const [topics, enrollments] = await Promise.all([
      this.prisma.courseTopic.findMany({
        where: { courseId },
        select: {
          isPrimary: true,
          topic: { select: { id: true, name: true, _count: { select: { skillQuestions: { where: { archivedAt: null } } } } } },
        },
      }),
      this.prisma.enrollment.findMany({ where: { courseId, userId: { not: instructorId } }, select: { userId: true, createdAt: true } }),
    ]);
    const userIds = enrollments.map((e) => e.userId);
    const topicIds = topics.map((t) => t.topic.id);
    const [skills, attempts] = await Promise.all([
      this.prisma.userTopicSkill.findMany({
        where: { userId: { in: userIds }, topicId: { in: topicIds }, answerCount: { gt: 0 } },
        select: { topicId: true, rating: true },
      }),
      this.prisma.skillAttempt.findMany({
        where: { userId: { in: userIds }, topicId: { in: topicIds }, finishedAt: { not: null }, ratingAfter: { not: null } },
        select: { userId: true, topicId: true, finishedAt: true, ratingAfter: true },
      }),
    ]);
    const enrolled = enrollments.map((e) => ({ userId: e.userId, enrolledAt: e.createdAt }));
    return {
      enrolled: enrollments.length,
      minGroup: SKILL_MIN_GROUP,
      topics: topics
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.topic.name.localeCompare(b.topic.name, 'vi'))
        .map(({ isPrimary, topic }) => {
          const pcts = skills.filter((s) => s.topicId === topic.id).map((s) => masteryPct(s.rating)).sort((a, b) => a - b);
          const points = attempts
            .filter((a) => a.topicId === topic.id)
            .map((a) => ({ userId: a.userId, at: a.finishedAt!, pct: masteryPct(a.ratingAfter!) }));
          return {
            topicId: topic.id,
            name: topic.name,
            isPrimary,
            hasBank: topic._count.skillQuestions > 0,
            measured: pcts.length,
            masteryPcts: pcts.length >= SKILL_MIN_GROUP ? pcts : null,
            gain: topicGain(enrolled, points),
          };
        }),
    };
  }
}
