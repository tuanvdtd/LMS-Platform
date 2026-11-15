'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CodeInput } from '@/components/security/fields';
import { securityError } from '@/components/security/messages';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { safeRedirect, withRedirect } from '@/lib/safe-redirect';
import { AuthShell } from '../../_components/auth-shell';
import { NETWORK } from '../../_components/auth-messages';

// Mật khẩu đã đúng (back-end giữ cookie tạm 10 phút). Nhập mã từ ứng dụng hoặc một mã dự phòng để có phiên đăng nhập.
export function TwoFactorForm({ redirect }: { redirect?: string }) {
  const router = useRouter();
  const [backup, setBackup] = useState(false);
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState<string>();
  // Cookie tạm hết hạn / sai quá số lần → chỉ còn cách đăng nhập lại.
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (backup ? !code.trim() : code.length !== 6) {
      setError(backup ? 'Nhập mã dự phòng' : 'Nhập đủ 6 chữ số');
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const { error } = backup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim(), trustDevice })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice });
      if (!error) {
        router.replace(safeRedirect(redirect));
        router.refresh();
        return;
      }
      setExpired(error.code === 'INVALID_TWO_FACTOR_COOKIE' || error.code === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE');
      setError(securityError(error));
      setCode('');
    } catch {
      setError(NETWORK);
    }
    setBusy(false);
  }

  const loginHref = withRedirect('/login', redirect);

  return (
    <AuthShell title="Xác thực hai lớp">
      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          <Field data-invalid={!!error || undefined}>
            <FieldLabel htmlFor="code">{backup ? 'Mã dự phòng' : 'Mã 6 số từ ứng dụng xác thực'}</FieldLabel>
            {backup ? (
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                className="h-11 font-mono"
                aria-invalid={!!error}
                aria-describedby={error ? 'code-error' : undefined}
              />
            ) : (
              <CodeInput id="code" value={code} onChange={setCode} autoFocus aria-invalid={!!error} aria-describedby={error ? 'code-error' : undefined} />
            )}
            {error && <FieldError id="code-error">{error}</FieldError>}
          </Field>

          <Field orientation="horizontal">
            <Checkbox id="trustDevice" checked={trustDevice} onCheckedChange={(v) => setTrustDevice(v === true)} />
            <FieldLabel htmlFor="trustDevice" className="font-normal">
              Không hỏi lại trên thiết bị này trong 30 ngày
            </FieldLabel>
          </Field>

          {expired ? (
            <Link href={loginHref} className="text-center text-sm font-semibold text-primary hover:underline">
              Đăng nhập lại
            </Link>
          ) : (
            <Button type="submit" size="lg" className="w-full" isLoading={busy}>
              Xác nhận
            </Button>
          )}
        </FieldGroup>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          className="rounded-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          onClick={() => {
            setBackup((b) => !b);
            setCode('');
            setError(undefined);
          }}
        >
          {backup ? 'Dùng mã từ ứng dụng xác thực' : 'Không có điện thoại? Dùng mã dự phòng'}
        </button>
        {!expired && (
          <Link href={loginHref} className="text-muted-foreground hover:underline">
            Quay lại đăng nhập
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
