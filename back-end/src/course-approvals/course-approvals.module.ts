import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { MailModule } from '../mail/mail.module.js';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { AdminCourseApprovalsController } from './admin-course-approvals.controller.js';
import { CourseApprovalsService } from './course-approvals.service.js';
import { InstructorSubmitController } from './instructor-submit.controller.js';

@Module({
  imports: [InstructorCoursesModule, CurriculumModule, MailModule],
  controllers: [InstructorSubmitController, AdminCourseApprovalsController],
  providers: [CourseApprovalsService],
})
export class CourseApprovalsModule {}
