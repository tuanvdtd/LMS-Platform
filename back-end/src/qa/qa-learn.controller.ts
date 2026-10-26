import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { answerSchema, createQuestionSchema, learnQuestionsQuery } from './qa.schemas.js';
import type { AnswerInput, CreateQuestionInput, LearnQuestionsQuery } from './qa.schemas.js';
import { QaService } from './qa.service.js';

type User = AuthSession['user'];

// Hỏi đáp phía học viên (spec 2026-10-20-course-qa §4). Ghi danh kiểm trong service.
@Controller('learn/:courseSlug')
export class QaLearnController {
  constructor(private readonly qa: QaService) {}

  @Get('questions')
  list(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Query(new ZodValidationPipe(learnQuestionsQuery)) q: LearnQuestionsQuery,
  ) {
    return this.qa.listForLearner(slug, user.id, q);
  }

  @Post('questions')
  create(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Body(new ZodValidationPipe(createQuestionSchema)) body: CreateQuestionInput,
  ) {
    return this.qa.create(slug, user.id, body);
  }

  @Post('questions/:questionId/answers')
  async answer(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Param('questionId') id: string,
    @Body(new ZodValidationPipe(answerSchema)) body: AnswerInput,
  ) {
    return this.qa.answer(await this.qa.learnerQuestion(slug, user.id, id), user.id, body);
  }

  @Delete('questions/:questionId')
  @HttpCode(204)
  async removeQuestion(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('questionId') id: string) {
    await this.qa.removeQuestion(await this.qa.learnerQuestion(slug, user.id, id), user.id);
  }

  @Delete('answers/:answerId')
  @HttpCode(204)
  async removeAnswer(@CurrentUser() user: User, @Param('courseSlug') slug: string, @Param('answerId') id: string) {
    await this.qa.removeAnswer(await this.qa.learnerAnswer(slug, user.id, id), user.id);
  }
}
