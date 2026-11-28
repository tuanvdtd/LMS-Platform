'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { acceptTerms, getApplication, submitApplication } from '@/lib/api/instructor-application';
import { formatVnd, PAYOUT_MIN_VND } from '@/types/revenue';
import { ApplicationChecklist, missingScreens } from './application-checklist';
import { StepFooter } from './step-footer';
import { handleStepError, type StepProps } from './step-shared';

// Màn 4: xem lại đúng những gì người duyệt sẽ xem, đồng ý điều khoản rồi gửi.
export function ReviewStep({ view, onSaved, onUpdate, go }: StepProps) {
  const [agree, setAgree] = useState(view.termsAccepted);
  const [sending, setSending] = useState(false);
  const left = missingScreens(view);
  const terms = [
    `Doanh thu chốt hằng tháng, chuyển khoản khi đủ ${formatVnd(PAYOUT_MIN_VND)}. Khoản thuộc đơn hàng bị hoàn tiền sẽ được khấu trừ.`,
    'Giá khoá học cố định từ lần xuất bản đầu tiên; muốn giảm giá sau đó thì dùng mã giảm giá.',
    'Bạn cam kết sở hữu hoặc có quyền sử dụng toàn bộ nội dung đăng lên khoá học.',
    'Bạn tự chịu trách nhiệm về nghĩa vụ thuế với thu nhập nhận từ Aolumi.',
  ];

  async function send() {
    setSending(true);
    try {
      // Đã đồng ý trước đó thì không PUT lại, giữ nguyên thời điểm đồng ý.
      if (!view.termsAccepted) await acceptTerms();
      const v = await submitApplication();
      window.scrollTo({ top: 0 });
      onSaved(v);
      toast.success('Đã gửi đơn, chờ Aolumi duyệt');
    } catch (e) {
      const data = axios.isAxiosError(e) ? e.response?.data : undefined;
      if (data?.code === 'APPLICATION_INCOMPLETE') {
        const list = (data.missing as { message: string }[] | undefined)?.map((m) => m.message).join(', ');
        toast.error(list ? `Đơn còn thiếu: ${list}` : 'Đơn còn thiếu thông tin');
        getApplication().then(onUpdate, () => undefined);
      } else {
        handleStepError(e, () => undefined, { failMessage: 'Không gửi được đơn, thử lại' });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8 p-5 sm:p-6">
        <section aria-labelledby="review-check" className="flex flex-col gap-4">
          <h3 id="review-check" className="font-bold">
            Người duyệt sẽ xem
          </h3>
          <ApplicationChecklist view={view} onEdit={go} />
        </section>

        <Separator />

        <section aria-labelledby="review-terms" className="flex flex-col gap-4">
          <h3 id="review-terms" className="font-bold">
            Điều khoản dành cho giảng viên
          </h3>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-4xl font-extrabold tracking-tight text-primary tabular-nums">{view.revenueSharePct}%</span>
            <span className="text-sm text-foreground/85">doanh thu mỗi lượt bán khoá là của bạn; Aolumi giữ phần còn lại.</span>
          </p>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-foreground/85">
            {terms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Link
            href="/terms#giang-vien"
            target="_blank"
            className="w-fit text-sm font-medium text-primary underline underline-offset-4"
          >
            Đọc đầy đủ điều khoản dành cho giảng viên
          </Link>
          <Field orientation="horizontal">
            {/* Đồng ý là một chiều: đã lưu thì khoá ô */}
            <Checkbox id="agree" checked={agree} disabled={view.termsAccepted} onCheckedChange={(v) => setAgree(v === true)} />
            <FieldLabel htmlFor="agree" className="font-normal leading-snug">
              Tôi đã đọc và đồng ý điều khoản dành cho giảng viên của Aolumi
            </FieldLabel>
          </Field>
        </section>
      </div>

      <StepFooter onBack={() => go('payout')}>
        <span className="text-sm text-muted-foreground" aria-live="polite">
          {left > 0
            ? `Còn ${left} phần chưa xong`
            : !agree
              ? 'Đánh dấu đồng ý điều khoản để gửi'
              : 'Aolumi duyệt trong khoảng 2 ngày làm việc'}
        </span>
        <Button onClick={send} disabled={sending || left > 0 || !agree}>
          {sending ? 'Đang gửi…' : 'Gửi đơn'}
        </Button>
      </StepFooter>
    </>
  );
}
