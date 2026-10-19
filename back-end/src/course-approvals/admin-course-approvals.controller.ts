import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { approvalsQuery, rejectSchema } from './course-approvals.schemas.js';
import type { ApprovalsQuery, RejectInput } from './course-approvals.schemas.js';
import { CourseApprovalsService } from './course-approvals.service.js';

type User = AuthSession['user'];

// Moderator chỉ thấy khoá thuộc danh mục được gán; admin thấy tất cả.
@Roles('admin', 'moderator')
@Controller('admin/course-approvals')
export class AdminCourseApprovalsController {
  constructor(private readonly approvals: CourseApprovalsService) {}

  @Get()
  async list(@CurrentUser() user: User, @Query(new ZodValidationPipe(approvalsQuery)) q: ApprovalsQuery) {
    return this.approvals.list(q, await this.approvals.scopeOf(user));
  }

  @Get(':id')
  async detail(@CurrentUser() user: User, @Param('id') id: string) {
    return this.approvals.detail(id, await this.approvals.scopeOf(user));
  }

  @Post(':id/approve')
  @HttpCode(200)
  async approve(@CurrentUser() user: User, @Param('id') id: string) {
    return this.approvals.approve(id, user.id, await this.approvals.scopeOf(user));
  }

  @Post(':id/reject')
  @HttpCode(200)
  async reject(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectSchema)) body: RejectInput,
  ) {
    return this.approvals.reject(id, user.id, await this.approvals.scopeOf(user), body.reason);
  }

  @Get(':id/assets/:assetId/url')
  async assetUrl(@CurrentUser() user: User, @Param('id') id: string, @Param('assetId') assetId: string) {
    return this.approvals.assetUrl(id, assetId, await this.approvals.scopeOf(user));
  }
}
