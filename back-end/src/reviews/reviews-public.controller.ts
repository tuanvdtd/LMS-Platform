import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { listReviewsQuery, type ListReviewsQuery } from './reviews.schemas.js';
import { ReviewsService } from './reviews.service.js';

// Đánh giá của khoá cho khách/học viên. Không cache: người vừa viết phải thấy ngay đánh giá của mình.
@Public()
@Controller('courses')
export class ReviewsPublicController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get(':slug/reviews')
  @Header('Cache-Control', 'no-store')
  list(@Param('slug') slug: string, @Query(new ZodValidationPipe(listReviewsQuery)) q: ListReviewsQuery) {
    return this.reviews.list(slug, q);
  }
}
