import { Injectable } from '@nestjs/common';
import { requireEnv } from '../env.js';
import { type DiditDecision, verifyDiditWebhook } from './identity-rules.js';

const BASE = 'https://verification.didit.me/v3';

// Chỗ duy nhất trong src/ gọi Didit. E2E thay createSession/getDecision bằng test/fake-didit.ts;
// verifyWebhook giữ bản thật để kiểm chữ ký thật. Sandbox và live chung endpoint, khác nhau ở API key.
@Injectable()
export class DiditGateway {
  private readonly apiKey = requireEnv('DIDIT_API_KEY');
  private readonly workflowId = requireEnv('DIDIT_WORKFLOW_ID');
  private readonly webhookSecret = requireEnv('DIDIT_WEBHOOK_SECRET');
  // Làm xong trên trang Didit thì quay về wizard; GET đơn ở đó tự hỏi Didit kết quả.
  private readonly callback = `${requireEnv('FE_URL')}/instructor/verification`;

  // vendor_data = userId: còn phiên dở cho cùng (workflow, user) thì Didit trả lại đúng phiên đó.
  async createSession(userId: string): Promise<{ sessionId: string; url: string }> {
    const s = await this.request<{ session_id: string; url: string }>('/session/', {
      method: 'POST',
      body: JSON.stringify({ workflow_id: this.workflowId, vendor_data: userId, language: 'vi', callback: this.callback }),
    });
    return { sessionId: s.session_id, url: s.url };
  }

  getDecision(sessionId: string): Promise<DiditDecision> {
    return this.request<DiditDecision>(`/session/${encodeURIComponent(sessionId)}/decision/`);
  }

  // Body đã parse nếu chữ ký + thời điểm hợp lệ, null nếu không.
  verifyWebhook(raw: Buffer, signature: string | undefined): Record<string, unknown> | null {
    return verifyDiditWebhook(raw, signature, this.webhookSecret);
  }

  // Timeout 5s: webhook của Didit chờ tối đa 5s, người dùng cũng không nên chờ lâu hơn.
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(BASE + path, {
      ...init,
      headers: { 'x-api-key': this.apiKey, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      throw new Error(`Didit ${init.method ?? 'GET'} ${path} → ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }
}
