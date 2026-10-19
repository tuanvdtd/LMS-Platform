'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, BellDot, BookOpen, Code, MessageCircleQuestion, Settings, Star, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MOCK_NOTIFICATIONS, type Notif, type NotifAudience, type NotifType } from '@/lib/mock-notifications';

const ICONS: Record<NotifType, React.ElementType> = {
  verdict: Code,
  course: BookOpen,
  reminder: Bell,
  system: Settings,
  enrollment: UserPlus,
  question: MessageCircleQuestion,
  review: Star,
};

// Panel chỉ để liếc mấy cái mới nhất; xem hết thì sang /notifications.
const PANEL_LIMIT = 8;

// 28rem, chặn thêm theo chiều cao màn để panel không tràn đáy.
const maxListHeight = () => Math.min(448, window.innerHeight - 208);

// Chiều cao để mục cuối lộ khoảng một nửa — người dùng thấy ngay là cuộn được.
function getPeekListHeight(list: HTMLElement, max: number) {
  if (list.scrollHeight <= max) return list.scrollHeight;
  const top = list.getBoundingClientRect().top - list.scrollTop;
  let peek = max;
  for (const item of list.querySelectorAll<HTMLElement>('[data-peek-item]')) {
    const r = item.getBoundingClientRect();
    const middle = r.top - top + r.height / 2;
    if (middle > max) break;
    peek = middle;
  }
  return peek;
}

interface NotificationPanelProps {
  // ponytail: dữ liệu giả mặc định, nối API thì truyền vào + nối hai handler.
  notifications?: Notif[];
  // Chỉ giảng viên mới có tab Giảng viên; học viên thường thấy một danh sách, không tab.
  isInstructor?: boolean;
  onMarkAllRead?: () => void;
  onOpenNotification?: (n: Notif) => void;
}

export function NotificationPanel({
  notifications = MOCK_NOTIFICATIONS,
  isInstructor = false,
  onMarkAllRead = () => {},
  onOpenNotification = () => {},
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotifAudience>('student');
  const [listHeight, setListHeight] = useState<number>();

  const visible = isInstructor ? notifications : notifications.filter((n) => n.audience === 'student');
  const unreadCount = visible.filter((n) => !n.read).length;
  const hasUnread = (a: NotifAudience) => visible.some((n) => n.audience === a && !n.read);
  const shown = visible.filter((n) => n.audience === tab).slice(0, PANEL_LIMIT);

  // Giữ chiều cao lớn nhất đã đo: đổi sang tab ít mục thì mép dưới không nhảy.
  const measureList = (el: HTMLDivElement | null) => {
    if (el) setListHeight((h) => Math.max(h ?? 0, getPeekListHeight(el, maxListHeight())));
  };

  const BellIcon = unreadCount > 0 ? BellDot : Bell;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTab('student');
          setListHeight(undefined);
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-full aria-expanded:bg-foreground/5 lg:inline-flex"
            aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
          />
        }
      >
        <BellIcon size={18} className="text-foreground [&_circle]:fill-current" />
      </PopoverTrigger>

      {/* Nút h-10 giữa header h-16 → đáy nút cách đường kẻ 12px; +8 để mép panel nằm dưới đường kẻ */}
      <PopoverContent
        align="end"
        sideOffset={20}
        positionMethod="fixed"
        className="w-96 max-w-[calc(100vw-2rem)] gap-0 rounded-2xl border border-border bg-card p-0 shadow-lg ring-0"
      >
        <div className="flex items-center justify-between pt-3 pl-4 pr-1">
          <h2 className="text-base font-semibold text-foreground">Thông báo</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-sm" onClick={onMarkAllRead}>
              Đánh dấu đã đọc
            </Button>
          )}
        </div>

        {isInstructor ? (
          <div className="border-b border-border px-4 pt-2 pb-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as NotifAudience)}>
              <TabsList>
                {(['student', 'instructor'] as const).map((a) => (
                  <TabsTrigger key={a} value={a} className="px-3">
                    {a === 'student' ? 'Học viên' : 'Giảng viên'}
                    {hasUnread(a) && <span className="size-1.5 rounded-full bg-foreground" aria-label="có thông báo chưa đọc" />}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        ) : (
          <div className="border-b border-border pt-2" />
        )}

        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Chưa có thông báo nào</p>
        ) : (
          <div
            ref={measureList}
            className="overflow-y-auto p-2"
            style={{ height: listHeight }}
          >
            {shown.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Chưa có thông báo nào</p>
            ) : (
              shown.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    type="button"
                    data-peek-item
                    onClick={() => onOpenNotification(n)}
                    className="flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors outline-none hover:bg-muted focus-visible:bg-muted dark:hover:bg-foreground/5"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground dark:bg-foreground/10">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start gap-3">
                        <span
                          title={n.title}
                          className={cn(
                            'line-clamp-2 flex-1 text-sm font-medium',
                            n.read ? 'text-foreground/70' : 'text-foreground',
                          )}
                        >
                          {n.title}
                        </span>
                        {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" aria-label="Chưa đọc" />}
                      </span>
                      <span title={n.body} className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{n.time}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        <Link
          href="/notifications"
          onClick={() => setOpen(false)}
          className="flex h-11 items-center justify-center rounded-b-2xl border-t border-border text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:bg-muted dark:hover:bg-foreground/5"
        >
          Xem tất cả thông báo
        </Link>
      </PopoverContent>
    </Popover>
  );
}
