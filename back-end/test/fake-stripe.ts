import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { StripeGateway } from '../src/checkout/stripe.gateway.js';

type S = Stripe.Checkout.Session;

// Thay 3 hàm gọi mạng; constructEvent kế thừa bản thật (kiểm chữ ký thật).
export class FakeStripe extends StripeGateway {
  readonly sessions = new Map<string, S>();
  readonly created: Stripe.Checkout.SessionCreateParams[] = [];
  failNextCreate = false;

  override createSession(params: Stripe.Checkout.SessionCreateParams) {
    if (this.failNextCreate) {
      this.failNextCreate = false;
      return Promise.reject(new Error('stripe down'));
    }
    this.created.push(params);
    const id = `cs_test_${randomUUID()}`;
    const s = {
      id,
      url: `https://checkout.stripe.test/${id}`,
      status: 'open',
      payment_status: 'unpaid',
      metadata: params.metadata ?? {},
      payment_intent: null,
    } as unknown as S;
    this.sessions.set(id, s);
    return Promise.resolve(s);
  }
  override retrieveSession(id: string) {
    const s = this.sessions.get(id);
    return s ? Promise.resolve(s) : Promise.reject(new Error('no such session'));
  }
  override expireSession(id: string) {
    const s = this.sessions.get(id)!;
    if (s.status !== 'open') return Promise.reject(new Error('session not open'));
    s.status = 'expired';
    return Promise.resolve(s);
  }
  pay(id: string) {
    const s = this.sessions.get(id)!;
    Object.assign(s, { status: 'complete', payment_status: 'paid', payment_intent: `pi_${randomUUID()}` });
    return s;
  }
  expire(id: string) {
    const s = this.sessions.get(id)!;
    s.status = 'expired';
    return s;
  }
}

// Body + header chữ ký thật cho POST /api/webhooks/stripe. Trả kèm event id để test dọn payment_events.
export function signedEvent(type: string, session: S) {
  const id = `evt_${randomUUID()}`;
  const payload = JSON.stringify({ id, object: 'event', type, data: { object: session } });
  const header = new Stripe('sk_test_dummy').webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  });
  return { id, payload, header };
}
