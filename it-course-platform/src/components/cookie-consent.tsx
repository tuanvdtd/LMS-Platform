'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getConsent, onConsentChange, onOpenCookieSettings, openCookieSettings, setConsent } from '@/lib/cookie-consent';

// Thanh hỏi ý kiến về cookie. Không phải modal: không chặn trang, người dùng vẫn đọc và bấm bình thường.
// Hai nút ngang hàng nhau (cùng cỡ, đều rõ) để từ chối không khó hơn đồng ý.
export function CookieConsent() {
  // Server và lần hydrate đầu trả 'ssr' → không render gì, khỏi lệch hydration.
  const consent = useSyncExternalStore(onConsentChange, () => getConsent() ?? 'unset', () => 'ssr');
  const [reopened, setReopened] = useState(false);
  useEffect(() => onOpenCookieSettings(() => setReopened(true)), []);

  if (consent === 'ssr' || (consent !== 'unset' && !reopened)) return null;

  const choose = (value: 'accepted' | 'rejected') => {
    setConsent(value);
    setReopened(false);
  };

  return (
    <section
      aria-label="Lựa chọn cookie"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-3 duration-300 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none sm:px-4 sm:pb-4"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xl sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <Cookie className="hidden size-6 shrink-0 text-primary sm:block" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-sm font-bold">Aolumi dùng cookie</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cookie thiết yếu giữ phiên đăng nhập và luôn bật. Công cụ chẩn đoán lỗi chỉ chạy khi bạn đồng ý.{' '}
            <Link href="/privacy#cookie" className="font-semibold text-primary underline-offset-4 hover:underline">
              Xem chi tiết
            </Link>
          </p>
          {consent !== 'unset' && (
            <p className="text-xs text-muted-foreground">
              Lựa chọn hiện tại: <strong className="text-foreground">{consent === 'accepted' ? 'Đồng ý tất cả' : 'Từ chối'}</strong>
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" className="h-10 flex-1 sm:flex-none" onClick={() => choose('rejected')}>
            Từ chối
          </Button>
          <Button className="h-10 flex-1 sm:flex-none" onClick={() => choose('accepted')}>
            Đồng ý tất cả
          </Button>
        </div>
      </div>
    </section>
  );
}

// Nút mở lại bảng chọn. Mặc định trông như link trong đoạn văn.
export function CookieSettingsButton({ className, children = 'Tuỳ chỉnh cookie' }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={openCookieSettings} className={cn('cursor-pointer', className)}>
      {children}
    </button>
  );
}
