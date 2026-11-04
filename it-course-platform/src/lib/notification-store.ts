import { create } from 'zustand';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api/notifications';
import type { AppNotification } from '@/types/notification';

const KEEP = 20; // = 1 trang API; chuông hiện 8 mục đầu

interface NotificationState {
  items: AppNotification[]; // trang đầu "Tất cả"
  unreadCount: number; // tổng chưa đọc phía server, không chỉ trong items
  lastReceived: AppNotification | null; // sự kiện socket mới nhất — trang Thông báo / bài code theo dõi
  load: () => Promise<void>;
  receive: (n: AppNotification) => void;
  markRead: (n: AppNotification) => void;
  markAllRead: () => void;
  remove: (n: AppNotification) => void;
  reset: () => void;
}

// Một nguồn cho chuông, mobile-nav, trang bài code. Đánh dấu/xoá lạc quan; API lỗi thì tải lại từ server.
export const useNotificationStore = create<NotificationState>()((set, get) => {
  let seq = 0; // lượt load mới thay lượt cũ (đăng xuất giữa chừng cũng bỏ phản hồi cũ)
  const reload = () => get().load().catch(() => {});
  // Nhận cả DTO: trang Thông báo có thể thao tác mục cũ không nằm trong items. Bản trong store (nếu có) mới nhất.
  const wasUnread = (n: AppNotification) => !(get().items.find((x) => x.id === n.id) ?? n).read;

  return {
    items: [],
    unreadCount: 0,
    lastReceived: null,
    async load() {
      const mine = ++seq;
      const page = await listNotifications();
      // ponytail: sự kiện tới đúng lúc load đang bay có thể bị trang cũ ghi đè; chỉ xảy ra lúc vào / nối lại.
      if (mine === seq) set({ items: page.items, unreadCount: page.unreadCount });
    },
    receive(n) {
      if (get().items.some((x) => x.id === n.id)) return;
      set((s) => ({ items: [n, ...s.items].slice(0, KEEP), unreadCount: s.unreadCount + (n.read ? 0 : 1), lastReceived: n }));
    },
    markRead(n) {
      if (!wasUnread(n)) return;
      set((s) => ({
        items: s.items.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }));
      markNotificationRead(n.id).catch(reload);
    },
    markAllRead() {
      set((s) => ({ items: s.items.map((x) => ({ ...x, read: true })), unreadCount: 0 }));
      markAllNotificationsRead().catch(reload);
    },
    remove(n) {
      const unread = wasUnread(n);
      set((s) => ({
        items: s.items.filter((x) => x.id !== n.id),
        unreadCount: Math.max(0, s.unreadCount - (unread ? 1 : 0)),
      }));
      deleteNotification(n.id).catch(reload);
    },
    reset() {
      seq++;
      set({ items: [], unreadCount: 0, lastReceived: null });
    },
  };
});
