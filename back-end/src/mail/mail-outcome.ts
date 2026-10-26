import { z } from 'zod';

// 1 lần đầu + 3 retry, mỗi lần chờ 60s ở mail.retry.
export const MAX_ATTEMPTS = 4;

// HTTP status của Brevo, hoặc 'network' khi fetch throw (timeout, DNS, TCP).
export type DeliverStatus = number | 'network';
export type MailOutcome = 'sent' | 'retry' | 'dead';

export const mailJobSchema = z.object({
  to: z.string().min(1),
  subject: z.string(),
  html: z.string(),
  attempt: z.number().int().positive(),
});
export type MailJob = z.infer<typeof mailJobSchema>;

// Lỗi tạm (429, 5xx, mạng) thì thử lại; 4xx khác (email sai, API key sai)
export function outcomeOf(status: DeliverStatus, attempt: number): MailOutcome {
  if (status !== 'network' && status >= 200 && status < 300) return 'sent';
  const transient = status === 'network' || status === 429 || status >= 500;
  return transient && attempt < MAX_ATTEMPTS ? 'retry' : 'dead';
}
