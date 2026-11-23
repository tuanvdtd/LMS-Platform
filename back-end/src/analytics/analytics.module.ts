import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AnalyticsCoursesService } from './analytics-courses.service.js';
import { AnalyticsController } from './analytics.controller.js';
import { AssessmentsAnalyticsService } from './assessments.service.js';
import { ClassSkillsService } from './class-skills.service.js';
import { StudentsAnalyticsService } from './students.service.js';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsCoursesService, AssessmentsAnalyticsService, ClassSkillsService, StudentsAnalyticsService],
})
export class AnalyticsModule {}
