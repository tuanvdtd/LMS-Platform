import type { IdentityStatus } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Phần response GET /v3/session/{id}/decision/ của Didit mà Aolumi dùng tới.
export type DiditDecision = {
  status?: string;
  id_verifications?: { full_name?: string | null; first_name?: string | null; last_name?: string | null }[] | null;
};

// Trạng thái Didit → trạng thái lưu ở đơn. 'expired' = phiên chết (hết hạn / bỏ dở), xoá để người dùng làm lại.
// undefined = chuỗi lạ, giữ nguyên trạng thái cũ. So không phân biệt hoa thường vì docs Didit có chỗ trả "APPROVED".
export function mapDiditStatus(status: string | undefined): IdentityStatus | 'expired' | undefined {
  switch (status?.toLowerCase()) {
    case 'not started':
    case 'in progress':
    case 'resubmitted':
      return 'pending';
    case 'in review':
      return 'in_review';
    case 'approved':
      return 'approved';
    case 'declined':
      return 'declined';
    case 'expired':
    case 'abandoned':
    case 'kyc expired':
      return 'expired';
    default:
      return undefined;
  }
}

// Họ tên trên giấy tờ đầu tiên. full_name không phải lúc nào cũng có → ghép first + last.
// ponytail: ghép first + last có thể đảo thứ tự họ tên kiểu Việt; nếu Didit không trả full_name cho CCCD thì đổi cách ghép.
export function pickName(decision: DiditDecision): string | null {
  const v = decision.id_verifications?.[0];
  if (!v) return null;
  const name = v.full_name?.trim() || [v.first_name, v.last_name].filter(Boolean).join(' ').trim();
  return name || null;
}

// Webhook Didit: X-Signature = HMAC-SHA256 (hex, 64 ký tự) trên đúng byte body nhận được.
// Thời điểm gửi lấy từ `timestamp` trong body, vì body nằm trong phần được ký (header X-Timestamp thì không);
// lệch quá 5 phút → coi như gửi lại, từ chối. Hợp lệ → trả body đã parse; không hợp lệ → null.
// Kiểm đúng 64 ký tự hex trước: timingSafeEqual ném lỗi khi hai buffer khác độ dài (chữ ký rác sẽ thành 500 thay vì 401).
export function verifyDiditWebhook(
  raw: Buffer,
  signature: string | undefined,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
): Record<string, unknown> | null {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return null;
  const expected = createHmac('sha256', secret).update(raw).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
  let body: unknown;
  try {
    body = JSON.parse(raw.toString('utf8'));
  } catch {
    return null;
  }
  if (typeof body !== 'object' || body === null) return null;
  const ts = (body as { timestamp?: unknown }).timestamp;
  if (typeof ts !== 'number' || !Number.isFinite(ts) || Math.abs(nowSec - ts) > 300) return null;
  return body as Record<string, unknown>;
}
