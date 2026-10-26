'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CircleAlert, CircleCheck, CreditCard, Receipt, RotateCw, Tag, Wallet } from 'lucide-react';
import { OrdersSkeleton } from '@/components/skeletons/orders-skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { getMyOrders } from '@/lib/api/checkout';
import type { MyOrder } from '@/types/checkout';
import { formatVnd } from '@/types/revenue';

const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });

export function OrdersView() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    getMyOrders().then(
      (o) => { setOrders(o); setError(false); },
      () => setError(true),
    );
  }, [nonce]);

  if (!orders && !error) return <OrdersSkeleton />;

  const spent = orders?.reduce((s, o) => s + o.totalAmount, 0) ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:py-10">
      <h1 className="text-2xl font-bold text-foreground">Lịch sử mua hàng</h1>
      {orders && orders.length > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} đơn hàng · đã thanh toán <span className="font-semibold text-foreground tabular-nums">{formatVnd(spent)}</span>
        </p>
      )}

      {!orders ? (
        <div role="alert" className="mt-6 flex flex-col items-start gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
          <CircleAlert className="size-5 shrink-0 text-destructive" aria-hidden />
          <p className="flex-1 text-sm text-foreground">Không tải được lịch sử mua hàng. Kiểm tra kết nối mạng rồi thử lại.</p>
          <Button variant="outline" onClick={() => { setError(false); setNonce((n) => n + 1); }}>
            <RotateCw aria-hidden /> Thử lại
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <section className="mt-6 flex flex-col items-center rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-foreground/5">
            <Receipt className="size-6 text-muted-foreground" aria-hidden />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-foreground">Bạn chưa mua khoá học nào</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Đơn hàng và hoá đơn của bạn sẽ xuất hiện ở đây sau khi thanh toán thành công.
          </p>
          <Link href="/courses" className={buttonVariants({ size: 'lg', className: 'mt-6' })}>Khám phá khoá học</Link>
        </section>
      ) : (
        <ol className="mt-6 space-y-6" aria-label="Danh sách đơn hàng">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </ol>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: MyOrder }) {
  const paidAt = new Date(order.paidAt);
  const Method = order.provider === 'vnpay' ? Wallet : CreditCard;
  return (
    <li className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b bg-foreground/[0.03] px-4 py-3 sm:px-5">
        <time dateTime={order.paidAt} className="text-sm font-semibold text-foreground">
          {dateFmt.format(paidAt)}
          <span className="ml-1.5 font-normal text-muted-foreground">{timeFmt.format(paidAt)}</span>
        </time>
        <span className="text-sm text-muted-foreground">
          Mã đơn <span className="font-mono text-foreground">#{order.id.slice(0, 8)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Method className="size-4" aria-hidden />
          {order.provider === 'vnpay' ? 'VNPay' : 'Thẻ · Stripe'}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-green-800 dark:bg-green-950 dark:text-green-300">
          <CircleCheck className="size-3.5" aria-hidden /> Đã thanh toán
        </span>
      </header>

      <ul className="divide-y">
        {order.items.map((it) => (
          <li key={it.course.id} className="flex gap-4 px-4 py-4 sm:px-5">
            <Link
              href={`/course/${it.course.slug}`}
              tabIndex={-1}
              aria-hidden
              className="relative flex aspect-video w-20 shrink-0 self-start items-center justify-center overflow-hidden rounded-md bg-foreground/5 sm:w-28"
            >
              {it.course.thumbnailUrl ? (
                <Image src={it.course.thumbnailUrl} alt="" fill sizes="112px" unoptimized className="object-cover" />
              ) : (
                <BookOpen className="size-5 text-muted-foreground" />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-6">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/course/${it.course.slug}`}
                  className="line-clamp-2 leading-snug font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {it.course.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {it.coupon && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <Tag className="size-3" aria-hidden /> {it.coupon.code}
                    </span>
                  )}
                  <Link
                    href={`/learn/${it.course.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Vào học <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
              <p className="tabular-nums sm:text-right">
                <span className="font-semibold text-foreground sm:block">{formatVnd(it.unitPriceAmount)}</span>
                {it.unitPriceAmount < it.listPriceAmount && (
                  <span className="ml-2 text-sm text-muted-foreground line-through sm:ml-0">{formatVnd(it.listPriceAmount)}</span>
                )}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="space-y-1.5 border-t px-4 py-4 text-sm tabular-nums sm:px-5">
        {order.discountAmount > 0 && (
          <>
            <div className="flex justify-end gap-6">
              <dt className="text-muted-foreground">Giá gốc</dt>
              <dd className="w-32 text-right text-foreground">{formatVnd(order.subtotalAmount)}</dd>
            </div>
            <div className="flex justify-end gap-6 text-green-700 dark:text-green-400">
              <dt>Giảm giá</dt>
              <dd className="w-32 text-right">−{formatVnd(order.discountAmount)}</dd>
            </div>
          </>
        )}
        <div className="flex items-baseline justify-end gap-6">
          <dt className="font-semibold text-foreground">Tổng thanh toán</dt>
          <dd className="w-32 text-right text-lg font-bold text-foreground">{formatVnd(order.totalAmount)}</dd>
        </div>
      </dl>
    </li>
  );
}
