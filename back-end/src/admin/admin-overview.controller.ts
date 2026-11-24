import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { overviewQuery, type OverviewQuery } from './admin.schemas.js';
import { AdminOverviewService } from './admin-overview.service.js';

@Roles('admin')
@Controller('admin/overview')
export class AdminOverviewController {
  constructor(private readonly overview: AdminOverviewService) {}

  @Get()
  get(@Query(new ZodValidationPipe(overviewQuery)) q: OverviewQuery) {
    return this.overview.overview(q.range);
  }
}
