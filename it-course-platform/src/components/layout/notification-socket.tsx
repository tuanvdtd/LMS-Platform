'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { useNotificationStore } from '@/lib/notification-store';
import { isOnPage, toastKind } from '@/lib/notifications';
import type { AppNotification } from '@/types/notification';

// Gắn 1 lần ở root layout. Có session → tải thông báo + mở socket; đăng xuất / đổi tài khoản → đóng + xoá.
export function NotificationSocket() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    const store = () => useNotificationStore.getState();
    store().load().catch(() => {});
    const socket = io(process.env.NEXT_PUBLIC_API_URL, { withCredentials: true });
    // Rớt mạng rồi nối lại → tải lại để bù thông báo lỡ (server không phát lại).
    socket.io.on('reconnect', () => void store().load().catch(() => {}));
    socket.on('notification:new', (n: AppNotification) => {
      store().receive(n);
      // Trang bài code tự hiện kết quả + toast riêng.
      if (n.type === 'verdict' && isOnPage(n.link, window.location.pathname)) return;
      const link = n.link;
      toast[toastKind(n)](n.title, {
        description: n.body,
        action: link
          ? { label: 'Xem', onClick: () => { store().markRead(n); router.push(link); } }
          : undefined,
      });
    });
    return () => {
      socket.disconnect();
      store().reset();
    };
  }, [userId, router]);

  return null;
}
