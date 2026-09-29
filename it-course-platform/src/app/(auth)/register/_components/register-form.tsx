'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { SocialButtons } from '../../_components/social-buttons';
import { CheckEmailScreen } from '../../_components/check-email-screen';
import { Banner, Field, PasswordToggle } from '../../_components/form-parts';
import { fallbackError, NETWORK, resendVerification } from '../../_components/auth-messages';
import { registerSchema, type RegisterInput, type RegisterValues } from './register-form.schema';

// Lỗi 400 của Better Auth lọt qua zod → gắn vào đúng ô
const FIELD_ERRORS: Record<string, { field: 'email' | 'password'; message: string }> = {
  INVALID_EMAIL: { field: 'email', message: 'Email không hợp lệ' },
  INVALID_PASSWORD: { field: 'password', message: 'Mật khẩu không hợp lệ' },
  PASSWORD_TOO_SHORT: { field: 'password', message: 'Mật khẩu cần ít nhất 8 ký tự' },
  PASSWORD_TOO_LONG: { field: 'password', message: 'Mật khẩu tối đa 128 ký tự' },
};

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
        callbackURL: `${window.location.origin}/onboarding`,
      });
      if (!error) {
        setSentTo(values.email);
        return;
      }
      const fieldError = error.code ? FIELD_ERRORS[error.code] : undefined;
      if (fieldError) setError(fieldError.field, { message: fieldError.message });
      else setBanner(fallbackError(error.status));
    } catch {
      setBanner(NETWORK);
    }
  }

  if (sentTo) {
    return (
      <CheckEmailScreen
        title="Kiểm tra email"
        onResend={() => resendVerification(sentTo)}
        footer={
          <Button
            variant="link"
            onClick={() => {
              // useForm vẫn giữ name/email khi form unmount (shouldUnregister mặc định false)
              resetField('password');
              resetField('confirmPassword');
              setSentTo(null);
            }}
          >
            Dùng email khác
          </Button>
        }
      >
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Chúng tôi đã gửi link xác minh tới <strong>{sentTo}</strong>.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Link hết hạn sau 24 giờ. Nếu email này đã có tài khoản, hãy{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">đăng nhập</Link>.
        </p>
      </CheckEmailScreen>
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
            <PasswordToggle shown={showPw} onToggle={() => setShowPw((p) => !p)} />
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

        {banner && <Banner>{banner}</Banner>}

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
