'use client';

import { useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getApplication, submitApplication } from '@/lib/api/instructor-application';
import { handleStepError, type StepProps } from './step-shared';

// Tóm tắt trước khi nộp. 400 APPLICATION_INCOMPLETE → tải lại đơn, PremiumFlow tự mở bước còn thiếu.
export function ReviewStep({ view, onSaved }: StepProps) {
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    try {
      onSaved(await submitApplication());
      toast.success('Đã gửi đơn, chờ duyệt');
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.data?.code === 'APPLICATION_INCOMPLETE') {
        toast.error('Đơn còn thiếu thông tin');
        getApplication().then(onSaved, () => undefined);
      } else {
        handleStepError(e, () => undefined, { failMessage: 'Không gửi được đơn, thử lại' });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {view.image && (
          <Image
            src={view.image}
            alt=""
            width={64}
            height={64}
            unoptimized
            className="size-16 shrink-0 rounded-full object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="font-semibold">{view.name}</div>
          <div className="text-sm text-muted-foreground">{view.headline}</div>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed">{view.bio}</p>
      {view.bank && (
        <p className="text-sm">
          <span className="text-muted-foreground">Nhận tiền: </span>
          {view.bank.bankAccountName} · <span className="tabular-nums">••••{view.bank.bankAccountNo.slice(-4)}</span>
        </p>
      )}
      <Separator />
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-muted-foreground">SkillPath duyệt trong khoảng 2 ngày làm việc. Kết quả gửi qua email.</p>
        <Button onClick={send} disabled={sending}>
          {sending ? 'Đang gửi…' : 'Gửi đơn'}
        </Button>
      </div>
    </div>
  );
}
