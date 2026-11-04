'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { notificationIcon } from '@/components/layout/notification-panel';
import { VerdictBadge } from '@/components/shared/product-ui';
import { NotificationListSkeleton, NotificationsSkeleton } from '@/components/skeletons/notifications-skeleton';
import { Button } from '@/components/ui/button';
import { apiMessage } from '@/lib/api/checkout';
import { listNotifications } from '@/lib/api/notifications';
import { useNotificationStore } from '@/lib/notification-store';
import { authClient } from '@/lib/auth-client';
import { isInstructor } from '@/lib/instructor-role';
import { NOTIF_META, typesFor } from '@/lib/notifications';
import { fullTime, timeAgo } from '@/lib/time-ago';
import { cn } from '@/lib/utils';
import { isSubmissionStatus, verdictOf } from '@/types/exercise';
import type { AppNotification, NotificationType } from '@/types/notification';

type Filter = 'all' | NotificationType;
type List = { filter: Filter; items: AppNotification[]; nextCursor: string | null };

const query = (filter: Filter, cursor?: string) => ({ ...(filter !== 'all' && { type: filter }), ...(cursor && { cursor }) });

// Danh sách riêng theo chip (lọc ở BE) + "Xem thêm"; đánh dấu / xoá đi qua store để chuông cập nhật theo.
export function NotificationsView() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    ...typesFor(isInstructor(session?.user)).map((id) => ({ id, label: NOTIF_META[id].label })),
  ];
  const [filter, setFilter] = useState<Filter>('all');
  const [list, setList] = useState<List | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const lastReceived = useNotificationStore((s) => s.lastReceived);

  useEffect(() => {
    let cancelled = false;
    listNotifications(query(filter)).then(
      (p) => { if (!cancelled) setList({ filter, items: p.items, nextCursor: p.nextCursor }); },
      (e) => { if (!cancelled) setError(apiMessage(e, 'Không tải được thông báo')); },
    );
    return () => { cancelled = true; };
  }, [filter, nonce]);

  // Thông báo mới qua socket → chèn đầu nếu khớp chip đang xem.
  // Chỉnh state ngay lúc render (mẫu React khuyên dùng) thay vì setState trong effect.
  const [seen, setSeen] = useState(lastReceived);
  if (seen !== lastReceived) {
    setSeen(lastReceived);
    const n = lastReceived;
    if (n && list && (list.filter === 'all' || list.filter === n.type) && !list.items.some((x) => x.id === n.id)) {
      setList({ ...list, items: [n, ...list.items] });
    }
  }

  const patch = (fn: (items: AppNotification[]) => AppNotification[]) => setList((l) => (l ? { ...l, items: fn(l.items) } : l));

  function open(n: AppNotification) {
    useNotificationStore.getState().markRead(n);
    patch((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.link) router.push(n.link);
  }
  function dismiss(n: AppNotification) {
    useNotificationStore.getState().remove(n);
    patch((xs) => xs.filter((x) => x.id !== n.id));
  }
  function readAll() {
    useNotificationStore.getState().markAllRead();
    patch((xs) => xs.map((x) => ({ ...x, read: true })));
  }
  function choose(f: Filter) {
    setError(null);
    setFilter(f);
  }
  async function loadMore() {
    if (!list?.nextCursor) return;
    // Con trỏ = mục cuối còn hiển thị: nếu mục cuối cũ đã bị xoá, BE sẽ trả rỗng và nút "Xem thêm" chết.
    const last = list.items[list.items.length - 1];
    if (!last) { setNonce((x) => x + 1); return; } // hết mục hiển thị → tải lại trang đầu của chip
    setLoadingMore(true);
    try {
      const p = await listNotifications(query(list.filter, last.id));
      setList((l) =>
        l && l.filter === list.filter
          ? { ...l, items: [...l.items, ...p.items.filter((x) => !l.items.some((y) => y.id === x.id))], nextCursor: p.nextCursor }
          : l,
      );
    } catch (e) {
      toast.error(apiMessage(e, 'Không tải thêm được thông báo'));
    } finally {
      setLoadingMore(false);
    }
  }

  // Skeleton cả trang chỉ lần đầu; đổi chip thì giữ header + chip (focus ở nguyên chip vừa bấm), chỉ danh sách là skeleton.
  if (!list && !error) return <NotificationsSkeleton />;
  const switching = !error && (!list || list.filter !== filter);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Thông báo</h1>
          {unreadCount > 0 && <p className="mt-0.5 text-sm text-muted-foreground">{unreadCount} chưa đọc</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="link" onClick={readAll} className="px-0">
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Lọc thông báo">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            onClick={() => choose(id)}
            className={cn(
              'h-11 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8',
              filter === id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {switching ? (
        <NotificationListSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="h-11 sm:h-9" onClick={() => { setError(null); setNonce((x) => x + 1); }}>
            Thử lại
          </Button>
        </div>
      ) : !list || list.items.length === 0 ? (
        <div className="py-16 text-center">
          <Bell size={36} className="mx-auto mb-3 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">Không có thông báo nào</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {list.items.map((n) => {
              const Icon = notificationIcon(n.type);
              const status = n.type === 'verdict' && isSubmissionStatus(n.data.status) ? n.data.status : null;
              return (
                <li
                  key={n.id}
                  className={cn(
                    'flex gap-1 rounded-2xl border p-1 transition-shadow hover:shadow-sm',
                    n.read ? 'border-border bg-card' : 'border-primary/20 bg-primary-soft',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className="flex min-w-0 flex-1 gap-3 rounded-xl p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon size={16} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm leading-snug font-semibold text-foreground">
                          {n.title}
                          {!n.read && (
                            <>
                              <span className="ml-2 inline-block size-2 rounded-full bg-primary align-middle" aria-hidden />
                              <span className="sr-only">Chưa đọc</span>
                            </>
                          )}
                        </span>
                        <time dateTime={n.createdAt} title={fullTime(n.createdAt)} className="mt-0.5 shrink-0 text-xs text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </time>
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                      {status && (
                        <span className="mt-1.5 block">
                          <VerdictBadge verdict={verdictOf(status)} />
                        </span>
                      )}
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismiss(n)}
                    className="size-11 self-start text-muted-foreground hover:text-destructive sm:size-8"
                    aria-label="Xoá thông báo"
                  >
                    <X aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
          {list.nextCursor && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" className="h-11 sm:h-9" isLoading={loadingMore} onClick={loadMore}>
                Xem thêm
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
