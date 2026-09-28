'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthShell } from './auth-shell';
import { SocialButtons } from './social-buttons';

export function LoginView() {
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  return (
    <AuthShell title="Đăng nhập">
      <SocialButtons />

      <form onSubmit={(e) => { e.preventDefault(); router.push('/'); }} className="space-y-4">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>Email</label>
          <Input
            type="email"
            defaultValue="minhkhoa@example.com"
            placeholder="ten@email.com"
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>Mật khẩu</label>
          <div className="relative">
            <Input
              type={showPw ? 'text' : 'password'}
              defaultValue="••••••••"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-0 top-1/2 -translate-y-1/2"
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />}
            </Button>
          </div>
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</Link>
          </div>
        </div>
        <Btn variant="primary" size="lg" type="submit" className="w-full">
          Đăng nhập
        </Btn>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký miễn phí</Link>
      </p>
    </AuthShell>
  );
}
