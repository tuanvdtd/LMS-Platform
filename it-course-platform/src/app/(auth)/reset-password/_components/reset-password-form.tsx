'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Btn } from '@/components/shared/product-ui';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { fallbackError, NETWORK } from '../../_components/auth-messages';
import { Banner, Field, PasswordToggle } from '../../_components/form-parts';
import { resetPasswordSchema, type ResetPasswordValues } from './reset-password.schema';

const FIELD_ERRORS: Record<string, string> = {
  PASSWORD_TOO_SHORT: 'Mật khẩu cần ít nhất 8 ký tự',
  PASSWORD_TOO_LONG: 'Mật khẩu tối đa 128 ký tự',
};

export function ResetPasswordForm({ token, invite }: { token: string | null; invite: boolean }) {
  const router = useRouter();
  const [expired, setExpired] = useState(!token);
  const [banner, setBanner] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit({ password }: ResetPasswordValues) {
    setBanner(null);
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
      if (!error) {
        setDone(true);
        // BE đã thu hồi session nhưng trình duyệt còn cookie → proxy sẽ đẩy khỏi /login
        await authClient.signOut().catch(() => {});
        router.replace('/login?reset=1');
        return;
      }
      if (error.code === 'INVALID_TOKEN') setExpired(true);
      else if (error.code && FIELD_ERRORS[error.code]) setError('password', { message: FIELD_ERRORS[error.code] });
      else setBanner(fallbackError(error.status));
    } catch {
      setBanner(NETWORK);
    }
  }

  // Link mời chỉ admin gửi lại được → không đưa sang luồng quên mật khẩu.
  if (expired && invite) {
    return (
      <AuthShell title="Link không hợp lệ">
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Link mời đã hết hạn, liên hệ quản trị viên để gửi lại
          </p>
          <Link href="/login" className="block text-sm text-blue-600 hover:underline">Quay lại đăng nhập</Link>
        </div>
      </AuthShell>
    );
  }
  if (expired) {
    return (
      <AuthShell title="Link không hợp lệ">
        <div className="text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            Link đặt lại đã hết hạn hoặc không hợp lệ.
          </p>
          <Btn variant="primary" size="lg" className="w-full" onClick={() => router.push('/forgot-password')}>
            Yêu cầu link mới
          </Btn>
          <Link href="/login" className="block text-sm text-blue-600 hover:underline">Quay lại đăng nhập</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={invite ? 'Đặt mật khẩu' : 'Đặt mật khẩu mới'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field id="password" label="Mật khẩu mới" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              className="pr-10"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
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
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            {...register('confirmPassword')}
          />
        </Field>
        {banner && <Banner>{banner}</Banner>}
        <Btn variant="primary" size="lg" type="submit" isLoading={isSubmitting || done} className="w-full">
          Lưu mật khẩu mới
        </Btn>
      </form>
    </AuthShell>
  );
}
