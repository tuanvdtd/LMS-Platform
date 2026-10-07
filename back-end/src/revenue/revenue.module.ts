import { Module } from '@nestjs/common';
import { AdminRevenueController } from './admin-revenue.controller.js';
import { InstructorRevenueController } from './instructor-revenue.controller.js';
import { RevenueService } from './revenue.service.js';

@Module({ controllers: [InstructorRevenueController, AdminRevenueController], providers: [RevenueService] })
export class RevenueModule {}
