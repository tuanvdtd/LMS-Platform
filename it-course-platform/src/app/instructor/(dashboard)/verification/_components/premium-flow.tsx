'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Check, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { BankFields, type BankFieldErrors, EMPTY_BANK } from '@/components/shared/bank-fields';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { becomePremium, getPayoutAccount } from '@/lib/api/revenue';
import type { BankAccount, PayoutAccountState } from '@/types/revenue';

type Info = { headline: string; bio: string; linkedin: string; github: string };
type ApiError = { path: string[]; message: string };

const STEPS = ['Hồ sơ giảng viên', 'Tài khoản nhận tiền'];

// Đăng ký giảng viên cao cấp (spec pricing-submit-review §3.3): tự động, không cần admin duyệt hồ sơ.
export function PremiumFlow() {
  const [state, setState] = useState<PayoutAccountState | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [info, setInfo] = useState<Info>({ headline: '', bio: '', linkedin: '', github: '' });
  const [bank, setBank] = useState<BankAccount>(EMPTY_BANK);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPayoutAccount().then(setState, () => toast.error('Không tải được trạng thái giảng viên'));
  }, []);

  async function submit() {
    setSaving(true);
    setErrors({});
    try {
      setState(
        await becomePremium({
          headline: info.headline.trim(),
          bio: info.bio.trim() || undefined,
          socials: { linkedin: info.linkedin.trim() || undefined, github: info.github.trim() || undefined },
          bank: { ...bank, bankAccountName: bank.bankAccountName.trim() },
          agreeTerms: true,
        }),
      );
      toast.success('Bạn đã là giảng viên cao cấp');
    } catch (e) {
      const res = axios.isAxiosError(e) ? e.response : undefined;
      const list = res?.status === 400 ? (res.data?.errors as ApiError[] | undefined) : undefined;
      if (list?.length) {
        // path: ['headline'] | ['socials','github'] | ['bank','bankBin'] → key = phần tử cuối.
        setErrors(Object.fromEntries(list.map((x) => [x.path.at(-1) ?? '', x.message])));
        if (list.some((x) => x.path[0] !== 'bank' && x.path[0] !== 'agreeTerms')) setStep(1);
      } else if (res?.status === 409) {
        getPayoutAccount().then(setState, () => undefined);
      } else {
        toast.error('Không gửi được, thử lại');
      }
    } finally {
      setSaving(false);
    }
  }

  if (state === null) return <Skeleton className="h-64 w-full max-w-2xl" />;

  if (state.verified) {
    return (
      <div className="flex max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-8" />
        </div>
        <h1 className="text-2xl font-extrabold">Bạn là giảng viên cao cấp</h1>
        <p className="text-sm text-muted-foreground">
          Bạn có thể đặt giá trả phí cho khoá học. Thông tin nhận tiền sửa ở trang Hồ sơ.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/instructor/courses" className={buttonVariants()}>
            Về khoá học của tôi
          </Link>
          <Link href="/instructor/profile" className={buttonVariants({ variant: 'outline' })}>
            Sửa thông tin nhận tiền
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Giảng viên cao cấp</h1>
        <p className="text-sm text-muted-foreground">
          Đăng ký để đặt giá trả phí cho khoá học và nhận doanh thu hằng tháng. Hoàn tất ngay, không cần chờ duyệt.
        </p>
      </div>

      <ol className="flex items-center gap-3" aria-label="Các bước đăng ký">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
              <span
                className={`flex size-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  done || active ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {done ? <Check className="size-4" /> : n}
              </span>
              <span className={`text-sm ${active ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
              {n < STEPS.length && <span className="mx-1 h-0.5 w-8 bg-border sm:w-12" />}
            </li>
          );
        })}
      </ol>

      <section className="space-y-5 rounded-2xl border bg-card p-6">
        {step === 1 ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="headline">Chức danh</Label>
              <Input
                id="headline"
                maxLength={60}
                value={info.headline}
                onChange={(e) => setInfo((f) => ({ ...f, headline: e.target.value }))}
                placeholder="Vd: Senior React Developer"
                aria-invalid={!!errors.headline}
              />
              {errors.headline && <p className="text-xs text-destructive">{errors.headline}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Giới thiệu bản thân (tuỳ chọn)</Label>
              <Textarea
                id="bio"
                rows={4}
                maxLength={2000}
                value={info.bio}
                onChange={(e) => setInfo((f) => ({ ...f, bio: e.target.value }))}
                aria-invalid={!!errors.bio}
              />
              {errors.bio && <p className="text-xs text-destructive">{errors.bio}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="linkedin">LinkedIn (tuỳ chọn)</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={info.linkedin}
                  onChange={(e) => setInfo((f) => ({ ...f, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/username"
                  aria-invalid={!!errors.linkedin}
                />
                {errors.linkedin && <p className="text-xs text-destructive">{errors.linkedin}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="github">GitHub (tuỳ chọn)</Label>
                <Input
                  id="github"
                  type="url"
                  value={info.github}
                  onChange={(e) => setInfo((f) => ({ ...f, github: e.target.value }))}
                  placeholder="https://github.com/username"
                  aria-invalid={!!errors.github}
                />
                {errors.github && <p className="text-xs text-destructive">{errors.github}</p>}
              </div>
            </div>
          </>
        ) : (
          <>
            <BankFields value={bank} onChange={setBank} errors={errors as BankFieldErrors} />
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
                <Label htmlFor="agree" className="text-sm font-normal leading-snug">
                  Tôi đồng ý điều khoản chia doanh thu của SkillPath và cam kết thông tin ngân hàng là của tôi
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-xs text-destructive">{errors.agreeTerms}</p>}
            </div>
          </>
        )}
      </section>

      <div className="flex items-center justify-between">
        {step === 2 ? (
          <Button variant="outline" onClick={() => setStep(1)} disabled={saving}>
            <ChevronLeft data-icon="inline-start" /> Quay lại
          </Button>
        ) : (
          <span />
        )}
        {step === 1 ? (
          <Button onClick={() => setStep(2)} disabled={!info.headline.trim()}>
            Tiếp <ChevronRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={!agree || saving}>
            {saving ? 'Đang gửi…' : 'Đăng ký'}
          </Button>
        )}
      </div>
    </div>
  );
}
