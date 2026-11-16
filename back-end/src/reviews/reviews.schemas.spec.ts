import { listReviewsQuery, REVIEW_COMMENT_MAX, saveReviewSchema } from './reviews.schemas.js';

describe('saveReviewSchema', () => {
  it('hợp lệ: trim nhận xét', () => {
    expect(saveReviewSchema.parse({ rating: 4, comment: '  Hay  ' })).toEqual({ rating: 4, comment: 'Hay' });
  });
  it('không có nhận xét → qua', () => {
    expect(saveReviewSchema.parse({ rating: 5 }).comment ?? null).toBeNull();
  });
  it('nhận xét rỗng hoặc toàn khoảng trắng → null', () => {
    expect(saveReviewSchema.parse({ rating: 5, comment: '' }).comment).toBeNull();
    expect(saveReviewSchema.parse({ rating: 5, comment: ' \n ' }).comment).toBeNull();
  });
  it.each([0, 6, 1.5, '4'])('rating %s → lỗi', (rating) => {
    expect(saveReviewSchema.safeParse({ rating }).success).toBe(false);
  });
  it('nhận xét dài quá giới hạn → lỗi; đúng giới hạn → qua', () => {
    expect(saveReviewSchema.safeParse({ rating: 3, comment: 'a'.repeat(REVIEW_COMMENT_MAX + 1) }).success).toBe(false);
    expect(saveReviewSchema.safeParse({ rating: 3, comment: 'a'.repeat(REVIEW_COMMENT_MAX) }).success).toBe(true);
  });
  it('trường lạ → lỗi', () => {
    expect(saveReviewSchema.safeParse({ rating: 3, instructorReply: 'x' }).success).toBe(false);
  });
});

describe('listReviewsQuery', () => {
  it('rating trên URL là chuỗi → số', () => {
    expect(listReviewsQuery.parse({ rating: '4' })).toEqual({ rating: 4 });
  });
  it.each(['0', '6', 'abc'])('rating %s → lỗi', (rating) => {
    expect(listReviewsQuery.safeParse({ rating }).success).toBe(false);
  });
  it('cursor không phải uuid → lỗi', () => {
    expect(listReviewsQuery.safeParse({ cursor: 'x' }).success).toBe(false);
  });
});
