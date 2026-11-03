'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { BookOpen, CalendarDays, CircleCheck, CircleX, ExternalLink, Globe, Link2, Mail, TriangleAlert } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { approveApplication, getApplicationDetail, listApplications, rejectApplication } from '@/lib/api/instructor-application';
import { getVietQrBanks } from '@/lib/api/revenue';
import { cn } from '@/lib/utils';
import { type AdminApplicationDetail, BIO_MIN_WORDS, wordCount } from '@/types/instructor-application';
import { NextPending, QueueMessage } from '../../../_components/queue';
import { BackLink, type Check, CheckList, fmtDate, fmtDateTime, Panel, RejectDialog, ReviewStatusBadge, Spinner } from '../../../_components/review-ui';

const REASON_MAX = 500;
const LIST = '/admin/instructor-applications';
const PRESETS = [
  'Phần giới thiệu chưa nêu rõ kinh nghiệm chuyên môn hoặc giảng dạy.',
  'Ảnh hồ sơ chưa rõ mặt hoặc không phù hợp.',
  'Liên kết hồ sơ không truy cập được.',
  'Tên chủ tài khoản ngân hàng không khớp tên hồ sơ.',
  'Chức danh chưa phản ánh đúng chuyên môn.',
];

// So tên không dấu, không phân biệt hoa thường: "Trần Thị Thu Hà" ~ "TRAN THI THU HA".
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

