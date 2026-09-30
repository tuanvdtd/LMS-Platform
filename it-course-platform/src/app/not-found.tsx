import Link from 'next/link';
import { Home } from 'lucide-react';
import SiteHeader from '@/components/layout/site-header';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <>
      <SiteHeader cartCount={0} />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-4 text-7xl font-extrabold text-border">404</div>
        <h1 className="mb-3 text-xl font-bold text-foreground">Trang không tồn tại</h1>
        <p className="mb-6 text-muted-foreground">Đường dẫn bạn truy cập không hợp lệ.</p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}><Home className="size-4" />Về trang chủ</Link>
      </main>
    </>
  );
}
