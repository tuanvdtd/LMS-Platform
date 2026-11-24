import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { AdminOverviewController } from './admin-overview.controller.js';
import { AdminOverviewService } from './admin-overview.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { AuditLogService } from './audit-log.service.js';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [AdminUsersController, AdminOverviewController],
  providers: [AuditLogService, AdminUsersService, AdminOverviewService],
  exports: [AuditLogService],
})
export class AdminModule {}
