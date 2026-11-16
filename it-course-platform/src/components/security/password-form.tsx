'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { passwordField } from '@/app/(auth)/_components/auth-fields.schema';
import { NETWORK } from '@/app/(auth)/_components/auth-messages';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { apiMessage } from '@/lib/api/checkout';
import { api } from '@/lib/api/client';
import { authClient } from '@/lib/auth-client';
import { PasswordField } from './fields';
import { securityError } from './messages';

const schema = (hasPassword: boolean) =>
  z
    .object({
      currentPassword: hasPassword ? z.string().min(1, 'Nhập mật khẩu hiện tại') : z.string(),
      newPassword: passwordField,
      confirmPassword: z.string(),
      revokeOthers: z.boolean(),
    })
    .refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' })
    .refine((v) => !hasPassword || v.newPassword !== v.currentPassword, {
      path: ['newPassword'],
      message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    });

type Values = z.output<ReturnType<typeof schema>>;

// Có mật khẩu → đổi (kiểm mật khẩu cũ). Chỉ đăng nhập bằng Google/GitHub → tạo mật khẩu lần đầu (POST /me/password).
export function PasswordForm({ hasPassword, onDone }: { hasPassword: boolean; onDone: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema(hasPassword)),
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '', revokeOthers: true },
  });

  async function onSubmit(v: Values) {
    try {
      if (hasPassword) {
        const { error } = await authClient.changePassword({
          currentPassword: v.currentPassword,
          newPassword: v.newPassword,
          revokeOtherSessions: v.revokeOthers,
        });
        if (error?.code === 'INVALID_PASSWORD') {
          setError('currentPassword', { message: 'Mật khẩu hiện tại không đúng' }, { shouldFocus: true });
          return;
        }
        if (error) {
          toast.error(securityError(error));
          return;
        }
        toast.success('Đã đổi mật khẩu', { description: v.revokeOthers ? 'Các thiết bị khác đã bị đăng xuất.' : undefined });
      } else {
        await api.post('/me/password', { newPassword: v.newPassword });
        toast.success('Đã tạo mật khẩu', { description: 'Từ giờ bạn đăng nhập được bằng email và mật khẩu.' });
      }
      reset();
      onDone();
    } catch (e) {
      toast.error(hasPassword ? NETWORK : apiMessage(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md">
      <FieldGroup>
        {hasPassword && (
          <PasswordField
            id="currentPassword"
            label="Mật khẩu hiện tại"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
        )}
        <PasswordField
          id="newPassword"
          label="Mật khẩu mới"
          autoComplete="new-password"
          placeholder="Ít nhất 8 ký tự"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordField
          id="confirmPassword"
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {hasPassword && (
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="revokeOthers"
              render={({ field }) => <Checkbox id="revokeOthers" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <FieldLabel htmlFor="revokeOthers" className="font-normal">
              Đăng xuất khỏi các thiết bị khác sau khi đổi
            </FieldLabel>
          </Field>
        )}
        <div>
          <Button type="submit" isLoading={isSubmitting}>
            {hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
