'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Btn } from '@/components/shared/product-ui';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { AuthShell } from '../../_components/auth-shell';
import { fallbackError, NETWORK } from '../../_components/auth-messages';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
  type ForgotPasswordValues,
} from '../../_components/auth-fields.schema';
import { CheckEmailScreen } from '../../_components/check-email-screen';
import { Banner, Field } from '../../_components/form-parts';

// Email không tồn tại cũng trả 200 → không lộ tài khoản
async function requestReset(email: string): Promise<string | null> {
  try {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? fallbackError(error.status) : null;
  } catch {
    return NETWORK;
  }
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput, unknown, ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: { email: '' },
  });

  async function onSubmit({ email }: ForgotPasswordValues) {
    setBanner(null);
    const error = await requestReset(email);
    if (error) setBanner(error);
    else setSentTo(email);
  }

  if (sentTo) {
    return (
      <CheckEmailScreen
        title="Kiểm tra email"
        onResend={() => requestReset(sentTo)}
        footer={<Link href="/login" className="block text-sm text-blue-600 hover:underline">Quay lại đăng nhập</Link>}
      >
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          Nếu <strong>{sentTo}</strong> có tài khoản, chúng tôi đã gửi link đặt lại mật khẩu.
        </p>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Link còn hiệu lực trong 1 giờ. Hãy kiểm tra hộp thư, cả mục Spam/Quảng cáo, trước khi gửi lại.
        </p>
      </CheckEmailScreen>
    );
  }

  return (
    <AuthShell title="Quên mật khẩu">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Nhập email đã đăng ký, chúng tôi sẽ gửi link để bạn đặt mật khẩu mới.
        </p>
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="ten@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
        </Field>
        {banner && <Banner>{banner}</Banner>}
        <Btn variant="primary" size="lg" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi link đặt lại'
          )}
        </Btn>
      </form>
      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
        Nhớ mật khẩu rồi?{' '}
        <Link href="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
