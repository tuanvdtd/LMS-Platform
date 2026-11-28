'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getApplication } from '@/lib/api/instructor-application';
import type { ApplicationDisplayStatus } from '@/types/instructor-application';
import { setCoursePrice } from '@/lib/api/instructor-courses';
import { getPayoutAccount } from '@/lib/api/revenue';
import { formatPrice, PRICE_TIERS } from '@/types/instructor-course';
import type { PayoutAccountState } from '@/types/revenue';
import { useCourse } from './course-provider';
import { PageHeader } from './form-save';

const ITEMS = Object.fromEntries(PRICE_TIERS.map((p) => [String(p), formatPrice(p)]));

// Định giá: chọn bậc giá; bậc > 0 cần giảng viên cao cấp + TK ngân hàng.
const APP_NOTE: Record<ApplicationDisplayStatus, string> = {
  none: 'Đăng ký giảng viên cao cấp để bán khoá trả phí. Khoá miễn phí không cần đăng ký.',
  draft: 'Bạn đang làm dở đơn giảng viên cao cấp. Hoàn tất để bán khoá trả phí.',
  pending: 'Đơn giảng viên cao cấp đang chờ duyệt. Trong lúc chờ, khoá vẫn xuất bản miễn phí được.',
  rejected: 'Đơn giảng viên cao cấp chưa được duyệt. Xem lý do, sửa rồi gửi lại.',
  approved: 'Bạn đã là giảng viên cao cấp.',
};
const APP_CTA: Record<ApplicationDisplayStatus, string> = {
  none: 'Đăng ký giảng viên cao cấp',
  draft: 'Tiếp tục đơn',
  pending: 'Xem đơn',
  rejected: 'Xem lý do',
  approved: 'Xem',
};

export function PricingForm() {
  const { course, setCourse, patchCourse } = useCourse();
  const [account, setAccount] = useState<PayoutAccountState | null>(null);
  const [appStatus, setAppStatus] = useState<ApplicationDisplayStatus | null>(null);
  const [price, setPrice] = useState(course.priceAmount);
  const [saving, setSaving] = useState(false);
  const locked = course.status === 'in_review';
  const priceLocked = !!course.publishedAt;
  const canSell = !!account?.verified && !!account.account;

  useEffect(() => {
    getPayoutAccount().then(setAccount, () => toast.error('Không tải được thông tin giảng viên'));
    // Lỗi tải đơn bỏ qua: link vẫn hiện chữ mặc định.
    getApplication().then((v) => setAppStatus(v.displayStatus), () => undefined);
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
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Giá bán</CardTitle>
            <CardDescription>Giá đã khoá từ lần xuất bản đầu. Đổi giá bằng coupon ở mục Khuyến mại.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tracking-tight tabular-nums">{formatPrice(course.priceAmount)}</span>
            <span className="flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
              <Lock className="size-3" aria-hidden />
              Đã khoá
            </span>
          </CardContent>
        </Card>
      ) : (
        <>
          {account && !account.verified && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-foreground">
                {APP_NOTE[appStatus ?? 'none']}
                <Link href="/instructor/verification" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  {APP_CTA[appStatus ?? 'none']}
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {account?.verified && !account.account && (
            <Alert>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-foreground">
                Khai tài khoản ngân hàng để nhận doanh thu trước khi bán khoá trả phí.
                <Link href="/instructor/profile" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Khai tài khoản ngân hàng
                </Link>
              </AlertDescription>
            </Alert>
          )}
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Giá bán</CardTitle>
              <CardDescription>Đơn vị VND. Giá trả phí cần giảng viên cao cấp và tài khoản ngân hàng.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Label htmlFor="price">Mức giá</Label>
              <Select items={ITEMS} value={String(price)} onValueChange={(v) => v && setPrice(Number(v))} disabled={locked}>
                <SelectTrigger id="price" className="w-full sm:w-72">
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
            </CardContent>
            <CardFooter className="justify-end border-t bg-muted/50 py-4">
              <Button onClick={save} isLoading={saving} disabled={locked || price === course.priceAmount}>
                Lưu giá
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
