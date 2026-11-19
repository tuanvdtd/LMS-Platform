import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { PostEngagementService } from './post-engagement.service.js';
import { commentsQuery, type CommentsQuery } from './posts.schemas.js';

// Khách đọc được bình luận. no-store: bình luận vừa gửi / vừa xoá phải thấy ngay (khác trang bài cache 60 giây).
// @Public bỏ qua phiên đăng nhập → không trả gì riêng theo người xem; nút xoá FE tự tính, BE kiểm lại lúc xoá.
@Public()
@Controller('posts/:slug/comments')
export class PostEngagementPublicController {
  constructor(private readonly engagement: PostEngagementService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  list(@Param('slug') slug: string, @Query(new ZodValidationPipe(commentsQuery)) q: CommentsQuery) {
    return this.engagement.list(slug, q.cursor);
  }

  @Get(':commentId')
  @Header('Cache-Control', 'no-store')
  thread(@Param('slug') slug: string, @Param('commentId') commentId: string) {
    return this.engagement.thread(slug, commentId);
  }
}
