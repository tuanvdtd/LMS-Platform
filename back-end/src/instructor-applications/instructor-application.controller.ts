import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { mediaKeySchema, type MediaKeyInput } from '../instructor-courses/instructor-courses.schemas.js';
import { payoutAccountSchema, type PayoutAccountInput } from '../revenue/revenue.schemas.js';
import { infoSchema, type InfoInput, termsSchema } from './instructor-applications.schemas.js';
import { InstructorApplicationsService } from './instructor-applications.service.js';

type User = AuthSession['user'];

// Mỗi bước wizard một PUT, bấm "Lưu" mới gọi (không autosave).
@Roles('instructor')
@Controller('instructor/application')
export class InstructorApplicationController {
  constructor(private readonly apps: InstructorApplicationsService) {}

  @Get()
  view(@CurrentUser() user: User) {
    return this.apps.view(user.id);
  }

  @Put('info')
  saveInfo(@CurrentUser() user: User, @Body(new ZodValidationPipe(infoSchema)) body: InfoInput) {
    return this.apps.saveInfo(user.id, body);
  }

  @Put('avatar')
  saveAvatar(@CurrentUser() user: User, @Body(new ZodValidationPipe(mediaKeySchema)) body: MediaKeyInput) {
    return this.apps.saveAvatar(user.id, body.key);
  }

  @Put('terms')
  acceptTerms(@CurrentUser() user: User, @Body(new ZodValidationPipe(termsSchema)) _body: unknown) {
    return this.apps.acceptTerms(user.id);
  }

  @Put('payout')
  savePayout(@CurrentUser() user: User, @Body(new ZodValidationPipe(payoutAccountSchema)) body: PayoutAccountInput) {
    return this.apps.savePayout(user.id, body);
  }

  @Post('submit')
  @HttpCode(200)
  submit(@CurrentUser() user: User) {
    return this.apps.submit(user.id);
  }
}
