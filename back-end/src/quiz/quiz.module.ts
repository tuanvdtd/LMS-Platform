import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { LearnQuizController } from './learn-quiz.controller.js';
import { LearnQuizService } from './learn-quiz.service.js';
import { QuizController } from './quiz.controller.js';
import { QuizService } from './quiz.service.js';

@Module({
  imports: [InstructorCoursesModule, CurriculumModule],
  controllers: [QuizController, LearnQuizController],
  providers: [QuizService, LearnQuizService],
})
export class QuizModule {}
