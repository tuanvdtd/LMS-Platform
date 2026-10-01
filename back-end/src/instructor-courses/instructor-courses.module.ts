import { Module } from '@nestjs/common';
import { InstructorCoursesController } from './instructor-courses.controller.js';
import { InstructorCoursesService } from './instructor-courses.service.js';

@Module({ controllers: [InstructorCoursesController], providers: [InstructorCoursesService] })
export class InstructorCoursesModule {}
