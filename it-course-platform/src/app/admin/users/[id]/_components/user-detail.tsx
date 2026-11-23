'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { BadgeCheck, CircleCheck, Lock, TriangleAlert, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { AdminUserDetailSkeleton } from '@/components/skeletons/admin-user-detail-skeleton';
import { CourseStatusBadge } from '@/components/shared/course-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Progress } from '@/components/ui/progress';
import { AUDIT_ACTION_LABEL, describeUserAgent, formatDate, formatDateTime, LOGIN_METHOD_LABEL, usersListHref } from '@/lib/admin-users';
import { getUser, revokeUserSessions, unlockUser } from '@/lib/api/admin';
import { apiMessage } from '@/lib/api/checkout';
import type { AdminUserDetail } from '@/types/admin';
import { formatVnd } from '@/types/revenue';
import { BackLink } from '../../../_components/review-ui';
import { LockDialog } from './lock-dialog';

const ORDER_STATUS_LABEL: Record<AdminUserDetail['purchases']['recent'][number]['status'], string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  partially_refunded: 'Hoàn một phần',
};

type Confirm = 'unlock' | 'revoke' | null;

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loadError, setLoadError] = useState<'notFound' | 'failed' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [lockOpen, setLockOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect).
  useEffect(() => {
    let stale = false;
    getUser(id).then(
      (u) => {
        if (!stale) {
          setUser(u);
          setLoadError(null);
        }
      },
      (e) => {
        if (!stale) setLoadError(axios.isAxiosError(e) && e.response?.status === 404 ? 'notFound' : 'failed');
      },
    );
    return () => {
      stale = true;
    };
  }, [id, reloadKey]);

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={usersListHref()}>Người dùng</BackLink>
        <div className="rounded-2xl border bg-card p-5">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">{loadError === 'notFound' ? <UserX /> : <TriangleAlert />}</EmptyMedia>
              <EmptyTitle>{loadError === 'notFound' ? 'Không tìm thấy người dùng' : 'Không tải được thông tin người dùng'}</EmptyTitle>
              <EmptyDescription>
                {loadError === 'notFound' ? 'Người dùng không tồn tại hoặc không phải học viên / giảng viên.' : 'Kiểm tra kết nối rồi thử lại.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {loadError === 'notFound' ? (
                <Link href={usersListHref()} className={buttonVariants({ variant: 'outline' })}>
                  Về danh sách người dùng
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoadError(null);
                    setReloadKey((k) => k + 1);
                  }}
                >
                  Thử lại
                </Button>
              )}
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }
  if (!user) return <AdminUserDetailSkeleton />;

  const locked = user.status === 'locked';

  async function run(action: () => Promise<AdminUserDetail>, okMsg: string) {
    setBusy(true);
    try {
      setUser(await action());
      toast.success(okMsg);
      setConfirm(null);
    } catch (e) {
      toast.error(apiMessage(e, 'Thao tác thất bại, thử lại'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={usersListHref()}>Người dùng</BackLink>

      <section className="flex flex-wrap items-start gap-4 rounded-2xl border bg-card p-5">
        <Avatar className="size-16">
          {user.image && <AvatarImage src={user.image} alt="" />}
          <AvatarFallback className="text-xl">{user.name.trim().charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold">{user.name}</h1>
            <Badge variant="secondary">{user.roles.includes('instructor') ? 'Giảng viên' : 'Học viên'}</Badge>
            {user.verifiedAt && (
              <Badge variant="info">
                <BadgeCheck data-icon="inline-start" />
                Cao cấp
              </Badge>
            )}
            {locked ? (
              <Badge variant="danger">
                <Lock data-icon="inline-start" />
                Đã khoá
              </Badge>
            ) : (
              <Badge variant="success">
                <CircleCheck data-icon="inline-start" />
                Hoạt động
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.emailVerified ? 'Đã xác minh email' : 'Chưa xác minh email'}
          </p>
          <p className="text-sm text-muted-foreground">
            Tham gia {formatDate(user.createdAt)} · Đăng nhập bằng:{' '}
            {user.loginMethods.length ? user.loginMethods.map((m) => LOGIN_METHOD_LABEL[m] ?? m).join(', ') : 'chưa rõ'} · Xác thực hai lớp:{' '}
            {user.twoFactorEnabled ? 'Bật' : 'Tắt'}
            {user.verifiedAt && ` · Giảng viên cao cấp từ ${formatDate(user.verifiedAt)}`}
          </p>
          <Link href={`/u/${user.id}`} target="_blank" rel="noopener" className="w-fit text-sm text-primary hover:underline">
            Xem hồ sơ công khai
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {locked ? (
            <Button variant="outline" disabled={busy} onClick={() => setConfirm('unlock')}>
              Mở khoá
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => setLockOpen(true)}
            >
              Khoá tài khoản
            </Button>
          )}
          <Button variant="outline" disabled={busy || user.sessions.length === 0} onClick={() => setConfirm('revoke')}>
            Đăng xuất mọi thiết bị
          </Button>
        </div>
      </section>

      {locked && (
        <Alert variant="destructive">
          <Lock />
          <AlertTitle>Tài khoản đang bị khoá {user.lockedUntil ? `đến ${formatDateTime(user.lockedUntil)}` : 'vĩnh viễn'}</AlertTitle>
          <AlertDescription>Lý do: {user.lockReason ?? 'Không có'}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Khoá đang học" value={String(user.learning.enrollmentCount)} sub={`${user.learning.completedCount} đã hoàn thành`} />
        <Stat label="Đã chi" value={formatVnd(user.purchases.totalSpent)} sub={`${user.purchases.paidOrderCount} đơn`} />
        {user.teaching && (
          <>
            <Stat label="Khoá đang dạy" value={String(user.teaching.courseCount)} sub={`${user.teaching.publishedCount} đang bán`} />
            <Stat label="Thu nhập giảng dạy" value={formatVnd(user.teaching.totalEarned)} />
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Học tập gần đây">
          {user.learning.recent.length === 0 ? (
            <Muted>Chưa ghi danh khoá nào.</Muted>
          ) : (
            <ul className="flex flex-col divide-y">
              {user.learning.recent.slice(0, 5).map((c) => (
                <li key={c.courseId} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                  <Link href={`/course/${c.slug}`} className="font-medium hover:text-primary hover:underline">
                    {c.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    <Progress value={c.progressPct} aria-label={`Tiến độ ${c.title}`} className="flex-1" />
                    <span className="w-10 text-right text-sm tabular-nums">{c.progressPct}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ghi danh {formatDate(c.enrolledAt)}
                    {c.completedAt && ` · Hoàn thành ${formatDate(c.completedAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Đơn hàng gần đây">
          {user.purchases.recent.length === 0 ? (
            <Muted>Chưa có đơn hàng.</Muted>
          ) : (
            <ul className="flex flex-col divide-y">
              {user.purchases.recent.slice(0, 5).map((o) => (
                <li key={o.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm">{o.id.slice(-8)}</span>
                    <span className="font-medium tabular-nums">{formatVnd(o.totalAmount)}</span>
                  </div>
                  <p className="text-sm">{o.courses.join(', ')}</p>
                  <p className="text-xs text-muted-foreground">
                    {ORDER_STATUS_LABEL[o.status]} · {formatDate(o.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {user.teaching && (
          <Card title="Giảng dạy">
            {user.teaching.recent.length === 0 ? (
              <Muted>Chưa tạo khoá học nào.</Muted>
            ) : (
              <ul className="flex flex-col divide-y">
                {user.teaching.recent.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0 flex-1 font-medium">{c.title}</span>
                    <CourseStatusBadge status={c.status} />
                    <span className="text-sm text-muted-foreground">{c.enrollmentCount} học viên</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <Card title={`Phiên đăng nhập (${user.sessions.length})`}>
          {user.sessions.length === 0 ? (
            <Muted>Không có phiên nào đang mở.</Muted>
          ) : (
            <ul className="flex flex-col divide-y">
              {user.sessions.map((s) => (
                <li key={s.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{describeUserAgent(s.userAgent)}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.ipAddress ?? 'IP không rõ'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đăng nhập {formatDateTime(s.createdAt)} · Hoạt động gần nhất {formatDateTime(s.updatedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Nhật ký quản trị">
          {user.audit.length === 0 ? (
            <Muted>Chưa có thao tác nào.</Muted>
          ) : (
            <ul className="flex flex-col divide-y">
              {user.audit.slice(0, 20).map((a) => (
                <li key={a.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                  <p className="text-sm">
                    <span className="font-medium">{AUDIT_ACTION_LABEL[a.action]}</span> · bởi {a.actorName ?? 'Tài khoản đã xoá'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                  {a.action === 'user_lock' && (
                    <p className="text-sm text-muted-foreground">
                      {a.data.reason && <>Lý do: {a.data.reason} · </>}
                      Hạn: {a.data.expiresAt ? formatDateTime(a.data.expiresAt) : 'Vĩnh viễn'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <LockDialog
        user={lockOpen ? { id: user.id, name: user.name } : null}
        onClose={() => setLockOpen(false)}
        onLocked={(u) => {
          setUser(u);
          setLockOpen(false);
        }}
      />

      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && !busy && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm === 'unlock' ? `Mở khoá tài khoản ${user.name}?` : `Đăng xuất ${user.name} khỏi mọi thiết bị?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === 'unlock'
                ? 'Người dùng đăng nhập lại được ngay. Không có email thông báo.'
                : `${user.sessions.length} phiên đang mở sẽ bị đóng. Người dùng vẫn đăng nhập lại được.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Huỷ</AlertDialogCancel>
            {/* Không dùng AlertDialogAction: nó tự đóng hộp thoại trước khi gọi API xong. */}
            <Button
              disabled={busy}
              onClick={() =>
                confirm === 'unlock'
                  ? run(() => unlockUser(user.id), 'Đã mở khoá')
                  : run(() => revokeUserSessions(user.id), 'Đã đăng xuất mọi thiết bị')
              }
            >
              {busy ? 'Đang xử lý…' : confirm === 'unlock' ? 'Mở khoá' : 'Đăng xuất'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const Muted = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-muted-foreground">{children}</p>;
