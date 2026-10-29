import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { applicationsQuery, rejectSchema } from './instructor-applications.schemas.js';
import type { ApplicationsQuery, RejectInput } from './instructor-applications.schemas.js';
import { InstructorApplicationsService } from './instructor-applications.service.js';

type User = AuthSession['user'];

// Chỉ admin: moderator bị giới hạn theo danh mục khoá, đơn giảng viên không thuộc danh mục nào.
@Roles('admin')
@Controller('admin/instructor-applications')
export class AdminInstructorApplicationsController {
  constructor(private readonly apps: InstructorApplicationsService) {}

  @Get()
  list(@Query(new ZodValidationPipe(applicationsQuery)) q: ApplicationsQuery) {
    return this.apps.list(q);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.apps.detail(id);
  }

  @Post(':id/approve')
  @HttpCode(200)
  approve(@CurrentUser() user: User, @Param('id') id: string) {
    return this.apps.approve(id, user.id);
  }

  @Post(':id/reject')
  @HttpCode(200)
  reject(@CurrentUser() user: User, @Param('id') id: string, @Body(new ZodValidationPipe(rejectSchema)) body: RejectInput) {
    return this.apps.reject(id, user.id, body.reason);
  }
}
