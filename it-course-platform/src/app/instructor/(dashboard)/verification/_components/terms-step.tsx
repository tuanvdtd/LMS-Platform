'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { acceptTerms } from '@/lib/api/instructor-application';
import { handleStepError, type StepProps, useStepSave } from './step-shared';

// Bước 3: điều khoản giảng viên. Tỉ lệ chia doanh thu đọc từ cài đặt hệ thống.
export function TermsStep({ view, onSaved, registerSave }: StepProps) {
  const [agree, setAgree] = useState(view.termsAccepted);
  const [saving, setSaving] = useState(false);
  // Đã tick mà chưa lưu → chuyển bước thì lưu luôn. Bỏ tick không có gì để lưu (đồng ý là một chiều).
  const run = useStepSave(agree && !view.termsAccepted, save, registerSave);
  const terms = [
    `Bạn nhận ${view.revenueSharePct}% doanh thu mỗi lượt bán khoá học của mình; SkillPath giữ phần còn lại.`,
    'Doanh thu được chốt và chuyển khoản hằng tháng vào tài khoản ngân hàng bạn khai ở bước sau.',
    'Giá khoá học cố định từ lần xuất bản đầu tiên; muốn giảm giá sau đó thì dùng coupon.',
    'Bạn cam kết sở hữu hoặc có quyền sử dụng toàn bộ nội dung đăng lên khoá học.',
  ];

  async function save(): Promise<boolean> {
    setSaving(true);
    try {
      const v = await acceptTerms();
      toast.success('Đã đồng ý điều khoản');
      onSaved(v);
      return true;
    } catch (e) {
      handleStepError(e, () => undefined);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
        {terms.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="flex items-start gap-2">
        {/* Đồng ý là một chiều: đã lưu thì khoá ô, không cho bỏ tick */}
        <Checkbox
          id="agree"
          checked={agree}
          disabled={view.termsAccepted}
          onCheckedChange={(v) => setAgree(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="agree" className="text-sm font-normal leading-snug">
          Tôi đã đọc và đồng ý điều khoản dành cho giảng viên của SkillPath
        </Label>
      </div>
      <div>
        {/* Đã đồng ý trước đó → chỉ đi tiếp, không PUT lại để giữ nguyên thời điểm đồng ý */}
        {view.termsAccepted ? (
          <Button onClick={() => onSaved(view)}>Tiếp tục</Button>
        ) : (
          <Button onClick={run} disabled={!agree || saving}>
            {saving ? 'Đang lưu…' : 'Lưu và tiếp tục'}
          </Button>
        )}
      </div>
    </div>
  );
}
