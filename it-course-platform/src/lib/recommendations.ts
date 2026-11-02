// Import tương đối kèm .ts (không dùng alias @/) để `node --test` chạy được file test.
import { OCCUPATION_LABEL } from '../types/preferences.ts';
import type { Reason } from '../types/recommendations.ts';

export function reasonText(r: Reason): string {
  if (r.type === 'goal') return `Bạn đang theo dõi ${r.topic.name}`;
  return `Phổ biến với ${OCCUPATION_LABEL[r.occupation]} · ${r.topics.map((t) => t.name).join(', ')}`;
}
