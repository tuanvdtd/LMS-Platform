'use client';

import { useState } from 'react';
import { Bell, Lock, User } from 'lucide-react';
import { SecuritySettings } from '@/components/security/security-settings';
import { ProfileTab } from './profile-tab';

const TABS = [
  { id: 'profile', label: 'Hồ sơ', icon: User },
  { id: 'security', label: 'Bảo mật', icon: Lock },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
];

// initialTab lấy từ ?tab= (liên kết Google/GitHub xong quay về đúng tab Bảo mật). Đổi tab ghi lại vào URL để tải lại trang không mất chỗ.
export function SettingsView({ initialTab }: { initialTab?: string }) {
  const [tab, setTabState] = useState(TABS.some((t) => t.id === initialTab) ? initialTab! : 'profile');
  const setTab = (id: string) => {
    setTabState(id);
    window.history.replaceState(null, '', `?tab=${id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--foreground)' }}>Cài đặt</h1>

      <div role="tablist" aria-label="Mục cài đặt" className="flex gap-1 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === id ? 'var(--primary)' : 'transparent',
              color: tab === id ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'security' && <SecuritySettings />}
      {tab === 'notifications' && <NotificationsTab />}
    </div>
  );
}

function NotificationsTab() {
  const PREFS = [
    { group: 'Học tập', items: [
      { key: 'judge_results', label: 'Kết quả chấm bài', desc: 'Nhận thông báo khi bài tập được chấm xong' },
      { key: 'new_lesson', label: 'Bài học mới', desc: 'Khi khoá học bạn đang học có nội dung mới' },
      { key: 'study_reminder', label: 'Nhắc học hàng ngày', desc: 'Thông báo nhắc nhở theo lịch học của bạn' },
    ]},
    { group: 'Tài khoản', items: [
      { key: 'promo', label: 'Ưu đãi & khuyến mãi', desc: 'Flash sale, mã giảm giá' },
      { key: 'newsletter', label: 'Bản tin hàng tuần', desc: 'Tổng hợp bài viết và khoá học nổi bật' },
    ]},
  ];

  const [enabled, setEnabled] = useState<Set<string>>(new Set(['judge_results', 'study_reminder']));

  function toggle(key: string) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {PREFS.map((group) => (
        <div key={group.group} className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>{group.group}</h2>
          {group.items.map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className="shrink-0 w-10 h-6 rounded-full transition-colors relative"
                style={{ background: enabled.has(key) ? 'var(--primary)' : 'var(--border)' }}
                aria-checked={enabled.has(key)}
                role="switch"
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ left: enabled.has(key) ? '18px' : '2px' }}
                />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
