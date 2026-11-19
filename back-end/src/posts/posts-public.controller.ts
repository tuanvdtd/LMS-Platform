import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { PostsPublicService } from './posts-public.service.js';
import { listPostsQuery, type ListPostsQuery } from './posts.schemas.js';

// Blog công khai. Cache 60s như trang cá nhân; FE cũng revalidate 60s.
// 'post-topics' không nằm dưới 'posts/' để không đụng 'posts/:slug' (slug sinh từ tiêu đề do người dùng đặt).
@Public()
@Controller()
export class PostsPublicController {
  constructor(private readonly posts: PostsPublicService) {}

  @Get('posts')
  @Header('Cache-Control', 'public, max-age=60')
  list(@Query(new ZodValidationPipe(listPostsQuery)) q: ListPostsQuery) {
    return this.posts.list(q);
  }

  @Get('post-topics')
  @Header('Cache-Control', 'public, max-age=60')
  topics() {
    return this.posts.topics();
  }

  @Get('posts/:slug')
  @Header('Cache-Control', 'public, max-age=60')
  detail(@Param('slug') slug: string) {
    return this.posts.detail(slug);
  }

  @Get('users/:id/posts')
  @Header('Cache-Control', 'public, max-age=60')
  byAuthor(@Param('id') id: string) {
    return this.posts.byAuthor(id);
  }
}
