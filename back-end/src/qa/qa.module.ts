import { Module } from '@nestjs/common';
import { QaInstructorController } from './qa-instructor.controller.js';
import { QaLearnController } from './qa-learn.controller.js';
import { QaService } from './qa.service.js';

@Module({
  controllers: [QaLearnController, QaInstructorController],
  providers: [QaService],
})
export class QaModule {}
