import { Inject } from '@nestjs/common';
import { type OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Notification } from '@prisma/client';
import type { Server } from 'socket.io';
import { AUTH, type Auth } from '../auth/auth.js';
import { socketAuth, userRoom } from '../common/socket-auth.js';
import { requireEnv } from '../env.js';
import { toNotificationDto } from './notifications.service.js';

const FE_URL = requireEnv('FE_URL');

// Kênh 1 chiều server → client: mỗi user 1 room, mọi tab của user cùng nhận. Client không gửi gì lên.
// ponytail: emit trong bộ nhớ của 1 process (consumer chấm bài chạy chung process API). Tách worker / nhiều instance
// → thêm @socket.io/redis-adapter (Redis có sẵn).
@WebSocketGateway({ cors: { origin: FE_URL, credentials: true } })
export class NotificationsGateway implements OnGatewayInit {
  @WebSocketServer() private readonly server?: Server;

  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  afterInit(server: Server) {
    server.use(socketAuth(this.auth, FE_URL));
  }

  // Gọi SAU khi transaction tạo thông báo đã commit. Không ném lỗi; server chưa init (không listen) thì bỏ qua.
  push(n: Notification) {
    this.server?.to(userRoom(n.userId)).emit('notification:new', toNotificationDto(n));
  }
}