// Trang duyệt đơn: header hồ sơ → chi tiết bên trái, cột Quyết định dính bên phải.
export function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminApplicationDetail | null>(null);
  const [loadError, setLoadError] = useState<'notFound' | 'failed' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [bankNames, setBankNames] = useState<Record<string, string>>({});

  // Tên ngân hàng chỉ để đọc cho dễ; VietQR lỗi thì vẫn hiện BIN.
  useEffect(() => {
    getVietQrBanks().then(
      (banks) => setBankNames(Object.fromEntries(banks.map((b) => [b.bin, b.shortName]))),
      () => undefined,
    );
  }, []);

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

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={LIST}>Hàng đợi duyệt giảng viên</BackLink>
        <div className="rounded-xl border bg-card shadow-sm">
          {loadError === 'notFound' ? (
            <QueueMessage kind="empty" title="Không tìm thấy đơn" text="Đơn không tồn tại hoặc người nộp đã xoá tài khoản." />
          ) : (
            <QueueMessage
              kind="error"
              title="Không tải được đơn"
              text="Kiểm tra kết nối rồi thử lại."
              onRetry={() => {
                setLoadError(null);
                setReloadKey((k) => k + 1);
              }}
            />
          )}
        </div>
      </div>
    );
  }
  if (!detail) return <ApplicationDetailSkeleton />;

  const { user } = detail;
  const pending = detail.status === 'pending';
  const words = detail.bio ? wordCount(detail.bio) : 0;
  const links = [
    { label: 'Website', url: detail.website, icon: Globe },
    { label: 'LinkedIn', url: detail.socials.linkedin, icon: Link2 },
    { label: 'GitHub', url: detail.socials.github, icon: Link2 },
  ].filter((l): l is { label: string; url: string; icon: typeof Globe } => !!l.url);
  const nameMatches = detail.bankAccountName ? plain(detail.bankAccountName) === plain(user.name) : null;
  // Bằng chứng của đơn, đặt cạnh nút duyệt. Tài khoản đã chuyển sang hồ sơ GV sau khi duyệt → chỉ kiểm khi còn chờ.
  const checks: Check[] = [
    { ok: !!user.image, label: user.image ? 'Có ảnh hồ sơ' : 'Chưa có ảnh hồ sơ' },
    { ok: !!detail.headline, label: detail.headline ? 'Có chức danh' : 'Chưa ghi chức danh' },
    { ok: words >= BIO_MIN_WORDS, label: words >= BIO_MIN_WORDS ? `Giới thiệu ${words} từ` : `Giới thiệu chỉ ${words}/${BIO_MIN_WORDS} từ` },
    { ok: links.length > 0, label: links.length ? `${links.length} liên kết hồ sơ` : 'Không có liên kết hồ sơ' },
    {
      ok: nameMatches === true,
      label: nameMatches === null ? 'Chưa có tài khoản nhận tiền' : nameMatches ? 'Tên chủ tài khoản khớp hồ sơ' : 'Tên chủ tài khoản khác tên hồ sơ',
    },
  ];
  const warnings = checks.filter((c) => !c.ok).map((c) => c.label);

  return (
    <div className="flex flex-col gap-5">
      <BackLink href={LIST}>Hàng đợi duyệt giảng viên</BackLink>

      <header className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center">
        {/* Ảnh hồ sơ là một bước của đơn → bấm để xem ảnh gốc khi duyệt. */}
        {user.image ? (
          <a
            href={user.image}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Xem ảnh hồ sơ cỡ gốc (mở tab mới)"
            className="w-fit shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Avatar className="size-24">
              <AvatarImage src={user.image} alt="" />
              <AvatarFallback className="text-xl">{user.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
          </a>
        ) : (
          <Avatar className="size-24 shrink-0">
            <AvatarFallback className="text-xl">{user.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ReviewStatusBadge status={detail.status} />
            {!user.image && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <TriangleAlert className="size-3.5" aria-hidden /> Chưa có ảnh hồ sơ
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-balance break-words text-foreground">{user.name}</h1>
            <p className={detail.headline ? 'text-pretty text-muted-foreground' : 'text-muted-foreground italic'}>
              {detail.headline ?? 'Chưa ghi chức danh'}
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <li className="flex min-w-0 items-center gap-1.5">
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="[overflow-wrap:anywhere] text-foreground">{user.email}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              Tham gia {fmtDate(user.createdAt)}
            </li>
            <li className="flex items-center gap-1.5">
              <BookOpen className="size-4 shrink-0" aria-hidden />
              <span>
                <span className="font-semibold text-foreground tabular-nums">{detail.courseCount}</span> khoá đã tạo
              </span>
            </li>
          </ul>
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel
            title="Giới thiệu"
            meta={
              detail.bio && (
                <span className={cn('inline-flex items-center gap-1 font-medium', words >= BIO_MIN_WORDS ? 'text-success' : 'text-warning')}>
                  {words >= BIO_MIN_WORDS ? <CircleCheck className="size-3.5" aria-hidden /> : <TriangleAlert className="size-3.5" aria-hidden />}
                  {words} từ · tối thiểu {BIO_MIN_WORDS}
                </span>
              )
            }
          >
            {detail.bio ? (
              <p className="max-w-[60ch] text-sm leading-relaxed whitespace-pre-line break-words text-foreground">{detail.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có phần giới thiệu.</p>
            )}
          </Panel>

          <Panel title="Liên kết">
            {links.length === 0 ? (
              <p className="text-sm text-muted-foreground">Người nộp không thêm liên kết nào.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {links.map((l) => (
                  <li key={l.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                      <l.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{l.label}</p>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        <span className="truncate">{l.url}</span>
                        <ExternalLink className="size-3.5 shrink-0" aria-label="(mở tab mới)" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Tài khoản nhận tiền">
            {detail.bankAccountNoMasked ? (
              <div className="flex flex-col gap-4">
                <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Ngân hàng</dt>
                    <dd className="font-medium text-foreground">
                      {bankNames[detail.bankBin ?? ''] ?? 'Không rõ'} <span className="font-mono text-xs text-muted-foreground">BIN {detail.bankBin}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Chủ tài khoản</dt>
                    <dd className="font-medium text-foreground">{detail.bankAccountName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Số tài khoản</dt>
                    <dd className="font-mono font-medium text-foreground">{detail.bankAccountNoMasked}</dd>
                  </div>
                </dl>
                {nameMatches !== null && (
                  <p
                    className={cn(
                      'flex items-start gap-2 rounded-lg border p-3 text-sm',
                      nameMatches ? 'border-success-border bg-success-soft text-success' : 'border-warning-border bg-warning-soft text-warning',
                    )}
                  >
                    {nameMatches ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
                    {nameMatches
                      ? 'Tên chủ tài khoản khớp tên hồ sơ (so không dấu).'
                      : `Tên chủ tài khoản khác tên hồ sơ "${user.name}". Kiểm tra lại trước khi duyệt.`}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {detail.status === 'approved' ? 'Đã chuyển sang hồ sơ giảng viên sau khi duyệt.' : 'Người nộp chưa thêm tài khoản nhận tiền.'}
              </p>
            )}
          </Panel>
        </div>

        {/* Mobile: Quyết định lên trước nội dung. Desktop: cột phải, dính. */}
        <aside aria-labelledby="decision-heading" className="order-first flex flex-col rounded-xl border bg-card text-sm shadow-sm lg:sticky lg:top-20 lg:order-none">
          <header className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
            <h2 id="decision-heading" className="text-base font-semibold text-foreground">
              Quyết định
            </h2>
            <ReviewStatusBadge status={detail.status} />
          </header>
          <div className="flex flex-col gap-5 p-5">
            <p className="text-xs text-muted-foreground tabular-nums">
              Nộp {fmtDateTime(detail.submittedAt)} · đồng ý điều khoản {fmtDateTime(detail.termsAcceptedAt)}
            </p>
            {pending && <CheckList checks={checks} />}

            {pending ? (
              <div className="flex flex-col gap-2">
                <Button className="h-11" disabled={!!busy} onClick={() => setConfirmOpen(true)}>
                  <CircleCheck data-icon="inline-start" />
                  Duyệt giảng viên
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
                <div
                  className={cn(
                    'flex flex-col gap-1.5 rounded-lg border p-3',
                    detail.status === 'rejected' ? 'border-danger-border bg-danger-soft' : 'border-success-border bg-success-soft',
                  )}
                >
                  <p className={cn('flex items-center gap-1.5 font-semibold', detail.status === 'rejected' ? 'text-danger' : 'text-success')}>
                    {detail.status === 'rejected' ? <CircleX className="size-4" aria-hidden /> : <CircleCheck className="size-4" aria-hidden />}
                    {detail.status === 'rejected' ? 'Đã từ chối' : 'Đã duyệt làm giảng viên cao cấp'}
                  </p>
                  <p className="text-xs text-foreground">
                    {detail.reviewedBy ? `Bởi ${detail.reviewedBy.name}` : 'Người duyệt đã bị xoá'}
                    {detail.reviewedAt && ` · ${fmtDateTime(detail.reviewedAt)}`}
                  </p>
                  {detail.status === 'rejected' && detail.rejectReason && (
                    <p className="whitespace-pre-line break-words text-foreground">{detail.rejectReason}</p>
                  )}
                </div>
                <NextPending fetchPage={listApplications} current={detail.id} hrefOf={(i) => `${LIST}/${i}`} />
              </div>
            )}
          </div>
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
            <AlertDialogAction disabled={!!busy} onClick={() => run('approve', () => approveApplication(detail.id), 'Đã duyệt đơn')}>
              {busy === 'approve' && <Spinner />}
              {warnings.length > 0 ? 'Vẫn duyệt' : 'Duyệt giảng viên'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Từ chối đơn"
        description="Người nộp sẽ thấy lý do này để sửa đơn và gửi lại."
        presets={PRESETS}
        max={REASON_MAX}
        busy={busy === 'reject'}
        onConfirm={(reason) => run('reject', () => rejectApplication(detail.id, reason), 'Đã từ chối đơn')}
      />
    </div>
  );
}


// Cùng hình trang thật: link quay lại, header hồ sơ, chi tiết trái + cột quyết định phải.
export function ApplicationDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true" aria-label="Đang tải đơn">
      <Skeleton className="h-8 w-56" />
      <div className="flex items-center gap-5 rounded-xl border bg-card p-5">
        <Skeleton className="size-24 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2.5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    </div>
  );
}
