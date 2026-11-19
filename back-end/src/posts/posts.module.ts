import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { PostsAdminController } from './posts-admin.controller.js';
import { PostsMeController } from './posts-me.controller.js';
import { PostsPublicController } from './posts-public.controller.js';
import { PostsPublicService } from './posts-public.service.js';
import { PostsService } from './posts.service.js';

// CatalogModule: thẻ khoá học liên quan ở trang bài dùng CatalogService.toCards.
@Module({
  imports: [CatalogModule],
  controllers: [PostsPublicController, PostsMeController, PostsAdminController],
  providers: [PostsService, PostsPublicService],
})
export class PostsModule {}
