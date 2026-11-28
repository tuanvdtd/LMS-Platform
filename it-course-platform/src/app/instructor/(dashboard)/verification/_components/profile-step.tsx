'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveAvatar, saveInfo } from '@/lib/api/instructor-application';
import { authClient } from '@/lib/auth-client';
import { uploadAvatar, uploadErrorMessage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { AVATAR_MAX_BYTES, AVATAR_TYPES, BIO_MIN_WORDS, wordCount } from '@/types/instructor-application';
import { StepFooter } from './step-footer';
import { handleStepError, type StepProps, useStepSave } from './step-shared';

type Form = { name: string; headline: string; bio: string; website: string; linkedin: string; github: string };
const LINKS: { key: 'website' | 'linkedin' | 'github'; label: string; placeholder: string }[] = [
  { key: 'website', label: 'Website', placeholder: 'https://…' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
];
const LINK_IN_BIO = /https?:\/\/|\bwww\./i;

// Kiểm như BE để báo ngay dưới ô, khỏi chờ một vòng gửi lên.
function validate(f: Form): Record<string, string> {
  const e: Record<string, string> = {};
  const name = f.name.trim();
  if (name.length < 2 || name.length > 60) e.name = 'Tên hiển thị 2–60 ký tự';
  if (!f.headline.trim()) e.headline = 'Nhập chức danh';
  if (wordCount(f.bio) < BIO_MIN_WORDS) e.bio = `Giới thiệu tối thiểu ${BIO_MIN_WORDS} từ`;
  else if (LINK_IN_BIO.test(f.bio)) e.bio = 'Giới thiệu không được chứa link, hãy dùng các ô liên kết bên dưới';
  return e;
}

// Màn 1: phần học viên nhìn thấy. Tên và ảnh ghi thẳng vào tài khoản, phần còn lại vào đơn.
export function ProfileStep({ view, onSaved, onUpdate, registerSave }: StepProps) {
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
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { refetch } = authClient.useSession();
  const dirty = (Object.keys(initial) as (keyof Form)[]).some((k) => form[k] !== initial[k]);
  const infoMissing = view.missing.some((m) => m.step === 'info');
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
      toast.success('Đã lưu hồ sơ');
      onSaved(v);
      return true;
    } catch (e) {
      handleStepError(e, setErrors, { fields: Object.keys(initial) });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (!view.image) setAvatarError('Cần một ảnh hồ sơ rõ mặt');
    const first = Object.keys(found)[0] ?? (view.image ? null : 'avatar');
    if (first) formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
    if (Object.keys(found).length) return;
    // Điền sẵn từ Cài đặt mà chưa lưu vào đơn thì vẫn phải lưu.
    if (dirty || infoMissing) await run();
    else if (view.image) onSaved(view);
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return setAvatarError('Chỉ nhận ảnh JPG, PNG hoặc WebP');
    if (file.size > AVATAR_MAX_BYTES) return setAvatarError('Ảnh tối đa 5 MB');
    setUploading(true);
    setAvatarError(null);
    try {
      onUpdate(await saveAvatar(await uploadAvatar(file)));
      void refetch(); // ảnh mới lên header
      toast.success('Đã lưu ảnh hồ sơ');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) handleStepError(err, () => undefined);
      else setAvatarError(uploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate>
      <div className="flex flex-col gap-8 p-5 sm:p-6">
        <Field data-invalid={!!avatarError || undefined}>
          <FieldLabel htmlFor="avatar">Ảnh hồ sơ</FieldLabel>
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {view.image && <AvatarImage src={view.image} alt="Ảnh hồ sơ" />}
              <AvatarFallback>
                <UserRound className="size-8 text-muted-foreground" aria-hidden />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start gap-1.5">
              {/* Input ẩn nằm trong label nên vòng focus phải vẽ lên label */}
              <label
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'cursor-pointer has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                  uploading && 'pointer-events-none opacity-50',
                )}
              >
                <input
                  id="avatar"
                  type="file"
                  accept={AVATAR_TYPES.join(',')}
                  className="sr-only"
                  disabled={uploading}
                  aria-describedby="avatar-hint"
                  aria-invalid={!!avatarError}
                  onChange={(e) => {
                    void pick(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {uploading ? 'Đang tải lên…' : view.image ? 'Đổi ảnh' : 'Chọn ảnh'}
              </label>
              <FieldDescription id="avatar-hint">Rõ mặt, nền gọn, tối thiểu 200×200 px, tối đa 5 MB. Chọn là lưu luôn.</FieldDescription>
            </div>
          </div>
          {avatarError && <FieldError>{avatarError}</FieldError>}
        </Field>

        <FieldGroup>
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="name">Tên hiển thị</FieldLabel>
            <Input id="name" maxLength={60} value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby="name-hint" />
            <FieldDescription id="name-hint">Hiện trên trang giảng viên và khoá học. Không cần trùng tên trên giấy tờ.</FieldDescription>
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
                aria-live="polite"
                className={cn('text-xs tabular-nums', words < BIO_MIN_WORDS ? 'text-muted-foreground' : 'text-success')}
              >
                {words < BIO_MIN_WORDS ? `Còn ${BIO_MIN_WORDS - words} từ` : `${words} từ`}
              </span>
            </div>
            <Textarea
              id="bio"
              maxLength={2000}
              value={form.bio}
              onChange={set('bio')}
              aria-invalid={!!errors.bio}
              aria-describedby="bio-hint"
              className="min-h-40"
            />
            <FieldDescription id="bio-hint">
              Tối thiểu {BIO_MIN_WORDS} từ: bạn đã làm gì, giỏi mảng nào, vì sao muốn dạy. Không chèn link hay mã giảm giá.
            </FieldDescription>
            {errors.bio && <FieldError>{errors.bio}</FieldError>}
          </Field>
        </FieldGroup>

        <FieldSet>
          <FieldLegend>Liên kết hồ sơ</FieldLegend>
          <FieldDescription>Không bắt buộc, nhưng giúp người duyệt xác nhận chuyên môn nhanh hơn.</FieldDescription>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            {LINKS.map((f) => (
              <Field key={f.key} data-invalid={!!errors[f.key] || undefined} className={cn(f.key === 'website' && 'sm:col-span-2')}>
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
        </FieldSet>
      </div>
      <StepFooter>
        <Button type="submit" disabled={saving || uploading}>
          {saving ? 'Đang lưu…' : 'Lưu và tiếp tục'}
        </Button>
      </StepFooter>
    </form>
  );
}
