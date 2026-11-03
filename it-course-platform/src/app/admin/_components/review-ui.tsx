'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, CircleCheck, CircleX, Clock, Hourglass, Loader2, Plus, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Mảnh giao diện dùng chung cho hai hàng đợi duyệt (khoá học, đơn giảng viên cao cấp).

export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];
export const REVIEW_LABEL: Record<ReviewStatus, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Bị từ chối' };

const TONE = {
  pending: { icon: Hourglass, className: 'bg-warning-soft text-warning' },
  approved: { icon: CircleCheck, className: 'bg-success-soft text-success' },
  rejected: { icon: CircleX, className: 'bg-danger-soft text-danger' },
} as const;

// Màu + icon + chữ (Paired-Signal Rule).
export function ReviewStatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  const { icon: Icon, className: tone } = TONE[status];
  return (
    <Badge className={cn('gap-1 font-semibold', tone, className)}>
      <Icon aria-hidden />
      {REVIEW_LABEL[status]}
    </Badge>
  );
}

export const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');
export const fmtDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

// ponytail: ngưỡng "chờ lâu" cố định 3 ngày; đưa vào Cài đặt admin khi cần chỉnh theo SLA.
const OVERDUE_HOURS = 72;

// "Chờ 5 giờ" / "Chờ 3 ngày". now truyền từ ngoài (đọc một lần lúc mở trang) để render thuần.
export function waitingFor(since: string, now: number) {
  const h = Math.max(0, (now - new Date(since).getTime()) / 3_600_000);
  const label = h < 1 ? 'Vừa gửi' : h < 24 ? `Chờ ${Math.floor(h)} giờ` : `Chờ ${Math.floor(h / 24)} ngày`;
  return { label, overdue: h >= OVERDUE_HOURS };
}

export function WaitingChip({ since, now }: { since: string; now: number }) {
  const { label, overdue } = waitingFor(since, now);
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap',
        overdue ? 'bg-warning-soft text-warning' : 'bg-secondary text-secondary-foreground',
      )}
    >
      <Clock className="size-3" aria-hidden />
      {label}
    </span>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2.5 w-fit text-muted-foreground')}>
      <ChevronLeft data-icon="inline-start" />
      {children}
    </Link>
  );
}

// Khối nội dung cấp trang: tiêu đề + phụ chú bên phải, thân có padding. Không lồng Panel trong Panel.
export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border bg-card shadow-sm', className)}>
      {title && (
        <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-5 py-3.5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {meta && <div className="text-xs text-muted-foreground">{meta}</div>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Spinner() {
  return <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />;
}

export type Check = { ok: boolean; label: string };

// Kiểm tra tự động trên chính bài nộp: ✓ đạt / ⚠ cần xem — luôn kèm chữ (Paired-Signal Rule).
export function CheckList({ checks }: { checks: Check[] }) {
  const warns = checks.filter((c) => !c.ok).length;
  return (
    <section aria-labelledby="auto-checks" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 id="auto-checks" className="text-xs font-semibold text-foreground">
          Kiểm tra tự động
        </h3>
        <span className={cn('text-xs font-medium', warns ? 'text-warning' : 'text-success')}>
          {warns ? `${warns} cần xem` : 'Đạt cả'}
        </span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm">
            {c.ok ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Đạt" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-label="Cần xem" />
            )}
            <span className={c.ok ? 'text-muted-foreground' : 'font-medium text-foreground'}>{c.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Hộp từ chối: lý do soạn sẵn bấm để chèn / bấm lần nữa để gỡ (không chèn trùng), vẫn sửa tay được.
// Mở ra focus thẳng vào ô lý do. Không đóng khi bấm ra ngoài: tránh mất lý do đang gõ.
export function RejectDialog({
  open,
  onOpenChange,
  title,
  description,
  presets,
  max,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  presets: string[];
  max: number;
  busy: boolean;
  onConfirm: (reason: string) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  const lines = reason.split('\n').map((l) => l.trim());
  const toggle = (p: string) =>
    setReason((r) => {
      const rows = r.split('\n').filter((l) => l.trim());
      const next = rows.some((l) => l.trim() === p) ? rows.filter((l) => l.trim() !== p) : [...rows, p];
      return next.join('\n').slice(0, max);
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)} disablePointerDismissal>
      <DialogContent className="sm:max-w-lg" initialFocus={inputRef}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p id={`${id}-presets`} className="text-xs font-medium text-muted-foreground">
              Lý do thường gặp
            </p>
            <div role="group" aria-labelledby={`${id}-presets`} className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const on = lines.includes(p);
                return (
                  <Button
                    key={p}
                    type="button"
                    variant={on ? 'secondary' : 'outline'}
                    size="sm"
                    aria-pressed={on}
                    className={cn('h-auto min-h-8 rounded-full py-1 text-left font-normal whitespace-normal', on && 'font-medium')}
                    onClick={() => toggle(p)}
                  >
                    {on ? <Check data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
                    {p}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${id}-reason`}>Lý do từ chối</Label>
            <Textarea
              ref={inputRef}
              id={`${id}-reason`}
              value={reason}
              maxLength={max}
              rows={5}
              aria-describedby={`${id}-count`}
              placeholder="Người gửi sẽ đọc lý do này để sửa và gửi lại."
              onChange={(e) => setReason(e.target.value)}
            />
            <p id={`${id}-count`} className="text-right text-xs text-muted-foreground tabular-nums">
              {reason.length}/{max}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button variant="destructive" disabled={!reason.trim() || busy} onClick={() => onConfirm(reason.trim())}>
            {busy && <Spinner />}
            Xác nhận từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
