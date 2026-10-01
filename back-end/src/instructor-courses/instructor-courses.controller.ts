import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createCourseSchema, updateCourseSchema } from './instructor-courses.schemas.js';
import type { CreateCourseInput, UpdateCourseInput } from './instructor-courses.schemas.js';
import { InstructorCoursesService } from './instructor-courses.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/courses')
export class InstructorCoursesController {
  constructor(private readonly courses: InstructorCoursesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body(new ZodValidationPipe(createCourseSchema)) body: CreateCourseInput) {
    return this.courses.create(user.id, body.title);
  }

  @Get()
  list(@CurrentUser() user: User) {
    return this.courses.list(user.id);
  }

  @Get(':id')
  detail(@CurrentUser() user: User, @Param('id') id: string) {
    return this.courses.detail(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCourseSchema)) body: UpdateCourseInput,
  ) {
    return this.courses.update(id, user.id, body);
  }
}
