import { Inject } from '@nestjs/common';
import { type OnGatewayInit, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Namespace } from 'socket.io';
import { AUTH, type Auth } from '../auth/auth.js';
import { socketAuth, userRoom } from '../common/socket-auth.js';
import { requireEnv } from '../env.js';
import type { MessageDto } from './messages.service.js';

const FE_URL = requireEnv('FE_URL');

// Kênh riêng của tin nhắn (namespace /messages): chung kết nối vật lý với thông báo, tách sự kiện/room/xác thực.
// Chỉ server → client; gửi tin đi qua REST. ponytail: emit trong bộ nhớ 1 process; nhiều instance → @socket.io/redis-adapter.
@WebSocketGateway({ namespace: 'messages', cors: { origin: FE_URL, credentials: true } })
export class MessagesGateway implements OnGatewayInit {
  @WebSocketServer() private readonly server?: Namespace;
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  afterInit(ns: Namespace) {
    ns.use(socketAuth(this.auth, FE_URL));
  }

  private to(userIds: string[]) {
    return this.server?.to(userIds.map(userRoom));
  }
  messageNew(userIds: string[], message: MessageDto) {
    this.to(userIds)?.emit('message:new', { conversationId: message.conversationId, message });
  }
  read(userIds: string[], p: { conversationId: string; userId: string; readAt: string }) {
    this.to(userIds)?.emit('conversation:read', p);
  }
  updated(userIds: string[], conversationId: string) {
    this.to(userIds)?.emit('conversation:updated', { conversationId });
  }
}
