'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { BankFields, type BankFieldErrors, EMPTY_BANK } from '@/components/shared/bank-fields';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getPayoutAccount, savePayoutAccount } from '@/lib/api/revenue';
import type { BankAccount, PayoutAccountState } from '@/types/revenue';

// Thông tin nhận tiền (spec revenue-share-payout §5). Lưu bằng nút, không autosave; không có nút xoá (R10).
export function PayoutAccountCard() {
  const [state, setState] = useState<PayoutAccountState | null>(null);
  const [form, setForm] = useState<BankAccount>(EMPTY_BANK);
  const [errors, setErrors] = useState<BankFieldErrors>({});
  const [saving, setSaving] = useState(false);

  const saved = state?.account ?? EMPTY_BANK;
  const dirty = (Object.keys(EMPTY_BANK) as (keyof BankAccount)[]).some((k) => form[k] !== saved[k]);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect).
  useEffect(() => {
    getPayoutAccount().then(
      (s) => {
        setState(s);
        setForm(s.account ?? EMPTY_BANK);
      },
      () => toast.error('Không tải được thông tin nhận tiền'),
    );
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save() {
    setSaving(true);
    setErrors({});
    try {
      const s = await savePayoutAccount({ ...form, bankAccountName: form.bankAccountName.trim() });
      setState(s);
      setForm(s.account ?? EMPTY_BANK);
      toast.success('Đã lưu thông tin nhận tiền');
    } catch (e) {
      const list = axios.isAxiosError(e) && e.response?.status === 400 ? e.response.data?.errors : null;
      if (Array.isArray(list)) {
        setErrors(Object.fromEntries(list.map((x: { path: string[]; message: string }) => [x.path[0], x.message])));
      } else {
        toast.error('Không lưu được, thử lại');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-bold">Thông tin nhận tiền</h2>
        <p className="text-sm text-muted-foreground">
          Doanh thu được chuyển khoản vào tài khoản này mỗi tháng. Bắt buộc trước khi đặt giá cho khoá học.
        </p>
      </div>

      {!state ? (
        <Skeleton className="h-32 w-full" />
      ) : !state.verified ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4 text-sm">
          <span>Bạn cần đăng ký giảng viên cao cấp trước khi khai thông tin nhận tiền.</span>
          <Link href="/instructor/verification" className={buttonVariants({ size: 'sm' })}>
            Đăng ký ngay
          </Link>
        </div>
      ) : (
        <>
          <BankFields value={form} onChange={setForm} errors={errors} />
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? 'Đang lưu…' : 'Lưu thông tin nhận tiền'}
          </Button>
        </>
      )}
    </section>
  );
}
