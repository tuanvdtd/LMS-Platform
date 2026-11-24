// Quy tắc thuần của tin nhắn (không import Nest/Prisma) — dùng ở service và test.
export const BODY_MAX = 4000;
export const IMAGES_MAX = 4;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type ImageMime = (typeof IMAGE_MIME)[number];

export type CannotSend = 'BLOCKED_BY_ME' | 'BLOCKED_BY_OTHER' | 'NO_PAID_LINK';
export type BlockedState = 'none' | 'me' | 'other';
export type ConvRow = { userAId: string; userBId: string; aLastReadAt: Date | null; bLastReadAt: Date | null; blockedById: string | null };

export const CANNOT_SEND_MESSAGE: Record<CannotSend, string> = {
  BLOCKED_BY_ME: 'Bạn đã chặn người này',
  BLOCKED_BY_OTHER: 'Không thể gửi tin trong cuộc trò chuyện này',
  NO_PAID_LINK: 'Hai bạn không còn khoá trả phí nào chung nên không gửi tin được',
};

// uuid Prisma trả về chữ thường → so chuỗi khớp thứ tự byte của Postgres (CHECK "userAId" < "userBId").
export function orderPair(x: string, y: string): [string, string] {
  if (x === y) throw new Error('Không nhắn cho chính mình');
  return x < y ? [x, y] : [y, x];
}

export const otherOf = (c: ConvRow, me: string) => (c.userAId === me ? c.userBId : c.userAId);
export const readField = (c: ConvRow, me: string) => (c.userAId === me ? 'aLastReadAt' : 'bLastReadAt') as 'aLastReadAt' | 'bLastReadAt';
export const readMarks = (c: ConvRow, me: string) =>
  c.userAId === me ? { mine: c.aLastReadAt, other: c.bLastReadAt } : { mine: c.bLastReadAt, other: c.aLastReadAt };

export const blockedState = (c: ConvRow, me: string): BlockedState =>
  !c.blockedById ? 'none' : c.blockedById === me ? 'me' : 'other';

export function cannotSend(c: ConvRow, me: string, hasPaidLink: boolean): CannotSend | null {
  const b = blockedState(c, me);
  if (b === 'me') return 'BLOCKED_BY_ME';
  if (b === 'other') return 'BLOCKED_BY_OTHER';
  return hasPaidLink ? null : 'NO_PAID_LINK';
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
export const isMessageImageKey = (conversationId: string, key: string) =>
  new RegExp(`^messages/${conversationId}/${UUID}\\.(jpg|png|webp)$`).test(key);
