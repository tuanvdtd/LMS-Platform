'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, BookOpen, Bell, Code, Settings, UserPlus, MessageCircleQuestion, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_NOTIFICATIONS as INITIAL, type Notif, type NotifType } from '@/lib/mock-notifications';

const ICONS: Record<NotifType, React.ElementType> = {
  verdict: Code,
  course: BookOpen,
  reminder: Bell,
  system: Settings,
  enrollment: UserPlus,
  question: MessageCircleQuestion,
  review: Star,
};

const COLORS: Record<NotifType, string> = {
  verdict: '#2563eb',
  course: '#7c3aed',
  reminder: '#d97706',
  system: '#64748b',
  enrollment: '#059669',
  question: '#2563eb',
  review: '#d97706',
};

export function NotificationsView() {
  const [notifs, setNotifs] = useState<Notif[]>(INITIAL);
  const [filter, setFilter] = useState<'all' | NotifType>('all');

  const displayed = filter === 'all' ? notifs : notifs.filter((n) => n.type === filter);
  const unreadCount = notifs.filter((n) => !n.read).length;

  function markAll() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markOne(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function dismiss(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'verdict', label: 'Chấm bài' },
    { id: 'course', label: 'Khoá học' },
    { id: 'reminder', label: 'Nhắc học' },
    { id: 'system', label: 'Hệ thống' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ color: 'var(--foreground)' }}>Thông báo</h1>
          {unreadCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{unreadCount} chưa đọc</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="link" onClick={markAll} className="px-0">
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id as typeof filter)}
            className="px-3 py-1.5 rounded-full border text-xs font-medium transition-colors"
            style={{
              background: filter === id ? 'var(--primary)' : 'var(--card)',
              color: filter === id ? '#fff' : 'var(--foreground)',
              borderColor: filter === id ? 'var(--primary)' : 'var(--border)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {displayed.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <div
              key={n.id}
              onClick={() => markOne(n.id)}
              className="flex gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-sm"
              style={{
                borderColor: 'var(--border)',
                background: n.read ? 'var(--card)' : 'var(--primary-light, #eff6ff)',
                opacity: n.read ? 0.85 : 1,
              }}
            >
              {/* Icon */}
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: COLORS[n.type] + '1a' }}
              >
                <Icon size={16} style={{ color: COLORS[n.type] }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--foreground)' }}>
                    {n.title}
                    {!n.read && (
                      <span className="inline-block ml-2 w-2 h-2 rounded-full bg-blue-600 align-middle" />
                    )}
                  </p>
                  <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{n.time}</span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{n.body}</p>

                {/* Verdict indicator */}
                {n.verdict && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold">
                    {n.verdict === 'AC' ? (
                      <><CheckCircle size={12} className="text-green-600" /><span className="text-green-600">Accepted</span></>
                    ) : n.verdict === 'WA' ? (
                      <><XCircle size={12} className="text-red-500" /><span className="text-red-500">Wrong Answer</span></>
                    ) : (
                      <span className="text-amber-600">Time Limit Exceeded</span>
                    )}
                  </div>
                )}
              </div>

              {/* Dismiss */}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                className="self-start text-muted-foreground hover:text-destructive"
                aria-label="Xoá thông báo"
              >
                ×
              </Button>
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="text-center py-16">
            <Bell size={36} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p style={{ color: 'var(--muted-foreground)' }}>Không có thông báo nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
