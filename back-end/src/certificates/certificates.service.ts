import { GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { requireEnv } from '../env.js';
import { PrismaService } from '../infra/prisma.service.js';
import { measure, renderPdf, renderPng } from './certificate-render.js';
import { certificateSvg, type CertificateView } from './certificate-template.js';
import { SERIAL_RE } from './serial.js';

const MAX_SKILLS = 4;
const notFound = () =>
  new NotFoundException({ statusCode: 404, code: 'CERTIFICATE_NOT_FOUND', message: 'Không tìm thấy chứng chỉ' });
const revoked = () =>
  new GoneException({ statusCode: 410, code: 'CERTIFICATE_REVOKED', message: 'Chứng chỉ này đã bị thu hồi' });

@Injectable()
export class CertificatesService {
  private readonly verifyBase = `${requireEnv('FE_URL').replace(/\/$/, '')}/verify/`;

  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    const rows = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      select: { serialNo: true, issuedAt: true, revokedAt: true, course: { select: { title: true, slug: true } } },
    });
    return rows.map((r) => ({
      serialNo: r.serialNo,
      course: r.course,
      issuedAt: r.issuedAt.toISOString(),
      revoked: r.revokedAt !== null,
    }));
  }

  // Nội dung in lấy theo dữ liệu hiện tại (không chụp lại lúc cấp): học viên sửa tên thì chứng chỉ đổi theo.
  private async find(serialNo: string): Promise<(CertificateView & { courseSlug: string }) | null> {
    if (!SERIAL_RE.test(serialNo)) return null;
    const c = await this.prisma.certificate.findUnique({
      where: { serialNo },
      select: {
        serialNo: true,
        issuedAt: true,
        revokedAt: true,
        revokeReason: true,
        user: { select: { name: true } },
        course: {
          select: {
            title: true,
            slug: true,
            instructor: { select: { name: true } },
            topics: { select: { isPrimary: true, topic: { select: { name: true } } } },
          },
        },
      },
    });
    if (!c) return null;
    const skills = [...c.course.topics]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.topic.name.localeCompare(b.topic.name))
      .slice(0, MAX_SKILLS)
      .map((t) => t.topic.name);
    return {
      serialNo: c.serialNo,
      learnerName: c.user.name,
      courseTitle: c.course.title,
      courseSlug: c.course.slug,
      instructorName: c.course.instructor.name,
      skills,
      issuedAt: c.issuedAt,
      revokedAt: c.revokedAt,
      revokeReason: c.revokeReason,
    };
  }

  async info(serialNo: string) {
    const v = await this.find(serialNo);
    if (!v) throw notFound();
    return {
      serialNo: v.serialNo,
      learnerName: v.learnerName,
      courseTitle: v.courseTitle,
      courseSlug: v.courseSlug,
      instructorName: v.instructorName,
      skills: v.skills,
      issuedAt: v.issuedAt.toISOString(),
      revoked: v.revokedAt !== null,
      revokeReason: v.revokeReason,
    };
  }

  private async svg(serialNo: string): Promise<string> {
    const v = await this.find(serialNo);
    if (!v) throw notFound();
    if (v.revokedAt) throw revoked();
    return certificateSvg(v, { verifyBase: this.verifyBase, measure });
  }

  async image(serialNo: string): Promise<Buffer> {
    return renderPng(await this.svg(serialNo));
  }

  async pdf(serialNo: string): Promise<Buffer> {
    return renderPdf(await this.svg(serialNo));
  }
}
