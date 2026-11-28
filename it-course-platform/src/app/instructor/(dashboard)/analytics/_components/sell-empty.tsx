// src/app/instructor/(dashboard)/analytics/_components/sell-empty.tsx
import { BadgeCheck, Tag } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { AnalyticsEmpty } from './analytics-shell';

// Giảng viên chưa bán được khoá có phí (canSell = false): chưa xác minh → trang xác minh; đã xác minh → đặt giá khoá.
export function SellEmpty({ verified }: { verified: boolean }) {
  return verified ? (
    <AnalyticsEmpty icon={Tag} 
      title="Chưa có khoá có phí"
      action={
        <Link href="/instructor/courses" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Đến quản lý khoá học
        </Link>
      }
    >
      Đặt giá cho khoá trong trang quản lý khoá học (giá khoá cố định sau lần xuất bản đầu).
    </AnalyticsEmpty>
  ) : (
    <AnalyticsEmpty icon={BadgeCheck} 
      title="Chưa thể bán khoá có phí"
      action={
        <Link href="/instructor/verification" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Đăng ký giảng viên cao cấp
        </Link>
      }
    >
      Giảng viên cao cấp mới đặt được giá trả phí cho khoá học.
    </AnalyticsEmpty>
  );
}
