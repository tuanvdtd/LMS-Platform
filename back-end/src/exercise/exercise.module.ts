import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { CodeRunner } from './code-runner.js';
import { ExerciseController } from './exercise.controller.js';
import { ExerciseService } from './exercise.service.js';
import { LearnExerciseController } from './learn-exercise.controller.js';
import { LearnExerciseService } from './learn-exercise.service.js';
import { SubmissionConsumer } from './submission.consumer.js';

@Module({
  imports: [InstructorCoursesModule, CurriculumModule],
  controllers: [ExerciseController, LearnExerciseController],
  providers: [CodeRunner, ExerciseService, LearnExerciseService, SubmissionConsumer],
})
export class ExerciseModule {}
