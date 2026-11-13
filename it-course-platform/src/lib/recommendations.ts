// Import tương đối kèm .ts (không dùng alias @/) để `node --test` chạy được file test.
import { OCCUPATION_LABEL } from '../types/preferences.ts';
import type { Reason } from '../types/recommendations.ts';

export function reasonText(r: Reason): string {
  if (r.type === 'gap')
    return r.blockedTopic
      ? `Nên vững ${r.topic.name} (${r.pct}%) trước khi học ${r.blockedTopic.name}`
      : `Bạn đạt ${r.pct}% ở ${r.topic.name}`;
  if (r.type === 'goal') return `Bạn đang theo dõi ${r.topic.name}`;
  return `Phổ biến với ${OCCUPATION_LABEL[r.occupation]} · ${r.topics.map((t) => t.name).join(', ')}`;
}

// Tên các kỹ năng nền chưa làm bài đánh giá của một nhóm gợi ý, để mời học viên đo thêm.
export function unmeasuredTopics(courses: readonly { reason: Reason }[]): string[] {
  return [
    ...new Set(
      courses.flatMap((c) => (c.reason.type === 'gap' ? c.reason.unmeasuredPrereqs.map((t) => t.name) : [])),
    ),
  ];
}
