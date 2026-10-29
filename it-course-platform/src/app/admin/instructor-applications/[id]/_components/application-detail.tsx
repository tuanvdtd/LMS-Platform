'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { approveApplication, getApplicationDetail, rejectApplication } from '@/lib/api/instructor-application';
import { type AdminApplicationDetail, REVIEW_STATUS_LABEL } from '@/types/instructor-application';

const REASON_MAX = 500;
const LIST = '/admin/instructor-applications';
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

function Spinner() {
  return <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden />;
}

function BackLink() {
  return (
    <Link href={LIST} className="text-sm text-primary hover:underline">
      ← Danh sách
    </Link>
  );
}

// Trang duyệt đơn: hồ sơ bên trái, thao tác bên phải.
export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<'notFound' | 'failed' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect).
  useEffect(() => {
    let stale = false;
    getApplicationDetail(id).then(
      (d) => {
        if (!stale) setDetail(d);
      },
      (e) => {
        if (!stale) setLoadError(axios.isAxiosError(e) && e.response?.status === 404 ? 'notFound' : 'failed');
      },
    );
    return () => {
      stale = true;
    };
  }, [id, reloadKey]);

  async function run(kind: 'approve' | 'reject', action: () => Promise<AdminApplicationDetail>, done: string) {
    setBusy(kind);
    try {
      setDetail(await action());
      setConfirmOpen(false);
      setRejectOpen(false);
      toast.success(done);
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      toast.error(data?.message ?? 'Thao tác thất bại, thử lại');
      // Admin khác vừa xử lý đơn → đóng hộp thoại và tải lại để thấy kết quả.
      if (data?.code === 'APPLICATION_NOT_PENDING') {
        setConfirmOpen(false);
        setRejectOpen(false);
        getApplicationDetail(id).then(setDetail, () => undefined);
      }
    } finally {
      setBusy(null);
    }
  }

  if (loadError === 'notFound') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Không tìm thấy đơn này.</p>
        <BackLink />
      </div>
    );
  }
  if (loadError === 'failed') {
    return (
      <div className="flex flex-col items-start gap-3" role="alert">
        <p className="text-sm text-muted-foreground">Không tải được đơn.</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setLoadError(null);
            setReloadKey((k) => k + 1);
          }}
        >
          Thử lại
        </Button>
        <BackLink />
      </div>
    );
  }
  if (!detail) return <DetailSkeleton />;

  const { user } = detail;
  const links = [
    ['Website', detail.website],
    ['LinkedIn', detail.socials.linkedin],
    ['GitHub', detail.socials.github],
  ].filter((l): l is [string, string] => !!l[1]);

  return (
    <div className="space-y-4">
      <BackLink />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {/* Ảnh hồ sơ là một bước của đơn → bấm để xem ảnh gốc khi duyệt. */}
            {user.image ? (
              <a
                href={user.image}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xem ảnh hồ sơ cỡ gốc (mở tab mới)"
                className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Avatar className="size-24">
                  <AvatarImage src={user.image} alt="" />
                  <AvatarFallback className="text-lg">{user.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </a>
            ) : (
              <Avatar className="size-24 shrink-0">
                <AvatarFallback className="text-lg">{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold break-words">{user.name}</h1>
              {detail.headline && <p className="text-sm text-muted-foreground">{detail.headline}</p>}
            </div>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="min-w-0">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium [overflow-wrap:anywhere]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ngày tạo tài khoản</dt>
              <dd className="font-medium">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Khoá học đã tạo</dt>
              <dd className="font-medium">{detail.courseCount}</dd>
            </div>
          </dl>

          <Separator />
          <div>
            <h2 className="mb-2 text-sm font-semibold">Giới thiệu</h2>
            <p className="whitespace-pre-line break-words text-sm">{detail.bio ?? '—'}</p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Liên kết</h2>
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có</p>
            ) : (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                {links.map(([label, url]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="break-all">
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {url}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold">Tài khoản nhận tiền</h2>
            {detail.bankAccountNoMasked ? (
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Chủ tài khoản</dt>
                <dd>{detail.bankAccountName}</dd>
                <dt className="text-muted-foreground">Số tài khoản</dt>
                <dd className="font-mono">{detail.bankAccountNoMasked}</dd>
                <dt className="text-muted-foreground">Mã ngân hàng (BIN)</dt>
                <dd className="font-mono">{detail.bankBin}</dd>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                {detail.status === 'approved' ? 'Đã chuyển sang hồ sơ giảng viên' : 'Chưa có'}
              </p>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-4 self-start rounded-2xl border bg-card p-5 text-sm lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trạng thái</span>
            <Badge variant={detail.status === 'rejected' ? 'destructive' : detail.status === 'approved' ? 'default' : 'secondary'}>
              {REVIEW_STATUS_LABEL[detail.status]}
            </Badge>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Nộp lúc</dt>
            <dd>{fmt(detail.submittedAt)}</dd>
            <dt className="text-muted-foreground">Đồng ý điều khoản</dt>
            <dd>{fmt(detail.termsAcceptedAt)}</dd>
          </dl>
          <Separator />
          {detail.status === 'pending' ? (
            <div className="flex flex-col gap-2">
              <Button disabled={!!busy} onClick={() => setConfirmOpen(true)}>
                Duyệt
              </Button>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:text-destructive"
                disabled={!!busy}
                onClick={() => setRejectOpen(true)}
              >
                Từ chối
              </Button>
            </div>
          ) : (
            <div>
              <p>
                Kết quả: <span className="font-medium">{REVIEW_STATUS_LABEL[detail.status]}</span>
                {detail.reviewedBy && ` bởi ${detail.reviewedBy.name}`}
                {detail.reviewedAt && ` lúc ${fmt(detail.reviewedAt)}`}
              </p>
              {detail.status === 'rejected' && detail.rejectReason && (
                <p className="mt-2 whitespace-pre-line break-words text-destructive">Lý do: {detail.rejectReason}</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt {user.name} làm giảng viên cao cấp?</AlertDialogTitle>
            <AlertDialogDescription>
              Giảng viên sẽ đặt được giá trả phí cho khoá học và nhận doanh thu hằng tháng từ SkillPath.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busy}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={!!busy} onClick={() => run('approve', () => approveApplication(detail.id), 'Đã duyệt đơn')}>
              {busy === 'approve' && <Spinner />}
              Duyệt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Không đóng khi bấm ra ngoài: tránh lỡ tay đóng giữa lúc đang gõ lý do. */}
      <Dialog open={rejectOpen} onOpenChange={(o) => !busy && setRejectOpen(o)} disablePointerDismissal>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đơn</DialogTitle>
            <DialogDescription>Giảng viên sẽ thấy lý do này để sửa đơn và gửi lại.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Lý do từ chối</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              maxLength={REASON_MAX}
              rows={5}
              aria-describedby="reject-reason-count"
              onChange={(e) => setReason(e.target.value)}
            />
            <div id="reject-reason-count" className="text-right text-xs text-muted-foreground">
              {reason.length}/{REASON_MAX}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={!!busy} onClick={() => setRejectOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || !!busy}
              onClick={() => run('reject', () => rejectApplication(detail.id, reason.trim()), 'Đã từ chối đơn')}
            >
              {busy === 'reject' && <Spinner />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Khung chờ cùng hình với trang: hồ sơ bên trái, cột thao tác bên phải.
function DetailSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-4 w-24" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 rounded-2xl border bg-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="space-y-3 self-start rounded-2xl border bg-card p-5">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
