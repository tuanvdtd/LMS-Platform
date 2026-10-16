'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiMessage, getCart, removeFromCart, startCheckout } from '@/lib/api/checkout';
import type { Cart } from '@/types/checkout';
import { formatVnd } from '@/types/revenue';

// Giỏ thật (spec stripe-checkout §10). Mã coupon giữ ở state/URL, không lưu DB (P5).
export default function CartView() {
  const initialCode = useSearchParams().get('couponCode')?.toUpperCase() ?? '';
  const [cart, setCart] = useState<Cart | null>(null);
  const [code, setCode] = useState(initialCode);
  const [applied, setApplied] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [errorNonce, setErrorNonce] = useState(0);

  const [loadError, setLoadError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const load = () => setReloadNonce((n) => n + 1);
  useEffect(() => {
    let cancelled = false; // bỏ qua phản hồi cũ khi đổi mã / tải lại liên tiếp
    getCart(applied || undefined).then(
      (c) => { if (!cancelled) { setCart(c); setLoadError(false); } },
      () => { if (!cancelled) { setLoadError(true); toast.error('Không tải được giỏ hàng'); } },
    );
    return () => { cancelled = true; };
  }, [applied, reloadNonce]);

  const ids = cart?.items.map((i) => i.course.id).join(',') ?? '';
  // Key mới khi giỏ / mã đổi hoặc gặp lỗi nghiệp vụ (spec §7).
  const idemKey = useMemo(() => crypto.randomUUID(), [ids, applied, errorNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  async function remove(courseId: string) {
    setBusy(true);
    await removeFromCart(courseId).catch(() => toast.error('Không xoá được'));
    setBusy(false);
    load();
  }

  async function pay() {
    setBusy(true);
    try {
      // Chỉ gửi mã khi đang được áp; mã báo lỗi mà vẫn gửi thì BE trả COUPON_UNAVAILABLE.
      const { url } = await startCheckout(idemKey, { couponCode: applied && !cart?.couponError ? applied : undefined });
      window.location.assign(url);
    } catch (e) {
      const s = (e as { response?: { status?: number } }).response?.status;
      if (s && s >= 400 && s < 500) { setErrorNonce((n) => n + 1); load(); }
      toast.error(apiMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!cart) {
    return (
      <div className="mx-auto max-w-screen-lg px-4 py-8 text-muted-foreground">
        {loadError ? (
          <>Không tải được giỏ hàng. <Button variant="outline" size="sm" onClick={load}>Thử lại</Button></>
        ) : 'Đang tải…'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-foreground">Giỏ hàng ({cart.items.length} khoá)</h1>
      {cart.items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="mb-4 text-lg text-muted-foreground">Giỏ hàng trống</p>
          <Link href="/courses" className={buttonVariants()}>Khám phá khoá học</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <ul className="flex-1 space-y-4">
            {cart.items.map(({ course, listPrice, finalPrice }) => (
              <li key={course.id} className="flex gap-4 border-b pb-4">
                {course.thumbnailUrl && (
                  <Image src={course.thumbnailUrl} alt="" width={96} height={64} unoptimized className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/course/${course.slug}`} className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary">
                    {course.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{course.instructorName}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-bold text-foreground">{formatVnd(finalPrice)}</span>
                    {finalPrice < listPrice && <span className="ml-2 text-muted-foreground line-through">{formatVnd(listPrice)}</span>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" disabled={busy} onClick={() => remove(course.id)} aria-label={`Xoá ${course.title} khỏi giỏ`}>
                  <Trash2 className="text-destructive" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>

          <aside className="shrink-0 lg:w-80">
            <div className="sticky top-20 rounded-2xl border bg-card p-5">
              <h2 className="mb-4 font-bold text-foreground">Tóm tắt đơn đặt hàng</h2>
              <dl className="mb-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Giá gốc</dt><dd>{formatVnd(cart.summary.subtotal)}</dd></div>
                {cart.summary.discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <dt>Chiết khấu (Giảm giá {Math.round((cart.summary.discount / cart.summary.subtotal) * 100)}%)</dt>
                    <dd>-{formatVnd(cart.summary.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <dt>Tổng tiền ({cart.items.length} khoá học)</dt><dd>{formatVnd(cart.summary.total)}</dd>
                </div>
              </dl>
              <form className="mb-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(code.trim().toUpperCase()); }}>
                <div className="relative flex-1">
                  <Tag className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Mã giảm giá" className="pl-7" aria-label="Mã giảm giá" />
                </div>
                <Button type="submit" variant="secondary" size="sm">Áp dụng</Button>
              </form>
              {applied && cart.couponError && <p className="mb-3 text-xs text-destructive">{cart.couponError}</p>}
              {applied && (
                <p className="mb-3 text-xs text-primary">
                  {!cart.couponError && <>Đã áp mã {applied}{' '}</>}
                  <button type="button" className="underline" onClick={() => { setCode(''); setApplied(''); }}>Gỡ</button>
                </p>
              )}
              <Button size="lg" className="w-full" disabled={busy} onClick={pay}>
                {busy ? 'Đang chuyển tới Stripe…' : `Thanh toán ${formatVnd(cart.summary.total)}`}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
