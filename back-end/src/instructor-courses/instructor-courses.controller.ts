import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { createCourseSchema, mediaKeySchema, updateCourseSchema } from './instructor-courses.schemas.js';
import type { CreateCourseInput, MediaKeyInput, UpdateCourseInput } from './instructor-courses.schemas.js';
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

  @Put(':id/thumbnail')
  setThumbnail(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mediaKeySchema)) body: MediaKeyInput,
  ) {
    return this.courses.setThumbnail(id, user.id, body.key);
  }

  @Put(':id/promo-video')
  setPromoVideo(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mediaKeySchema)) body: MediaKeyInput,
  ) {
    return this.courses.setPromoVideo(id, user.id, body.key);
  }

  @Delete(':id/promo-video')
  removePromoVideo(@CurrentUser() user: User, @Param('id') id: string) {
    return this.courses.removePromoVideo(id, user.id);
  }
}
