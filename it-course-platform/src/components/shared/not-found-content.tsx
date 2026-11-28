import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { ErrorScreen } from '@/components/shared/error-screen';

export function NotFoundContent() {
  return (
    <ErrorScreen
      scene="Lost"
      code="404"
      title="Không tìm thấy trang này"
      actions={
        <>
          <Link href="/" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}><Home />Về trang chủ</Link>
          <Link href="/courses" className={buttonVariants({ variant: 'outline', size: 'lg', className: 'w-full sm:w-auto' })}><Compass />Khám phá khoá học</Link>
        </>
      }
    >
      Đường dẫn có thể bị gõ sai, hoặc trang đã được chuyển sang chỗ khác.
    </ErrorScreen>
  );
}
