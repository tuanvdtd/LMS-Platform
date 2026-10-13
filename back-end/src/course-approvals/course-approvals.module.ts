import { Module } from '@nestjs/common';
import { CurriculumModule } from '../curriculum/curriculum.module.js';
import { MailService } from '../mail/mail.service.js';
import { InstructorCoursesModule } from '../instructor-courses/instructor-courses.module.js';
import { AdminCourseApprovalsController } from './admin-course-approvals.controller.js';
import { CourseApprovalsService } from './course-approvals.service.js';
import { InstructorSubmitController } from './instructor-submit.controller.js';

@Module({
  imports: [InstructorCoursesModule, CurriculumModule],
  controllers: [InstructorSubmitController, AdminCourseApprovalsController],
  providers: [CourseApprovalsService, MailService],
})
export class CourseApprovalsModule {}
