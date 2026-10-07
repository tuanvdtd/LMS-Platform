'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
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
  if (!data.user.role?.split(',').includes('admin')) {
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
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}
