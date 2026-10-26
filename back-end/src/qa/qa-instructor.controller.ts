import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { answerSchema, instructorQuestionsQuery } from './qa.schemas.js';
import type { AnswerInput, InstructorQuestionsQuery } from './qa.schemas.js';
import { QaService } from './qa.service.js';

type User = AuthSession['user'];

// Hỏi đáp phía giảng viên: mọi khoá có instructorId = mình (spec 2026-10-20-course-qa §4).
@Roles('instructor')
@Controller('instructor/questions')
export class QaInstructorController {
  constructor(private readonly qa: QaService) {}

  @Get()
  list(@CurrentUser() user: User, @Query(new ZodValidationPipe(instructorQuestionsQuery)) q: InstructorQuestionsQuery) {
    return this.qa.listForInstructor(user.id, q);
  }

  @Post(':questionId/answers')
  async answer(
    @CurrentUser() user: User,
    @Param('questionId') id: string,
    @Body(new ZodValidationPipe(answerSchema)) body: AnswerInput,
  ) {
    return this.qa.answer(await this.qa.instructorQuestion(user.id, id), user.id, body);
  }

  @Delete('answers/:answerId')
  @HttpCode(204)
  async removeAnswer(@CurrentUser() user: User, @Param('answerId') id: string) {
    await this.qa.removeAnswer(await this.qa.instructorAnswer(user.id, id), user.id);
  }

  @Delete(':questionId')
  @HttpCode(204)
  async removeQuestion(@CurrentUser() user: User, @Param('questionId') id: string) {
    await this.qa.removeQuestion(await this.qa.instructorQuestion(user.id, id), user.id);
  }
}
