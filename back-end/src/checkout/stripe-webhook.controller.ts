import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/decorators.js';
import { CheckoutService } from './checkout.service.js';

// Body là Buffer nhờ express.raw ở setup-app.ts.
@Public()
@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('stripe')
  @HttpCode(200)
  handle(@Req() req: Request, @Headers('stripe-signature') signature: string | undefined) {
    return this.checkout.handleWebhook(req.body as Buffer, signature);
  }
}
