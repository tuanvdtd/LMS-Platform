import Link from 'next/link';
import { BadgeCheck, Check, Hourglass } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ApplicationView } from '@/types/instructor-application';
import { ApplicationChecklist } from './application-checklist';

const SHELL = 'mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border bg-card p-6 sm:p-8';

// Đã gửi → đang duyệt → kết quả. Mốc hiện tại tô nổi, mốc sau mờ.
export function PendingScreen({ view }: { view: ApplicationView }) {
  const sent = view.submittedAt ? new Date(view.submittedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : null;
  const steps = [
    { title: 'Đã gửi đơn', sub: sent ?? '', state: 'done' },
    { title: 'Aolumi đang duyệt', sub: 'Khoảng 2 ngày làm việc', state: 'current' },
    { title: 'Nhận kết quả', sub: 'Qua email và thông báo trên Aolumi', state: 'todo' },
  ] as const;
  return (
    <section aria-labelledby="pending-title" className={SHELL}>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Hourglass className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h1 id="pending-title" className="text-2xl font-extrabold text-balance">
            Đơn đang chờ duyệt
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Trong lúc chờ, bạn vẫn tạo và xuất bản khoá miễn phí. Trang này tự cập nhật khi có kết quả.
          </p>
        </div>
      </div>

      <ol className="flex flex-col">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && <span className="absolute top-7 bottom-1 left-3 w-px bg-border" aria-hidden />}
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                s.state === 'done' && 'border-success bg-success text-success-foreground',
                s.state === 'current' && 'border-warning bg-warning-soft',
                s.state === 'todo' && 'border-border bg-background',
              )}
            >
              {s.state === 'done' && <Check className="size-3.5" aria-hidden />}
              {s.state === 'current' && <span className="size-2 rounded-full bg-warning" aria-hidden />}
            </span>
            <div className="flex flex-col">
              <span className={cn('text-sm font-semibold', s.state === 'todo' && 'text-muted-foreground')}>
                {s.title}
                {s.state === 'current' && <span className="sr-only"> (bước hiện tại)</span>}
              </span>
              {s.sub && <span className="text-sm text-muted-foreground">{s.sub}</span>}
            </div>
          </li>
        ))}
      </ol>

      <Separator />
      <div className="flex flex-col gap-4">
        <h2 className="font-bold">Đơn bạn đã gửi</h2>
        <ApplicationChecklist view={view} compact />
      </div>

      <Link href="/instructor/courses" className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
        Về khoá học của tôi
      </Link>
    </section>
  );
}

export function ApprovedScreen({ view }: { view: ApplicationView }) {
  return (
    <section aria-labelledby="approved-title" className={SHELL}>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
          <BadgeCheck className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h1 id="approved-title" className="text-2xl font-extrabold text-balance">
            Bạn là giảng viên cao cấp
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Từ giờ bạn đặt được giá trả phí cho khoá học và nhận {view.revenueSharePct}% doanh thu mỗi lượt bán.
          </p>
        </div>
      </div>
      {view.identity.name && (
        <p className="text-sm text-foreground/85">
          Danh tính đã xác minh: <span className="font-semibold text-foreground">{view.identity.name}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Link href="/instructor/courses" className={buttonVariants()}>
          Đặt giá cho khoá học
        </Link>
        <Link href="/instructor/profile" className={buttonVariants({ variant: 'outline' })}>
          Tài khoản nhận tiền
        </Link>
      </div>
    </section>
  );
}
