'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SettingsRow as Row } from '@/components/shared/settings-row';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { authClient } from '@/lib/auth-client';
import { isStaff } from '@/lib/instructor-role';
import { type LinkedAccount, LinkedAccounts } from './linked-accounts';
import { linkError } from './messages';
import { PasswordForm } from './password-form';
import { SessionsList } from './sessions-list';
import { TwoFactor } from './two-factor';

// Bảo mật tài khoản: mật khẩu, Google/GitHub liên kết, xác thực hai lớp, phiên đăng nhập.
// Dùng ở Cài đặt của học viên/giảng viên và ở khu quản trị (tài khoản nghiệp vụ không có Google/GitHub).
export function SecuritySettings() {
  const { data } = authClient.useSession();
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Đổi mật khẩu có thể đá các phiên khác → tải lại danh sách phiên.
  const [sessionsKey, setSessionsKey] = useState(0);

  const loadAccounts = useCallback(
    () =>
      authClient.listAccounts().then(
        (res) => (res.data ? setAccounts(res.data) : setFailed(true)),
        () => setFailed(true),
      ),
    [],
  );

  useEffect(() => {
    void authClient.listAccounts().then(
      (res) => (res.data ? setAccounts(res.data) : setFailed(true)),
      () => setFailed(true),
    );
    // Liên kết Google/GitHub thất bại → back-end đưa về đây kèm ?error=<mã>. Báo một lần rồi gỡ khỏi URL.
    const url = new URL(window.location.href);
    const error = url.searchParams.get('error');
    if (error) {
      toast.error(linkError(error));
      url.searchParams.delete('error');
      window.history.replaceState(null, '', url);
    }
  }, []);

  if (failed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không tải được thông tin bảo mật. Hãy tải lại trang.</AlertDescription>
      </Alert>
    );
  }
  if (!data || !accounts) return <SecuritySkeleton />;

  const { user, session } = data;
  const hasPassword = accounts.some((a) => a.providerId === 'credential');

  return (
    <div>
      <Row
        title={hasPassword ? 'Mật khẩu' : 'Tạo mật khẩu'}
        hint={
          hasPassword
            ? 'Dùng để đăng nhập bằng email.'
            : 'Tài khoản này đang chỉ đăng nhập bằng mạng xã hội. Tạo mật khẩu để đăng nhập được bằng email và bật xác thực hai lớp.'
        }
      >
        <PasswordForm
          key={String(hasPassword)}
          hasPassword={hasPassword}
          onDone={() => {
            void loadAccounts();
            setSessionsKey((k) => k + 1);
          }}
        />
      </Row>

      {!isStaff(user) && (
        <Row title="Tài khoản liên kết" hint="Đăng nhập nhanh bằng Google hoặc GitHub, vào cùng một tài khoản Aolumi.">
          <LinkedAccounts accounts={accounts} onChange={loadAccounts} />
        </Row>
      )}

      <Row title="Xác thực hai lớp" hint="Thêm một bước mã 6 số, kẻ biết mật khẩu vẫn không đăng nhập được.">
        <TwoFactor enabled={!!user.twoFactorEnabled} hasPassword={hasPassword} />
      </Row>

      <Row title="Phiên đăng nhập" hint="Thiết bị đang đăng nhập vào tài khoản. Thấy thiết bị lạ thì đăng xuất nó rồi đổi mật khẩu.">
        <SessionsList key={sessionsKey} currentId={session.id} />
      </Row>
    </div>
  );
}

// Cùng hình bốn hàng thật: cột tiêu đề + nội dung (form, danh sách).
function SecuritySkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải cài đặt bảo mật">
      {[52, 34, 28, 34].map((h, i) => (
        <div key={i} className="grid gap-x-10 gap-y-3 border-b py-6 md:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="w-full max-w-md rounded-lg" style={{ height: `${h * 0.25}rem` }} />
        </div>
      ))}
    </div>
  );
}
