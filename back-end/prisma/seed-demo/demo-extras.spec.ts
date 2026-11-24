import { planShowcaseExtras } from './demo-extras.ts';
import { mulberry32 } from './rng.ts';

const now = new Date('2026-11-21T00:00:00Z');
const run = (n: number) =>
  planShowcaseExtras(mulberry32(5), {
    now, courseId: 'c', label: 'JS', lectureIds: ['l1', 'l2'], lectureTitles: ['Bài 1'], id: () => Math.random().toString(),
    enrollments: Array.from({ length: n }, (_, i) => ({ userId: `u${i}`, progressPct: 10 + (i % 8) * 10, lastAccessedAt: new Date(now.getTime() - 86_400_000), orderId: null })),
  });

describe('planShowcaseExtras questions', () => {
  it.each([7, 14])('%i người đủ điều kiện -> 3 câu hỏi của 3 người khác nhau', (n) => {
    const q = run(n).questions;
    expect(q).toHaveLength(3);
    expect(new Set(q.map((x) => x.userId)).size).toBe(3);
  });
  it('không có người đủ điều kiện -> không câu hỏi', () => {
    expect(run(0).questions).toHaveLength(0);
  });
});
