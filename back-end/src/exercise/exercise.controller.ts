import { Body, Controller, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { updateCodeSchema, updateExerciseSchema } from './exercise.schemas.js';
import type { UpdateCodeInput, UpdateExerciseInput } from './exercise.schemas.js';
import { ExerciseService } from './exercise.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses/:courseId/items/:itemId/exercise')
export class ExerciseController {
  constructor(private readonly exercise: ExerciseService) {}

  @Get()
  get(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.exercise.get(courseId, user.id, itemId);
  }

  @Patch()
  update(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateExerciseSchema)) body: UpdateExerciseInput,
  ) {
    return this.exercise.update(courseId, user.id, itemId, body);
  }

  @Put('code')
  updateCode(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateCodeSchema)) body: UpdateCodeInput,
  ) {
    return this.exercise.updateCode(courseId, user.id, itemId, body);
  }

  @Post('verify')
  @HttpCode(200)
  verify(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('itemId') itemId: string) {
    return this.exercise.verify(courseId, user.id, itemId);
  }
}
