'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Clock, Loader2 } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatClock } from '@/lib/skills';
import { cn } from '@/lib/utils';
import type { AttemptState } from '@/types/skills';
import { useCountdown } from './use-countdown';

type QuestionState = Extract<AttemptState, { state: 'question' }>;

const LOW_MS = 2 * 60_000;

// Đổi đề (kể cả giảng viên sửa đáp án giữa chừng) → key đổi → mount lại, xoá lựa chọn cũ.
const questionKey = (s: QuestionState) => s.question.id + s.question.options.map((o) => o.id).join();

export function AssessmentRunner({
  state,
  offsetMs,
  busy,
  onAnswer,
  expireFailed,
  onExpire,
}: {
  state: QuestionState;
  offsetMs: number;
  busy: boolean;
  onAnswer: (optionIds: string[]) => void;
  expireFailed: boolean;
  onExpire: () => void;
}) {
  const msLeft = useCountdown(Date.parse(state.deadlineAt), offsetMs);
  const expired = msLeft <= 0;
  const low = !expired && msLeft < LOW_MS;
  const key = questionKey(state);
  // Câu đầu của lần mở này đứng yên; các câu sau trượt vào.
  const [firstKey] = useState(key);

  // Hết giờ → để cha lấy kết quả (cha tự thử lại nếu server chưa chốt).
  const expireRef = useRef(onExpire);
  useEffect(() => { expireRef.current = onExpire; });
  useEffect(() => { if (expired) expireRef.current(); }, [expired]);

  // Cho trình đọc màn hình: chuỗi chỉ đổi đúng 2 lần (mốc 5 phút, 1 phút); đồng hồ chính aria-hidden.
  // Chỉ báo mốc đồng hồ vừa đi qua lúc đang mở (vào lại khi còn 3:00 thì không báo "Còn 5 phút").
  const [startLeft] = useState(msLeft);
  const announce =
    msLeft <= 0 ? ''
      : msLeft <= 60_000 ? (startLeft > 60_000 ? 'Còn 1 phút' : '')
        : msLeft <= 5 * 60_000 ? (startLeft > 5 * 60_000 ? 'Còn 5 phút' : '')
          : '';

  return (
    <>
      <div className="sticky top-16 z-40 border-b bg-card">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm text-muted-foreground">{state.topic.name}</p>
            <p className="shrink-0 text-sm font-semibold text-foreground">Câu {state.position}/{state.total}</p>
            <p
              aria-hidden
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-semibold text-foreground',
                low && 'border-warning bg-warning-soft',
              )}
            >
              <Clock className={cn('size-4', low && 'text-warning')} />
              {formatClock(msLeft)}
              {low && <span className="font-sans text-xs font-semibold">Sắp hết giờ</span>}
            </p>
          </div>
          <Progress value={((state.position - 1) / state.total) * 100} aria-label={`Đã làm ${state.position - 1} trên ${state.total} câu`} />
          <p aria-live="polite" className="sr-only">{announce}</p>
        </div>
      </div>

      <Question key={key} state={state} busy={busy} expired={expired} expireFailed={expireFailed} animate={key !== firstKey} onAnswer={onAnswer} onExpire={onExpire} />
    </>
  );
}

function Question({
  state,
  busy,
  expired,
  expireFailed,
  animate,
  onAnswer,
  onExpire,
}: {
  state: QuestionState;
  busy: boolean;
  expired: boolean;
  expireFailed: boolean;
  animate: boolean;
  onAnswer: (optionIds: string[]) => void;
  onExpire: () => void;
}) {
  const q = state.question;
  const multi = q.type === 'multiple_choice';
  const [selected, setSelected] = useState<string[]>([]);
  const stemRef = useRef<HTMLDivElement>(null);
  const locked = busy || expired;

  // Focus về đề câu mới (nút vừa bấm đã unmount/đổi nghĩa).
  useEffect(() => { stemRef.current?.focus(); }, []);

  function toggle(id: string) {
    if (locked) return;
    setSelected((cur) => (!multi ? [id] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  // Chỉ phím 1–9 chọn/bỏ chọn đáp án (không phím tắt nào khác).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (locked || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      // Ô tìm kiếm trên header cũng nằm trong trang: không cướp phím khi đang gõ.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault();
        toggle(q.options[n - 1].id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      {/* overflow-x-clip: câu đang trượt vào không làm trang hiện thanh cuộn ngang. */}
      <div className="overflow-x-clip">
        <div
          className={cn(
            'flex flex-col gap-5',
            animate && 'animate-in duration-200 ease-out fade-in-0 slide-in-from-right-8 motion-reduce:animate-none',
          )}
        >
          <div
            ref={stemRef}
            tabIndex={-1}
            role="group"
            id="question-stem"
            aria-label={`Câu ${state.position}`}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm outline-none sm:p-5"
          >
            <Badge variant="secondary">{multi ? 'Chọn nhiều' : 'Chọn 1'}</Badge>
            <Markdown className="min-w-0 text-base text-foreground">{q.stem}</Markdown>
          </div>

          {multi && <p className="text-sm text-muted-foreground">Chọn tất cả đáp án đúng</p>}

          <div role={multi ? 'group' : 'radiogroup'} aria-labelledby="question-stem" className="flex flex-col gap-3">
            {q.options.map((opt, i) => {
              const on = selected.includes(opt.id);
              return (
                // div thay button: nội dung Markdown có thể chứa p/pre/a, không hợp lệ trong <button>.
                <div
                  key={opt.id}
                  role={multi ? 'checkbox' : 'radio'}
                  aria-checked={on}
                  aria-disabled={locked}
                  tabIndex={0}
                  onClick={() => toggle(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(opt.id); }
                  }}
                  className={cn(
                    'flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-lg border-2 bg-card p-3 text-left transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-4',
                    on ? 'border-primary bg-(--primary-light)' : 'border-border hover:border-primary/60',
                    locked && 'cursor-not-allowed opacity-70',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 flex size-6 shrink-0 items-center justify-center border-2 text-xs font-semibold',
                      multi ? 'rounded-md' : 'rounded-full',
                      on ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground',
                    )}
                  >
                    {on ? <Check className="size-3.5" /> : i < 9 ? i + 1 : null}
                  </span>
                  <Markdown className="min-w-0 flex-1 text-foreground">{opt.content}</Markdown>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="h-11" disabled={locked} onClick={() => onAnswer([])}>
              Tôi không biết
            </Button>
            <Button className="h-11" disabled={locked || !selected.length} onClick={() => onAnswer(selected)}>
              {busy && <Loader2 data-icon="inline-start" className="animate-spin motion-reduce:animate-none" aria-hidden />}
              Trả lời
            </Button>
          </div>
          {expired && (expireFailed ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-foreground">
              Hết giờ nhưng chưa lấy được kết quả.
              <Button variant="outline" className="h-11" onClick={onExpire}>Thử lại</Button>
            </div>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">Hết giờ — đang tính kết quả…</p>
          ))}
        </div>
      </div>
    </main>
  );
}
