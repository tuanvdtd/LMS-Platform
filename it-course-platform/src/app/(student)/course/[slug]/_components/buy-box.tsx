'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { addToCart, apiMessage, enroll, getBuyStatus, previewCoupon, startCheckout } from '@/lib/api/checkout';
import type { CouponPreview, CourseBuyStatus } from '@/types/checkout';
import { formatPrice } from '@/types/instructor-course';
import { formatVnd } from '@/types/revenue';

type Props = { course: { id: string; slug: string; priceAmount: number } };

// Khối giá + nút mua (spec stripe-checkout §10). Trạng thái riêng từng người lấy ở client vì trang được cache.
export function BuyBox({ course }: Props) {
  const router = useRouter();
  const code = useSearchParams().get('couponCode')?.trim().toUpperCase() || undefined;
  const { data: session, isPending } = authClient.useSession();
  const [status, setStatus] = useState<CourseBuyStatus | null>(null);
  const [preview, setPreview] = useState<{ code: string; data: CouponPreview } | null>(null);
  const coupon = preview && preview.code === code ? preview.data : null; // bỏ preview của mã cũ
  const [busy, setBusy] = useState(false);
  const [errorNonce, setErrorNonce] = useState(0);
  // Key mới khi đổi coupon hoặc gặp lỗi nghiệp vụ; double-click / retry mạng dùng lại (spec §7).
  const idemKey = useMemo(() => crypto.randomUUID(), [code, errorNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session) getBuyStatus(course.id).then(setStatus, () => undefined);
  }, [session, course.id]);
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    previewCoupon(course.slug, code).then(
      (c) => { if (!cancelled) setPreview({ code, data: c }); },
      () => { if (!cancelled) toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn'); },
    );
    return () => { cancelled = true; };
  }, [code, course.slug]);

  const price = coupon?.type === 'free' ? 0 : (coupon?.priceAmount ?? course.priceAmount);
  const discounted = price < course.priceAmount;

  function requireLogin() {
    if (session) return false;
    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    return true;
  }

  async function run(fn: () => Promise<void>) {
    if (busy || requireLogin()) return;
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      const s = (e as { response?: { status?: number } }).response?.status;
      if (s && s >= 400 && s < 500) setErrorNonce((n) => n + 1);
      toast.error(apiMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const priceBlock = (
    <div className="flex items-baseline gap-2">
      <p className="text-2xl font-extrabold text-foreground">{formatPrice(price)}</p>
      {discounted && <p className="text-sm text-muted-foreground line-through">{formatVnd(course.priceAmount)}</p>}
      {discounted && course.priceAmount > 0 && (
        <p className="text-sm font-semibold text-primary">-{Math.round((1 - price / course.priceAmount) * 100)}%</p>
      )}
    </div>
  );

  if (status?.enrolled) {
    return <>{priceBlock}<Link href="/my-learning" className={buttonVariants({ size: 'lg', className: 'w-full' })}>Vào học</Link></>;
  }
  if (status?.isOwner) {
    return <>{priceBlock}<Button size="lg" disabled className="w-full">Khoá học của bạn</Button></>;
  }
  if (price === 0) {
    return (
      <>
        {priceBlock}
        <Button size="lg" className="w-full" disabled={busy || isPending || (!!session && !status)}
          onClick={() => run(async () => {
            await enroll(course.id, coupon?.type === 'free' ? code : undefined);
            toast.success('Đã ghi danh');
            router.push('/my-learning');
          })}>
          Ghi danh ngay
        </Button>
      </>
    );
  }
  return (
    <>
      {priceBlock}
      {status?.inCart ? (
        <Link href={code ? `/cart?couponCode=${encodeURIComponent(code)}` : '/cart'} className={buttonVariants({ variant: 'accent', size: 'lg', className: 'w-full' })}>
          <ShoppingCart data-icon="inline-start" aria-hidden /> Đến giỏ hàng
        </Link>
      ) : (
        <Button variant="accent" size="lg" className="w-full" disabled={busy || isPending || (!!session && !status)}
          onClick={() => run(async () => {
            await addToCart(course.id);
            setStatus((s) => ({ enrolled: false, isOwner: false, ...s, inCart: true }));
            toast.success('Đã thêm vào giỏ');
          })}>
          <ShoppingCart data-icon="inline-start" aria-hidden /> Thêm vào giỏ
        </Button>
      )}
      <Button variant="outline" size="lg" className="w-full" disabled={busy || isPending || (!!session && !status)}
        onClick={() => run(async () => {
          const { url } = await startCheckout(idemKey, { courseId: course.id, couponCode: coupon ? code : undefined });
          window.location.assign(url);
        })}>
        Mua ngay
      </Button>
    </>
  );
}
