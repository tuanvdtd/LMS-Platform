import { Controller, Get, Param } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { CheckoutService } from './checkout.service.js';

type User = AuthSession['user'];

@Controller('me')
export class MeCheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get('orders')
  orders(@CurrentUser() user: User) {
    return this.checkout.myOrders(user.id);
  }

  @Get('orders/by-session/:sessionId')
  bySession(@CurrentUser() user: User, @Param('sessionId') sessionId: string) {
    return this.checkout.orderBySession(user.id, sessionId);
  }

  @Get('enrollments')
  enrollments(@CurrentUser() user: User) {
    return this.checkout.myEnrollments(user.id);
  }
}
