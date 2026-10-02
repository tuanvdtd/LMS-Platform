'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, Lock, User, Link2, Eye, EyeOff } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';

const TABS = [
  { id: 'profile', label: 'Hồ sơ', icon: User },
  { id: 'security', label: 'Bảo mật', icon: Lock },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'accounts', label: 'Tài khoản liên kết', icon: Link2 },
];

export function SettingsView() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--foreground)' }}>Cài đặt</h1>

      <div className="flex gap-1 mb-8 border-b" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
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
      {tab === 'security' && <SecurityTab />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'accounts' && <AccountsTab />}
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Image
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop"
            className="w-20 h-20 rounded-full object-cover"
            alt="Avatar"
            width={80}
            height={80}
          />
          <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold hover:bg-blue-700 transition-colors">
            +
          </button>
        </div>
        <div>
          <p className="font-bold" style={{ color: 'var(--foreground)' }}>Nguyễn Minh Khoa</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Học viên · Tham gia từ Tháng 1, 2024</p>
        </div>
      </div>

      <div className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Họ', defaultValue: 'Nguyễn Minh' },
            { label: 'Tên', defaultValue: 'Khoa' },
          ].map(({ label, defaultValue }) => (
            <div key={label}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>{label}</label>
              <input
                defaultValue={defaultValue}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
            </div>
          ))}
        </div>
        {[
          { label: 'Email', defaultValue: 'khoa.nguyen@example.com', type: 'email' },
          { label: 'Số điện thoại', defaultValue: '0912 345 678', type: 'tel' },
          { label: 'Nghề nghiệp', defaultValue: 'Sinh viên CNTT' },
        ].map(({ label, defaultValue, type = 'text' }) => (
          <div key={label}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>{label}</label>
            <input
              type={type}
              defaultValue={defaultValue}
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>
        ))}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Sở thích học tập</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Nghề, kỹ năng quan tâm và trình độ — dùng để gợi ý khoá học</p>
          </div>
          <Link href="/onboarding" className="text-sm font-semibold text-primary hover:underline">Chỉnh sửa</Link>
        </div>
      </div>

      <Btn variant="primary">Lưu thay đổi</Btn>
    </div>
  );
}

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="space-y-6">
      <div className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Đổi mật khẩu</h2>
        {[
          { label: 'Mật khẩu hiện tại', show: showCurrent, toggle: () => setShowCurrent((v) => !v) },
          { label: 'Mật khẩu mới', show: showNew, toggle: () => setShowNew((v) => !v) },
          { label: 'Xác nhận mật khẩu mới', show: showNew, toggle: () => setShowNew((v) => !v) },
        ].map(({ label, show, toggle }) => (
          <div key={label}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>{label}</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none pr-10"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
              <button
                type="button"
                onClick={toggle}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        <Btn variant="primary">Cập nhật mật khẩu</Btn>
      </div>

      <div className="border rounded-2xl p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Xác thực hai yếu tố (2FA)</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Tăng cường bảo mật tài khoản bằng xác thực qua ứng dụng Authenticator.
        </p>
        <Btn variant="secondary">Bật 2FA</Btn>
      </div>
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

function AccountsTab() {
  const ACCOUNTS = [
    { provider: 'Google', icon: '🔵', connected: true, email: 'khoa.nguyen@gmail.com' },
    { provider: 'GitHub', icon: '⚫', connected: false, email: null },
  ];

  return (
    <div className="space-y-4">
      {ACCOUNTS.map(({ provider, icon, connected, email }) => (
        <div
          key={provider}
          className="border rounded-2xl p-5 flex items-center justify-between"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{provider}</p>
              {connected && email && (
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{email}</p>
              )}
            </div>
          </div>
          {connected ? (
            <Btn variant="danger" size="sm">Huỷ liên kết</Btn>
          ) : (
            <Btn variant="secondary" size="sm">Liên kết</Btn>
          )}
        </div>
      ))}
    </div>
  );
}
