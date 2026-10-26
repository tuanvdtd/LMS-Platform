'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { isInstructor } from '@/lib/instructor-role';

// Chặn quyền cho mọi trang /instructor. Chạy ở client: session
// nằm ở back-end, proxy.ts chỉ kiểm có cookie. Không đọc usePathname/useParams → không cần Suspense;
// URL hiện tại lấy từ window trong effect. Chưa là giảng viên → về landing /teach, cửa duy nhất bật vai trò.
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { data, isPending, error, refetch } = authClient.useSession();
  const router = useRouter();
  const signedOut = !isPending && !data && (!error || error.status === 401);
  const notInstructor = !!data && !isInstructor(data.user);

  useEffect(() => {
    if (signedOut) router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    else if (notInstructor) router.replace('/teach');
  }, [signedOut, notInstructor, router]);

  if (error && !data && !signedOut) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">Không kiểm tra được phiên đăng nhập.</p>
        <Button onClick={() => refetch()}>Thử lại</Button>
      </main>
    );
  }
  if (!data || notInstructor) {
    return (
      <div className="space-y-4 p-6" role="status" aria-busy="true" aria-label="Đang tải">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return children;
}
