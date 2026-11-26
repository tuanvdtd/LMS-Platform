'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Home } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { ErrorScreen } from '@/components/shared/error-screen';
import { authClient } from '@/lib/auth-client';

function AccountLine({ email }: { email: string }) {
  const [pending, setPending] = useState(false);

  async function switchAccount() {
    setPending(true);
    const { error } = await authClient.signOut().catch(() => ({ error: true }));
    if (error) {
      setPending(false);
      toast.error('Đăng xuất thất bại, thử lại');
      return;
    }
    window.location.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
  }

  return (
    <>
      <p>
        Bạn đang đăng nhập bằng <span className="inline-block max-w-full font-medium break-all text-foreground">{email}.</span>
      </p>
      <Button variant="link" size="sm" isLoading={pending} onClick={switchAccount} className="mx-auto mt-1 flex text-sm">
        Đổi tài khoản
      </Button>
    </>
  );
}

export function OutsiderForbidden({ user }: { user: { email: string } }) {
  return (
    <ErrorScreen
      scene="Guard"
      standalone
      title="Bạn không có quyền xem trang này"
      actions={<Link href="/" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}><Home />Về trang chủ</Link>}
      footnote={<AccountLine email={user.email} />}
    >
      Khu quản trị chỉ dành cho tài khoản quản trị viên và kiểm duyệt viên.
    </ErrorScreen>
  );
}

export function ModeratorForbidden({ user }: { user: { email: string } }) {
  return (
    <ErrorScreen
      scene="Guard"
      title="Trang này chỉ dành cho quản trị viên"
      actions={
        <Link href="/admin/course-approvals" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}><ClipboardCheck />Về hàng đợi duyệt khoá</Link>
      }
      footnote={<AccountLine email={user.email} />}
    >
      Tài khoản kiểm duyệt dùng được hàng đợi duyệt khoá học, ngân hàng kỹ năng và trang bảo mật tài khoản.
    </ErrorScreen>
  );
}
