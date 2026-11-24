import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AnalyticsCoursesService } from './analytics-courses.service.js';
import { CourseEventsController } from './course-events.controller.js';
import { AnalyticsController } from './analytics.controller.js';
import { AssessmentsAnalyticsService } from './assessments.service.js';
import { ClassSkillsService } from './class-skills.service.js';
import { EngagementAnalyticsService } from './engagement.service.js';
import { OverviewAnalyticsService } from './overview.service.js';
import { SalesAnalyticsService } from './sales.service.js';
import { StudentsAnalyticsService } from './students.service.js';

@Module({
  imports: [AuthModule, MailModule, MessagesModule, NotificationsModule],
  controllers: [AnalyticsController, CourseEventsController],
  providers: [AnalyticsCoursesService, AssessmentsAnalyticsService, ClassSkillsService, EngagementAnalyticsService, OverviewAnalyticsService, SalesAnalyticsService, StudentsAnalyticsService],
})
export class AnalyticsModule {}
