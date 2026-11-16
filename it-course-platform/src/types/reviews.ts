export type Stars = 1 | 2 | 3 | 4 | 5;
export type RatingDistribution = Record<Stars, number>;

export interface CourseReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { name: string; image: string | null };
}

export interface CourseReviewPage {
  items: CourseReview[];
  nextCursor: string | null;
  distribution: RatingDistribution;
}

export interface OwnReview {
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// Đánh giá của người đang xem kèm điều kiện được đánh giá.
export interface MyReview {
  review: OwnReview | null;
  progressPct: number;
  minProgressPct: number;
  canReview: boolean;
}
