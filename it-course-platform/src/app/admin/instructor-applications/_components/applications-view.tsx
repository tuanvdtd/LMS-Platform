'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { listApplications } from '@/lib/api/instructor-application';
import { cn } from '@/lib/utils';
import type { AdminApplicationRow } from '@/types/instructor-application';
import { HEAD, PageHeader, QueueFooter, QueueMessage, QueueTabs, ROW, useQueue } from '../../_components/queue';
import { fmtDate, WaitingChip } from '../../_components/review-ui';

// Cột: người nộp · chức danh · thời điểm · mũi tên.
const COLS = 'md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_8.5rem_1rem]';

const EMPTY = {
  pending: { title: 'Không có đơn chờ duyệt', text: 'Đơn đăng ký giảng viên cao cấp sẽ hiện ở đây, đơn chờ lâu nhất ở trên cùng.' },
  approved: { title: 'Chưa duyệt đơn nào', text: 'Giảng viên đã được duyệt sẽ hiện ở đây.' },
  rejected: { title: 'Chưa từ chối đơn nào', text: 'Đơn bị từ chối kèm lý do sẽ hiện ở đây.' },
};

export function ApplicationsView() {
  const q = useQueue(listApplications);
  const { status, data } = q;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Duyệt giảng viên cao cấp"
        description="Giảng viên được duyệt sẽ đặt được giá trả phí cho khoá học và nhận doanh thu hằng tháng. Kiểm tra hồ sơ chuyên môn và tài khoản nhận tiền trước khi duyệt."
      />

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto border-b px-1 [scrollbar-width:none] sm:px-3">
          <QueueTabs value={status} counts={q.counts} onChange={q.changeStatus} />
        </div>

        {q.failed ? (
          <QueueMessage kind="error" title="Không tải được danh sách đơn" text="Kiểm tra kết nối rồi thử lại." onRetry={q.retry} />
        ) : !data ? (
          <RowsSkeleton />
        ) : data.items.length === 0 ? (
          <QueueMessage kind="empty" {...EMPTY[status]} />
        ) : (
          <>
            <div className={cn(HEAD, COLS)} aria-hidden>
              <span>Người nộp</span>
              <span>Chức danh</span>
              <span>{status === 'pending' ? 'Nộp lúc' : status === 'approved' ? 'Duyệt lúc' : 'Từ chối lúc'}</span>
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

function Row({ row, now }: { row: AdminApplicationRow; now: number }) {
  const pending = row.status === 'pending';
  return (
    <Link href={`/admin/instructor-applications/${row.id}`} className={cn(ROW, COLS)}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10 shrink-0">
          {row.user.image && <AvatarImage src={row.user.image} alt="" />}
          <AvatarFallback>{row.user.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{row.user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      </div>
      {/* sr-only: hàng tiêu đề cột aria-hidden → mỗi ô tự mang nhãn khi đọc tên link. */}
      <p className={cn('min-w-0 truncate text-sm', row.headline ? 'text-foreground' : 'text-muted-foreground')}>
        <span className="sr-only">Chức danh: </span>
        {row.headline ?? 'Chưa ghi chức danh'}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:flex-col md:items-start md:gap-1">
        <span className="tabular-nums">
          <span className="sr-only">{pending ? 'Nộp ngày ' : 'Xử lý ngày '}</span>
          {fmtDate(pending ? row.submittedAt : row.reviewedAt)}
        </span>
        {pending && row.submittedAt && <WaitingChip since={row.submittedAt} now={now} />}
      </div>
      <ChevronRight className="hidden size-4 text-muted-foreground md:block" aria-hidden />
    </Link>
  );
}

function RowsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải danh sách đơn" className="divide-y">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={cn('grid items-center gap-x-5 gap-y-2 px-5 py-3.5', COLS)}>
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <Skeleton className="hidden h-4 w-3/4 md:block" />
          <Skeleton className="hidden h-4 w-20 md:block" />
          <span />
        </div>
      ))}
    </div>
  );
}
