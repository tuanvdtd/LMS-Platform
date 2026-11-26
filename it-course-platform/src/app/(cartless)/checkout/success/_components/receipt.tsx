'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, CreditCard, Gauge, Loader2, PlayCircle, ReceiptText, Wallet } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SessionOrder } from '@/types/checkout';
import { formatVnd } from '@/types/revenue';

const StampLumi = dynamic(() => import('./stamp-lumi').then((m) => m.StampLumi), { ssr: false });

// Khớp artboard Stamp (rive/stamp.mjs): khung 300×250, mép vé ở y=200, dấu chạm vé tại STAMP_HIT ở khung 32
const ART = { w: 300, h: 250, edge: 200, hitX: 166, hitY: 231, hitMs: 533 };
const LUMI_W = 270;
const k = LUMI_W / ART.w;
const LUMI_ABOVE = ART.edge * k;
const dateFmt = new Intl.DateTimeFormat('vi-VN');

function Perforation() {
  return (
    <div className="relative border-t border-dashed">
      <span className="absolute top-0 left-0 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-muted" />
      <span className="absolute top-0 right-0 size-5 translate-x-1/2 -translate-y-1/2 rounded-full border bg-muted" />
    </div>
  );
}

function StampMark({ date }: { date: string }) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-150 duration-200 fill-mode-both motion-reduce:animate-none"
      style={{ left: ART.hitX * k, top: ART.hitY * k, animationDelay: `${ART.hitMs}ms` }}
    >
      <div className="-rotate-[8deg] rounded-lg border-[3px] border-success bg-card/80 px-3 py-1 text-center text-success">
        <span className="block text-sm font-extrabold tracking-wide whitespace-nowrap uppercase">Đã thanh toán</span>
        <span className="block font-mono text-[11px]">{date}</span>
      </div>
    </div>
  );
}

function Ticket({ order }: { order: SessionOrder | null }) {
  const paid = order?.status === 'paid';
  const date = dateFmt.format(order?.paidAt ? new Date(order.paidAt) : new Date());
  const Method = order?.provider === 'vnpay' ? Wallet : CreditCard;
  const first = order?.items[0]?.course;
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute right-3 z-10" style={{ top: -LUMI_ABOVE, width: LUMI_W, height: ART.h * k }}>
        {paid && <StampMark date={date} />}
        <StampLumi paid={paid} className="absolute inset-0" />
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm max-sm:pt-16 sm:px-6 sm:pr-48">
          {order ? <span className="font-mono font-medium">Đơn #{order.id.slice(-8).toUpperCase()}</span> : <Skeleton className="h-4 w-28" />}
          <span className="text-muted-foreground">{date}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Method className="size-4" />
            {order?.provider === 'vnpay' ? 'VNPay' : 'Thẻ · Stripe'}
          </span>
        </div>
        <Perforation />
        <ul className="divide-y px-5 sm:px-6">
          {order
            ? order.items.map((it) => (
                <li key={it.course.slug} className="flex items-center gap-4 py-3">
                  <div className="relative flex aspect-video w-16 shrink-0 items-center justify-center overflow-hidden rounded-md cover-placeholder sm:w-24">
                    {it.course.thumbnailUrl ? (
                      <Image src={it.course.thumbnailUrl} alt="" fill unoptimized sizes="96px" className="object-cover" />
                    ) : (
                      <BookOpen className="size-5 text-primary/70" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    {paid ? (
                      <Link href={`/learn/${it.course.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                        {it.course.title}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-sm font-semibold">{it.course.title}</p>
                    )}
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{it.course.instructor.name}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm tabular-nums">
                    <p className="font-semibold">{formatVnd(it.unitPriceAmount)}</p>
                    {it.unitPriceAmount < it.listPriceAmount && <p className="text-xs text-muted-foreground line-through">{formatVnd(it.listPriceAmount)}</p>}
                  </div>
                </li>
              ))
            : [0, 1].map((i) => (
                <li key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="aspect-video w-16 rounded-md sm:w-24" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </li>
              ))}
        </ul>
        <Perforation />
        <div className="flex items-baseline justify-between gap-4 px-5 py-3 sm:px-6">
          <span className="text-sm text-muted-foreground">
            Tổng thanh toán{order && order.discountAmount > 0 && <> · đã giảm {formatVnd(order.discountAmount)}</>}
          </span>
          {order ? <span className="text-xl font-extrabold tabular-nums">{formatVnd(order.totalAmount)}</span> : <Skeleton className="h-6 w-28" />}
        </div>
        <Perforation />
        <div className="flex flex-col gap-3 bg-primary-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {paid ? (
            <>
              <Link href={first ? `/learn/${first.slug}` : '/my-learning'} className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}>
                <PlayCircle />
                Vào học ngay
              </Link>
              <div className="flex gap-2 max-sm:grid max-sm:grid-cols-2">
                <Link href="/skills" className={buttonVariants({ variant: 'outline', className: 'max-sm:w-full' })}>
                  <Gauge />
                  Đo kỹ năng
                </Link>
                <Link href="/orders" className={buttonVariants({ variant: 'outline', className: 'max-sm:w-full' })}>
                  <ReceiptText />
                  Đơn hàng
                </Link>
              </div>
            </>
          ) : (
            <p className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
              Đang chờ {order?.provider === 'vnpay' ? 'VNPay' : 'Stripe'} xác nhận giao dịch…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Heading({ order }: { order: SessionOrder | null }) {
  const paid = order?.status === 'paid';
  return (
    <div aria-live="polite">
      <h1 className="text-2xl font-extrabold text-balance">{paid ? 'Thanh toán thành công' : 'Đang xác nhận thanh toán…'}</h1>
      <p className="mt-2 text-base text-muted-foreground">
        {paid ? 'Đơn hàng đã được xác nhận. Bạn có thể vào học ngay.' : 'Thường chỉ mất vài giây, bạn đừng đóng trang.'}
      </p>
    </div>
  );
}

// Hàng tiêu đề nằm ngay trên mép vé, chừa bên phải cho Lumi (phần trống phía trên khung Lumi nhô vào lề trên);
// trên mobile tiêu đề lên trên, Lumi xuống hàng riêng
function HeadRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-end pb-5 max-sm:pb-[calc(var(--lumi)+0.5rem)] sm:min-h-[var(--row)] sm:pr-[17.5rem]" style={{ ['--lumi' as string]: `${LUMI_ABOVE}px`, ['--row' as string]: `${LUMI_ABOVE - 56}px` }}>
      {children}
    </div>
  );
}

export function Receipt({ order }: { order: SessionOrder | null }) {
  return (
    <section className="min-h-page bg-muted px-4 pt-6 pb-12 sm:pt-8">
      <div className="mx-auto max-w-2xl">
        <HeadRow>
          <Heading order={order} />
        </HeadRow>
        <Ticket order={order} />
      </div>
    </section>
  );
}
