'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { SocialButtons } from '../../_components/social-buttons';
import { registerSchema, type RegisterInput, type RegisterValues } from './register-form.schema';

const RESEND_COOLDOWN = 60;
const RATE_LIMITED = 'Bạn thử quá nhiều lần, vui lòng đợi vài phút';
const NETWORK = 'Không kết nối được máy chủ, thử lại sau';

// Lỗi 400 của Better Auth lọt qua zod → gắn vào đúng ô
const FIELD_ERRORS: Record<string, { field: 'email' | 'password'; message: string }> = {
  INVALID_EMAIL: { field: 'email', message: 'Email không hợp lệ' },
  INVALID_PASSWORD: { field: 'password', message: 'Mật khẩu không hợp lệ' },
  PASSWORD_TOO_SHORT: { field: 'password', message: 'Mật khẩu cần ít nhất 8 ký tự' },
  PASSWORD_TOO_LONG: { field: 'password', message: 'Mật khẩu tối đa 128 ký tự' },
};

// Bấm link xác minh → back-end autoSignInAfterVerification → về đây
const callbackURL = () => `${window.location.origin}/onboarding`;

export function RegisterForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  });

  async function onSubmit(values: RegisterValues) {
    setBanner(null);
    try {
      // Email đã tồn tại cũng trả 200 (requireEmailVerification → chống dò tài khoản)
      const { error } = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: callbackURL(),
      });
      if (!error) {
        setSentTo(values.email);
        return;
      }
      const fieldError = error.code ? FIELD_ERRORS[error.code] : undefined;
      if (fieldError) setError(fieldError.field, { message: fieldError.message });
      else setBanner(error.status === 429 ? RATE_LIMITED : NETWORK);
    } catch {
      setBanner(NETWORK);
    }
  }

  if (sentTo) {
    return (
      <SentScreen
        email={sentTo}
        onBack={() => {
          // useForm vẫn giữ name/email khi form unmount (shouldUnregister mặc định false)
          resetField('password');
          resetField('confirmPassword');
          setSentTo(null);
        }}
      />
    );
  }

  const describedBy = (field: keyof RegisterInput) => (errors[field] ? `${field}-error` : undefined);

  return (
    <AuthShell title="Tạo tài khoản">
      <SocialButtons />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="name" label="Họ tên" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Nguyễn Văn A" aria-invalid={!!errors.name} aria-describedby={describedBy('name')} {...register('name')} />
        </Field>

        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="ten@email.com" aria-invalid={!!errors.email} aria-describedby={describedBy('email')} {...register('email')} />
        </Field>

        <Field id="password" label="Mật khẩu" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={describedBy('password')}
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPw((p) => !p)}
              className="absolute right-0 top-1/2 -translate-y-1/2"
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOff size={15} style={{ color: 'var(--muted-foreground)' }} /> : <Eye size={15} style={{ color: 'var(--muted-foreground)' }} />}
            </Button>
          </div>
        </Field>

        <Field id="confirmPassword" label="Nhập lại mật khẩu" error={errors.confirmPassword?.message}>
          <Input
            id="confirmPassword"
            type={showPw ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={describedBy('confirmPassword')}
            {...register('confirmPassword')}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-[var(--primary)]"
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={describedBy('acceptTerms')}
              {...register('acceptTerms')}
            />
            <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của SkillPath</span>
          </label>
          {errors.acceptTerms && <p id="acceptTerms-error" className="mt-1 text-xs text-destructive">{errors.acceptTerms.message}</p>}
        </div>

        {banner && (
          <div
            role="alert"
            className="rounded-lg border px-3 py-2 text-sm text-destructive"
            style={{ borderColor: 'var(--destructive)', background: 'color-mix(in srgb, var(--destructive) 8%, transparent)' }}
          >
            {banner}
          </div>
        )}

        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            'Tạo tài khoản'
          )}
        </Btn>
      </form>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SentScreen({ email, onBack }: { email: string; onBack: () => void }) {
  // Bắt đầu đã khoá: email vừa được gửi lúc đăng ký
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function resend() {
    setResendError(null);
    setCooldown(RESEND_COOLDOWN);
    try {
      const { error } = await authClient.sendVerificationEmail({ email, callbackURL: callbackURL() });
      if (error) setResendError(error.status === 429 ? RATE_LIMITED : NETWORK);
    } catch {
      setResendError(NETWORK);
    }
  }

  return (
    <AuthShell title="Kiểm tra email">
      <div className="text-center space-y-4">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-7" />
        </div>
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Chúng tôi đã gửi link xác minh tới <strong>{email}</strong>.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Link hết hạn sau 24 giờ. Nếu email này đã có tài khoản, hãy{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">đăng nhập</Link>.
        </p>
        <Button variant="outline" className="w-full" disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Gửi lại email (${cooldown}s)` : 'Gửi lại email'}
        </Button>
        {resendError && <p role="alert" className="text-xs text-destructive">{resendError}</p>}
        <Button variant="link" onClick={onBack}>Dùng email khác</Button>
      </div>
    </AuthShell>
  );
}
