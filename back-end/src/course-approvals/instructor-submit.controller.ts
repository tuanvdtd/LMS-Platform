import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { submitSchema } from './course-approvals.schemas.js';
import type { SubmitInput } from './course-approvals.schemas.js';
import { CourseApprovalsService } from './course-approvals.service.js';

@Roles('instructor')
@Controller('instructor/courses')
export class InstructorSubmitController {
  constructor(private readonly approvals: CourseApprovalsService) {}

  @Post(':id/submit')
  @HttpCode(200)
  submit(
    @CurrentUser() user: AuthSession['user'],
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitSchema)) body: SubmitInput,
  ) {
    return this.approvals.submit(id, user.id, body.note);
  }
}
