import { fromNodeHeaders } from 'better-auth/node';
import type { Socket } from 'socket.io';
import type { Auth } from '../auth/auth.js';

export const userRoom = (userId: string) => `user:${userId}`;

// Dùng cho mọi namespace socket: CORS không áp cho WebSocket → tự kiểm Origin (chặn trang lạ mượn cookie); phiên Better Auth từ cookie; vào room của user.
// ponytail: session hết hạn / bị ban khi đang nối thì socket giữ tới khi rớt; lần nối lại mới bị chặn.
export function socketAuth(auth: Auth, feUrl: string) {
  return (socket: Socket, next: (err?: Error) => void) => {
    if (socket.handshake.headers.origin !== feUrl) return next(new Error('forbidden'));
    auth.api.getSession({ headers: fromNodeHeaders(socket.handshake.headers) }).then(
      (session) => {
        if (!session) return next(new Error('unauthorized'));
        void socket.join(userRoom(session.user.id));
        next();
      },
      () => next(new Error('unauthorized')),
    );
  };
}
