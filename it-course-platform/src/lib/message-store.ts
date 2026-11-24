// src/lib/message-store.ts — Số cuộc chưa đọc + sự kiện socket mới nhất cho khung chat/danh sách đang mở.
import { create } from 'zustand';
import { getUnreadCount } from '@/lib/api/messages';
import type { MessageEvent } from '@/types/message';

interface MessageState {
  unreadCount: number;
  lastEvent: MessageEvent | null;
  loadUnread: () => Promise<void>;
  onEvent: (e: MessageEvent) => void;
  reset: () => void;
}

export const useMessageStore = create<MessageState>()((set, get) => {
  let seq = 0;
  return {
    unreadCount: 0,
    lastEvent: null,
    async loadUnread() {
      const mine = ++seq;
      const count = await getUnreadCount();
      if (mine === seq) set({ unreadCount: count });
    },
    // ponytail: mọi sự kiện có thể đổi số chưa đọc → hỏi lại server (1 truy vấn nhẹ) thay vì tự cộng trừ.
    onEvent(e) {
      set({ lastEvent: e });
      if (e.type !== 'conversation:updated') get().loadUnread().catch(() => {});
    },
    reset() {
      seq++;
      set({ unreadCount: 0, lastEvent: null });
    },
  };
});
