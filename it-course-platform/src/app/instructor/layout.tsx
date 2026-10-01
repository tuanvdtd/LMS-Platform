'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { becomeInstructor } from '@/lib/api/instructor-courses';
import { authClient } from '@/lib/auth-client';

// Chặn quyền cho mọi trang /instructor (spec course-create-basics §5.4). Chạy ở client: session
// nằm ở back-end, proxy.ts chỉ kiểm có cookie. Không đọc usePathname/useParams → không cần Suspense;
// URL hiện tại lấy từ window trong effect.
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
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
  if (!data.user.role?.split(',').includes('instructor')) return <BecomeInstructor onDone={() => refetch()} />;
  return children;
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </main>
  );
}

// Một đường duy nhất để bật vai trò: nút "Chuyển sang Giảng viên" ở header dẫn tới /instructor → màn này.
function BecomeInstructor({ onDone }: { onDone: () => Promise<unknown> }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await becomeInstructor();
      await onDone(); // get-session trả role mới (BE đã refresh cache Redis)
    } catch {
      toast.error('Không bật được vai trò giảng viên, thử lại');
    } finally {
      setPending(false);
    }
  }

  return (
    <Centered>
      <h1 className="text-2xl font-extrabold">Trở thành giảng viên</h1>
      <p className="text-sm text-muted-foreground">
        Tạo khoá học và chia sẻ kiến thức với học viên SkillPath. Bạn có thể bắt đầu soạn khoá ngay; chỉ khi bán
        khoá có phí mới cần xác minh danh tính.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleClick} disabled={pending}>
          {pending ? 'Đang bật…' : 'Bắt đầu dạy học'}
        </Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Về trang học viên
        </Link>
      </div>
    </Centered>
  );
}
