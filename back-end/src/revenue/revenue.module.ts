import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AdminRevenueController } from './admin-revenue.controller.js';
import { InstructorRevenueController } from './instructor-revenue.controller.js';
import { RevenueService } from './revenue.service.js';

@Module({
  imports: [MailModule, NotificationsModule],
  controllers: [InstructorRevenueController, AdminRevenueController],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
