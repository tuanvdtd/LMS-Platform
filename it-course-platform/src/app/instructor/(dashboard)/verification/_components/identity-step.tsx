'use client';

import { useState } from 'react';
import axios from 'axios';
import { BadgeCheck, Clock, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { startIdentity } from '@/lib/api/instructor-application';
import { handleStepError, type StepProps } from './step-shared';

const NOTICE = [
  'Aolumi cần biết đúng người nhận doanh thu, để chi trả và chống gian lận.',
  'Bạn chụp giấy tờ tuỳ thân (căn cước hoặc hộ chiếu) và một ảnh chân dung. Việc này do Didit, đơn vị xác minh danh tính, thực hiện.',
  'Ảnh chân dung được dùng để so khớp khuôn mặt, đây là dữ liệu sinh trắc học.',
  'Aolumi không giữ ảnh của bạn, chỉ lưu kết quả xác minh và họ tên trên giấy tờ.',
];

const providerDown = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 502;

// Bước 4: xác minh danh tính qua Didit. Không có form để lưu nên không đăng ký registerSave.
// Chuyển hẳn sang trang của Didit (to, rõ hơn modal); xong Didit đưa về trang này, GET đơn tự lấy kết quả mới.
export function IdentityStep({ view, onSaved }: StepProps) {
  const { status, name } = view.identity;
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  // Phiên đang dở thì đã đồng ý lúc tạo phiên, không hỏi lại.
  const needsConsent = status === null || status === 'declined';

  async function start() {
    setBusy(true);
    try {
      const { url } = await startIdentity();
      // Giữ busy: trang đang chuyển đi, không cho bấm lần hai.
      window.location.assign(url);
    } catch (e) {
      setBusy(false);
      if (providerDown(e)) toast.error('Không kết nối được dịch vụ xác minh, thử lại sau');
      else handleStepError(e, () => undefined);
    }
  }

  if (status === 'approved') {
    return (
      <div className="flex flex-col gap-6">
        <p className="flex items-center gap-2 text-sm">
          <BadgeCheck className="size-4 text-success" aria-hidden /> Đã xác minh: <span className="font-medium">{name}</span>
        </p>
        <div>
          <Button onClick={() => onSaved(view)}>Tiếp tục</Button>
        </div>
      </div>
    );
  }

  if (status === 'in_review') {
    return (
      <Alert>
        <Clock aria-hidden />
        <AlertTitle>Đang được xem xét</AlertTitle>
        <AlertDescription>
          Hồ sơ xác minh của bạn đang được xem xét thêm. Kết quả sẽ tự cập nhật khi bạn quay lại trang này.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {status === 'declined' && (
        <Alert variant="warning">
          <TriangleAlert aria-hidden />
          <AlertTitle>Xác minh chưa thành công</AlertTitle>
          <AlertDescription>Hãy thử lại với ảnh giấy tờ rõ nét, đủ sáng.</AlertDescription>
        </Alert>
      )}
      {status === 'pending' && (
        <p className="text-sm text-muted-foreground">Bạn chưa hoàn tất xác minh. Tiếp tục từ chỗ đã dừng.</p>
      )}
      {needsConsent && (
        <>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
            {NOTICE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Field orientation="horizontal">
            <Checkbox id="identity-agree" checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
            <FieldLabel htmlFor="identity-agree" className="font-normal leading-snug">
              Tôi đồng ý để Didit xử lý ảnh giấy tờ và ảnh chân dung của tôi cho việc xác minh danh tính
            </FieldLabel>
          </Field>
        </>
      )}
      <div>
        <Button onClick={start} disabled={busy || (needsConsent && !agree)}>
          {busy ? 'Đang chuyển…' : status === 'pending' ? 'Tiếp tục xác minh' : status === 'declined' ? 'Thử lại' : 'Bắt đầu xác minh'}
        </Button>
      </div>
    </div>
  );
}
