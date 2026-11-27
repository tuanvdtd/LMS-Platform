import { createHmac, randomUUID } from 'node:crypto';
import { DiditGateway } from '../src/instructor-applications/didit.gateway.js';
import type { DiditDecision } from '../src/instructor-applications/identity-rules.js';

// Thay 2 hàm gọi mạng. verifyWebhook kế thừa bản thật (kiểm chữ ký thật bằng DIDIT_WEBHOOK_SECRET).
export class FakeDidit extends DiditGateway {
  readonly decisions = new Map<string, DiditDecision>();
  decisionCalls = 0;
  failNext = false;

  override createSession(_userId: string) {
    if (this.takeFail()) return Promise.reject(new Error('didit down'));
    const sessionId = randomUUID();
    this.decisions.set(sessionId, { status: 'Not Started' });
    return Promise.resolve({ sessionId, url: `https://verify.didit.test/session/${sessionId}` });
  }

  override getDecision(sessionId: string) {
    this.decisionCalls++;
    if (this.takeFail()) return Promise.reject(new Error('didit down'));
    const d = this.decisions.get(sessionId);
    return d ? Promise.resolve(d) : Promise.reject(new Error('Didit 404'));
  }

  decide(sessionId: string, status: string, fullName?: string) {
    this.decisions.set(sessionId, { status, id_verifications: fullName ? [{ full_name: fullName }] : [] });
  }

  private takeFail() {
    const f = this.failNext;
    this.failNext = false;
    return f;
  }
}

// Body (có timestamp như Didit gửi) + header ký thật cho POST /api/webhooks/didit.
export function signedDidit(body: object, ts = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify({ timestamp: ts, ...body });
  const signature = createHmac('sha256', process.env.DIDIT_WEBHOOK_SECRET!).update(payload).digest('hex');
  return { payload, headers: { 'X-Signature': signature } };
}
