'use client';

import { useState } from 'react';
import axios from 'axios';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { approveCourse, getApproval, rejectCourse } from '@/lib/api/course-approvals';
import type { AdminApprovalDetail } from '@/types/course-approval';
import { APPROVAL_STATUS_LABEL, formatPrice } from '@/types/instructor-course';

const REASON_MAX = 1000;
const fmt = (d: string) => new Date(d).toLocaleString('vi-VN');

// Cột phải trang duyệt: giá, cam kết, lịch sử, Duyệt / Từ chối.
export function ReviewActions({
  detail,
  onChange,
}: {
  detail: AdminApprovalDetail;
  onChange: (d: AdminApprovalDetail) => void;
}) {
  const { approval, course, history } = detail;
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  async function run(action: () => Promise<AdminApprovalDetail>, done: string) {
    setBusy(true);
    try {
      onChange(await action());
      setConfirmOpen(false);
      setRejectOpen(false);
      toast.success(done);
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      toast.error(data?.message ?? 'Thao tác thất bại, thử lại');
      // 409 ALREADY_REVIEWED: admin khác đã xử lý → tải lại để thấy kết quả.
      if (data?.code === 'ALREADY_REVIEWED') getApproval(approval.id).then(onChange, () => undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex flex-col gap-4 rounded-2xl border bg-card p-5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-muted-foreground">Giá bán</div>
          <div className="font-mono text-lg font-bold">{formatPrice(course.priceAmount)}</div>
        </div>
        <Badge variant={approval.status === 'rejected' ? 'destructive' : approval.status === 'approved' ? 'default' : 'secondary'}>
          {APPROVAL_STATUS_LABEL[approval.status]}
        </Badge>
      </div>

      <Separator />
      <div>
        <div className="text-muted-foreground">Người gửi</div>
        <div className="font-medium">{approval.submittedBy.name}</div>
        <div className="text-xs text-muted-foreground">{approval.submittedBy.email}</div>
        <div className="mt-1 text-xs text-muted-foreground">Gửi lúc {fmt(approval.createdAt)}</div>
      </div>

      <Separator />
      <div>
        <div className="text-muted-foreground">Ghi chú của giảng viên</div>
        <p className="whitespace-pre-line">{approval.copyrightNote ?? 'Không có'}</p>
      </div>

      <Separator />
      {approval.status === 'pending' ? (
        <div className="flex flex-col gap-2">
          <Button disabled={busy} onClick={() => setConfirmOpen(true)}>
            Duyệt &amp; xuất bản
          </Button>
          <Button variant="outline" className="border-destructive/40 text-destructive hover:text-destructive" disabled={busy} onClick={() => setRejectOpen(true)}>
            Từ chối
          </Button>
        </div>
      ) : (
        <div>
          <p>
            Kết quả: <span className="font-medium">{APPROVAL_STATUS_LABEL[approval.status]}</span>
            {approval.reviewedBy && ` bởi ${approval.reviewedBy.name}`}
            {approval.reviewedAt && ` lúc ${fmt(approval.reviewedAt)}`}
          </p>
          {approval.status === 'rejected' && approval.reason && (
            <p className="mt-2 whitespace-pre-line text-destructive">Lý do: {approval.reason}</p>
          )}
        </div>
      )}

      <Separator />
      <div>
        <div className="mb-2 font-semibold">Lịch sử gửi duyệt</div>
        {history.length === 0 ? (
          <p className="text-muted-foreground">Lần gửi đầu tiên</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((h) => (
              <li key={h.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{fmt(h.createdAt)}</span>
                  <Badge variant={h.status === 'rejected' ? 'destructive' : 'secondary'}>{APPROVAL_STATUS_LABEL[h.status]}</Badge>
                </div>
                {h.reason && <p className="whitespace-pre-line text-xs text-muted-foreground">{h.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt &amp; xuất bản khoá học?</AlertDialogTitle>
            <AlertDialogDescription>Khoá sẽ được xuất bản và giá bị khoá vĩnh viễn.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => run(() => approveCourse(approval.id), 'Đã duyệt khoá học')}>
              Duyệt &amp; xuất bản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối khoá học</DialogTitle>
            <DialogDescription>Giảng viên sẽ thấy lý do này để chỉnh sửa và gửi lại.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <Textarea id="reject-reason" value={reason} maxLength={REASON_MAX} rows={5} onChange={(e) => setReason(e.target.value)} />
            <div className="text-right text-xs text-muted-foreground">
              {reason.length}/{REASON_MAX}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setRejectOpen(false)}>
              Huỷ
            </Button>
            <Button variant="destructive" disabled={!reason.trim() || busy} onClick={() => run(() => rejectCourse(approval.id, reason.trim()), 'Đã từ chối')}>
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
