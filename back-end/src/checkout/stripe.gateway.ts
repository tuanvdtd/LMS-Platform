import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { requireEnv } from '../env.js';

// Chỗ duy nhất trong src/ gọi Stripe SDK (spec stripe-checkout §5). E2E thay 3 hàm gọi mạng bằng
// test/fake-stripe.ts; constructEvent giữ bản thật để kiểm chữ ký thật.
// Tổng thời gian chờ (timeout × (1 + retries) + backoff ≈ 10.5s) phải < timeout TX checkout (60s, CHECKOUT_TX), không thì
// Prisma ném "Transaction already closed" sau khi session đã tạo. Stripe treo → hết 10.5s ném lỗi → 502, TX rollback.
@Injectable()
export class StripeGateway {
  private readonly stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), { timeout: 5_000, maxNetworkRetries: 1 });
  private readonly webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');

  createSession(params: Stripe.Checkout.SessionCreateParams): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create(params);
  }

  retrieveSession(id: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(id);
  }

  expireSession(id: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.expire(id);
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }
}
