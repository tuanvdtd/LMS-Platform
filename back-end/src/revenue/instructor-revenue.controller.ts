import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { pageQuery, payoutAccountSchema } from './revenue.schemas.js';
import type { PageQuery, PayoutAccountInput } from './revenue.schemas.js';
import { RevenueService } from './revenue.service.js';

type User = AuthSession['user'];

@Roles('instructor')
@Controller('instructor')
export class InstructorRevenueController {
  constructor(private readonly revenue: RevenueService) {}

  @Get('payout-account')
  getAccount(@CurrentUser() user: User) {
    return this.revenue.getPayoutAccount(user.id);
  }

  @Put('payout-account')
  setAccount(@CurrentUser() user: User, @Body(new ZodValidationPipe(payoutAccountSchema)) body: PayoutAccountInput) {
    return this.revenue.setPayoutAccount(user.id, body);
  }

  @Get('earnings/summary')
  summary(@CurrentUser() user: User) {
    return this.revenue.summary(user.id);
  }

  @Get('payouts')
  payouts(@CurrentUser() user: User, @Query(new ZodValidationPipe(pageQuery)) q: PageQuery) {
    return this.revenue.myPayouts(user.id, q.page);
  }
}
