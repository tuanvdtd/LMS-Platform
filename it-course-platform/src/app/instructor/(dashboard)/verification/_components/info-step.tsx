'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveInfo } from '@/lib/api/instructor-application';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { BIO_MIN_WORDS, wordCount } from '@/types/instructor-application';
import { handleStepError, type StepProps, useStepSave } from './step-shared';

type Form = { name: string; headline: string; bio: string; website: string; linkedin: string; github: string };
const FIELDS: { key: keyof Form; label: string; placeholder: string }[] = [
  { key: 'website', label: 'Website (tuỳ chọn)', placeholder: 'https://…' },
  { key: 'linkedin', label: 'LinkedIn (tuỳ chọn)', placeholder: 'https://linkedin.com/in/username' },
  { key: 'github', label: 'GitHub (tuỳ chọn)', placeholder: 'https://github.com/username' },
];

// Bước 1: thông tin cá nhân. Họ tên ghi vào tài khoản ngay; phần còn lại vào đơn.
export function InfoStep({ view, onSaved, registerSave }: StepProps) {
  const initial: Form = {
    name: view.name,
    headline: view.headline ?? '',
    bio: view.bio ?? '',
    website: view.website ?? '',
    linkedin: view.socials.linkedin ?? '',
    github: view.socials.github ?? '',
  };
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { refetch } = authClient.useSession();
  const dirty = (Object.keys(initial) as (keyof Form)[]).some((k) => form[k] !== initial[k]);
  const run = useStepSave(dirty, save, registerSave);
  const words = wordCount(form.bio);
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(): Promise<boolean> {
    setSaving(true);
    setErrors({});
    const opt = (s: string) => s.trim() || undefined;
    try {
      const v = await saveInfo({
        name: form.name.trim(),
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        website: opt(form.website),
        socials: { linkedin: opt(form.linkedin), github: opt(form.github) },
      });
      void refetch(); // tên mới lên header
      toast.success('Đã lưu thông tin cá nhân');
      onSaved(v);
      return true;
    } catch (e) {
      handleStepError(e, setErrors, { fields: Object.keys(initial) });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <FieldGroup>
        <Field data-invalid={!!errors.name || undefined}>
          <FieldLabel htmlFor="name">Họ tên</FieldLabel>
          <Input id="name" maxLength={60} value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.headline || undefined}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="headline">Chức danh</FieldLabel>
            <span className="text-xs tabular-nums text-muted-foreground">{form.headline.length}/60</span>
          </div>
          <Input
            id="headline"
            maxLength={60}
            value={form.headline}
            onChange={set('headline')}
            placeholder="Ví dụ: Senior React Developer"
            aria-invalid={!!errors.headline}
          />
          {errors.headline && <FieldError>{errors.headline}</FieldError>}
        </Field>
        <Field data-invalid={!!errors.bio || undefined}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor="bio">Giới thiệu bản thân</FieldLabel>
            <span
              className={cn('text-xs tabular-nums', words < BIO_MIN_WORDS ? 'text-muted-foreground' : 'text-primary')}
            >
              {words < BIO_MIN_WORDS ? `Còn ${BIO_MIN_WORDS - words} từ` : `${words} từ`}
            </span>
          </div>
          <Textarea
            id="bio"
            rows={6}
            maxLength={2000}
            value={form.bio}
            onChange={set('bio')}
            aria-invalid={!!errors.bio}
            aria-describedby="bio-hint"
          />
          <FieldDescription id="bio-hint">
            Tối thiểu {BIO_MIN_WORDS} từ: kinh nghiệm, chuyên môn, vì sao bạn dạy. Không chèn link hay mã giảm giá.
          </FieldDescription>
          {errors.bio && <FieldError>{errors.bio}</FieldError>}
        </Field>
        {FIELDS.map((f) => (
          <Field key={f.key} data-invalid={!!errors[f.key] || undefined}>
            <FieldLabel htmlFor={f.key}>{f.label}</FieldLabel>
            <Input
              id={f.key}
              type="url"
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              aria-invalid={!!errors[f.key]}
            />
            {errors[f.key] && <FieldError>{errors[f.key]}</FieldError>}
          </Field>
        ))}
      </FieldGroup>
      <div>
        <Button onClick={run} disabled={saving || !form.name.trim() || !form.headline.trim()}>
          {saving ? 'Đang lưu…' : 'Lưu và tiếp tục'}
        </Button>
      </div>
    </div>
  );
}
