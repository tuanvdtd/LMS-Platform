import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { moveQuestionSchema, questionSchema, updateQuizSchema } from './quiz.schemas.js';
import type { MoveQuestionInput, QuestionInput, UpdateQuizInput } from './quiz.schemas.js';
import { QuizService } from './quiz.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses/:courseId/items/:itemId/quiz')
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Get()
  get(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.quiz.get(courseId, user.id, itemId);
  }

  @Patch()
  update(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateQuizSchema)) body: UpdateQuizInput,
  ) {
    return this.quiz.update(courseId, user.id, itemId, body);
  }

  @Post('questions')
  createQuestion(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(questionSchema)) body: QuestionInput,
  ) {
    return this.quiz.createQuestion(courseId, user.id, itemId, body);
  }

  @Put('questions/:questionId')
  updateQuestion(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Param('questionId') questionId: string,
    @Body(new ZodValidationPipe(questionSchema)) body: QuestionInput,
  ) {
    return this.quiz.updateQuestion(courseId, user.id, itemId, questionId, body);
  }

  @Delete('questions/:questionId')
  deleteQuestion(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.quiz.deleteQuestion(courseId, user.id, itemId, questionId);
  }

  @Post('questions/:questionId/move')
  @HttpCode(200)
  moveQuestion(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Param('questionId') questionId: string,
    @Body(new ZodValidationPipe(moveQuestionSchema)) body: MoveQuestionInput,
  ) {
    return this.quiz.moveQuestion(courseId, user.id, itemId, questionId, body.index);
  }
}
