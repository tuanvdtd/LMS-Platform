import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { submitSchema } from './learn-quiz.schemas.js';
import type { SubmitInput } from './learn-quiz.schemas.js';
import { LearnQuizService } from './learn-quiz.service.js';

type User = AuthSession['user'];

// Mọi user đăng nhập; ghi danh kiểm trong service (spec 2026-10-17-quiz-taking §3).
@Controller('learn/:courseSlug/quizzes/:itemId')
export class LearnQuizController {
  constructor(private readonly quiz: LearnQuizService) {}

  @Get()
  overview(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.quiz.overview(slug, user.id, itemId);
  }

  @Post('attempts')
  @HttpCode(200)
  start(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.quiz.start(slug, user.id, itemId);
  }

  @Post('attempts/:attemptId/submit')
  @HttpCode(200)
  submit(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Param('attemptId') attemptId: string,
    @Body(new ZodValidationPipe(submitSchema)) body: SubmitInput,
  ) {
    return this.quiz.submit(slug, user.id, itemId, attemptId, body);
  }

  @Get('attempts/:attemptId')
  result(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.quiz.result(slug, user.id, itemId, attemptId);
  }
}
