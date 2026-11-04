import { Injectable } from '@nestjs/common';
import type { Notification } from '@prisma/client';
import { PrismaService } from '../infra/prisma.service.js';
import type { ListNotificationsQuery } from './notifications.schemas.js';

const PAGE = 20;

export type NotificationDto = {
  id: string;
  type: Notification['type'];
  title: string;
  body: string;
  link: string | null;
  data: unknown;
  read: boolean;
  createdAt: string;
};

// Dùng chung cho REST và socket → FE nhận một hình dạng duy nhất.
export const toNotificationDto = (n: Notification): NotificationDto => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.body,
  link: n.link,
  data: n.data,
  read: n.readAt !== null,
  createdAt: n.createdAt.toISOString(),
});

// Mọi truy vấn đều lọc theo userId: id của người khác coi như không tồn tại (204, không đổi gì).
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, { cursor, type }: ListNotificationsQuery) {
    const unreadCount = await this.prisma.notification.count({ where: { userId, readAt: null } });
    // Cursor phải là thông báo của chính mình; không dựa vào hành vi ngầm của Prisma cursor khi id lạ.
    if (cursor && !(await this.prisma.notification.findFirst({ where: { id: cursor, userId }, select: { id: true } }))) {
      return { items: [], nextCursor: null, unreadCount };
    }
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(type && { type }) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    const items = rows.slice(0, PAGE);
    return { items: items.map(toNotificationDto), nextCursor: rows.length > PAGE ? items[PAGE - 1].id : null, unreadCount };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
  }

  // deleteMany: xoá 2 lần / xoá song song → 0 dòng, không 500.
  async remove(userId: string, id: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
  }
}
