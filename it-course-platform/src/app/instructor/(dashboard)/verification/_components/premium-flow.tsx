'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getApplication } from '@/lib/api/instructor-application';
import { cn } from '@/lib/utils';
import { type ApplicationStep, type ApplicationView, STEP_LABEL, STEPS } from '@/types/instructor-application';
import { AvatarStep } from './avatar-step';
import { InfoStep } from './info-step';
import { PayoutStep } from './payout-step';
import { ReviewStep } from './review-step';
import type { StepSave } from './step-shared';
import { TermsStep } from './terms-step';

type Screen = ApplicationStep | 'review';
const SCREENS = { info: InfoStep, avatar: AvatarStep, terms: TermsStep, payout: PayoutStep, review: ReviewStep };

const GRID = 'grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)]';

// Bước đầu tiên còn thiếu; đủ hết → màn tóm tắt.
const firstScreen = (v: ApplicationView): Screen => v.missing[0]?.step ?? 'review';

// Đơn giảng viên cao cấp kiểu Udemy: 4 bước, mỗi bước lưu lên server, admin duyệt.
export function PremiumFlow() {
  const [view, setView] = useState<ApplicationView | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [screen, setScreen] = useState<Screen>('info');
  // Ref, không phải state: chỉ đọc lúc bấm stepper, không cần render lại.
  // pendingSave: hàm lưu của bước đang có thay đổi chưa lưu. target: bước sẽ sang sau khi lưu xong.
  const pendingSave = useRef<StepSave | null>(null);
  const target = useRef<Screen | null>(null);
  const registerSave = useCallback((save: StepSave | null) => {
    pendingSave.current = save;
  }, []);
  // Đổi bước → đưa tiêu điểm lên tiêu đề bước: trình đọc màn hình đọc tên bước mới, màn hẹp về đầu form.
  // Không làm ở lần mở trang đầu để khỏi giật tiêu điểm khi người dùng chưa thao tác.
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [screen]);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); reset lỗi ở onClick "Thử lại".
  const load = useCallback(() => {
    getApplication().then(
      (v) => {
        setView(v);
        setScreen(firstScreen(v));
      },
      () => setLoadFailed(true),
    );
  }, []);
  useEffect(() => load(), [load]);

  // Màn đang mở, đọc trong saved(): lần lưu kết thúc sau khi người dùng đã sang bước khác thì không kéo họ về.
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  });

  if (view?.displayStatus === 'approved') return <Approved />;
  if (view?.displayStatus === 'pending') return <Pending submittedAt={view.submittedAt} />;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">Đăng ký giảng viên cao cấp</h1>
        <p className="text-sm text-muted-foreground">
          Giảng viên cao cấp được đặt giá trả phí cho khoá học và nhận doanh thu hằng tháng. Khoá miễn phí không cần đăng ký.
        </p>
      </div>
      {loadFailed ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được đơn đăng ký</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            Kiểm tra kết nối rồi thử lại.
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLoadFailed(false);
                load();
              }}
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : view ? (
        renderWizard(view)
      ) : (
        <div className={GRID}>
          <div className="flex flex-col gap-1">
            {STEPS.map((s) => (
              <Skeleton key={s} className="h-11 w-full rounded-lg" />
            ))}
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      )}
    </div>
  );

  function renderWizard(view: ApplicationView) {
    const missing = new Set(view.missing.map((m) => m.step));
    // Lưu bằng nút "Lưu và tiếp tục" → sang bước còn thiếu; lưu do bấm stepper → sang đúng bước vừa bấm.
    // Chỉ chuyển màn khi người dùng còn đứng ở bước vừa lưu (hoặc đang chờ sang bước đã bấm).
    const saved = (v: ApplicationView) => {
      setView(v);
      if (!target.current && screenRef.current !== screen) return;
      moved.current = true;
      setScreen(target.current ?? firstScreen(v));
    };
    // Bấm sang bước khác: bước hiện tại còn thay đổi thì tự lưu trước; lưu lỗi → ở lại, lỗi hiện dưới ô.
    const go = async (s: Screen) => {
      if (s === screen || target.current) return;
      const save = pendingSave.current;
      if (!save) {
        moved.current = true;
        return setScreen(s);
      }
      target.current = s;
      try {
        await save();
      } finally {
        target.current = null;
      }
    };
    const Current = SCREENS[screen];

    return (
      <>
        {view.rejectReason && (
          <Alert variant="destructive">
            <AlertTitle>Đơn trước bị từ chối</AlertTitle>
            <AlertDescription className="whitespace-pre-line">Lý do: {view.rejectReason}</AlertDescription>
          </Alert>
        )}

        <div className={GRID}>
          <ol aria-label="Các bước đăng ký" className="flex flex-col gap-1">
            {[...STEPS, 'review' as const].map((s, i) => {
              const done = s !== 'review' && !missing.has(s);
              const active = screen === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => void go(s)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                      active ? 'bg-muted font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums',
                        done
                          ? 'border-primary bg-primary text-primary-foreground'
                          : active
                            ? 'border-primary text-primary'
                            : 'border-border text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
                    </span>
                    <span className={cn(done && !active && 'text-foreground')}>
                      {s === 'review' ? 'Gửi đơn' : STEP_LABEL[s]}
                    </span>
                    {done && <span className="sr-only">(đã xong)</span>}
                  </button>
                </li>
              );
            })}
          </ol>

          <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
            <h2 ref={heading} tabIndex={-1} className="mb-5 text-lg font-bold outline-none">
              {screen === 'review' ? 'Kiểm tra và gửi đơn' : STEP_LABEL[screen]}
            </h2>
            {/* key: đổi bước → form dựng lại từ dữ liệu đã lưu, không giữ state bước cũ */}
            <Current key={screen} view={view} onSaved={saved} registerSave={registerSave} />
          </section>
        </div>
      </>
    );
  }
}

function Approved() {
  return (
    <div className="flex max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ShieldCheck className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-extrabold">Bạn là giảng viên cao cấp</h1>
      <p className="text-sm text-muted-foreground">Bạn có thể đặt giá trả phí cho khoá học. Thông tin nhận tiền sửa ở trang Hồ sơ.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/instructor/courses" className={buttonVariants()}>
          Về khoá học của tôi
        </Link>
        <Link href="/instructor/profile" className={buttonVariants({ variant: 'outline' })}>
          Sửa thông tin nhận tiền
        </Link>
      </div>
    </div>
  );
}

function Pending({ submittedAt }: { submittedAt: string | null }) {
  return (
    <div className="flex max-w-2xl flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Clock className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-extrabold">Đơn đang chờ duyệt</h1>
      <p className="text-sm text-pretty text-muted-foreground">
        {submittedAt && `Gửi lúc ${new Date(submittedAt).toLocaleString('vi-VN')}. `}
        SkillPath duyệt trong khoảng 2 ngày làm việc, kết quả gửi qua email. Trong lúc chờ bạn vẫn tạo khoá miễn phí được.
      </p>
      <Link href="/instructor/courses" className={buttonVariants({ variant: 'outline' })}>
        Về khoá học của tôi
      </Link>
    </div>
  );
}
