'use client';
// src/components/messages/conversation-list.tsx — Danh sách cuộc: tìm, phân trang cuộn, cập nhật realtime theo sự kiện socket.

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { listConversations } from '@/lib/api/messages';
import { useMessageStore } from '@/lib/message-store';
import { badgeText, conversationHref, dayLabel, previewText, shortDate, timeLabel } from '@/lib/messages';
import { cn } from '@/lib/utils';
import { usePointerFocus } from '@/lib/use-pointer-focus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConversationListSkeleton } from '@/components/messages/messages-skeleton';
import { MessagesEmpty } from '@/components/messages/messages-empty';
import { UserAvatar } from '@/components/messages/user-avatar';
import type { ConversationListItem } from '@/types/message';

// Hôm nay → HH:mm, cũ hơn → dd/MM.
function shortTime(iso: string) {
  if (dayLabel(iso, new Date()) === 'Hôm nay') return timeLabel(iso);
  return shortDate(iso);
}

export function ConversationList({ basePath, activeId }: { basePath: string; activeId: string | null }) {
  const me = authClient.useSession().data?.user.id;
  const lastEvent = useMessageStore((s) => s.lastEvent);
  const pointer = usePointerFocus();

  const [input, setInput] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const seq = useRef(0); // bỏ kết quả của lần tải cũ
  const sentinel = useRef<HTMLDivElement>(null);
  const seenEvent = useRef(lastEvent);

  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const loadFirst = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const page = await listConversations(q ? { q } : {});
      if (mine !== seq.current) return;
      setItems(page.items);
      setCursor(page.nextCursor);
      setStatus('ready');
    } catch {
      if (mine === seq.current) setStatus('error');
    }
  }, [q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu ngoài khi từ khoá đổi
    void loadFirst();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    const mine = seq.current;
    setLoadingMore(true);
    try {
      const page = await listConversations(q ? { cursor, q } : { cursor });
      if (mine !== seq.current) return;
      setItems((prev) => [...prev, ...page.items.filter((i) => !prev.some((p) => p.id === i.id))]);
      setCursor(page.nextCursor);
    } catch {
      /* lần cuộn sau thử lại */
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, q]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && void loadMore());
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loadMore, items.length]);

  // Realtime. Bỏ sự kiện cũ còn trong store từ trước khi danh sách mount.
  useEffect(() => {
    if (!lastEvent || lastEvent === seenEvent.current) return;
    seenEvent.current = lastEvent;
    if (lastEvent.type === 'message:new') {
      const { conversationId, message } = lastEvent;
      const cur = items.find((i) => i.id === conversationId);
      if (!cur) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ state từ socket (hệ thống ngoài)
        void loadFirst(); // cuộc mới chưa có trong danh sách
        return;
      }
      const mine = message.senderId === me;
      const reading = conversationId === activeId && document.visibilityState === 'visible';
      const updated: ConversationListItem = {
        ...cur,
        lastMessage: { body: message.body, hasImages: message.images.length > 0, senderIsMe: mine, createdAt: message.createdAt },
        unreadCount: mine || reading ? cur.unreadCount : cur.unreadCount + 1,
      };
      setItems([updated, ...items.filter((i) => i.id !== conversationId)]);
    } else if (lastEvent.type === 'conversation:read') {
      const { conversationId, userId } = lastEvent;
      if (userId === me) setItems((prev) => prev.map((i) => (i.id === conversationId ? { ...i, unreadCount: 0 } : i)));
    } else {
      void loadFirst(); // reconnect / conversation:updated (chặn, hết khoá chung…)
    }
  }, [lastEvent, items, me, activeId, loadFirst]);

  return (
    <>
      <div className="flex flex-col gap-3 border-b p-4">
        <h1 className="text-lg font-extrabold tracking-tight">Tin nhắn</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tìm theo tên"
            aria-label="Tìm cuộc trò chuyện theo tên"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <nav aria-label="Cuộc trò chuyện" className="min-h-0 flex-1 overflow-y-auto" {...pointer}>
        {status === 'loading' && <ConversationListSkeleton />}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-muted-foreground">
            Không tải được danh sách.
            <Button variant="outline" size="sm" onClick={() => void loadFirst()}>
              Thử lại
            </Button>
          </div>
        )}
        {status === 'ready' && items.length === 0 &&
          (q ? <p className="p-6 text-center text-sm text-muted-foreground">Không có cuộc trò chuyện nào khớp “{q}”.</p> : <MessagesEmpty variant="none" />)}
        {status === 'ready' && items.length > 0 && (
          <ul>
            {items.map((c) => {
              const unread = badgeText(c.unreadCount);
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <Link
                    href={conversationHref(basePath, c.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 border-l-2 border-transparent px-4 py-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                      active && 'border-primary bg-ui-accent hover:bg-ui-accent',
                    )}
                  >
                    <UserAvatar user={c.other} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-sm', unread ? 'font-bold text-foreground' : 'font-semibold')}>{c.other.name}</span>
                        {c.lastMessage && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{shortTime(c.lastMessage.createdAt)}</span>}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('truncate text-sm', unread ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                          {c.lastMessage ? previewText(c.lastMessage.body, c.lastMessage.hasImages, c.lastMessage.senderIsMe) : 'Chưa có tin nhắn'}
                        </span>
                        {unread && (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                            {unread}
                            <span className="sr-only"> tin chưa đọc</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {cursor && <div ref={sentinel} className="h-8" aria-hidden />}
        {loadingMore && <p className="py-2 text-center text-xs text-muted-foreground">Đang tải thêm…</p>}
      </nav>
    </>
  );
}
