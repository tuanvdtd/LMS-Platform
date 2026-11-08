import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { answerSchema, type AnswerInput } from './skills.schemas.js';
import { SkillsService } from './skills.service.js';

type User = AuthSession['user'];

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  overview(@CurrentUser() user: User) {
    return this.skills.overview(user.id);
  }

  @Post(':topicSlug/attempts')
  @HttpCode(200)
  start(@CurrentUser() user: User, @Param('topicSlug') slug: string) {
    return this.skills.start(user.id, slug);
  }

  @Get('attempts/:id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.skills.get(user.id, id);
  }

  @Post('attempts/:id/answer')
  @HttpCode(200)
  answer(@CurrentUser() user: User, @Param('id') id: string, @Body(new ZodValidationPipe(answerSchema)) body: AnswerInput) {
    return this.skills.answer(user.id, id, body);
  }
}
