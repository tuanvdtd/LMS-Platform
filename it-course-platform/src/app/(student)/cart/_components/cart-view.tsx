'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, CircleAlert, Loader2, Lock, RotateCw, ShoppingCart, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { CartSkeleton } from '@/components/skeletons/cart-skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiMessage, startCheckout } from '@/lib/api/checkout';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/utils';
import type { CartItem } from '@/types/checkout';
import { formatVnd } from '@/types/revenue';

// Mã coupon chỉ sống ở state/URL, không lưu DB; giỏ lấy từ store dùng chung với badge ở header.
export default function CartView() {
  const initialCode = useSearchParams().get('couponCode')?.toUpperCase() ?? '';
  const cart = useCartStore((s) => s.cart);
  const loading = useCartStore((s) => s.loading);
  const [code, setCode] = useState(initialCode);
  const [applied, setApplied] = useState(initialCode);
  const [paying, setPaying] = useState(false);
  const [errorNonce, setErrorNonce] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const load = () =>
    useCartStore.getState().load(applied).catch(() => {
      // Đang có giỏ cũ trên màn thì giữ nguyên và báo nhẹ; chưa có gì thì hiện khối lỗi.
      if (useCartStore.getState().cart) toast.error('Không cập nhật được giỏ hàng');
      else setLoadError(true);
    });
  useEffect(() => { load(); }, [applied]); // eslint-disable-line react-hooks/exhaustive-deps

  const ids = cart?.items.map((i) => i.course.id).join(',') ?? '';
  // Key mới khi giỏ / mã đổi hoặc gặp lỗi nghiệp vụ, để BE không trả lại phiên Stripe cũ.
  const idemKey = useMemo(() => crypto.randomUUID(), [ids, applied, errorNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(item: CartItem) {
    try {
      await useCartStore.getState().remove(item.course.id);
    } catch {
      toast.error(`Không xoá được “${item.course.title}”`);
    }
  }

  async function pay() {
    setPaying(true);
    try {
      // Chỉ gửi mã khi đang được áp; mã báo lỗi mà vẫn gửi thì BE trả COUPON_UNAVAILABLE.
      const { url } = await startCheckout(idemKey, { couponCode: applied && !cart?.couponError ? applied : undefined });
      window.location.assign(url);
    } catch (e) {
      const s = (e as { response?: { status?: number } }).response?.status;
      if (s && s >= 400 && s < 500) { setErrorNonce((n) => n + 1); useCartStore.getState().refresh().catch(() => {}); }
      toast.error(apiMessage(e));
      setPaying(false);
    }
  }

  if (!cart && !loadError) return <CartSkeleton />;

  const count = cart?.items.length ?? 0;
  const payLabel = paying ? <><Loader2 className="animate-spin" aria-hidden /> Đang chuyển tới Stripe…</> : 'Thanh toán';

  return (
    <div className={cn('mx-auto max-w-screen-xl px-4 py-8 lg:py-10', count > 0 && 'pb-28')}>
      <h1 className="text-2xl font-bold text-foreground">Giỏ hàng</h1>
      {count > 0 && <p className="mt-1 text-sm text-muted-foreground">{count} khoá học đang chờ thanh toán</p>}

      {!cart ? (
        <div role="alert" className="mt-6 flex flex-col items-start gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
          <CircleAlert className="size-5 shrink-0 text-destructive" aria-hidden />
          <p className="flex-1 text-sm text-foreground">Không tải được giỏ hàng. Kiểm tra kết nối mạng rồi thử lại.</p>
          <Button variant="outline" onClick={() => { setLoadError(false); load(); }}>
            <RotateCw aria-hidden /> Thử lại
          </Button>
        </div>
      ) : count === 0 ? (
        <EmptyCart />
      ) : (
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <ul className="divide-y rounded-xl border bg-card" aria-label="Khoá học trong giỏ">
            {cart.items.map((item) => (
              <CartRow key={item.course.id} item={item} coupon={applied} onRemove={() => remove(item)} />
            ))}
          </ul>

          <aside className="lg:sticky lg:top-24">
            <section aria-labelledby="cart-summary" aria-busy={loading} className="rounded-xl border bg-card p-5 sm:p-6">
              <h2 id="cart-summary" className="text-lg font-semibold text-foreground">Tóm tắt đơn hàng</h2>

              <dl className={cn('mt-4 space-y-2.5 text-sm tabular-nums transition-opacity', loading && 'opacity-60')}>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Giá gốc ({count} khoá)</dt>
                  <dd className="text-foreground">{formatVnd(cart.summary.subtotal)}</dd>
                </div>
                {cart.summary.discount > 0 && (
                  <div className="flex justify-between gap-4 text-green-700 dark:text-green-400">
                    <dt>Giảm giá ({Math.round((cart.summary.discount / cart.summary.subtotal) * 100)}%)</dt>
                    <dd>−{formatVnd(cart.summary.discount)}</dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4 border-t pt-3">
                  <dt className="font-semibold text-foreground">Tổng cộng</dt>
                  <dd className="text-2xl font-bold text-foreground">{formatVnd(cart.summary.total)}</dd>
                </div>
              </dl>

              <form
                className="mt-5"
                onSubmit={(e) => { e.preventDefault(); setApplied(code.trim().toUpperCase()); }}
              >
                <label htmlFor="coupon-code" className="text-sm font-medium text-foreground">Mã giảm giá</label>
                <div className="mt-2 flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                    <Input
                      id="coupon-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Nhập mã"
                      autoComplete="off"
                      aria-describedby="coupon-status"
                      aria-invalid={Boolean(applied && cart.couponError && !loading)}
                      className="h-10 pl-9 uppercase placeholder:normal-case"
                    />
                  </div>
                  <Button type="submit" variant="outline" className="h-10" disabled={!code.trim() || loading}>
                    Áp dụng
                  </Button>
                </div>
                <div id="coupon-status" aria-live="polite" className="text-sm">
                  {applied && !loading && (
                    <div className="mt-2 flex items-start justify-between gap-2">
                      {cart.couponError ? (
                        <p className="flex items-start gap-1.5 text-destructive">
                          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {cart.couponError}
                        </p>
                      ) : (
                        <p className="text-green-700 dark:text-green-400">
                          Đã áp mã <span className="font-semibold">{applied}</span>
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="-my-1 shrink-0 text-muted-foreground"
                        onClick={() => { setCode(''); setApplied(''); }}
                        aria-label={`Gỡ mã ${applied}`}
                      >
                        <X aria-hidden />
                      </Button>
                    </div>
                  )}
                </div>
              </form>

              <Button
                variant="accent"
                size="lg"
                className="mt-5 h-12 w-full text-base"
                disabled={paying || loading}
                aria-busy={paying}
                onClick={pay}
              >
                {payLabel}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5" aria-hidden /> Thanh toán bảo mật qua Stripe
              </p>
            </section>
          </aside>

          {/* Mobile: tóm tắt nằm dưới cả danh sách → giữ tổng tiền và nút thanh toán dính đáy màn hình */}
          <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t bg-card px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Tổng cộng ({count} khoá)</p>
              <p className={cn('text-lg font-bold text-foreground tabular-nums', loading && 'opacity-60')}>{formatVnd(cart.summary.total)}</p>
            </div>
            <Button variant="accent" size="lg" className="h-11" disabled={paying || loading} aria-busy={paying} onClick={pay}>
              {payLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CartRow({ item, coupon, onRemove }: { item: CartItem; coupon: string; onRemove: () => void }) {
  const { course, listPrice, finalPrice, couponApplied } = item;
  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link
        href={`/course/${course.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative flex aspect-video w-28 shrink-0 self-start items-center justify-center overflow-hidden rounded-lg bg-foreground/5 sm:w-40"
      >
        {course.thumbnailUrl ? (
          <Image src={course.thumbnailUrl} alt="" fill sizes="160px" unoptimized className="object-cover" />
        ) : (
          <BookOpen className="size-6 text-muted-foreground" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-6">
        <div className="min-w-0 flex-1">
          <Link
            href={`/course/${course.slug}`}
            className="line-clamp-2 leading-snug font-semibold text-foreground transition-colors hover:text-primary"
          >
            {course.title}
          </Link>
          <p className="mt-1 truncate text-sm text-muted-foreground">{course.instructorName}</p>
          {couponApplied && coupon && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-300">
              <Tag className="size-3" aria-hidden /> {coupon}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-between">
          <p className="tabular-nums sm:text-right">
            <span className="block font-bold text-foreground">{formatVnd(finalPrice)}</span>
            {finalPrice < listPrice && (
              <span className="text-sm text-muted-foreground line-through">{formatVnd(listPrice)}</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 h-9 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Xoá ${course.title} khỏi giỏ`}
          >
            <Trash2 aria-hidden /> Xoá
          </Button>
        </div>
      </div>
    </li>
  );
}

function EmptyCart() {
  return (
    <section className="mt-6 flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-foreground/5">
        <ShoppingCart className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">Giỏ hàng đang trống</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Thêm những khoá bạn muốn học vào giỏ để thanh toán một lần cho tất cả.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/courses" className={buttonVariants({ size: 'lg' })}>Khám phá khoá học</Link>
        <Link href="/my-learning" className={buttonVariants({ variant: 'outline', size: 'lg' })}>Học tập của tôi</Link>
      </div>
    </section>
  );
}
