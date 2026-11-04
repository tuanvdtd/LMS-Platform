import { NotificationType } from '@prisma/client';
import { z } from 'zod';

// type lấy thẳng enum Prisma → thêm loại thông báo mới không phải sửa ở đây.
export const listNotificationsQuery = z.object({ cursor: z.guid().optional(), type: z.enum(NotificationType).optional() });
export type ListNotificationsQuery = z.output<typeof listNotificationsQuery>;
export const notificationId = z.guid();
