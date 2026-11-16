'use client';

import { useState } from 'react';
import { PasswordToggle } from '@/app/(auth)/_components/form-parts';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<typeof Input>;

// Ô mật khẩu có nút hiện/ẩn. Nhận thẳng {...register()} của react-hook-form.
export function PasswordField({ id, label, error, ...input }: InputProps & { id: string; label: string; error?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={shown ? 'text' : 'password'}
          className="pr-10"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
        />
        <PasswordToggle shown={shown} onToggle={() => setShown((s) => !s)} />
      </div>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

// Ô mã 6 số của ứng dụng xác thực: chỉ nhận chữ số, bàn phím số trên điện thoại, tự điền nếu trình duyệt hỗ trợ.
export function CodeInput({
  value,
  onChange,
  className,
  ...input
}: Omit<InputProps, 'value' | 'onChange'> & { value: string; onChange: (code: string) => void }) {
  return (
    <Input
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      // indent bù khoảng tracking sau chữ số cuối, để dãy số nằm đúng giữa ô.
      className={cn('h-11 indent-[0.4em] text-center font-mono text-lg tracking-[0.4em] tabular-nums', className)}
      {...input}
    />
  );
}
