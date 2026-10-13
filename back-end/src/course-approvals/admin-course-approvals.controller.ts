import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { approvalsQuery, rejectSchema } from './course-approvals.schemas.js';
import type { ApprovalsQuery, RejectInput } from './course-approvals.schemas.js';
import { CourseApprovalsService } from './course-approvals.service.js';

@Roles('admin')
@Controller('admin/course-approvals')
export class AdminCourseApprovalsController {
  constructor(private readonly approvals: CourseApprovalsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(approvalsQuery)) q: ApprovalsQuery) {
    return this.approvals.list(q);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.approvals.detail(id);
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(@CurrentUser() user: AuthSession['user'], @Param('id') id: string) {
    return this.approvals.approve(id, user.id);
  }

  @Post(':id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectSchema)) body: RejectInput,
  ) {
    return this.approvals.reject(id, user.id, body.reason);
  }

  @Get(':id/assets/:assetId/url')
  assetUrl(@Param('id') id: string, @Param('assetId') assetId: string) {
    return this.approvals.assetUrl(id, assetId);
  }
}
