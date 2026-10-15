'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { getMyOrders } from '@/lib/api/checkout';
import type { MyOrder } from '@/types/checkout';
import { formatVnd } from '@/types/revenue';

export function OrdersView() {
  const [orders, setOrders] = useState<MyOrder[] | null>(null);

  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    getMyOrders().then(
      (o) => { setOrders(o); setError(false); },
      () => { setError(true); toast.error('Không tải được đơn hàng'); },
    );
  }, [nonce]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-foreground">Lịch sử đơn hàng</h1>

      {!orders ? (
        <p className="text-muted-foreground">
          {error ? <>Không tải được đơn hàng. <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)}>Thử lại</Button></> : 'Đang tải…'}
        </p>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <ShoppingBag className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden />
          <p className="mb-4 text-muted-foreground">Chưa có đơn hàng</p>
          <Link href="/courses" className={buttonVariants()}>Khám phá khoá học</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="rounded-2xl border bg-card p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">#{o.id.slice(0, 8)}</span>
                <span>{new Date(o.paidAt).toLocaleDateString('vi-VN')}</span>
                <span>{o.provider === 'vnpay' ? 'VNPay' : 'Thẻ (Stripe)'}</span>
              </div>
              <ul className="divide-y">
                {o.items.map((it) => (
                  <li key={it.course.id} className="flex items-start gap-4 py-3">
                    {it.course.thumbnailUrl && (
                      <Image src={it.course.thumbnailUrl} alt="" width={80} height={48} unoptimized className="h-12 w-20 shrink-0 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link href={`/course/${it.course.slug}`} className="text-sm leading-snug font-semibold text-foreground hover:text-primary">
                        {it.course.title}
                      </Link>
                      {it.coupon && (
                        <p className="mt-1">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">{it.coupon.code}</span>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-foreground">{formatVnd(it.unitPriceAmount)}</div>
                      {it.unitPriceAmount < it.listPriceAmount && (
                        <div className="text-xs text-muted-foreground line-through">{formatVnd(it.listPriceAmount)}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t pt-3 text-sm font-bold text-foreground">
                <span>Tổng</span>
                <span>{formatVnd(o.totalAmount)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
