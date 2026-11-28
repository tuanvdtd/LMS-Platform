'use client';

import { useState } from 'react';
import { CircleCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { BankFields, type BankFieldErrors, EMPTY_BANK, toAccountName } from '@/components/shared/bank-fields';
import { Button } from '@/components/ui/button';
import { savePayout } from '@/lib/api/instructor-application';
import { type BankAccount, formatVnd, PAYOUT_MIN_VND } from '@/types/revenue';
import { StepFooter } from './step-footer';
import { handleStepError, type StepProps, useStepSave } from './step-shared';

// Màn 3: tài khoản nhận doanh thu (VietQR). Nên chính chủ nhưng không bắt buộc: lệch tên giấy tờ chỉ nhắc, không chặn.
export function PayoutStep({ view, onSaved, registerSave, go }: StepProps) {
  const verifiedName = view.identity.status === 'approved' && view.identity.name ? toAccountName(view.identity.name) : '';
  // Chưa khai lần nào → điền sẵn tên trên giấy tờ. So dirty với chính giá trị điền sẵn để bấm sang bước khác không tự lưu nửa vời.
  const initial = view.bank ?? { ...EMPTY_BANK, bankAccountName: verifiedName };
  const [bank, setBank] = useState<BankAccount>(initial);
  const [errors, setErrors] = useState<BankFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const dirty = (Object.keys(EMPTY_BANK) as (keyof BankAccount)[]).some((k) => bank[k] !== initial[k]);
  const run = useStepSave(dirty, save, registerSave);
  const holder = toAccountName(bank.bankAccountName.trim());

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (dirty || !view.bank) void run();
    else onSaved(view);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-foreground/85">
          Doanh thu chốt hằng tháng và chuyển khoản khi đủ {formatVnd(PAYOUT_MIN_VND)}; chưa đủ thì cộng dồn sang tháng sau. Người duyệt
          đơn chỉ thấy 4 số cuối của số tài khoản.
        </p>
        <BankFields value={bank} onChange={setBank} errors={errors} />
        {verifiedName && holder && (
          holder === verifiedName ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CircleCheck className="size-4 shrink-0" aria-hidden />
              Khớp tên trên giấy tờ đã xác minh
            </p>
          ) : (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Khác tên trên giấy tờ <span className="font-medium text-foreground">{verifiedName}</span>. Bạn vẫn lưu được, nhưng tài khoản
                nên đứng tên bạn: tiền đã chuyển vào tài khoản người khác thì bạn tự chịu trách nhiệm.
              </span>
            </p>
          )
        )}
      </div>
      <StepFooter onBack={() => go('identity')}>
        <Button type="submit" disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu và tiếp tục'}
        </Button>
      </StepFooter>
    </form>
  );
}
