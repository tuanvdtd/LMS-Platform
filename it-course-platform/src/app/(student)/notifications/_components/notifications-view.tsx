'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, BookOpen, Bell, Code, Settings } from 'lucide-react';

type NotifType = 'verdict' | 'course' | 'reminder' | 'system';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  verdict?: 'AC' | 'WA' | 'TLE';
}

const INITIAL: Notif[] = [
  {
    id: 'n1',
    type: 'verdict',
    title: 'Kết quả chấm bài',
    body: 'Bài "Xây dựng useDebounce Hook" — Accepted 5/5 test cases ✓',
    time: '2 phút trước',
    read: false,
    verdict: 'AC',
  },
  {
    id: 'n2',
    type: 'verdict',
    title: 'Kết quả chấm bài',
    body: 'Bài "SQL: Tìm học viên điểm cao nhất" — Wrong Answer (test 3/5)',
    time: '1 giờ trước',
    read: false,
    verdict: 'WA',
  },
  {
    id: 'n3',
    type: 'course',
    title: 'Bài học mới',
    body: 'React Mastery: Chương 4.3 "Suspense & Concurrent Mode" vừa được đăng.',
    time: '3 giờ trước',
    read: false,
  },
  {
    id: 'n4',
    type: 'reminder',
    title: 'Nhắc học hàng ngày',
    body: 'Hôm nay bạn chưa học! Mục tiêu của bạn là 30 phút/ngày.',
    time: '8 giờ trước',
    read: true,
  },
  {
    id: 'n5',
    type: 'course',
    title: 'Khoá học sắp hết hạn giảm',
    body: 'Node.js Backend Chuyên Sâu: ưu đãi 40% còn 2 ngày.',
    time: '1 ngày trước',
    read: true,
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Cập nhật hệ thống',
    body: 'Tính năng chấm code bằng Python đã được nâng cấp lên CPython 3.12.',
    time: '3 ngày trước',
    read: true,
  },
];

const ICONS: Record<NotifType, React.ElementType> = {
  verdict: Code,
  course: BookOpen,
  reminder: Bell,
  system: Settings,
};

const COLORS: Record<NotifType, string> = {
  verdict: '#2563eb',
  course: '#7c3aed',
  reminder: '#d97706',
  system: '#64748b',
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
          <button onClick={markAll} className="text-sm text-blue-600 hover:underline">
            Đánh dấu tất cả đã đọc
          </button>
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
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                className="shrink-0 text-xs hover:text-red-500 transition-colors self-start mt-0.5"
                style={{ color: 'var(--muted-foreground)' }}
                aria-label="Xoá thông báo"
              >
                ×
              </button>
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
