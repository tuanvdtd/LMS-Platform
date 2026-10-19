import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminModeratorsController } from './admin-moderators.controller.js';
import { ModeratorsService } from './moderators.service.js';

@Module({ imports: [AuthModule], controllers: [AdminModeratorsController], providers: [ModeratorsService] })
export class ModeratorsModule {}
