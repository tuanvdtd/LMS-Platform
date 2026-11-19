import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, StaffAllowed } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import {
  myPostsQuery,
  postUploadSchema,
  savePostSchema,
  type MyPostsQuery,
  type PostUploadInput,
  type SavePostInput,
} from './posts.schemas.js';
import { PostsService } from './posts.service.js';

type User = AuthSession['user'];

// Khu "Bài viết của tôi". @StaffAllowed: admin cũng viết bài; moderator qua được guard nhưng canWrite trả false.
// Route tĩnh (permission, uploads) khai TRƯỚC ':id'.
@StaffAllowed()
@Controller('me/posts')
export class PostsMeController {
  constructor(private readonly posts: PostsService) {}

  @Get('permission')
  async permission(@CurrentUser() user: User) {
    return { canWrite: await this.posts.canWrite(user) };
  }

  @Get()
  list(@CurrentUser() user: User, @Query(new ZodValidationPipe(myPostsQuery)) q: MyPostsQuery) {
    return this.posts.list(user.id, q.status);
  }

  @Post()
  create(@CurrentUser() user: User) {
    return this.posts.create(user);
  }

  @Post('uploads')
  createUpload(@CurrentUser() user: User, @Body(new ZodValidationPipe(postUploadSchema)) body: PostUploadInput) {
    return this.posts.createUpload(user, body);
  }

  @Get(':id')
  get(@CurrentUser() user: User, @Param('id') id: string) {
    return this.posts.get(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: User, @Param('id') id: string, @Body(new ZodValidationPipe(savePostSchema)) body: SavePostInput) {
    return this.posts.update(user, id, body);
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@CurrentUser() user: User, @Param('id') id: string) {
    return this.posts.publish(user, id);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  unpublish(@CurrentUser() user: User, @Param('id') id: string) {
    return this.posts.unpublish(user, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.posts.remove(user, id);
  }
}
