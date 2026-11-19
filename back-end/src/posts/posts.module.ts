import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PostEngagementPublicController } from './post-engagement-public.controller.js';
import { PostEngagementController } from './post-engagement.controller.js';
import { PostEngagementService } from './post-engagement.service.js';
import { PostsAdminController } from './posts-admin.controller.js';
import { PostsMeController } from './posts-me.controller.js';
import { PostsPublicController } from './posts-public.controller.js';
import { PostsPublicService } from './posts-public.service.js';
import { PostsService } from './posts.service.js';

// CatalogModule: thẻ khoá học liên quan ở trang bài dùng CatalogService.toCards.
// NotificationsModule: thông báo bình luận đẩy realtime qua NotificationsGateway.
@Module({
  imports: [CatalogModule, NotificationsModule],
  controllers: [PostsPublicController, PostsMeController, PostsAdminController, PostEngagementPublicController, PostEngagementController],
  providers: [PostsService, PostsPublicService, PostEngagementService],
})
export class PostsModule {}
