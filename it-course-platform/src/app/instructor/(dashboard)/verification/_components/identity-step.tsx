'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { ArrowUpRight, BadgeCheck, Clock, IdCard, LoaderCircle, ScanFace, TriangleAlert, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORT_EMAIL } from '@/app/(student)/_components/legal-page';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { startIdentity, syncIdentity } from '@/lib/api/instructor-application';
import { StepFooter } from './step-footer';
import { handleStepError, type StepProps } from './step-shared';

const HOW = [
  { icon: IdCard, title: 'Chụp 2 mặt giấy tờ', text: 'Căn cước hoặc hộ chiếu còn hạn' },
  { icon: ScanFace, title: 'Chụp khuôn mặt', text: 'Nhìn thẳng camera, đủ sáng' },
  { icon: Undo2, title: 'Quay lại Aolumi', text: 'Xong là tự quay về đây' },
];
const NOTICE = [
  'Aolumi cần biết đúng người bán khoá trả phí và nhận doanh thu, để chi trả và chống mạo danh.',
  'Việc chụp và kiểm tra do đối tác xác minh danh tính của Aolumi thực hiện, trên trang xác minh riêng.',
  'Ảnh chân dung được dùng để so khớp khuôn mặt với ảnh trên giấy tờ, đây là dữ liệu sinh trắc học.',
  'Aolumi không giữ ảnh của bạn. Aolumi chỉ lưu kết quả, họ tên trên giấy tờ và một mã băm của số giấy tờ để mỗi giấy tờ chỉ dùng cho một tài khoản.',
];
const POLL_TRIES = 5;
const POLL_MS = 3000;

const providerDown = (e: unknown) => axios.isAxiosError(e) && e.response?.status === 502;

