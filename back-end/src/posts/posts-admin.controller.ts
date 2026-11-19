import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { Roles } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { removePostSchema, type RemovePostInput } from './posts.schemas.js';
import { PostsService } from './posts.service.js';

// Admin gỡ bài vi phạm và mở lại (về nháp, tác giả tự xuất bản lại).
@Roles('admin')
@Controller('admin/posts')
export class PostsAdminController {
  constructor(private readonly posts: PostsService) {}

  @Post(':id/remove')
  @HttpCode(200)
  remove(@Param('id') id: string, @Body(new ZodValidationPipe(removePostSchema)) body: RemovePostInput) {
    return this.posts.adminRemove(id, body.reason);
  }

  @Post(':id/restore')
  @HttpCode(200)
  restore(@Param('id') id: string) {
    return this.posts.adminRestore(id);
  }
}
