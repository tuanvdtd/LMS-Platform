import { Body, Controller, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { AUTH, type Auth, isStaff } from '../auth/auth.js';
import { Public } from '../auth/decorators.js';
import { clientIp, tooManyRequests } from '../common/http.js';
import { isGuid, ZodValidationPipe } from '../common/zod.pipe.js';
import { PrismaService } from '../infra/prisma.service.js';
import { RedisService, rateLimit } from '../infra/redis.js';
import { courseViewSchema, type CourseViewInput } from './analytics.schemas.js';

// Lượt xem trang khoá cho phễu chuyển đổi. Guard bỏ qua phiên với route @Public → tự đọc phiên (Redis, rẻ).
// Không ghi: khoá chưa xuất bản, chủ khoá, tài khoản nghiệp vụ, người đã ghi danh. Luôn 204 để trang khoá không phải xử lý lỗi.
// ponytail: chỉ chặn theo IP; ai cũng có thể bơm lượt xem bằng mã khách ngẫu nhiên. Cần thì ký mã khách phía server / captcha.
@Controller('courses')
export class CourseEventsController {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Post(':courseId/view')
  @HttpCode(204)
  async view(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Body(new ZodValidationPipe(courseViewSchema)) body: CourseViewInput,
  ): Promise<void> {
    if (!(await rateLimit(this.redis, `rl:course-view:${clientIp(req)}`, 60, 60))) throw tooManyRequests();
    if (!isGuid(courseId)) return;
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(req.headers) }).catch(() => null);
    const user = session?.user ?? null;
    if (user && isStaff(user.role)) return;
    const userId = user?.id ?? null;
    await this.prisma.$executeRaw`INSERT INTO course_events (id, "courseId", kind, "userId", "visitorId")
      SELECT ${uuidv7()}::uuid, c.id, 'page_view'::"CourseEventKind", ${userId}::uuid, ${body.visitorId}::uuid
      FROM courses c
      WHERE c.id = ${courseId}::uuid AND c.status = 'published' AND c."instructorId" IS DISTINCT FROM ${userId}::uuid
        AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e."courseId" = c.id AND e."userId" = ${userId}::uuid)`;
  }
}
