'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { safeRedirect } from '@/lib/safe-redirect';
import { AuthShell } from './auth-shell';
import { fallbackError, NETWORK, resendVerification } from './auth-messages';
import { Banner, Field, PasswordToggle } from './form-parts';
import { loginSchema, type LoginInput, type LoginValues } from './login-form.schema';
import { SocialButtons } from './social-buttons';
import { useCooldown } from './use-cooldown';

const INVALID = 'Email hoặc mật khẩu không đúng';
const OAUTH_FAILED = 'Đăng nhập bằng Google/GitHub không thành công, vui lòng thử lại';
// Better Auth không liên kết OAuth vào tài khoản email chưa xác minh (chống chiếm tài khoản)
const ACCOUNT_NOT_LINKED =
  'Email này đã được đăng ký nhưng chưa xác minh. Hãy mở link xác minh trong email (hoặc đăng nhập bằng mật khẩu để gửi lại link), sau đó mới liên kết được Google/GitHub.';

/** oauthError: mã lỗi ?error= do back-end gắn khi OAuth thất bại */
type Props = { redirect?: string; reset?: boolean; oauthError?: string };

export function LoginView({ redirect, reset, oauthError }: Props) {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [banner, setBanner] = useState<string | null>(
    oauthError === 'account_not_linked' ? ACCOUNT_NOT_LINKED : oauthError ? OAUTH_FAILED : null,
  );
  const [showReset, setShowReset] = useState(!!reset);
  const [unverified, setUnverified] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    setBanner(null);
    setShowReset(false);
    setUnverified(null);
    try {
      const { error } = await authClient.signIn.email(values);
      if (!error) {
        setDone(true);
        router.replace(safeRedirect(redirect));
        router.refresh();
        return;
      }
      if (error.code === 'EMAIL_NOT_VERIFIED') setUnverified(values.email);
      else if (error.code === 'INVALID_EMAIL_OR_PASSWORD') {
        resetField('password');
        setFocus('password');
        setBanner(INVALID);
      } else setBanner(fallbackError(error.status));
    } catch {
      setBanner(NETWORK);
    }
  }

  const describedBy = (field: keyof LoginInput) => (errors[field] ? `${field}-error` : undefined);

  return (
    <AuthShell title="Đăng nhập">
      <SocialButtons redirect={redirect} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {showReset && <Banner tone="success">Đổi mật khẩu thành công, hãy đăng nhập lại</Banner>}

        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="ten@email.com" aria-invalid={!!errors.email} aria-describedby={describedBy('email')} {...register('email')} />
        </Field>

        <Field id="password" label="Mật khẩu" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={describedBy('password')}
              {...register('password')}
            />
            <PasswordToggle shown={showPw} onToggle={() => setShowPw((p) => !p)} />
          </div>
          <div className="flex justify-end mt-1">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">Quên mật khẩu?</Link>
          </div>
        </Field>

        {banner && <Banner>{banner}</Banner>}
        {unverified && <UnverifiedNotice email={unverified} />}

        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting || done} className="w-full">
          {isSubmitting || done ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </Btn>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký miễn phí</Link>
      </p>
    </AuthShell>
  );
}

function UnverifiedNotice({ email }: { email: string }) {
  // Lần đầu không khoá: mail xác minh gửi lúc đăng ký, có thể đã lâu
  const { cooldown, restart } = useCooldown();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function resend() {
    setResult(null);
    restart();
    const error = await resendVerification(email);
    setResult(error ? { ok: false, text: error } : { ok: true, text: `Đã gửi lại tới ${email}` });
  }

  return (
    <div role="alert" className="rounded-lg border px-3 py-3 text-sm space-y-2" style={{ borderColor: 'var(--border)' }}>
      <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Email chưa được xác minh</p>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        Link xác minh đã được gửi khi bạn đăng ký và còn hiệu lực 24 giờ. Hãy kiểm tra hộp thư, cả mục
        Spam/Quảng cáo, trước khi gửi lại.
      </p>
      <Button type="button" variant="outline" size="sm" className="w-full" disabled={cooldown > 0} onClick={resend}>
        {cooldown > 0 ? `Gửi lại email xác minh (${cooldown}s)` : 'Gửi lại email xác minh'}
      </Button>
      {result && <p className={`text-xs ${result.ok ? 'text-green-600' : 'text-destructive'}`}>{result.text}</p>}
    </div>
  );
}
