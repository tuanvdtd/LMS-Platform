import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { PayoutAccountCard } from './payout-account-card';

// Chức danh, giới thiệu, liên kết của giảng viên là hồ sơ chung của tài khoản: sửa ở Cài đặt → Hồ sơ.
// Trang này chỉ còn phần riêng của giảng viên: tài khoản nhận tiền.
export default function ProfileForm() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex max-w-2xl flex-col gap-6">
        <h1 className="text-2xl font-extrabold text-foreground">Tài khoản nhận tiền</h1>
        <PayoutAccountCard />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t pt-6">
          <p className="max-w-[46ch] text-sm text-muted-foreground">
            Chức danh, giới thiệu và liên kết hiện trên trang cá nhân của bạn được sửa ở Cài đặt.
          </p>
          <Link href="/settings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Sửa hồ sơ
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </div>
  );
}
