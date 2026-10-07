'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getPayoutAccount, getVietQrBanks, savePayoutAccount } from '@/lib/api/revenue';
import type { BankAccount, PayoutAccountState, VietQrBank } from '@/types/revenue';

const EMPTY: BankAccount = { bankBin: '', bankAccountNo: '', bankAccountName: '' };
// Giống BE normalizeAccountName để người dùng thấy đúng tên sẽ lưu.
const toAccountName = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();

type FieldErrors = Partial<Record<keyof BankAccount, string>>;

// Thông tin nhận tiền (spec revenue-share-payout §5). Lưu bằng nút, không autosave; không có nút xoá (R10).
export function PayoutAccountCard() {
  const [state, setState] = useState<PayoutAccountState | null>(null);
  const [form, setForm] = useState<BankAccount>(EMPTY);
  const [banks, setBanks] = useState<VietQrBank[] | null>(null);
  const [banksError, setBanksError] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const saved = state?.account ?? EMPTY;
  const dirty = (Object.keys(EMPTY) as (keyof BankAccount)[]).some((k) => form[k] !== saved[k]);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); reset lỗi ở onClick "Thử lại".
  const loadBanks = useCallback(() => {
    getVietQrBanks().then(setBanks, () => setBanksError(true));
  }, []);

  useEffect(() => {
    getPayoutAccount().then(
      (s) => {
        setState(s);
        setForm(s.account ?? EMPTY);
      },
      () => toast.error('Không tải được thông tin nhận tiền'),
    );
    loadBanks();
  }, [loadBanks]);

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
      setForm(s.account ?? EMPTY);
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
          <span>Bạn cần được xác minh giảng viên trước khi khai thông tin nhận tiền.</span>
          <Link href="/instructor/verification" className={buttonVariants({ size: 'sm' })}>
            Xác minh ngay
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bank">Ngân hàng</Label>
              {banksError ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  Không tải được danh sách ngân hàng.
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBanksError(false);
                      loadBanks();
                    }}
                  >
                    Thử lại
                  </Button>
                </div>
              ) : (
                <Select
                  items={Object.fromEntries((banks ?? []).map((b) => [b.bin, b.shortName]))}
                  value={form.bankBin || null}
                  onValueChange={(bin) => setForm((f) => ({ ...f, bankBin: bin ?? '' }))}
                  disabled={!banks}
                >
                  <SelectTrigger id="bank" className="w-full" aria-invalid={!!errors.bankBin}>
                    <SelectValue placeholder={banks ? 'Chọn ngân hàng' : 'Đang tải…'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(banks ?? []).map((b) => (
                        <SelectItem key={b.bin} value={b.bin}>
                          <Image src={b.logo} alt="" width={40} height={16} className="h-4 w-10 object-contain" unoptimized />
                          {b.shortName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              {errors.bankBin && <p className="text-xs text-destructive">{errors.bankBin}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accountNo">Số tài khoản</Label>
              <Input
                id="accountNo"
                inputMode="numeric"
                value={form.bankAccountNo}
                onChange={(e) => setForm((f) => ({ ...f, bankAccountNo: e.target.value.replace(/\D/g, '').slice(0, 19) }))}
                aria-invalid={!!errors.bankAccountNo}
              />
              {errors.bankAccountNo && <p className="text-xs text-destructive">{errors.bankAccountNo}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accountName">Tên chủ tài khoản</Label>
              <Input
                id="accountName"
                value={form.bankAccountName}
                onChange={(e) => setForm((f) => ({ ...f, bankAccountName: e.target.value.slice(0, 50) }))}
                // Chuẩn hoá khi rời ô, không theo từng phím: tránh vỡ bộ gõ Telex/VNI giữa chừng.
                onBlur={() => setForm((f) => ({ ...f, bankAccountName: toAccountName(f.bankAccountName) }))}
                placeholder="NGUYEN VAN A"
                aria-invalid={!!errors.bankAccountName}
              />
              {errors.bankAccountName && <p className="text-xs text-destructive">{errors.bankAccountName}</p>}
            </div>
          </div>
          <Button onClick={save} disabled={!dirty || saving}>
            {saving ? 'Đang lưu…' : 'Lưu thông tin nhận tiền'}
          </Button>
        </>
      )}
    </section>
  );
}
