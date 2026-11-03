'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { redirect, usePathname, useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { isAdmin, isStaff } from '@/lib/instructor-role';
import { AdminShell } from './_components/admin-shell';

// Khu quản trị. Gate ở client như instructor/layout.tsx.
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
  if (!data) return <ShellSkeleton />;
  if (!isStaff(data.user)) return <Forbidden />;
  const admin = isAdmin(data.user);
  return (
    <AdminShell user={data.user} admin={admin}>
      <RoleGate admin={admin}>{children}</RoleGate>
    </AdminShell>
  );
}

// Cùng hình khung thật: header h-14, sidebar 256px (desktop), nội dung trên nền muted.
function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-muted" role="status" aria-busy="true" aria-label="Đang tải khu quản trị">
      <div className="flex h-14 items-center gap-3 border-b bg-card px-4">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="size-7 rounded-full" />
      </div>
      <div className="flex">
        <div className="hidden w-64 shrink-0 flex-col gap-2 border-r bg-card p-3 lg:flex">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-4 px-4 py-6 lg:px-8 lg:py-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-72 w-full max-w-6xl rounded-xl" />
        </div>
      </div>
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
