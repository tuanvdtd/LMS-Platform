import { Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.js';
import { CurrentUser, StaffAllowed } from '../auth/decorators.js';
import { ZodValidationPipe } from '../common/zod.pipe.js';
import { listNotificationsQuery, notificationId, type ListNotificationsQuery } from './notifications.schemas.js';
import { NotificationsService } from './notifications.service.js';

type User = AuthSession['user'];

// Thông báo là dữ liệu riêng của từng user → staff cũng dùng được.
@Controller('notifications')
@StaffAllowed()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: User, @Query(new ZodValidationPipe(listNotificationsQuery)) q: ListNotificationsQuery) {
    return this.notifications.list(user.id, q);
  }

  @Post('read-all')
  @HttpCode(204)
  async readAll(@CurrentUser() user: User) {
    await this.notifications.markAllRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(204)
  async read(@CurrentUser() user: User, @Param('id', new ZodValidationPipe(notificationId)) id: string) {
    await this.notifications.markRead(user.id, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('id', new ZodValidationPipe(notificationId)) id: string) {
    await this.notifications.remove(user.id, id);
  }
}
