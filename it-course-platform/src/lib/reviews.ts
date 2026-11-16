import type { RatingDistribution, Stars } from '../types/reviews.ts';

export const STARS: Stars[] = [1, 2, 3, 4, 5];
export const RATING_LABEL: Record<Stars, string> = { 1: 'Rất tệ', 2: 'Chưa tốt', 3: 'Tạm được', 4: 'Tốt', 5: 'Tuyệt vời' };
export const REVIEW_COMMENT_MAX = 1000;

// Độ tô (0..1) của từng ngôi sao: 4.3 → 4 sao đầy, sao thứ 5 tô 30%.
export function starFills(rating: number): number[] {
  return STARS.map((i) => Math.min(1, Math.max(0, rating - (i - 1))));
}

export function ratingSummary(d: RatingDistribution) {
  const total = STARS.reduce((sum, s) => sum + d[s], 0);
  const average = total ? STARS.reduce((sum, s) => sum + s * d[s], 0) / total : 0;
  const pct = Object.fromEntries(STARS.map((s) => [s, total ? Math.round((d[s] / total) * 100) : 0])) as RatingDistribution;
  return { total, average, pct };
}
