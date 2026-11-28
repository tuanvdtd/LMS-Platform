'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CircleX, Loader2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { getOrderBySession } from '@/lib/api/checkout';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/utils';
import type { SessionOrder } from '@/types/checkout';
import { Receipt } from './receipt';

const MAX_TRIES = 10;
const INTERVAL_MS = 2_000;

// Webhook có thể tới sau khi Stripe redirect về → gọi lại tối đa ~20s. BE tự hỏi Stripe nên thường xong ngay.
export function SuccessView() {
  const sessionId = useSearchParams().get('session_id');
  const [order, setOrder] = useState<SessionOrder | null>(null);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let tries = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const retry = () => {
      if (++tries < MAX_TRIES) timer = setTimeout(tick, INTERVAL_MS);
      else setGaveUp(true);
    };
    const tick = () =>
      getOrderBySession(sessionId).then(
        (o) => {
          if (cancelled) return;
          setOrder(o);
          if (o.status === 'pending') retry();
          // Thanh toán xong BE đã xoá các khoá khỏi giỏ, badge trên header phải tải lại
          if (o.status === 'paid') useCartStore.getState().refresh().catch(() => {});
        },
        () => { if (!cancelled) retry(); }, // lỗi mạng/tạm thời ≠ thanh toán thất bại
      );
    tick();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sessionId]);

  if (!sessionId || order?.status === 'failed') {
    return (
      <Notice icon={<CircleX className="size-8" />} tone="text-destructive bg-destructive/10" title="Thanh toán không thành công">
        <p className="mb-8 text-muted-foreground">Giao dịch chưa hoàn tất. Bạn có thể thử thanh toán lại từ giỏ hàng.</p>
        <Link href="/cart" className={buttonVariants({ size: 'lg' })}>Về giỏ hàng</Link>
      </Notice>
    );
  }
  if (gaveUp && order?.status !== 'paid') {
    return (
      <Notice icon={<Loader2 className="size-8" />} tone="text-primary bg-primary/10" title="Đang xử lý thanh toán">
        <p className="mb-8 text-muted-foreground">Hệ thống chưa nhận được xác nhận. Kiểm tra lại ở Đơn hàng sau ít phút.</p>
        <Link href="/orders" className={buttonVariants({ size: 'lg' })}>Xem đơn hàng</Link>
      </Notice>
    );
  }

  return <Receipt order={order} />;
}

function Notice({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className={cn('mb-6 flex size-16 items-center justify-center rounded-full', tone)}>{icon}</div>
      <h1 className="mb-3 text-2xl font-extrabold text-foreground">{title}</h1>
      {children}
    </div>
  );
}
