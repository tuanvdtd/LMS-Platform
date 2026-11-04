import { Inject } from '@nestjs/common';
import { type OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Notification } from '@prisma/client';
import { fromNodeHeaders } from 'better-auth/node';
import type { Server } from 'socket.io';
import { AUTH, type Auth } from '../auth/auth.js';
import { requireEnv } from '../env.js';
import { toNotificationDto } from './notifications.service.js';

const FE_URL = requireEnv('FE_URL');
const room = (userId: string) => `user:${userId}`;

// Kênh 1 chiều server → client: mỗi user 1 room, mọi tab của user cùng nhận. Client không gửi gì lên.
// ponytail: emit trong bộ nhớ của 1 process (consumer chấm bài chạy chung process API). Tách worker / nhiều instance
// → thêm @socket.io/redis-adapter (Redis có sẵn).
@WebSocketGateway({ cors: { origin: FE_URL, credentials: true } })
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer() private readonly server?: Server;

  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  afterInit(server: Server) {
    server.use((socket, next) => {
      // CORS không áp cho WebSocket → tự kiểm Origin, chặn trang lạ mượn cookie của user.
      if (socket.handshake.headers.origin !== FE_URL) return next(new Error('forbidden'));
      // ponytail: session hết hạn / bị ban khi đang nối thì socket giữ tới khi rớt; lần nối lại mới bị chặn.
      this.auth.api.getSession({ headers: fromNodeHeaders(socket.handshake.headers) }).then(
        (session) => {
          if (!session) return next(new Error('unauthorized'));
          void socket.join(room(session.user.id));
          next();
        },
        () => next(new Error('unauthorized')),
      );
    });
  }

  // Gọi SAU khi transaction tạo thông báo đã commit. Không ném lỗi; server chưa init (không listen) thì bỏ qua.
  push(n: Notification) {
    this.server?.to(room(n.userId)).emit('notification:new', toNotificationDto(n));
  }
}
