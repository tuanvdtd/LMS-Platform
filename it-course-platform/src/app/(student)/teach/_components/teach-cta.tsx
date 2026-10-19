'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { becomeInstructor } from '@/lib/api/instructor-courses';
import { authClient } from '@/lib/auth-client';
import { isInstructor } from '@/lib/instructor-role';

// CTA landing /teach (spec teach-landing §4.2): khách → đăng ký, học viên → bật vai trò rồi vào dashboard,
// giảng viên → vào dashboard. Hai chỗ dùng (khối 2, khối 8) đọc chung một session.
export function TeachCta() {
  const { data, isPending, refetch } = authClient.useSession();
  const router = useRouter();
  const [enabling, setEnabling] = useState(false);

  if (isPending) return <Skeleton className="h-11 w-48" />;

  if (!data) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Link href="/register?redirect=/teach" className={buttonVariants({ size: 'lg' })}>
          Đăng ký để bắt đầu dạy <ArrowRight data-icon="inline-end" />
        </Link>
        <p className="text-sm text-muted-foreground">
          Đã có tài khoản?{' '}
          <Link href="/login?redirect=/teach" className="font-semibold underline underline-offset-4">Đăng nhập</Link>
        </p>
      </div>
    );
  }

  if (isInstructor(data.user)) {
    return (
      <div className="flex flex-col items-start gap-2">
        <Link href="/instructor" className={buttonVariants({ size: 'lg' })}>
          Vào trang giảng viên <ArrowRight data-icon="inline-end" />
        </Link>
        <p className="text-sm text-muted-foreground">Bạn đã là giảng viên.</p>
      </div>
    );
  }

  async function enable() {
    setEnabling(true);
    try {
      await becomeInstructor();
    } catch {
      toast.error('Không bật được vai trò giảng viên, thử lại');
      setEnabling(false);
      return;
    }
    // refetch lỗi vẫn đi tiếp: layout /instructor đọc lại session (spec §5). Endpoint idempotent nên bấm lại an toàn.
    await refetch().catch(() => undefined);
    router.push('/instructor');
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="lg" onClick={enable} isLoading={enabling}>
        Bắt đầu dạy học <ArrowRight data-icon="inline-end" />
      </Button>
      <p className="text-sm text-muted-foreground">Miễn phí. Không cần nộp hồ sơ trước.</p>
    </div>
  );
}
