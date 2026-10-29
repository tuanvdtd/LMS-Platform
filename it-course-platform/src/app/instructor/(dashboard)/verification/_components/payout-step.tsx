'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BankFields, type BankFieldErrors, EMPTY_BANK } from '@/components/shared/bank-fields';
import { Button } from '@/components/ui/button';
import { savePayout } from '@/lib/api/instructor-application';
import type { BankAccount } from '@/types/revenue';
import { handleStepError, type StepProps, useStepSave } from './step-shared';

// Bước 4: tài khoản nhận doanh thu (VietQR). Không có phần thuế.
export function PayoutStep({ view, onSaved, registerSave }: StepProps) {
  const initial = view.bank ?? EMPTY_BANK;
  const [bank, setBank] = useState<BankAccount>(initial);
  const [errors, setErrors] = useState<BankFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const dirty = (Object.keys(EMPTY_BANK) as (keyof BankAccount)[]).some((k) => bank[k] !== initial[k]);
  const run = useStepSave(dirty, save, registerSave);

  async function save(): Promise<boolean> {
    setSaving(true);
    setErrors({});
    try {
      const v = await savePayout({ ...bank, bankAccountName: bank.bankAccountName.trim() });
      toast.success('Đã lưu tài khoản nhận tiền');
      onSaved(v);
      return true;
    } catch (e) {
      handleStepError(e, setErrors, { fields: Object.keys(EMPTY_BANK) });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">Tài khoản phải đứng tên bạn. Doanh thu chuyển khoản hằng tháng.</p>
      <BankFields value={bank} onChange={setBank} errors={errors} />
      <div>
        <Button onClick={run} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu và tiếp tục'}
        </Button>
      </div>
    </div>
  );
}
