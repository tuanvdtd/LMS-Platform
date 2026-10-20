import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { codeSchema } from './learn-exercise.schemas.js';
import type { CodeInput } from './learn-exercise.schemas.js';
import { LearnExerciseService } from './learn-exercise.service.js';

type User = AuthSession['user'];

// Mọi user đăng nhập; ghi danh kiểm trong service (spec 2026-10-19-coding-exercise §7).
@Controller('learn/:courseSlug/exercises/:itemId')
export class LearnExerciseController {
  constructor(private readonly exercise: LearnExerciseService) {}

  @Get()
  overview(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.exercise.overview(slug, user.id, itemId);
  }

  @Post('run')
  @HttpCode(200)
  run(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(codeSchema)) body: CodeInput,
  ) {
    return this.exercise.run(slug, user.id, itemId, body);
  }

  @Post('submissions')
  @HttpCode(202)
  submit(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(codeSchema)) body: CodeInput,
  ) {
    return this.exercise.submit(slug, user.id, itemId, body);
  }

  @Get('submissions')
  submissions(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('itemId') itemId: string) {
    return this.exercise.submissions(slug, user.id, itemId);
  }

  @Get('submissions/:submissionId')
  submission(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('itemId') itemId: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.exercise.submission(slug, user.id, itemId, submissionId);
  }
}
