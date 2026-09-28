import type { Metadata } from 'next';
import Link from 'next/link';
import { CircleCheckBig } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Thanh toán thành công | SkillPath' };

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CircleCheckBig className="size-8" />
      </div>
      <h1 className="mb-3 text-2xl font-extrabold text-foreground">Thanh toán thành công!</h1>
      <p className="mb-6 text-muted-foreground">Khoá học đã được thêm vào tài khoản của bạn.</p>
      <Link href="/my-learning" className={buttonVariants({ size: 'lg' })}>Bắt đầu học ngay</Link>
    </div>
  );
}
