'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleCheck, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { isStaff } from '@/lib/instructor-role';
import { notifyCartChanged } from '@/lib/cart-events';
import { loginUrlFor, parseAction, withoutAction, type ResumeAction } from '@/lib/resume-action';
import { addToCart, apiMessage, enroll, getBuyStatus, previewCoupon, startCheckout } from '@/lib/api/checkout';
import type { CouponPreview, CourseBuyStatus } from '@/types/checkout';
import { formatPrice } from '@/types/instructor-course';
import { formatVnd } from '@/types/revenue';

type Props = { course: { id: string; slug: string; priceAmount: number } };

// Khối giá + nút mua (spec stripe-checkout §10). Trạng thái riêng từng người lấy ở client vì trang được cache.
export function BuyBox({ course }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('couponCode')?.trim().toUpperCase() || undefined;
  const action = parseAction(searchParams.get('action'));
  const { data: session, isPending } = authClient.useSession();
  // Tài khoản nghiệp vụ không mua/ghi danh (BE trả 403) → chỉ hiện giá, không gọi status.
  const staff = isStaff(session?.user);
  const [status, setStatus] = useState<CourseBuyStatus | null>(null);
  const [preview, setPreview] = useState<{ code: string; data: CouponPreview } | null>(null);
  const [previewDone, setPreviewDone] = useState<string | null>(null); // mã đã preview xong (thành công hoặc lỗi)
  const coupon = preview && preview.code === code ? preview.data : null; // bỏ preview của mã cũ
  const [busy, setBusy] = useState(false);
  const [errorNonce, setErrorNonce] = useState(0);
  // Key mới khi đổi coupon hoặc gặp lỗi nghiệp vụ; double-click / retry mạng dùng lại (spec §7).
  const idemKey = useMemo(() => crypto.randomUUID(), [code, errorNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (session && !staff) getBuyStatus(course.id).then(setStatus, () => undefined);
  }, [session, staff, course.id]);
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    previewCoupon(course.slug, code).then(
      (c) => { if (!cancelled) { setPreview({ code, data: c }); setPreviewDone(code); } },
      () => { if (!cancelled) { setPreviewDone(code); toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn'); } },
    );
    return () => { cancelled = true; };
  }, [code, course.slug]);

  const price = coupon?.type === 'free' ? 0 : (coupon?.priceAmount ?? course.priceAmount);
  const discounted = price < course.priceAmount;
  const couponReady = !code || previewDone === code;

  function requireLogin(next: ResumeAction) {
    if (session) return false;
    router.push(loginUrlFor(window.location.pathname, window.location.search, next));
    return true;
  }

  async function run(next: ResumeAction, fn: () => Promise<void>) {
    if (busy || requireLogin(next)) return;
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

  const doEnroll = () =>
    run('enroll', async () => {
      await enroll(course.id, coupon?.type === 'free' ? code : undefined);
      toast.success('Đã ghi danh');
      router.push('/my-learning');
    });

  const doAddToCart = () =>
    run('add-to-cart', async () => {
      await addToCart(course.id);
      setStatus((s) => ({ enrolled: false, isOwner: false, ...s, inCart: true }));
      notifyCartChanged();
      toast.success('Đã thêm vào giỏ');
    });

  const doBuyNow = () =>
    run('buy-now', async () => {
      const { url } = await startCheckout(idemKey, { courseId: course.id, couponCode: coupon ? code : undefined });
      window.location.assign(url);
    });

  // Sau đăng nhập: chạy lại hành động dở đúng một lần, khi đã có status và coupon (nếu có) đã preview xong.
  const resumed = useRef(false);
  useEffect(() => {
    if (!action || resumed.current || !session || !status || !couponReady) return;
    resumed.current = true;
    router.replace(withoutAction(window.location.pathname, window.location.search), { scroll: false });
    if (status.enrolled || status.isOwner) return;
    // Handler gọi setBusy → không gọi đồng bộ trong effect (react-hooks/set-state-in-effect của eslint-config-next 16).
    queueMicrotask(() => {
      if (action === 'add-to-cart' && price > 0 && !status.inCart) doAddToCart();
      else if (action === 'enroll' && price === 0) doEnroll();
      // Mã coupon không hợp lệ: không tự thanh toán giá gốc, để người dùng xem lại rồi bấm.
      else if (action === 'buy-now' && price > 0 && (!code || coupon)) doBuyNow();
    });
  }, [action, session, status, couponReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const priceBlock = (
    <div className="flex items-baseline gap-2">
      <p className="text-3xl font-extrabold text-foreground">{formatPrice(price)}</p>
      {discounted && <p className="text-sm text-muted-foreground line-through">{formatVnd(course.priceAmount)}</p>}
      {discounted && course.priceAmount > 0 && (
        <p className="text-sm font-semibold text-primary">-{Math.round((1 - price / course.priceAmount) * 100)}%</p>
      )}
    </div>
  );
  const disabled = busy || isPending || (!!session && !status);

  // CTA chính dùng chung cho khối mua và thanh dính đáy (mobile); `bar` = bản gọn trong thanh.
  function primaryCta(bar: boolean) {
    const size = bar ? 'default' : 'lg';
    const width = bar ? 'h-10' : 'w-full';
    if (status?.enrolled) return <Link href="/my-learning" className={buttonVariants({ size, className: width })}>Vào học</Link>;
    if (status?.isOwner) return <Button size={size} disabled className={width}>Khoá học của bạn</Button>;
    if (price === 0) {
      return (
        <Button size={size} className={width} disabled={disabled}
          onClick={doEnroll}>
          Ghi danh ngay
        </Button>
      );
    }
    if (status?.inCart) {
      return (
        <Link href={code ? `/cart?couponCode=${encodeURIComponent(code)}` : '/cart'} className={buttonVariants({ variant: 'accent', size, className: width })}>
          <ShoppingCart data-icon="inline-start" aria-hidden /> Đến giỏ hàng
        </Link>
      );
    }
    return (
      <Button variant="accent" size={size} className={width} disabled={disabled}
        onClick={doAddToCart}>
        <ShoppingCart data-icon="inline-start" aria-hidden /> Thêm vào giỏ
      </Button>
    );
  }

  const enrolledNote = (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--skill-strong)]">
      <CircleCheck className="size-4" aria-hidden /> Bạn đã ghi danh
    </p>
  );
  const showBuyNow = price > 0 && !status?.enrolled && !status?.isOwner;

  if (staff) {
    return (
      <>
        {priceBlock}
        <p className="text-sm text-muted-foreground">Tài khoản nghiệp vụ không mua hoặc ghi danh khoá học.</p>
      </>
    );
  }

  return (
    <>
      {status?.enrolled ? enrolledNote : priceBlock}
      {primaryCta(false)}
      {showBuyNow && (
        <Button variant="secondary" size="lg" className="w-full" disabled={disabled}
          onClick={doBuyNow}>
          Mua ngay
        </Button>
      )}
      {/* Thanh dính đáy chỉ ở mobile; trang chừa pb-28 cho nó. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-card px-4 py-3 lg:hidden">
        <div className="min-w-0 whitespace-nowrap">
          {status?.enrolled ? enrolledNote : <p className="text-xl font-extrabold text-foreground">{formatPrice(price)}</p>}
        </div>
        {primaryCta(true)}
      </div>
    </>
  );
}
