'use client';

import { useState } from 'react';
import { CheckCircle, Clock, XCircle, Upload, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';

type Status = 'unsubmitted' | 'pending' | 'rejected' | 'verified';

const STEPS = [
  'Thông tin cá nhân',
  'Bằng cấp & Chứng chỉ',
  'Kinh nghiệm làm việc',
  'Portfolio',
  'Xác nhận & Gửi',
];

export default function VerificationFlow() {
  const [status, setStatus] = useState<Status>('unsubmitted');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: 'Nguyễn Thành Long',
    title: 'Senior Frontend Engineer',
    specialty: 'React, TypeScript, Node.js',
    phone: '0901234567',
    bio: 'Hơn 8 năm kinh nghiệm xây dựng ứng dụng React quy mô lớn...',
    linkedin: 'https://linkedin.com/in/nguyen-thanh-long',
    github: 'https://github.com/ntlong',
    portfolio: 'https://ntlong.dev',
    experience: '8 năm tại VNG, VNPAY và các startup fintech',
    agree: false,
  });

  if (status === 'verified') {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <ShieldCheck size={36} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2 text-green-600">Đã xác minh</h1>
        <p className="text-center mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Tài khoản giảng viên của bạn đã được xác minh. Bạn có thể tạo và đăng khoá học.
        </p>
        <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-green-50 text-green-700 border border-green-200">
          <ShieldCheck size={14} /> Giảng viên đã xác minh SkillPath
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <Clock size={36} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--foreground)' }}>
          Hồ sơ đang được xét duyệt
        </h1>
        <p className="text-center mb-8" style={{ color: 'var(--muted-foreground)' }}>
          Đội ngũ SkillPath sẽ xem xét hồ sơ trong 3–5 ngày làm việc. Bạn sẽ nhận thông báo qua email.
        </p>
        <div className="w-full space-y-3">
          {[
            { label: 'Nhận hồ sơ', done: true, date: '24/09/2025 09:00' },
            { label: 'Xem xét thông tin cá nhân', done: true, date: '24/09/2025 11:30' },
            { label: 'Kiểm tra bằng cấp & chứng chỉ', done: false, date: '' },
            { label: 'Phỏng vấn ngắn (nếu cần)', done: false, date: '' },
            { label: 'Quyết định duyệt / từ chối', done: false, date: '' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-green-100' : 'bg-slate-100'}`}>
                {item.done ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full" style={{ background: 'var(--border)' }} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{item.label}</p>
                {item.date && <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.date}</p>}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setStatus('unsubmitted')}
          className="mt-8 text-sm text-blue-600 hover:underline"
        >
          Chỉnh sửa hồ sơ
        </button>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex-1 p-6 max-w-xl mx-auto w-full">
        <div className="border-2 border-red-300 rounded-2xl p-5 mb-6 bg-red-50 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-700">Hồ sơ bị từ chối</p>
              <p className="text-sm text-red-600 mt-1">
                Lý do: Chứng chỉ được cung cấp không thể xác minh được. Vui lòng cung cấp bản scan rõ ràng hơn và đảm bảo tên trên chứng chỉ khớp với thông tin tài khoản.
              </p>
              <p className="text-xs text-red-500 mt-2">Ngày từ chối: 20/09/2025</p>
            </div>
          </div>
        </div>
        <Btn variant="primary" onClick={() => setStatus('unsubmitted')}>
          Sửa và nộp lại hồ sơ
        </Btn>
      </div>
    );
  }

  // Unsubmitted — show multi-step form
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--foreground)' }}>
          Xác minh Giảng viên
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--muted-foreground)' }}>
          Hoàn thiện hồ sơ để được xét duyệt trở thành giảng viên trên SkillPath.
        </p>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors"
                  style={{
                    background: i < step ? 'var(--primary)' : i === step ? 'var(--primary)' : 'var(--card)',
                    borderColor: i <= step ? 'var(--primary)' : 'var(--border)',
                    color: i <= step ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="text-xs mt-1 hidden sm:block" style={{ color: i === step ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-0.5 w-8 sm:w-16 mx-1" style={{ background: i < step ? 'var(--primary)' : 'var(--border)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="border rounded-2xl p-6 space-y-5" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          {step === 0 && (
            <>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Thông tin cá nhân & Chuyên môn</h2>
              {[
                { label: 'Họ và tên đầy đủ', key: 'fullName', type: 'text' },
                { label: 'Chức danh nghề nghiệp', key: 'title', type: 'text', placeholder: 'Vd: Senior React Developer tại VNG' },
                { label: 'Lĩnh vực chuyên môn', key: 'specialty', type: 'text', placeholder: 'Vd: React, TypeScript, Node.js' },
                { label: 'Số điện thoại', key: 'phone', type: 'tel' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>Giới thiệu bản thân</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={4}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Bằng cấp & Chứng chỉ</h2>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Tải lên ảnh chụp hoặc scan của bằng cấp, chứng chỉ liên quan (jpg, png, pdf).
              </p>
              {['Bằng cấp cao nhất (bắt buộc)', 'Chứng chỉ chuyên môn (tuỳ chọn)', 'Chứng chỉ khác'].map((label) => (
                <div key={label}>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
                  <div
                    className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Upload size={20} style={{ color: 'var(--muted-foreground)' }} className="mb-2" />
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Kéo thả hoặc click để tải lên</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>PDF, JPG, PNG (tối đa 5MB)</p>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                </div>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Kinh nghiệm làm việc</h2>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>
                  Mô tả kinh nghiệm làm việc
                </label>
                <textarea
                  value={form.experience}
                  onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                  rows={5}
                  placeholder="Liệt kê các vị trí, công ty, thời gian và trách nhiệm chính..."
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>
                  CV / Hồ sơ năng lực (tuỳ chọn)
                </label>
                <div
                  className="border-2 border-dashed rounded-xl p-5 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors gap-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Upload size={16} style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Tải lên CV (PDF)</span>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Portfolio & Liên kết</h2>
              {[
                { label: 'LinkedIn', key: 'linkedin', placeholder: 'https://linkedin.com/in/username' },
                { label: 'GitHub', key: 'github', placeholder: 'https://github.com/username' },
                { label: 'Website / Portfolio', key: 'portfolio', placeholder: 'https://yoursite.com' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
                  <input
                    type="url"
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                  />
                </div>
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Xác nhận & Gửi hồ sơ</h2>
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--secondary)' }}>
                {[
                  ['Họ tên', form.fullName],
                  ['Chức danh', form.title],
                  ['Chuyên môn', form.specialty],
                  ['LinkedIn', form.linkedin],
                  ['GitHub', form.github],
                ].map(([l, v]) => (
                  <div key={l} className="flex gap-3 text-sm">
                    <span className="w-24 shrink-0 font-medium" style={{ color: 'var(--muted-foreground)' }}>{l}</span>
                    <span style={{ color: 'var(--foreground)' }}>{v}</span>
                  </div>
                ))}
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setForm((f) => ({ ...f, agree: e.target.checked }))}
                  className="mt-0.5 accent-blue-600"
                />
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                  Tôi xác nhận rằng tất cả thông tin và tài liệu cung cấp là chính xác và thuộc sở hữu của tôi.
                  Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản Giảng viên</a> của SkillPath.
                </span>
              </label>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Btn variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft size={14} /> Quay lại
          </Btn>
          {step < STEPS.length - 1 ? (
            <Btn variant="primary" onClick={() => setStep((s) => s + 1)}>
              Tiếp theo <ChevronRight size={14} />
            </Btn>
          ) : (
            <Btn variant="primary" disabled={!form.agree} onClick={() => setStatus('pending')}>
              Gửi hồ sơ xét duyệt
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
}
