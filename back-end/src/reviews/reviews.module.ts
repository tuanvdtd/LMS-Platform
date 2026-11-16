import { Module } from '@nestjs/common';
import { ReviewsLearnController } from './reviews-learn.controller.js';
import { ReviewsPublicController } from './reviews-public.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  controllers: [ReviewsPublicController, ReviewsLearnController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
