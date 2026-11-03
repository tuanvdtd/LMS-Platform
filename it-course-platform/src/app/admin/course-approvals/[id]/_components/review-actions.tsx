'use client';

import { useState } from 'react';
import axios from 'axios';
import { CircleCheck, CircleX, Copyright, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { approveCourse, getApproval, listApprovals, rejectCourse } from '@/lib/api/course-approvals';
import { cn } from '@/lib/utils';
import type { AdminApprovalDetail } from '@/types/course-approval';
import { formatPrice } from '@/types/instructor-course';
import { NextPending } from '../../../_components/queue';
import { type Check, CheckList, fmtDateTime, RejectDialog, ReviewStatusBadge, Spinner } from '../../../_components/review-ui';

const REASON_MAX = 1000;
const PRESETS = [
  'Video hoặc âm thanh chất lượng thấp, khó theo dõi.',
  'Mô tả và mục tiêu khoá học chưa rõ ràng.',
  'Giáo trình còn bài trống hoặc thiếu nội dung.',
  'Nội dung có dấu hiệu vi phạm bản quyền.',
  'Khoá học chưa đúng danh mục đã chọn.',
  'Giá chưa tương xứng với thời lượng và nội dung.',
];

// Bằng chứng đo được từ chính bài nộp, đặt cạnh nút duyệt (giá khoá vĩnh viễn → phải thấy trước khi bấm).
function courseChecks({ course, sections, quizzes }: AdminApprovalDetail): Check[] {
  const items = sections.flatMap((s) => s.items);
  const empty = items.filter((i) => i.type === 'lecture' && !i.video && !i.document).length;
  const videoMin = Math.round(items.reduce((t, i) => t + (i.video ? i.durationSec : 0), 0) / 60);
  const quizList = Object.values(quizzes);
  const emptyQuiz = quizList.filter((q) => q.questions.length === 0).length;
  const checks: Check[] = [
    { ok: !!course.thumbnailUrl, label: course.thumbnailUrl ? 'Có ảnh bìa' : 'Chưa có ảnh bìa' },
    { ok: !!course.category, label: course.category ? 'Đã chọn danh mục' : 'Chưa chọn danh mục' },
    {
      ok: !!course.description && course.learningObjectives.length > 0,
      label: course.description && course.learningObjectives.length > 0 ? 'Có mô tả và mục tiêu' : 'Thiếu mô tả hoặc mục tiêu khoá học',
    },
    { ok: empty === 0, label: empty ? `${empty} bài giảng chưa có nội dung` : `Mọi bài giảng có nội dung · ${videoMin} phút video` },
  ];
  if (quizList.length > 0) checks.push({ ok: emptyQuiz === 0, label: emptyQuiz ? `${emptyQuiz} quiz chưa có câu hỏi` : 'Mọi quiz đều có câu hỏi' });
  return checks;
}

// Cột phải trang duyệt: trạng thái, giá, người gửi, ghi chú bản quyền, kiểm tra tự động, Duyệt / Từ chối.
export function ReviewActions({ detail, onChange }: { detail: AdminApprovalDetail; onChange: (d: AdminApprovalDetail) => void }) {
  const { approval, course } = detail;
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const pending = approval.status === 'pending';
  const checks = courseChecks(detail);
  const warnings = checks.filter((c) => !c.ok).map((c) => c.label);

  async function run(kind: 'approve' | 'reject', action: () => Promise<AdminApprovalDetail>, done: string) {
    setBusy(kind);
    try {
      onChange(await action());
      setConfirmOpen(false);
      setRejectOpen(false);
      toast.success(done);
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      toast.error(data?.message ?? 'Thao tác thất bại, thử lại');
      // 409 ALREADY_REVIEWED: người khác đã xử lý → đóng hộp thoại, tải lại để thấy kết quả.
      if (data?.code === 'ALREADY_REVIEWED') {
        setConfirmOpen(false);
        setRejectOpen(false);
        getApproval(approval.id).then(onChange, () => undefined);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <aside aria-labelledby="decision-heading" className="flex flex-col rounded-xl border bg-card text-sm shadow-sm">
      <header className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
        <h2 id="decision-heading" className="text-base font-semibold text-foreground">
          Quyết định
        </h2>
        <ReviewStatusBadge status={approval.status} />
      </header>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Giá bán</p>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">{formatPrice(course.priceAmount)}</p>
          {pending && course.priceAmount > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" aria-hidden /> Giá bị khoá vĩnh viễn sau khi duyệt.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Copyright className="size-3.5" aria-hidden /> Ghi chú bản quyền của giảng viên
          </p>
          <p className={approval.copyrightNote ? 'whitespace-pre-line text-foreground' : 'text-muted-foreground'}>
            {approval.copyrightNote ?? 'Không có ghi chú.'}
          </p>
        </div>

        {pending && <CheckList checks={checks} />}

        {pending ? (
          <div className="flex flex-col gap-2">
            <Button className="h-11" disabled={!!busy} onClick={() => setConfirmOpen(true)}>
              <CircleCheck data-icon="inline-start" />
              Duyệt &amp; xuất bản
            </Button>
            <Button
              variant="outline"
              className="h-11 border-danger-border text-danger hover:bg-danger-soft hover:text-danger"
              disabled={!!busy}
              onClick={() => setRejectOpen(true)}
            >
              <CircleX data-icon="inline-start" />
              Từ chối
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Outcome detail={detail} />
            <NextPending fetchPage={listApprovals} current={approval.id} hrefOf={(id) => `/admin/course-approvals/${id}`} />
          </div>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt &amp; xuất bản “{course.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Khoá lên catalog ngay và giá {formatPrice(course.priceAmount)} bị khoá vĩnh viễn. Giảng viên nhận thông báo đã duyệt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {warnings.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-warning-border bg-warning-soft p-3 text-sm text-warning">
              <p className="font-semibold">Còn {warnings.length} mục cần xem:</p>
              <ul className="list-disc pl-5">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busy}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={!!busy} onClick={() => run('approve', () => approveCourse(approval.id), 'Đã duyệt và xuất bản khoá học')}>
              {busy === 'approve' && <Spinner />}
              {warnings.length > 0 ? 'Vẫn duyệt & xuất bản' : 'Duyệt & xuất bản'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Từ chối khoá học"
        description="Giảng viên sẽ thấy lý do này để chỉnh sửa khoá và gửi duyệt lại."
        presets={PRESETS}
        max={REASON_MAX}
        busy={busy === 'reject'}
        onConfirm={(reason) => run('reject', () => rejectCourse(approval.id, reason), 'Đã từ chối khoá học')}
      />
    </aside>
  );
}

// Kết quả đã duyệt / từ chối: ai, lúc nào, lý do.
function Outcome({ detail }: { detail: AdminApprovalDetail }) {
  const { approval } = detail;
  const rejected = approval.status === 'rejected';
  return (
    <div className={cn('flex flex-col gap-1.5 rounded-lg border p-3', rejected ? 'border-danger-border bg-danger-soft' : 'border-success-border bg-success-soft')}>
      <p className={cn('flex items-center gap-1.5 font-semibold', rejected ? 'text-danger' : 'text-success')}>
        {rejected ? <CircleX className="size-4" aria-hidden /> : <CircleCheck className="size-4" aria-hidden />}
        {rejected ? 'Đã từ chối' : 'Đã duyệt & xuất bản'}
      </p>
      <p className="text-xs text-foreground">
        {approval.reviewedBy ? `Bởi ${approval.reviewedBy.name}` : 'Người duyệt đã bị xoá'}
        {approval.reviewedAt && ` · ${fmtDateTime(approval.reviewedAt)}`}
      </p>
      {rejected && approval.reason && <p className="whitespace-pre-line text-foreground">{approval.reason}</p>}
    </div>
  );
}
