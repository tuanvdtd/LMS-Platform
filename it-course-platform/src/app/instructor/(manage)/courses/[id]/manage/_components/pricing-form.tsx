'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApplication } from '@/lib/api/instructor-application';
import { setCoursePrice } from '@/lib/api/instructor-courses';
import { getPayoutAccount } from '@/lib/api/revenue';
import { formatPrice, PRICE_TIERS } from '@/types/instructor-course';
import type { PayoutAccountState } from '@/types/revenue';
import { useCourse } from './course-provider';
import { PageHeader } from './form-save';

const ITEMS = Object.fromEntries(PRICE_TIERS.map((p) => [String(p), formatPrice(p)]));

// Định giá: chọn bậc giá; bậc > 0 cần giảng viên cao cấp + TK ngân hàng.
export function PricingForm() {
  const { course, setCourse, patchCourse } = useCourse();
  const [account, setAccount] = useState<PayoutAccountState | null>(null);
  const [pending, setPending] = useState(false);
  const [price, setPrice] = useState(course.priceAmount);
  const [saving, setSaving] = useState(false);
  const locked = course.status === 'in_review';
  const priceLocked = !!course.publishedAt;
  const canSell = !!account?.verified && !!account.account;

  useEffect(() => {
    getPayoutAccount().then(setAccount, () => toast.error('Không tải được thông tin giảng viên'));
    // Lỗi tải đơn bỏ qua: link vẫn hiện chữ mặc định.
    getApplication().then((v) => setPending(v.displayStatus === 'pending'), () => undefined);
  }, []);

  async function save() {
    setSaving(true);
    try {
      const c = await setCoursePrice(course.id, price);
      setCourse(c);
      toast.success('Đã lưu giá');
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      if (data?.code === 'COURSE_LOCKED') patchCourse({ status: 'in_review' });
      toast.error(data?.message ?? 'Lưu thất bại, thử lại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Định giá" description="Chọn mức giá cho khoá học. Giá sẽ khoá sau lần xuất bản đầu tiên." />
      {priceLocked ? (
        <Alert>
          <AlertDescription>
            Giá đã khoá từ lần xuất bản đầu ({formatPrice(course.priceAmount)}). Đổi giá bằng coupon.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {account && !account.verified && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                {pending
                  ? 'Đơn giảng viên cao cấp đang chờ duyệt. Trong lúc chờ, khoá vẫn xuất bản miễn phí được.'
                  : 'Đăng ký giảng viên cao cấp để bán khoá trả phí. Khoá miễn phí không cần đăng ký.'}
                <Link href="/instructor/verification" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  {pending ? 'Xem đơn' : 'Đăng ký giảng viên cao cấp'}
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {account?.verified && !account.account && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Khai tài khoản ngân hàng để nhận doanh thu trước khi bán khoá trả phí.
                <Link href="/instructor/profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Khai tài khoản ngân hàng
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <div className="flex max-w-sm flex-col gap-2">
            <Label htmlFor="price">Mức giá</Label>
            <Select items={ITEMS} value={String(price)} onValueChange={(v) => v && setPrice(Number(v))} disabled={locked}>
              <SelectTrigger id="price" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PRICE_TIERS.map((p) => (
                    <SelectItem key={p} value={String(p)} disabled={p > 0 && !canSell}>
                      {formatPrice(p)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Đơn vị VND.</p>
          </div>
          <div>
            <Button onClick={save} disabled={locked || saving || price === course.priceAmount}>
              Lưu
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
