'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Inbox, TriangleAlert } from 'lucide-react';
import { ClientPagination } from '@/components/shared/client-pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Paged } from '@/types/revenue';
import { REVIEW_LABEL, REVIEW_STATUSES, type ReviewStatus } from './review-ui';

type FetchPage<T> = (p: { status: ReviewStatus; page: number }) => Promise<Paged<T>>;

// Trạng thái hàng đợi: tab + trang + dữ liệu + số lượng từng tab. fetchPage phải là hàm module (tham chiếu ổn định).
export function useQueue<T>(fetchPage: FetchPage<T>) {
  const [status, setStatus] = useState<ReviewStatus>('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [counts, setCounts] = useState<Partial<Record<ReviewStatus, number>>>({});
  const [now] = useState(() => Date.now()); // mốc tính "Chờ x ngày", đọc một lần

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); reset ở các handler.
  useEffect(() => {
    let stale = false;
    fetchPage({ status, page }).then(
      (d) => {
        if (stale) return;
        setData(d);
        setCounts((c) => ({ ...c, [status]: d.total }));
      },
      () => {
        if (!stale) setFailed(true);
      },
    );
    return () => {
      stale = true;
    };
  }, [fetchPage, status, page, reload]);

  // Số lượng hai tab còn lại: một lần khi mở trang (tab đang xem tự cập nhật ở trên).
  useEffect(() => {
    let stale = false;
    for (const s of REVIEW_STATUSES.filter((x) => x !== 'pending')) {
      fetchPage({ status: s, page: 1 }).then(
        (d) => {
          if (!stale) setCounts((c) => ({ ...c, [s]: d.total }));
        },
        () => undefined,
      );
    }
    return () => {
      stale = true;
    };
  }, [fetchPage]);

  const reset = () => {
    setData(null);
    setFailed(false);
  };
  return {
    status,
    page,
    data,
    failed,
    counts,
    now,
    changeStatus(s: ReviewStatus) {
      if (s === status) return;
      reset();
      setStatus(s);
      setPage(1);
    },
    changePage(p: number) {
      reset();
      setPage(p);
    },
    retry() {
      reset();
      setReload((n) => n + 1);
    },
  };
}

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-extrabold text-balance text-foreground">{title}</h1>
      <p className="max-w-[70ch] text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// Tab trạng thái gạch chân + số lượng. "Chờ duyệt" còn việc → số tô cảnh báo để thấy ngay.
export function QueueTabs({
  value,
  counts,
  onChange,
}: {
  value: ReviewStatus;
  counts: Partial<Record<ReviewStatus, number>>;
  onChange: (s: ReviewStatus) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ReviewStatus)}>
      {/* pb-[5px]: gạch chân (đặt dưới tab 5px) nằm trong TabsList → khung cha cuộn ngang được trên mobile mà không cắt mất gạch. */}
      <TabsList variant="line" aria-label="Lọc theo trạng thái" className="pb-[5px] group-data-horizontal/tabs:h-12">
        {REVIEW_STATUSES.map((s) => {
          const n = counts[s];
          return (
            <TabsTrigger key={s} value={s} className="gap-1.5 px-2 sm:gap-2 sm:px-3">
              {REVIEW_LABEL[s]}
              {n !== undefined && (
                <span
                  className={cn(
                    'min-w-5 rounded-full px-1.5 text-center text-xs font-semibold tabular-nums',
                    s === 'pending' && n > 0 ? 'bg-warning-soft text-warning' : 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {n}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

export function QueueMessage({ kind, title, text, onRetry }: { kind: 'empty' | 'error'; title: string; text: string; onRetry?: () => void }) {
  const Icon = kind === 'empty' ? Inbox : TriangleAlert;
  return (
    <div role={kind === 'error' ? 'alert' : undefined} className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="mb-1 grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      {onRetry && (
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function QueueFooter({ data, page, onPage }: { data: Paged<unknown>; page: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const from = (page - 1) * data.pageSize + 1;
  const to = Math.min(page * data.pageSize, data.total);
  return (
    <div className="flex items-center justify-between gap-3 border-t px-5 py-2.5 text-sm text-muted-foreground">
      <span className="tabular-nums">
        {from}–{to} trên {data.total}
      </span>
      {pages > 1 && <ClientPagination page={page} pageCount={pages} onPageChange={onPage} />}
    </div>
  );
}

// Sau khi ra quyết định: đi thẳng tới mục chờ kế tiếp (khác mục đang xem), khỏi quay về danh sách dò lại.
export function NextPending({
  fetchPage,
  current,
  hrefOf,
}: {
  fetchPage: FetchPage<{ id: string }>;
  current: string;
  hrefOf: (id: string) => string;
}) {
  const [next, setNext] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let stale = false;
    fetchPage({ status: 'pending', page: 1 }).then(
      (d) => {
        if (!stale) setNext(d.items.find((i) => i.id !== current)?.id ?? null);
      },
      () => {
        if (!stale) setNext(null);
      },
    );
    return () => {
      stale = true;
    };
  }, [fetchPage, current]);

  if (next === undefined) return <Skeleton className="h-11 w-full" />;
  if (!next) return <p className="text-center text-xs text-muted-foreground">Hàng đợi đã trống, không còn mục chờ duyệt.</p>;
  return (
    <Link href={hrefOf(next)} className={buttonVariants({ variant: 'outline', className: 'h-11 w-full' })}>
      Sang mục chờ tiếp theo
      <ArrowRight data-icon="inline-end" />
    </Link>
  );
}

// Dòng hàng đợi: cả dòng là link, focus bàn phím có viền trong.
export const ROW = 'grid items-center gap-x-5 gap-y-2 px-5 py-3.5 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset';
// Hàng tiêu đề cột: chỉ desktop, chữ nhỏ.
export const HEAD = 'hidden items-center gap-x-5 border-b bg-muted/40 px-5 py-2 text-xs font-medium text-muted-foreground md:grid';
