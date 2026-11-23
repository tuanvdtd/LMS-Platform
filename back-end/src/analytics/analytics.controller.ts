import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { AnalyticsCoursesService } from './analytics-courses.service.js';
import { nudgeSchema, studentsQuery, type NudgeInput, type StudentsQuery } from './analytics.schemas.js';
import { AssessmentsAnalyticsService } from './assessments.service.js';
import { ClassSkillsService } from './class-skills.service.js';
import { StudentsAnalyticsService } from './students.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor/analytics')
export class AnalyticsController {
  constructor(
    private readonly courses: AnalyticsCoursesService,
    private readonly assessments: AssessmentsAnalyticsService,
    private readonly skills: ClassSkillsService,
    private readonly students: StudentsAnalyticsService,
  ) {}

  @Get('courses')
  list(@CurrentUser() user: User) {
    return this.courses.list(user.id);
  }

  @Get('courses/:courseId/assessments')
  assessmentsOf(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.assessments.overview(courseId, user.id);
  }

  @Get('quizzes/:quizId')
  quiz(@CurrentUser() user: User, @Param('quizId') quizId: string) {
    return this.assessments.quiz(quizId, user.id);
  }

  @Get('exercises/:exerciseId')
  exercise(@CurrentUser() user: User, @Param('exerciseId') exerciseId: string) {
    return this.assessments.exercise(exerciseId, user.id);
  }

  @Get('courses/:courseId/skills')
  skillsOf(@CurrentUser() user: User, @Param('courseId') courseId: string) {
    return this.skills.course(courseId, user.id);
  }

  @Get('courses/:courseId/students')
  studentsOf(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
    @Query(new ZodValidationPipe(studentsQuery)) q: StudentsQuery,
  ) {
    return this.students.list(courseId, user.id, q);
  }

  @Get('courses/:courseId/students/:userId')
  student(@CurrentUser() user: User, @Param('courseId') courseId: string, @Param('userId') userId: string) {
    return this.students.detail(courseId, userId, user.id);
  }

  @Post('courses/:courseId/nudges')
  @HttpCode(200)
  nudge(@CurrentUser() user: User, @Param('courseId') courseId: string, @Body(new ZodValidationPipe(nudgeSchema)) body: NudgeInput) {
    return this.students.nudge(courseId, { id: user.id, name: user.name }, body);
  }
}
