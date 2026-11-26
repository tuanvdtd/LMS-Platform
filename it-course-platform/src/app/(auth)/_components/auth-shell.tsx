'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { LogoMark } from '@/components/shared/logo-mark';
import type { AuthScene } from './auth-lumi';

const AuthLumi = dynamic(() => import('./auth-lumi').then((m) => m.AuthLumi), { ssr: false });

const PASSWORD_MIN = 8;
const SHELF_FULL = 14;

function litCount(root: HTMLElement) {
  const inputs = [...root.querySelectorAll<HTMLInputElement>('form input:not([type="checkbox"]):not([type="hidden"])')];
  const password = inputs.find((i) => i.id === 'password')?.value ?? '';
  const ok = inputs.filter((i) => {
    if (!i.value.trim() || !i.checkValidity()) return false;
    if (i.id === 'password') return i.value.length >= PASSWORD_MIN;
    if (i.id === 'confirmPassword') return i.value === password;
    return true;
  }).length;
  return Math.round((ok / Math.max(inputs.length, 1)) * 4);
}

// Lumi đọc trạng thái form qua DOM (ô đang focus, ô mật khẩu đang ẩn hay hiện, banner lỗi) nên các form không phải tự báo.
// progress: mỗi ô điền đúng thì một cuốn sách bay về kệ (đăng ký); không có thì kệ đã đầy sẵn.
// mail: vừa gửi email, Lumi phóng máy bay giấy ra cửa sổ một lần.
export function AuthShell({ title, progress, mail, children }: { title: string; progress?: boolean; mail?: boolean; children: React.ReactNode }) {
  const card = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<AuthScene>({ lit: progress ? 0 : SHELF_FULL, mode: 0, lookX: 0.6 });
  const [shakeKey, setShakeKey] = useState(0);

  const read = useCallback(() => {
    const root = card.current;
    if (!root) return;
    const el = document.activeElement;
    const field = el instanceof HTMLInputElement ? el : el instanceof HTMLButtonElement ? el.parentElement?.querySelector('input') : null;
    let mode: AuthScene['mode'] = 0;
    let lookX = 0.6;
    if (field && root.contains(field) && field.type !== 'checkbox') {
      if (field.id.toLowerCase().includes('password')) {
        mode = field.type === 'password' ? 2 : 3;
        lookX = mode === 2 ? -0.8 : 1;
      } else {
        mode = 1;
        lookX = 0.2 + 0.8 * Math.min(1, (field.selectionStart ?? field.value.length) / 28);
      }
    }
    const lit = progress ? litCount(root) : SHELF_FULL;
    setScene((s) => (s.mode === mode && s.lit === lit && Math.abs(s.lookX - lookX) < 0.02 ? s : { mode, lit, lookX }));
  }, [progress]);
  const schedule = useCallback(() => requestAnimationFrame(read), [read]);

  useEffect(() => {
    const root = card.current;
    if (!root) return;
    const isAlert = (n: Node) => n instanceof HTMLElement && (n.matches('[role="alert"]') || !!n.querySelector('[role="alert"]'));
    const mo = new MutationObserver((records) => {
      if (records.some((r) => [...r.addedNodes].some(isAlert))) setShakeKey((k) => k + 1);
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2">
      <div className="relative h-60 bg-ink sm:h-72 lg:sticky lg:top-0 lg:h-dvh">
        <Link href="/" className="absolute top-5 left-5 z-10 flex items-center gap-2 rounded-md text-ink-foreground lg:top-10 lg:left-12">
          <LogoMark className="h-8 text-ink-foreground" />
          <span className="text-xl font-semibold">aolumi</span>
        </Link>
        <AuthLumi scene={scene} shakeKey={shakeKey} send={mail} className="absolute inset-0" />
      </div>
      <div className="flex justify-center px-4 py-10 lg:items-center lg:px-12">
        <div ref={card} onFocus={schedule} onBlur={schedule} onInput={schedule} onKeyUp={schedule} onClick={schedule} className="w-full max-w-sm">
          <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-3 mb-4 text-muted-foreground' })}>
            <ArrowLeft />
            Về trang chủ
          </Link>
          <h1 className="mb-6 text-2xl font-extrabold text-balance">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
