'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Link2, Globe } from 'lucide-react';
import { instructors } from '@/lib/mocks/data';
import { RatingStars, Btn } from '@/components/shared/product-ui';

export default function ProfileForm() {
  const ins = instructors[0];
  const [bio, setBio] = useState(ins.bio);
  const [name, setName] = useState(ins.name);
  const [title, setTitle] = useState(ins.title);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold mb-6" style={{ color: 'var(--foreground)' }}>
          Hồ sơ giảng viên
        </h1>

        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <Image src={ins.avatar} alt={ins.name} width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
              <button
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                aria-label="Đổi ảnh đại diện"
              >
                <Camera size={13} />
              </button>
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>{ins.name}</p>
              <div className="flex items-center gap-3 text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                <span className="flex items-center gap-1"><RatingStars rating={ins.rating} size="sm" /> {ins.rating}</span>
                <span>{ins.studentCount.toLocaleString()} học viên</span>
                <span>{ins.courseCount} khoá học</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Thông tin hiển thị</h2>
            {[
              { label: 'Tên hiển thị', value: name, set: setName },
              { label: 'Chức danh', value: title, set: setTitle },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
                <input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>Giới thiệu</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />
              <p className="text-xs mt-1 text-right" style={{ color: 'var(--muted-foreground)' }}>{bio.length}/1500</p>
            </div>
          </div>

          {/* Links */}
          <div className="border rounded-2xl p-5 space-y-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Liên kết mạng xã hội</h2>
            {[
              { icon: Globe, label: 'Website', placeholder: 'https://yoursite.com' },
              { icon: Link2, label: 'GitHub', placeholder: 'https://github.com/username' },
              { icon: Link2, label: 'Twitter/X', placeholder: 'https://twitter.com/username' },
              { icon: Link2, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
            ].map(({ icon: Icon, label, placeholder }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon size={16} style={{ color: 'var(--muted-foreground)' }} className="shrink-0" />
                <input
                  placeholder={placeholder}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            ))}
          </div>

          {/* Payout */}
          <div className="border rounded-2xl p-5 space-y-3" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Cài đặt thanh toán</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Thiết lập tài khoản ngân hàng để nhận doanh thu từ khoá học.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Tên chủ tài khoản' },
                { label: 'Số tài khoản' },
                { label: 'Ngân hàng' },
                { label: 'Chi nhánh' },
              ].map(({ label }) => (
                <div key={label}>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--foreground)' }}>{label}</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Btn variant="primary">Lưu thay đổi</Btn>
        </div>
      </div>
    </div>
  );
}
