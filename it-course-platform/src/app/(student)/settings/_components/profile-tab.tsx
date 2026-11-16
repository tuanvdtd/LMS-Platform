'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api/checkout';
import { getMyProfile, updateMyProfile } from '@/lib/api/profile';
import { authClient } from '@/lib/auth-client';
import { COVER_TONE_LABEL, COVER_TONES, type MyProfile } from '@/types/profile';

const HEADLINE_MAX = 60;
const BIO_MAX = 2000;
const LINKS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…' },
] as const;

// Một dòng cài đặt: tiêu đề + giải thích bên trái, ô nhập bên phải; trên mobile xếp dọc.
function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-x-10 gap-y-3 border-b py-6 md:grid-cols-[15rem_minmax(0,1fr)]">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// Tab Hồ sơ: nơi duy nhất sửa những gì hiện trên trang cá nhân /u/[id], cho cả học viên lẫn giảng viên.
// Tên và ảnh lấy từ tài khoản (đổi qua đơn giảng viên), ở đây chỉ hiển thị.
export function ProfileTab() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [form, setForm] = useState<MyProfile | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile().then(setForm, () => setFailed(true));
  }, []);

  if (failed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Không tải được hồ sơ. Hãy tải lại trang.</AlertDescription>
      </Alert>
    );
  }
  if (!form || !user) return <ProfileTabSkeleton />;

  const set = (patch: Partial<MyProfile>) => setForm((f) => (f ? { ...f, ...patch } : f));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const { verified, website, socials, ...own } = form;
      // Liên kết chỉ gửi khi đã xác minh: server từ chối (403) nếu tài khoản thường gửi.
      setForm(await updateMyProfile(verified ? { ...own, website, socials } : own));
      toast.success('Đã lưu hồ sơ', { description: 'Trang cá nhân cập nhật sau tối đa 1 phút.' });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      {/* Xem trước: đúng dải bìa và khối tên sẽ hiện trên trang cá nhân, đổi ngay khi chọn màu / gõ chức danh. */}
      <div className="overflow-hidden rounded-xl border">
        <div data-cover={form.coverTone} className="h-20" />
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3 px-5 pb-5">
          <Avatar className="-mt-8 size-20 ring-4 ring-background">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-secondary text-2xl font-extrabold text-secondary-foreground">
              {user.name.trim().charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 basis-40">
            <p className="truncate text-lg font-extrabold text-foreground">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{form.headline || 'Chưa có chức danh'}</p>
          </div>
          <Link href={`/u/${user.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Xem trang cá nhân
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </div>
      </div>

      <div className="mt-2">
        <Row title="Màu bìa" hint="Dải màu trên đầu trang cá nhân.">
          <div role="radiogroup" aria-label="Màu bìa" className="flex flex-wrap gap-3">
            {COVER_TONES.map((tone) => (
              <label key={tone} className="cursor-pointer">
                <input
                  type="radio"
                  name="coverTone"
                  value={tone}
                  checked={form.coverTone === tone}
                  onChange={() => set({ coverTone: tone })}
                  className="peer sr-only"
                />
                <span
                  data-cover={tone}
                  title={COVER_TONE_LABEL[tone]}
                  className="flex size-9 items-center justify-center rounded-full border ring-offset-2 ring-offset-background transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60"
                >
                  {form.coverTone === tone && <Check className="size-4" aria-hidden />}
                  <span className="sr-only">{COVER_TONE_LABEL[tone]}</span>
                </span>
              </label>
            ))}
          </div>
        </Row>

        <Row title="Chức danh và giới thiệu" hint="Hiện ngay dưới tên bạn và ở đầu trang cá nhân.">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="headline">Chức danh</FieldLabel>
              <Input
                id="headline"
                value={form.headline ?? ''}
                onChange={(e) => set({ headline: e.target.value })}
                maxLength={HEADLINE_MAX}
                placeholder="Ví dụ: Frontend Engineer · React và TypeScript"
              />
              <FieldDescription>Tối đa {HEADLINE_MAX} ký tự.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="bio">Giới thiệu</FieldLabel>
              <Textarea
                id="bio"
                value={form.bio ?? ''}
                onChange={(e) => set({ bio: e.target.value })}
                maxLength={BIO_MAX}
                rows={6}
                className="min-h-36"
              />
              <FieldDescription className="flex justify-between gap-4">
                <span>Bạn đang làm gì, dạy gì, học gì. Không chèn link.</span>
                <span className="shrink-0 tabular-nums">
                  {(form.bio ?? '').length}/{BIO_MAX}
                </span>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </Row>

        <Row title="Liên kết" hint="Hiện cạnh tên bạn. Chỉ nhận địa chỉ http hoặc https.">
          {form.verified ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="website">Website</FieldLabel>
                <Input id="website" type="url" value={form.website ?? ''} onChange={(e) => set({ website: e.target.value })} placeholder="https://" />
              </Field>
              {LINKS.map((l) => (
                <Field key={l.key}>
                  <FieldLabel htmlFor={l.key}>{l.label}</FieldLabel>
                  <Input
                    id={l.key}
                    type="url"
                    value={form.socials[l.key] ?? ''}
                    onChange={(e) => set({ socials: { ...form.socials, [l.key]: e.target.value } })}
                    placeholder={l.placeholder}
                  />
                </Field>
              ))}
            </FieldGroup>
          ) : (
            <p className="text-sm text-muted-foreground">
              Website và mạng xã hội chỉ dành cho giảng viên đã xác minh.{' '}
              <Link href="/instructor/verification" className="font-semibold text-primary hover:underline">
                Đăng ký giảng viên cao cấp
              </Link>
            </p>
          )}
        </Row>

        <Row title="Quyền riêng tư" hint="Mặc định phần học tập chỉ mình bạn thấy.">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="learningPublic">Công khai phần học tập</FieldLabel>
              <FieldDescription>
                Khi bật, ai mở trang cá nhân của bạn cũng thấy khoá đang học, khoá đã hoàn thành, chứng chỉ và điểm kỹ năng.
              </FieldDescription>
            </FieldContent>
            <Switch id="learningPublic" checked={form.learningPublic} onCheckedChange={(v) => set({ learningPublic: v })} />
          </Field>
        </Row>

        <Row title="Sở thích học tập" hint="Nghề, kỹ năng quan tâm và trình độ, dùng để gợi ý khoá học.">
          <Link href="/onboarding" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Chỉnh sửa
          </Link>
        </Row>
      </div>

      <div className="sticky bottom-0 flex justify-end bg-background py-4">
        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}

function ProfileTabSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải hồ sơ">
      <Skeleton className="h-[9.5rem] rounded-xl" />
      <div className="mt-2">
        {[9, 56, 36].map((h, i) => (
          <div key={i} className="grid gap-x-10 gap-y-3 border-b py-6 md:grid-cols-[15rem_minmax(0,1fr)]">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="w-full" style={{ height: `${h * 0.25}rem` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
