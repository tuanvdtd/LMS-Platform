'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getVietQrBanks } from '@/lib/api/revenue';
import type { BankAccount, VietQrBank } from '@/types/revenue';

export const EMPTY_BANK: BankAccount = { bankBin: '', bankAccountNo: '', bankAccountName: '' };
export type BankFieldErrors = Partial<Record<keyof BankAccount, string>>;

// Giống BE normalizeAccountName để người dùng thấy đúng tên sẽ lưu.
const toAccountName = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase();

// Ô tài khoản nhận tiền: dùng ở thẻ "Thông tin nhận tiền" và form đăng ký giảng viên cao cấp.
export function BankFields({
  value,
  onChange,
  errors,
}: {
  value: BankAccount;
  onChange: (next: BankAccount) => void;
  errors: BankFieldErrors;
}) {
  const [banks, setBanks] = useState<VietQrBank[] | null>(null);
  const [banksError, setBanksError] = useState(false);
  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); reset lỗi ở onClick "Thử lại".
  const loadBanks = useCallback(() => {
    getVietQrBanks().then(setBanks, () => setBanksError(true));
  }, []);
  useEffect(() => loadBanks(), [loadBanks]);
  const set = (patch: Partial<BankAccount>) => onChange({ ...value, ...patch });

  return (
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
            value={value.bankBin || null}
            onValueChange={(bin) => set({ bankBin: bin ?? '' })}
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
          value={value.bankAccountNo}
          onChange={(e) => set({ bankAccountNo: e.target.value.replace(/\D/g, '').slice(0, 19) })}
          aria-invalid={!!errors.bankAccountNo}
        />
        {errors.bankAccountNo && <p className="text-xs text-destructive">{errors.bankAccountNo}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="accountName">Tên chủ tài khoản</Label>
        <Input
          id="accountName"
          value={value.bankAccountName}
          onChange={(e) => set({ bankAccountName: e.target.value.slice(0, 50) })}
          // Chuẩn hoá khi rời ô, không theo từng phím: tránh vỡ bộ gõ Telex/VNI giữa chừng.
          onBlur={() => set({ bankAccountName: toAccountName(value.bankAccountName) })}
          placeholder="NGUYEN VAN A"
          aria-invalid={!!errors.bankAccountName}
        />
        {errors.bankAccountName && <p className="text-xs text-destructive">{errors.bankAccountName}</p>}
      </div>
    </div>
  );
}