// Màn 2: xác minh danh tính qua Didit. Chuyển hẳn sang trang Didit (to, rõ hơn modal); xong Didit đưa về,
// returning = vừa từ Didit về → hỏi lại kết quả vài lần vì Didit có thể chưa chấm xong.
export function IdentityStep({ view, onSaved, onUpdate, go, returning }: StepProps) {
  const { status, name, issue } = view.identity;
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(returning && status === 'pending');
  const [gaveUp, setGaveUp] = useState(false);
  // Phiên đang dở thì đã đồng ý lúc tạo phiên, không hỏi lại.
  const needsConsent = status === null || status === 'declined';

  useEffect(() => {
    if (!polling) return;
    let stopped = false;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      tries++;
      const v = await syncIdentity().catch(() => null);
      if (stopped) return;
      if (v) onUpdate(v);
      if (v && v.identity.status !== 'pending') return setPolling(false);
      if (tries >= POLL_TRIES) {
        setPolling(false);
        return setGaveUp(true);
      }
      timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, POLL_MS / 2);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [polling, onUpdate]);

  // Bấm Back từ trang xác minh: trình duyệt khôi phục trang từ bộ nhớ đệm, giữ nguyên busy = true → mở lại nút.
  useEffect(() => {
    const restore = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(false);
    };
    window.addEventListener('pageshow', restore);
    return () => window.removeEventListener('pageshow', restore);
  }, []);

  async function start() {
    setBusy(true);
    try {
      const { url } = await startIdentity();
      // Giữ busy: trang đang chuyển đi, không cho bấm lần hai.
      window.location.assign(url);
    } catch (e) {
      setBusy(false);
      if (providerDown(e)) toast.error('Không kết nối được dịch vụ xác minh, thử lại sau ít phút');
      else handleStepError(e, () => undefined);
    }
  }

  const startLabel = status === 'pending' ? 'Tiếp tục xác minh' : status === 'declined' ? 'Xác minh lại' : 'Bắt đầu xác minh';
  const showHow = status !== 'approved' && status !== 'in_review' && !polling;

  return (
    <>
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        {status === 'approved' && (
          <Alert variant="success">
            <BadgeCheck aria-hidden />
            <AlertTitle>Đã xác minh danh tính</AlertTitle>
            <AlertDescription>
              Họ tên trên giấy tờ: <span className="font-semibold text-foreground">{name ?? 'không đọc được tên'}</span>. Tên này
              chỉ người duyệt đơn thấy, không hiện công khai.
            </AlertDescription>
          </Alert>
        )}
        {status === 'in_review' && (
          <Alert variant="warning">
            <Clock aria-hidden />
            <AlertTitle>Hồ sơ đang được xem xét thêm</AlertTitle>
            <AlertDescription>
              Một số hồ sơ cần người kiểm tra lại. Có kết quả, bạn sẽ nhận thông báo. Trong lúc chờ, bạn khai tài khoản nhận
              tiền được.
            </AlertDescription>
          </Alert>
        )}
        {polling && (
          <Alert>
            <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden />
            <AlertTitle>Đang lấy kết quả xác minh…</AlertTitle>
            <AlertDescription>Thường mất vài giây. Bạn cứ để trang mở.</AlertDescription>
          </Alert>
        )}
        {status === 'pending' && !polling && (
          <Alert>
            <Clock aria-hidden />
            <AlertTitle>{gaveUp ? 'Chưa có kết quả xác minh' : 'Bạn chưa hoàn tất xác minh'}</AlertTitle>
            <AlertDescription>
              {gaveUp
                ? 'Nếu bạn đã làm xong các bước xác minh, kết quả sẽ tự cập nhật và bạn sẽ nhận thông báo. Nếu chưa, tiếp tục xác minh.'
                : 'Phiên xác minh vẫn còn. Tiếp tục từ chỗ đã dừng.'}
            </AlertDescription>
          </Alert>
        )}
        {status === 'declined' && (
          <Alert variant="warning">
            <TriangleAlert aria-hidden />
            {issue === 'duplicate_document' ? (
              <>
                <AlertTitle>Giấy tờ này đã được dùng cho tài khoản khác</AlertTitle>
                <AlertDescription>
                  Mỗi giấy tờ chỉ xác minh được cho một tài khoản giảng viên cao cấp. Nếu đây là nhầm lẫn, hãy liên hệ{' '}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-primary underline underline-offset-4">
                    {SUPPORT_EMAIL}
                  </a>
                  .
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertTitle>Xác minh chưa thành công</AlertTitle>
                <AlertDescription>Thử lại với ảnh giấy tờ rõ nét, đủ sáng, không loá; khuôn mặt nhìn thẳng camera.</AlertDescription>
              </>
            )}
          </Alert>
        )}

        {showHow && (
          <>
            <ol className="flex flex-col gap-4">
              {HOW.map((s, i) => (
                <li key={s.title} className="flex flex-1 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <s.icon className="size-5" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">
                      <span className="sr-only">Bước {i + 1}: </span>
                      {s.title}
                    </span>
                    <span className="text-sm text-muted-foreground">{s.text}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">Khoảng 2–3 phút, cần thiết bị có camera.</p>

            <details className="group rounded-lg border px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium outline-none select-none focus-visible:underline">
                Dữ liệu của bạn được xử lý thế nào
              </summary>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed text-foreground/85">
                {NOTICE.map((t) => (
                  <li key={t}>{t}</li>
                ))}
                <li>
                  Chi tiết xem{' '}
                  <Link href="/privacy#xac-minh-danh-tinh" target="_blank" className="font-medium text-primary underline underline-offset-4">
                    Chính sách bảo mật
                  </Link>
                  .
                </li>
              </ul>
            </details>

            {needsConsent && (
              <Field orientation="horizontal">
                <Checkbox id="identity-agree" checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
                <FieldLabel htmlFor="identity-agree" className="font-normal leading-snug">
                  Tôi đồng ý cho việc chụp và xử lý ảnh giấy tờ, ảnh chân dung của tôi để xác minh danh tính
                </FieldLabel>
              </Field>
            )}
          </>
        )}
      </div>

      <StepFooter onBack={() => go('profile')}>
        {status === 'approved' ? (
          <Button onClick={() => onSaved(view)}>Tiếp tục</Button>
        ) : status === 'in_review' ? (
          <Button onClick={() => go('payout')}>Khai tài khoản nhận tiền</Button>
        ) : polling ? (
          <Button disabled>Đang lấy kết quả…</Button>
        ) : (
          <>
            <span className="hidden text-xs text-muted-foreground sm:inline">Bạn sẽ chuyển sang trang xác minh</span>
            <Button onClick={start} disabled={busy || (needsConsent && !agree)}>
              {busy ? 'Đang chuyển…' : startLabel}
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </>
        )}
      </StepFooter>
    </>
  );
}
