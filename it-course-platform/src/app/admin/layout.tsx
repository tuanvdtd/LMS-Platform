'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { redirect, usePathname, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { isAdmin, isStaff } from '@/lib/instructor-role';
import { AdminNav } from './_components/admin-nav';

// Khu admin tối giản (spec revenue-share-payout §5). Gate ở client như instructor/layout.tsx.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data, isPending, error, refetch } = authClient.useSession();
  const router = useRouter();
  const signedOut = !isPending && !data && (!error || error.status === 401);

  useEffect(() => {
    if (!signedOut) return;
    router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [signedOut, router]);

  if (error && !data && !signedOut) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">Không kiểm tra được phiên đăng nhập.</p>
        <Button onClick={() => refetch()}>Thử lại</Button>
      </Centered>
    );
  }
  if (!data) {
    return (
      <div className="space-y-4 p-6" role="status" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!isStaff(data.user)) return <Forbidden />;
  const admin = isAdmin(data.user);
  return (
    <div className="flex min-h-screen">
      <AdminNav admin={admin} />
      <main className="flex-1 overflow-y-auto p-6">
        <RoleGate admin={admin}>{children}</RoleGate>
      </main>
    </div>
  );
}

// Moderator chỉ dùng hàng đợi duyệt khoá. Chỉ render sau khi có session (không chạy lúc prerender)
// nên usePathname không cần Suspense; /admin điều hướng theo vai trò ở đây vì page không biết session.
function RoleGate({ admin, children }: { admin: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/admin') redirect(admin ? '/admin/payouts' : '/admin/course-approvals');
  if (!admin && !pathname.startsWith('/admin/course-approvals')) return <Forbidden />;
  return children;
}

function Forbidden() {
  return (
    <Centered>
      <h1 className="text-2xl font-extrabold">403</h1>
      <p className="text-sm text-muted-foreground">Trang này chỉ dành cho quản trị viên.</p>
      <Link href="/" className={buttonVariants({ variant: 'outline' })}>
        Về trang chủ
      </Link>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}
