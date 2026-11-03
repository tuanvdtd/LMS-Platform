'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { listApprovals } from '@/lib/api/course-approvals';
import { cn } from '@/lib/utils';
import type { AdminApprovalRow } from '@/types/course-approval';
import { formatPrice } from '@/types/instructor-course';
import { HEAD, PageHeader, QueueFooter, QueueMessage, QueueTabs, ROW, useQueue } from '../../_components/queue';
import { fmtDate, WaitingChip } from '../../_components/review-ui';

// Cột: khoá (ảnh + tên + danh mục) · giảng viên · giá · thời điểm · mũi tên.
const COLS = 'md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_7rem_8.5rem_1rem]';

const EMPTY = {
  pending: { title: 'Hàng đợi trống', text: 'Không có khoá nào chờ duyệt. Khoá giảng viên gửi sẽ hiện ở đây, khoá chờ lâu nhất ở trên cùng.' },
  approved: { title: 'Chưa duyệt khoá nào', text: 'Khoá đã duyệt và xuất bản sẽ hiện ở đây.' },
  rejected: { title: 'Chưa từ chối khoá nào', text: 'Khoá bị từ chối kèm lý do sẽ hiện ở đây.' },
};

export function ApprovalsView() {
  const q = useQueue(listApprovals);
  const { status, data } = q;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Duyệt khoá học"
        description="Kiểm tra nội dung, giá và cam kết bản quyền trước khi khoá lên catalog. Người gửi và người duyệt không bao giờ là cùng một người."
      />

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto border-b px-1 [scrollbar-width:none] sm:px-3">
          <QueueTabs value={status} counts={q.counts} onChange={q.changeStatus} />
        </div>

        {q.failed ? (
          <QueueMessage kind="error" title="Không tải được hàng đợi" text="Kiểm tra kết nối rồi thử lại." onRetry={q.retry} />
        ) : !data ? (
          <RowsSkeleton />
        ) : data.items.length === 0 ? (
          <QueueMessage kind="empty" {...EMPTY[status]} />
        ) : (
          <>
            <div className={cn(HEAD, COLS)} aria-hidden>
              <span>Khoá học</span>
              <span>Giảng viên</span>
              <span>Giá</span>
              <span>{status === 'pending' ? 'Gửi lúc' : status === 'approved' ? 'Duyệt lúc' : 'Từ chối lúc'}</span>
              <span />
            </div>
            <ul className="divide-y">
              {data.items.map((row) => (
                <li key={row.id}>
                  <Row row={row} now={q.now} />
                </li>
              ))}
            </ul>
            <QueueFooter data={data} page={q.page} onPage={q.changePage} />
          </>
        )}
      </section>
    </div>
  );
}

function Row({ row, now }: { row: AdminApprovalRow; now: number }) {
  const { course } = row;
  const category = course.category ? [course.category.parent?.name, course.category.name].filter(Boolean).join(' › ') : 'Chưa chọn danh mục';
  return (
    <Link href={`/admin/course-approvals/${row.id}`} className={cn(ROW, COLS)}>
      <div className="flex min-w-0 items-center gap-3.5">
        <Thumb src={course.thumbnailUrl} />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-pretty text-foreground">{course.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{category}</p>
        </div>
      </div>
      {/* sr-only: hàng tiêu đề cột aria-hidden → mỗi ô tự mang nhãn khi đọc tên link. */}
      <div className="min-w-0 text-sm">
        <p className="truncate font-medium text-foreground">
          <span className="sr-only">Giảng viên: </span>
          {course.instructor.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{course.instructor.email}</p>
      </div>
      <div className="text-sm">
        <span className="sr-only">Giá: </span>
        {course.priceAmount === 0 ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Miễn phí</span>
        ) : (
          <span className="font-semibold text-foreground tabular-nums">{formatPrice(course.priceAmount)}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:flex-col md:items-start md:gap-1">
        <span className="tabular-nums">
          <span className="sr-only">{row.status === 'pending' ? 'Gửi ngày ' : 'Xử lý ngày '}</span>
          {fmtDate(row.status === 'pending' ? row.createdAt : row.reviewedAt)}
        </span>
        {row.status === 'pending' && <WaitingChip since={row.createdAt} now={now} />}
      </div>
      <ChevronRight className="hidden size-4 text-muted-foreground md:block" aria-hidden />
    </Link>
  );
}

function Thumb({ src }: { src: string | null }) {
  return src ? (
    <Image src={src} alt="" width={112} height={63} unoptimized className="aspect-video w-24 shrink-0 rounded-md border object-cover sm:w-28" />
  ) : (
    <span className="grid aspect-video w-24 shrink-0 place-items-center rounded-md border bg-muted text-muted-foreground sm:w-28">
      <ImageOff className="size-4" aria-hidden />
    </span>
  );
}

function RowsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải hàng đợi" className="divide-y">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn('grid items-center gap-x-5 gap-y-2 px-5 py-3.5', COLS)}>
          <div className="flex items-center gap-3.5">
            <Skeleton className="aspect-video w-24 shrink-0 rounded-md sm:w-28" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="hidden flex-col gap-1.5 md:flex">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="hidden h-4 w-16 md:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
          <span />
        </div>
      ))}
    </div>
  );
}
