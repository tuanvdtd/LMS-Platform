'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Clock, TriangleAlert, UserRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getApplication } from '@/lib/api/instructor-application';
import { useNotificationStore } from '@/lib/notification-store';
import { cn } from '@/lib/utils';
import { type ApplicationView, type Screen, SCREEN_LABEL, SCREEN_OF, SCREENS } from '@/types/instructor-application';
import { ApplicationChecklist, missingScreens } from './application-checklist';
import { IdentityStep } from './identity-step';
import { PayoutStep } from './payout-step';
import { ProfileStep } from './profile-step';
import { ReviewStep } from './review-step';
import { StartScreen } from './start-screen';
import { ApprovedScreen, PendingScreen } from './status-screens';
import type { StepSave } from './step-shared';

const STEP_OF = { profile: ProfileStep, identity: IdentityStep, payout: PayoutStep, review: ReviewStep };
const INTRO: Record<Screen, string> = {
  profile: 'Học viên thấy phần này trên trang giảng viên và trang khoá học.',
  identity: 'Aolumi cần biết đúng người bán khoá trả phí và nhận doanh thu.',
  payout: 'Nơi Aolumi chuyển doanh thu của bạn hằng tháng.',
  review: 'Kiểm tra lần cuối, đồng ý điều khoản rồi gửi cho Aolumi duyệt.',
};
// 3 phần cần chuẩn bị; màn cuối chỉ là gửi.
const PARTS = SCREENS.length - 1;
const GRID = 'grid items-start gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_17rem]';

// Màn đầu tiên còn thiếu (bỏ điều khoản: đồng ý ở màn gửi); đủ hết → màn gửi.
const firstScreen = (v: ApplicationView): Screen => {
  const m = v.missing.find((x) => x.step !== 'terms');
  return m ? SCREEN_OF[m.step] : 'review';
};
// Didit gọi callback kèm query (verificationSessionId, status).
const fromDidit = () => {
  const p = new URLSearchParams(window.location.search);
  return p.has('verificationSessionId') || p.has('status');
};

type Mark = 'done' | 'warn' | 'wait' | null;
function markOf(v: ApplicationView, s: Screen): Mark {
  if (s === 'identity') {
    const st = v.identity.status;
    if (st === 'approved') return 'done';
    if (st === 'declined') return 'warn';
    if (st === 'in_review') return 'wait';
    return null;
  }
  if (s === 'review') return null;
  return v.missing.some((m) => SCREEN_OF[m.step] === s) ? null : 'done';
}
const MARK_SR: Record<Exclude<Mark, null>, string> = { done: 'đã xong', warn: 'cần làm lại', wait: 'đang chờ kết quả' };

