import { planCourseDates } from './courses.ts';
import { mulberry32, DAY } from './rng.ts';

const now = new Date('2026-11-02T00:00:00Z');
const teacher = { createdAt: new Date(now.getTime() - 340 * DAY), verifiedAt: new Date(now.getTime() - 320 * DAY) };

describe('planCourseDates', () => {
  it('published: có phí thì xuất bản sau khi xác minh, trước now 7 ngày, approval trước publish', () => {
    for (let s = 0; s < 200; s++) {
      const d = planCourseDates(mulberry32(s), now, teacher, 'published', true);
      expect(d.publishedAt!.getTime()).toBeGreaterThan(teacher.verifiedAt.getTime());
      expect(d.publishedAt!.getTime()).toBeLessThanOrEqual(now.getTime() - 7 * DAY);
      expect(d.createdAt.getTime()).toBeGreaterThan(teacher.createdAt.getTime());
      expect(d.submittedAt!.getTime()).toBeLessThan(d.reviewedAt!.getTime());
      expect(d.reviewedAt!.getTime()).toBeLessThan(d.publishedAt!.getTime());
    }
  });
  it('in_review có submittedAt, chưa có reviewedAt/publishedAt', () => {
    const d = planCourseDates(mulberry32(1), now, teacher, 'in_review', false);
    expect(d.submittedAt).toBeTruthy();
    expect(d.reviewedAt).toBeNull();
    expect(d.publishedAt).toBeNull();
  });
  it('draft không có mốc duyệt', () => {
    const d = planCourseDates(mulberry32(2), now, teacher, 'draft', false);
    expect([d.submittedAt, d.reviewedAt, d.publishedAt]).toEqual([null, null, null]);
  });
});
