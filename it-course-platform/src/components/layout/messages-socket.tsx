'use client';
// src/components/layout/messages-socket.tsx — Socket namespace /messages: số chưa đọc + sự kiện cho khung chat.

import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { authClient } from '@/lib/auth-client';
import { isStaff } from '@/lib/instructor-role';
import { useMessageStore } from '@/lib/message-store';
import type { MessageEvent } from '@/types/message';

type Payload<T extends MessageEvent['type']> = Omit<Extract<MessageEvent, { type: T }>, 'type'>;

// Gắn 1 lần ở root layout. Có session → tải số chưa đọc + mở socket; đăng xuất / đổi tài khoản → đóng + xoá.
export function MessagesSocket() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const staff = isStaff(session?.user); // BE không cho staff dùng tin nhắn

  useEffect(() => {
    if (!userId || staff) return;
    const store = () => useMessageStore.getState();
    store().loadUnread().catch(() => {});
    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/messages`, { withCredentials: true });
    // Rớt mạng rồi nối lại → khung đang mở tự tải bù (server không phát lại).
    const onReconnect = () => store().onEvent({ type: 'reconnect' });
    socket.io.on('reconnect', onReconnect);
    socket.on('message:new', (p: Payload<'message:new'>) => store().onEvent({ type: 'message:new', ...p }));
    socket.on('conversation:read', (p: Payload<'conversation:read'>) => store().onEvent({ type: 'conversation:read', ...p }));
    socket.on('conversation:updated', (p: Payload<'conversation:updated'>) => store().onEvent({ type: 'conversation:updated', ...p }));
    return () => {
      socket.io.off('reconnect', onReconnect);
      socket.disconnect();
      store().reset();
    };
  }, [userId, staff]);

  return null;
}
