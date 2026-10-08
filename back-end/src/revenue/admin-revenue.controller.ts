import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { adminPayoutsQuery, closePeriodSchema, markPaidSchema, sharePctSchema } from './revenue.schemas.js';
import type { AdminPayoutsQuery, ClosePeriodInput, MarkPaidInput, SharePctInput } from './revenue.schemas.js';
import { RevenueService } from './revenue.service.js';

type User = AuthSession['user'];

@Roles('admin')
@Controller('admin')
export class AdminRevenueController {
  constructor(private readonly revenue: RevenueService) {}

  @Get('settings/revenue-share')
  getShare() {
    return this.revenue.getSharePct();
  }

  @Put('settings/revenue-share')
  setShare(@CurrentUser() user: User, @Body(new ZodValidationPipe(sharePctSchema)) body: SharePctInput) {
    return this.revenue.setSharePct(body.sharePct, user.id);
  }

  @Post('payouts/close-period')
  @HttpCode(200)
  close(@Body(new ZodValidationPipe(closePeriodSchema)) body: ClosePeriodInput) {
    return this.revenue.closePeriod(body.period);
  }

  @Get('payouts')
  list(@Query(new ZodValidationPipe(adminPayoutsQuery)) q: AdminPayoutsQuery) {
    return this.revenue.adminPayouts(q);
  }

  @Get('payouts/:id')
  detail(@Param('id') id: string) {
    return this.revenue.adminPayout(id);
  }

  @Post('payouts/:id/mark-paid')
  @HttpCode(200)
  markPaid(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(markPaidSchema)) body: MarkPaidInput,
  ) {
    return this.revenue.markPaid(id, user.id, body);
  }
}
