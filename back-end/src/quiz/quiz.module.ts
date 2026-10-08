import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { QuizController } from './quiz.controller.js';
import { QuizService } from './quiz.service.js';

@Module({ imports: [InstructorCoursesModule, CurriculumModule], controllers: [QuizController], providers: [QuizService] })
export class QuizModule {}
