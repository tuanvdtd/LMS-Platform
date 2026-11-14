import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CARD_SELECT, CatalogService } from '../catalog/catalog.service.js';
import { isGuid } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { masteryPct } from '../skills/skill-elo.js';
import type { UpdateProfileInput } from './profiles.schemas.js';
import { isProfileVisible, shapeIdentity } from './public-profile.js';

const notFound = () =>
  new NotFoundException({ statusCode: 404, code: 'USER_NOT_FOUND', message: 'Không tìm thấy người dùng' });
const OWN = { headline: true, bio: true, coverTone: true, learningPublic: true, website: true, socials: true } as const;
const COURSE = { slug: true, title: true, thumbnailUrl: true, instructor: { select: { name: true } } } as const;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  // Trang /u/:id. Select liệt kê từng trường: KHÔNG lấy email, bank*, role thô.
  async publicProfile(id: string) {
    const u = isGuid(id)
      ? await this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
            role: true,
            banned: true,
            profile: { select: OWN },
            instructorProfile: { select: { userId: true } },
          },
        })
      : null;
    if (!u || !isProfileVisible(u)) throw notFound();
    const learningPublic = u.profile?.learningPublic ?? false;
    const [taught, learning] = await Promise.all([
      u.role?.split(',').includes('instructor') ? this.teaching(id) : null,
      learningPublic ? this.learning(id) : null,
    ]);
    // Role instructor ai cũng tự bật được ("Chuyển sang Giảng viên"). Trên hồ sơ chỉ tính là giảng viên
    // khi đã qua duyệt đơn hoặc có khoá đang bán, không thì học viên thường cũng mang nhãn "Giảng viên".
    const teaching = taught && (u.instructorProfile || taught.courses.length > 0) ? taught : null;
    return {
      id: u.id,
      name: u.name,
      image: u.image,
      joinedAt: u.createdAt.toISOString(),
      isInstructor: !!teaching,
      ...shapeIdentity(u.profile, !!u.instructorProfile),
      teaching,
      learningPublic,
      learning,
    };
  }

  private async teaching(instructorId: string) {
    const rows = await this.prisma.course.findMany({
      where: { instructorId, status: 'published' },
      select: CARD_SELECT,
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    });
    return { courses: await this.catalog.toCards(rows), studentCount: rows.reduce((s, c) => s + c.enrollmentCount, 0) };
  }

  // Chỉ gọi khi chủ hồ sơ đã bật công khai. Khoá đã gỡ khỏi catalog thì không liệt kê.
  private async learning(userId: string) {
    const [enrollments, certificates, skills, attempts] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId, course: { status: 'published' } },
        orderBy: [{ lastAccessedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
        select: { progressPct: true, completedAt: true, course: { select: COURSE } },
      }),
      this.prisma.certificate.findMany({
        where: { userId, revokedAt: null },
        orderBy: { issuedAt: 'desc' },
        select: { serialNo: true, issuedAt: true, course: { select: { title: true, slug: true } } },
      }),
      this.prisma.userTopicSkill.findMany({
        where: { userId },
        select: { topicId: true, rating: true, answerCount: true, topic: { select: { slug: true, name: true } } },
      }),
      this.prisma.skillAttempt.findMany({
        where: { userId, status: 'in_progress' },
        select: {
          topicId: true,
          ratingBefore: true,
          _count: { select: { answers: { where: { answeredAt: { not: null } } } } },
        },
      }),
    ]);
    const course = (e: (typeof enrollments)[number]) => ({
      slug: e.course.slug,
      title: e.course.title,
      thumbnailUrl: e.course.thumbnailUrl,
      instructorName: e.course.instructor.name,
    });
    // Lượt đang làm dở: báo số liệu từ trước lượt đó (như GET /skills), không thì % đổi theo từng câu sẽ lộ đúng/sai.
    const open = new Map(attempts.map((a) => [a.topicId, a]));
    return {
      inProgress: enrollments
        .filter((e) => !e.completedAt)
        .map((e) => ({ ...course(e), progressPct: Math.round(Number(e.progressPct)) })),
      completed: enrollments
        .filter((e) => e.completedAt)
        .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())
        .map((e) => ({ ...course(e), completedAt: e.completedAt!.toISOString() })),
      certificates: certificates.map((c) => ({
        serialNo: c.serialNo,
        courseTitle: c.course.title,
        courseSlug: c.course.slug,
        issuedAt: c.issuedAt.toISOString(),
      })),
      skills: skills
        .flatMap((s) => {
          const cur = open.get(s.topicId);
          if (s.answerCount - (cur?._count.answers ?? 0) <= 0) return [];
          return [{ slug: s.topic.slug, name: s.topic.name, pct: masteryPct(cur ? cur.ratingBefore : s.rating) }];
        })
        .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name)),
    };
  }

  async mine(userId: string) {
    const [own, instructor] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId }, select: OWN }),
      this.prisma.instructorProfile.findUnique({ where: { userId }, select: { userId: true } }),
    ]);
    // verified: giảng viên đã xác minh, được đặt website / mạng xã hội.
    const { headline, bio, coverTone, website, socials, verified } = shapeIdentity(own, !!instructor);
    return { headline, bio, coverTone, website, socials, verified, learningPublic: own?.learningPublic ?? false };
  }

  async update(userId: string, input: UpdateProfileInput) {
    // Liên kết ra ngoài chỉ dành cho người đã qua duyệt đơn giảng viên; không thì ai cũng rải link được.
    if (input.website !== undefined || input.socials !== undefined) {
      const ok = await this.prisma.instructorProfile.findUnique({ where: { userId }, select: { userId: true } });
      if (!ok) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'LINKS_REQUIRE_VERIFICATION',
          message: 'Chỉ giảng viên đã xác minh mới thêm được liên kết',
        });
      }
    }
    await this.prisma.userProfile.upsert({ where: { userId }, create: { userId, ...input }, update: input });
    return this.mine(userId);
  }
}
