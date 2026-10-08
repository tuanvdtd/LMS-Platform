import { Module } from '@nestjs/common';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { CurriculumController } from './curriculum.controller.js';
import { CurriculumService } from './curriculum.service.js';

@Module({
  imports: [InstructorCoursesModule],
  controllers: [CurriculumController],
  providers: [CurriculumService],
  exports: [CurriculumService],
})
export class CurriculumModule {}