// Đơn giảng viên cao cấp: 4 màn, mỗi màn lưu lên server, admin duyệt.
export function PremiumFlow() {
  const [view, setView] = useState<ApplicationView | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [screen, setScreen] = useState<Screen | 'start'>('profile');
  // Vừa được Didit đưa về: màn xác minh hỏi lại kết quả vài lần.
  const [returning, setReturning] = useState(false);
  // Ref, không phải state: chỉ đọc lúc bấm stepper, không cần render lại.
  // pendingSave: hàm lưu của màn đang có thay đổi chưa lưu. target: màn sẽ sang sau khi lưu xong.
  const pendingSave = useRef<StepSave | null>(null);
  const target = useRef<Screen | null>(null);
  const registerSave = useCallback((save: StepSave | null) => {
    pendingSave.current = save;
  }, []);
  // Đổi màn → đưa tiêu điểm lên tiêu đề màn: trình đọc màn hình đọc tên màn mới, màn hẹp về đầu form.
  // Không làm ở lần mở trang đầu để khỏi giật tiêu điểm khi người dùng chưa thao tác.
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    heading.current?.focus();
    heading.current?.scrollIntoView({ block: 'nearest' });
  }, [screen]);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect); reset lỗi ở onClick "Thử lại".
  const load = useCallback((back = false) => {
    getApplication().then(
      (v) => {
        setView(v);
        setReturning(back);
        // Vừa từ Didit về → mở màn xác minh để thấy kết quả thay vì nhảy thẳng sang màn sau.
        if (back && v.displayStatus !== 'none') setScreen('identity');
        else setScreen(v.displayStatus === 'none' ? 'start' : firstScreen(v));
      },
      () => setLoadFailed(true),
    );
  }, []);
  // Chạy một lần: StrictMode chạy effect 2 lần, lần sau URL đã bị xoá query nên sẽ tưởng không phải từ Didit về.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const back = fromDidit();
    if (back) window.history.replaceState(null, '', window.location.pathname);
    load(back);
  }, [load]);

  // Có kết quả duyệt đơn lúc đang chờ → tải lại để sang màn đã duyệt / hiện lý do từ chối.
  // Có kết quả xác minh lúc đang làm đơn → chỉ cập nhật dữ liệu, không đổi màn (form đang gõ không mất).
  const lastReceived = useNotificationStore((s) => s.lastReceived);
  const handled = useRef<string | null>(null);
  useEffect(() => {
    const n = lastReceived;
    if (n?.type !== 'instructor_application' || handled.current === n.id) return;
    handled.current = n.id;
    if (view?.displayStatus === 'pending') load();
    else if (n.data.identity) getApplication().then(setView, () => undefined);
  }, [lastReceived, view?.displayStatus, load]);

  // Màn đang mở, đọc trong saved(): lần lưu kết thúc sau khi người dùng đã sang màn khác thì không kéo họ về.
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  });

  if (view?.displayStatus === 'approved') return <ApprovedScreen view={view} />;
  if (view?.displayStatus === 'pending') return <PendingScreen view={view} />;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex max-w-[72ch] flex-col gap-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">Đăng ký giảng viên cao cấp</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Giảng viên cao cấp đặt được giá trả phí cho khoá học và nhận doanh thu hằng tháng. Khoá miễn phí không cần đăng ký.
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
      ) : !view ? (
        <FlowSkeleton />
      ) : screen === 'start' ? (
        <StartScreen view={view} onStart={() => go('profile')} />
      ) : (
        renderWizard(view, screen)
      )}
    </div>
  );

  // Bấm sang màn khác: màn hiện tại còn thay đổi thì tự lưu trước; lưu lỗi → ở lại, lỗi hiện dưới ô.
  async function go(s: Screen) {
    if (s === screen || target.current) return;
    setReturning(false);
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
  }

  function renderWizard(view: ApplicationView, screen: Screen) {
    // Lưu bằng nút chính → sang màn còn thiếu; lưu do bấm stepper → sang đúng màn vừa bấm.
    // Chỉ chuyển màn khi người dùng còn đứng ở màn vừa lưu (hoặc đang chờ sang màn đã bấm).
    const saved = (v: ApplicationView) => {
      setView(v);
      if (!target.current && screenRef.current !== screen) return;
      moved.current = true;
      setReturning(false);
      setScreen(target.current ?? firstScreen(v));
    };
    const Current = STEP_OF[screen];
    const index = SCREENS.indexOf(screen);
    const done = PARTS - missingScreens(view);

    return (
      <>
        {view.rejectReason && (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertTitle>
              Đơn trước chưa được duyệt{view.rejectedAt && ` (ngày ${new Date(view.rejectedAt).toLocaleDateString('vi-VN')})`}
            </AlertTitle>
            <AlertDescription className="whitespace-pre-line">
              Lý do: {view.rejectReason}
              {'\n'}Sửa phần liên quan rồi gửi lại ở màn cuối.
            </AlertDescription>
          </Alert>
        )}

        <div className={GRID}>
          <nav aria-label="Các bước đăng ký" className="hidden flex-col gap-5 lg:sticky lg:top-20 lg:flex">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold tabular-nums">
                {done}/{PARTS} phần đã xong
              </span>
              <Progress value={(done / PARTS) * 100} aria-label="Tiến độ đơn đăng ký" />
            </div>
            <ol className="flex flex-col gap-1">
              {SCREENS.map((s, i) => {
                const mark = markOf(view, s);
                const active = screen === s;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      aria-current={active ? 'step' : undefined}
                      onClick={() => void go(s)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                        active ? 'bg-muted font-semibold text-foreground' : 'text-muted-foreground',
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold tabular-nums',
                          mark === 'done' && 'border-primary bg-primary text-primary-foreground',
                          mark === 'warn' && 'border-warning bg-warning-soft text-warning',
                          mark === 'wait' && 'border-warning-border bg-warning-soft text-warning',
                          !mark && (active ? 'border-primary text-primary' : 'border-border'),
                        )}
                      >
                        {mark === 'done' ? (
                          <Check className="size-3.5" aria-hidden />
                        ) : mark === 'warn' ? (
                          <TriangleAlert className="size-3.5" aria-hidden />
                        ) : mark === 'wait' ? (
                          <Clock className="size-3.5" aria-hidden />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className={cn(mark === 'done' && !active && 'text-foreground')}>{SCREEN_LABEL[s]}</span>
                      {mark && <span className="sr-only">({MARK_SR[mark]})</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <section aria-labelledby="step-title" className="min-w-0 rounded-2xl border bg-card">
            <div className="flex flex-col gap-3 border-b px-5 pt-5 pb-4 sm:px-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="step-title" ref={heading} tabIndex={-1} className="scroll-mt-24 text-xl font-bold outline-none">
                  {SCREEN_LABEL[screen]}
                </h2>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums lg:hidden">
                  Bước {index + 1}/{SCREENS.length}
                </span>
              </div>
              <Progress value={((index + 1) / SCREENS.length) * 100} aria-label="Tiến độ" className="lg:hidden" />
              <p className="text-sm text-muted-foreground">{INTRO[screen]}</p>
            </div>
            {/* key: đổi màn → form dựng lại từ dữ liệu đã lưu, không giữ state màn cũ */}
            <Current
              key={screen}
              view={view}
              onSaved={saved}
              onUpdate={setView}
              go={(s) => void go(s)}
              registerSave={registerSave}
              returning={returning}
            />
          </section>

          <aside aria-label="Xem trước hồ sơ" className="hidden xl:sticky xl:top-20 xl:block">
            {/* Màn gửi đơn đã có checklist đầy đủ, cột phải chỉ còn phần xem trước */}
            <ProfilePreview view={view} checklist={screen !== 'review'} />
          </aside>
        </div>
      </>
    );
  }
}

// Học viên sẽ thấy gì, cộng tình trạng từng phần của đơn. Đọc dữ liệu đã lưu, không theo từng phím gõ.
function ProfilePreview({ view, checklist }: { view: ApplicationView; checklist: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Học viên sẽ thấy</h2>
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          {view.image && <AvatarImage src={view.image} alt="" />}
          <AvatarFallback>
            <UserRound className="size-5 text-muted-foreground" aria-hidden />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{view.name}</span>
          <span className="truncate text-sm text-muted-foreground">{view.headline || 'Chưa có chức danh'}</span>
        </div>
      </div>
      {view.bio && <p className="line-clamp-4 text-sm leading-relaxed text-foreground/80">{view.bio}</p>}
      {checklist && (
        <>
          <Separator />
          <h2 className="text-sm font-semibold">Đơn của bạn</h2>
          <ApplicationChecklist view={view} compact />
        </>
      )}
    </div>
  );
}

function FlowSkeleton() {
  return (
    <div className={GRID}>
      <div className="hidden flex-col gap-2 lg:flex">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mb-3 h-2 w-full rounded-full" />
        {SCREENS.map((s) => (
          <Skeleton key={s} className="h-11 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[32rem] w-full rounded-2xl" />
      <Skeleton className="hidden h-80 w-full rounded-2xl xl:block" />
    </div>
  );
}
