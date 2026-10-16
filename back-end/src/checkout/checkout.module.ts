import { Module } from '@nestjs/common';
import { RevenueModule } from '../revenue/revenue.module.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';
import { MeCheckoutController } from './me-checkout.controller.js';
import { StripeWebhookController } from './stripe-webhook.controller.js';
import { StripeGateway } from './stripe.gateway.js';

@Module({
  imports: [RevenueModule],
  controllers: [CheckoutController, StripeWebhookController, MeCheckoutController],
  providers: [CheckoutService, StripeGateway],
})
export class CheckoutModule {}
