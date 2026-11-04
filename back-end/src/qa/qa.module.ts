import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { QaInstructorController } from './qa-instructor.controller.js';
import { QaLearnController } from './qa-learn.controller.js';
import { QaService } from './qa.service.js';

@Module({
  imports: [NotificationsModule],
  controllers: [QaLearnController, QaInstructorController],
  providers: [QaService],
})
export class QaModule {}
