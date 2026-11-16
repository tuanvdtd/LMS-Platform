import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { saveReviewSchema, type SaveReviewInput } from './reviews.schemas.js';
import { ReviewsService } from './reviews.service.js';

type User = AuthSession['user'];

// Đánh giá của chính học viên. Quyền (ghi danh, không phải chủ khoá) kiểm trong service.
@Controller('learn/:courseSlug/review')
export class ReviewsLearnController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  mine(@CurrentUser() user: User, @Param('courseSlug') slug: string) {
    return this.reviews.mine(slug, user.id);
  }

  @Put()
  save(
    @CurrentUser() user: User,
    @Param('courseSlug') slug: string,
    @Body(new ZodValidationPipe(saveReviewSchema)) body: SaveReviewInput,
  ) {
    return this.reviews.save(slug, user.id, body);
  }

  @Delete()
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('courseSlug') slug: string) {
    await this.reviews.remove(slug, user.id);
  }
}
