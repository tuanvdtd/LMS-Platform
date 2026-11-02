import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { RevenueModule } from '../revenue/revenue.module.js';
import { AdminInstructorApplicationsController } from './admin-instructor-applications.controller.js';
import { InstructorApplicationController } from './instructor-application.controller.js';
import { InstructorApplicationsService } from './instructor-applications.service.js';

@Module({
  imports: [AuthModule, MailModule, RevenueModule],
  controllers: [InstructorApplicationController, AdminInstructorApplicationsController],
  providers: [InstructorApplicationsService],
})
export class InstructorApplicationsModule {}
