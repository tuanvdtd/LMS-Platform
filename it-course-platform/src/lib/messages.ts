// src/lib/messages.ts — Helper thuần của tin nhắn (không React): link, xem trước, nhóm theo ngày, nhãn giờ, badge.
import type { MessageDto } from '@/types/message';

export type LinkPart = { type: 'text'; value: string } | { type: 'link'; href: string; value: string };

export function linkify(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let last = 0;
  const push = (value: string) => value && parts.push({ type: 'text', value });
  for (const m of text.matchAll(/https?:\/\/[^\s<>"']+/g)) {
    const url = m[0].replace(/[.,!?;:)\]]+$/, '');
    push(text.slice(last, m.index));
    parts.push({ type: 'link', href: url, value: url });
    last = m.index + url.length;
  }
  push(text.slice(last));
  return parts;
}

export function previewText(last: string, hasImages: boolean, senderIsMe: boolean): string {
  const body = [hasImages ? '[Ảnh]' : '', last].filter(Boolean).join(' ');
  return senderIsMe ? `Bạn: ${body}` : body;
}

export const badgeText = (n: number): string | null => (n <= 0 ? null : n > 9 ? '9+' : String(n));

const VN = 'Asia/Ho_Chi_Minh';
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: VN });
const timeFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: VN, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dayKey = (d: Date | string) => dayKeyFmt.format(new Date(d));

export function dayLabel(iso: string, now: Date): string {
  const key = dayKey(iso);
  if (key === dayKey(now)) return 'Hôm nay';
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return 'Hôm qua';
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
}

// dd/MM theo giờ VN (toLocaleDateString vi-VN ở Chrome ra "20-11").
export const shortDate = (iso: string): string => dayKey(iso).slice(5).split('-').reverse().join('/');
export const timeLabel = (iso: string): string => timeFmt.format(new Date(iso));

export interface MessageGroup {
  day: string;
  dayLabel: string;
  runs: { senderId: string; mine: boolean; messages: MessageDto[] }[];
}

// items đã sắp cũ → mới.
export function groupMessages(items: MessageDto[], me: string): MessageGroup[] {
  const now = new Date();
  const groups: MessageGroup[] = [];
  for (const m of items) {
    const day = dayKey(m.createdAt);
    let g = groups[groups.length - 1];
    if (g?.day !== day) groups.push((g = { day, dayLabel: dayLabel(m.createdAt, now), runs: [] }));
    const run = g.runs[g.runs.length - 1];
    if (run?.senderId === m.senderId) run.messages.push(m);
    else g.runs.push({ senderId: m.senderId, mine: m.senderId === me, messages: [m] });
  }
  return groups;
}

export const conversationHref = (basePath: string, id: string) => `${basePath.replace(/\/$/, '')}/${id}`;
