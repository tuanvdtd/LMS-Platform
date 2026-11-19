import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, StaffAllowed } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { PostEngagementService } from './post-engagement.service.js';
import { createCommentSchema, type CreateCommentInput } from './posts.schemas.js';

type User = AuthSession['user'];

// Tim + viết / xoá bình luận. @StaffAllowed: admin, moderator cũng tham gia (hiện tên "Aolumi").
// 'post-comments/:id' không nằm dưới 'posts/' để không đụng 'posts/:slug'.
@StaffAllowed()
@Controller()
export class PostEngagementController {
  constructor(private readonly engagement: PostEngagementService) {}

  @Get('posts/:slug/like')
  likeState(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.engagement.likeState(slug, user.id);
  }

  @Put('posts/:slug/like')
  like(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.engagement.setLike(slug, user.id, true);
  }

  @Delete('posts/:slug/like')
  unlike(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.engagement.setLike(slug, user.id, false);
  }

  @Post('posts/:slug/comments')
  create(
    @CurrentUser() user: User,
    @Param('slug') slug: string,
    @Body(new ZodValidationPipe(createCommentSchema)) body: CreateCommentInput,
  ) {
    return this.engagement.create(slug, user, body);
  }

  @Delete('post-comments/:id')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.engagement.remove(id, user);
  }
}
