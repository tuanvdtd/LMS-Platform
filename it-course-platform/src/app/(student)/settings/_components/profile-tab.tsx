'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api/checkout';
import { getMyProfile, updateMyProfile } from '@/lib/api/profile';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { COVER_TONE_LABEL, COVER_TONES, type MyProfile } from '@/types/profile';

const HEADLINE_MAX = 60;
const BIO_MAX = 2000;

// Tab Hồ sơ: những gì hiện trên trang cá nhân công khai /u/[id].
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
  const initial = user.name.trim().charAt(0).toUpperCase() || '?';

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const { headline, bio, coverTone, learningPublic } = form;
      setForm(await updateMyProfile({ headline, bio, coverTone, learningPublic }));
      toast.success('Đã lưu hồ sơ', { description: 'Trang cá nhân cập nhật sau tối đa 1 phút.' });
    } catch (err) {
      toast.error(apiMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-8">
      {/* Xem trước bìa: đúng dải màu và chữ cái sẽ hiện trên trang cá nhân. */}
      <div data-cover={form.coverTone} className="relative isolate flex items-center gap-4 overflow-hidden rounded-2xl p-5">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 -bottom-10 -z-10 text-[11rem] leading-none font-extrabold text-(--cover-mark) select-none"
        >
          {initial}
        </span>
        <Avatar className="size-16 rounded-xl after:rounded-xl after:border-(--cover-fg)/25 after:mix-blend-normal dark:after:mix-blend-normal">
          {user.image && <AvatarImage src={user.image} alt="" className="rounded-xl" />}
          <AvatarFallback className="rounded-xl bg-(--cover-mark) text-2xl font-extrabold text-(--cover-fg)">{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-extrabold">{user.name}</p>
          <p className="truncate text-sm text-(--cover-soft)">{user.email}</p>
        </div>
        <Link
          href={`/u/${user.id}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'shrink-0 border-(--cover-fg)/40 bg-transparent text-(--cover-fg) hover:bg-(--cover-fg)/10 hover:text-(--cover-fg)',
          )}
        >
          Xem trang cá nhân
          <ArrowUpRight data-icon="inline-end" />
        </Link>
      </div>

      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">Tông bìa</FieldLegend>
          <div className="flex flex-wrap gap-2.5">
            {COVER_TONES.map((tone) => (
              <label key={tone} className="group relative cursor-pointer">
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
                  className="flex h-11 w-24 items-center justify-center rounded-lg border text-sm font-semibold ring-offset-2 ring-offset-background transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/60"
                >
                  {COVER_TONE_LABEL[tone]}
                </span>
              </label>
            ))}
          </div>
        </FieldSet>

        {form.hasInstructorProfile ? (
          <Alert>
            <Info />
            <AlertDescription>
              Chức danh và phần giới thiệu trên trang cá nhân lấy từ hồ sơ giảng viên đã được duyệt của bạn.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="headline">Chức danh</FieldLabel>
              <Input
                id="headline"
                value={form.headline ?? ''}
                onChange={(e) => set({ headline: e.target.value })}
                maxLength={HEADLINE_MAX}
                placeholder="Ví dụ: Sinh viên CNTT năm 3, đang học front-end"
              />
              <FieldDescription>Một dòng ngay dưới tên bạn. Tối đa {HEADLINE_MAX} ký tự.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="bio">Giới thiệu</FieldLabel>
              <Textarea
                id="bio"
                value={form.bio ?? ''}
                onChange={(e) => set({ bio: e.target.value })}
                maxLength={BIO_MAX}
                rows={5}
                className="min-h-32"
              />
              <FieldDescription className="flex justify-between gap-4">
                <span>Bạn đang học gì, làm gì, muốn đi tới đâu. Không chèn link.</span>
                <span className="shrink-0 tabular-nums">
                  {(form.bio ?? '').length}/{BIO_MAX}
                </span>
              </FieldDescription>
            </Field>
          </>
        )}

        <Field orientation="horizontal" className="rounded-xl border p-4">
          <FieldContent>
            <FieldLabel htmlFor="learningPublic">Công khai phần học tập</FieldLabel>
            <FieldDescription>
              Khi bật, ai mở trang cá nhân của bạn cũng thấy khoá đang học, khoá đã hoàn thành, chứng chỉ và điểm kỹ năng.
              Khi tắt, họ chỉ thấy tên, chức danh và phần giới thiệu.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="learningPublic"
            checked={form.learningPublic}
            onCheckedChange={(v) => set({ learningPublic: v })}
          />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Sở thích học tập</p>
            <p className="text-sm text-muted-foreground">Nghề, kỹ năng quan tâm và trình độ, dùng để gợi ý khoá học.</p>
          </div>
          <Link href="/onboarding" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Chỉnh sửa
          </Link>
        </div>
      </FieldGroup>

      <div>
        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}

function ProfileTabSkeleton() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-busy="true" aria-label="Đang tải hồ sơ">
      <Skeleton className="h-[6.5rem] rounded-2xl" />
      <div className="flex flex-col gap-5">
        <div className="flex gap-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
