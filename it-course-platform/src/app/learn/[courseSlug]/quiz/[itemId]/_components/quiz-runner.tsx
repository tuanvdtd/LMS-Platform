'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Flag, Send } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AttemptSheet, SubmitPayload } from '@/types/learn-quiz';

type Saved = { answers: Record<string, string[]>; flagged: string[]; current: number };

// Đáp án giữ ở client theo attemptId, nộp một lần.
const storageKey = (attemptId: string) => `quiz-attempt:${attemptId}`;

export function clearSavedAttempt(attemptId: string) {
  try { localStorage.removeItem(storageKey(attemptId)); } catch { /* storage bị chặn */ }
}

// Chỉ giữ đáp án/đánh dấu còn khớp đề hiện tại (giảng viên có thể đã sửa câu).
function loadSaved(sheet: AttemptSheet): Saved {
  const empty: Saved = { answers: {}, flagged: [], current: 0 };
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(sheet.attemptId)) ?? 'null') as Partial<Saved> | null;
    if (!raw || typeof raw !== 'object') return empty;
    const answers: Record<string, string[]> = {};
    for (const q of sheet.questions) {
      const ids = raw.answers?.[q.id];
      if (Array.isArray(ids)) {
        const valid = ids.filter((id) => q.options.some((o) => o.id === id));
        if (valid.length) answers[q.id] = q.type === 'single_choice' ? valid.slice(0, 1) : valid;
      }
    }
    const flagged = Array.isArray(raw.flagged) ? raw.flagged.filter((id) => sheet.questions.some((q) => q.id === id)) : [];
    const current = Number.isInteger(raw.current) ? Math.min(Math.max(raw.current!, 0), sheet.questions.length - 1) : 0;
    return { answers, flagged, current };
  } catch {
    return empty;
  }
}

export function QuizRunner({
  title,
  sheet,
  submitting,
  onSubmit,
}: {
  title: string;
  sheet: AttemptSheet;
  submitting: boolean;
  onSubmit: (body: SubmitPayload) => void;
}) {
  // Runner chỉ render sau khi fetch ở client → đọc localStorage trong initializer không lệch hydrate.
  const [initial] = useState(() => loadSaved(sheet));
  const [answers, setAnswers] = useState(initial.answers);
  const [flagged, setFlagged] = useState(() => new Set(initial.flagged));
  const [current, setCurrent] = useState(initial.current);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = sheet.questions.length;
  const q = sheet.questions[current];
  const multi = q.type === 'multiple_choice';
  const selected = answers[q.id] ?? [];
  const answeredCount = sheet.questions.filter((x) => answers[x.id]?.length).length;
  const unanswered = total - answeredCount;

  useEffect(() => {
    try {
      const saved: Saved = { answers, flagged: [...flagged], current };
      localStorage.setItem(storageKey(sheet.attemptId), JSON.stringify(saved));
    } catch { /* storage đầy/bị chặn: vẫn làm bài được, chỉ mất khả năng khôi phục */ }
  }, [answers, flagged, current, sheet.attemptId]);

  function toggle(optionId: string) {
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      const next = !multi ? [optionId] : cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      return { ...prev, [q.id]: next };
    });
  }

  const go = (i: number) => setCurrent(Math.min(Math.max(i, 0), total - 1));

  function toggleFlag() {
    setFlagged((prev) => {
      const n = new Set(prev);
      if (n.has(q.id)) n.delete(q.id);
      else n.add(q.id);
      return n;
    });
  }

  function submit() {
    setConfirmOpen(false);
    onSubmit({
      answers: sheet.questions
        .filter((x) => answers[x.id]?.length)
        .map((x) => ({ questionId: x.id, optionIds: answers[x.id] })),
    });
  }

  // Phím tắt: 1–9 chọn đáp án, ←/→ chuyển câu. Bỏ qua khi đang gõ hoặc dialog mở.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirmOpen || submitting || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1); return; }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) { e.preventDefault(); toggle(q.options[n - 1].id); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section aria-labelledby="question-heading" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="truncate text-sm text-muted-foreground">{title} · Lần {sheet.attemptNo}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="question-heading" className="text-lg font-semibold text-foreground">
                Câu {current + 1} / {total}
              </h1>
              <Button variant={flagged.has(q.id) ? 'secondary' : 'outline'} aria-pressed={flagged.has(q.id)} onClick={toggleFlag} className="h-11">
                <Flag data-icon="inline-start" className={cn(flagged.has(q.id) && 'fill-current text-brand-accent')} aria-hidden />
                {flagged.has(q.id) ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
              </Button>
            </div>
            <Progress value={(answeredCount / total) * 100} aria-label={`Đã trả lời ${answeredCount} trên ${total} câu`} />
            <p className="text-sm text-muted-foreground">Đã trả lời {answeredCount}/{total} câu</p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <Badge variant="secondary">{multi ? 'Chọn nhiều' : 'Chọn 1'}</Badge>
            <Markdown className="text-base text-foreground">{q.stem}</Markdown>
          </div>

          <div role={multi ? 'group' : 'radiogroup'} aria-labelledby="question-heading" className="flex flex-col gap-3">
            {q.options.map((opt, i) => {
              const on = selected.includes(opt.id);
              return (
                // div thay button: nội dung Markdown có thể chứa p/pre/a, không hợp lệ trong <button>.
                <div
                  key={opt.id}
                  role={multi ? 'checkbox' : 'radio'}
                  aria-checked={on}
                  tabIndex={0}
                  onClick={() => toggle(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(opt.id); }
                  }}
                  className={cn(
                    'flex min-h-11 w-full cursor-pointer items-start gap-3 rounded-lg border-2 bg-card p-3 text-left transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:p-4',
                    on ? 'border-primary bg-(--primary-light)' : 'border-border hover:border-primary/60',
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

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" className="h-11" onClick={() => go(current - 1)} disabled={current === 0}>
              <ChevronLeft data-icon="inline-start" aria-hidden /> Trước
            </Button>
            {current < total - 1 ? (
              <Button className="h-11" onClick={() => go(current + 1)}>
                Tiếp <ChevronRight data-icon="inline-end" aria-hidden />
              </Button>
            ) : (
              <Button className="h-11" disabled={submitting} onClick={() => (unanswered ? setConfirmOpen(true) : submit())}>
                <Send data-icon="inline-start" aria-hidden /> {submitting ? 'Đang nộp…' : 'Nộp bài'}
              </Button>
            )}
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">Phím tắt: 1–9 chọn đáp án · ← → chuyển câu</p>
        </section>

        <aside aria-label="Danh sách câu hỏi" className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm lg:sticky lg:top-20 lg:self-start">
          <h2 className="text-sm font-semibold text-foreground">Danh sách câu</h2>
          <ol className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
            {sheet.questions.map((x, i) => {
              const done = !!answers[x.id]?.length;
              const isFlag = flagged.has(x.id);
              const label = `Câu ${i + 1}${done ? ', đã trả lời' : ', chưa trả lời'}${isFlag ? ', đã đánh dấu' : ''}`;
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={label}
                    aria-current={i === current ? 'step' : undefined}
                    className={cn(
                      'relative flex size-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                      done ? 'border-primary/40 bg-(--primary-light) text-primary' : 'border-border bg-background text-muted-foreground hover:bg-muted',
                      i === current && 'ring-2 ring-primary ring-offset-2 ring-offset-card',
                    )}
                  >
                    {i + 1}
                    {isFlag && <Flag aria-hidden className="absolute -top-1.5 -right-1.5 size-4 fill-current text-brand-accent" />}
                  </button>
                </li>
              );
            })}
          </ol>
          <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-sm border border-primary/40 bg-(--primary-light)" /> Đã trả lời</li>
            <li className="flex items-center gap-2"><span aria-hidden className="size-3 rounded-sm ring-2 ring-primary" /> Đang làm</li>
            <li className="flex items-center gap-2"><Flag aria-hidden className="size-3 fill-current text-brand-accent" /> Đánh dấu xem lại</li>
          </ul>
          <Button variant="outline" className="h-11" disabled={submitting} onClick={() => (unanswered ? setConfirmOpen(true) : submit())}>
            {submitting ? 'Đang nộp…' : 'Nộp bài'}
          </Button>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Còn {unanswered} câu chưa trả lời. Nộp bài?</AlertDialogTitle>
            <AlertDialogDescription>Câu chưa trả lời sẽ được tính là sai.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Làm tiếp</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={submit}>Nộp bài</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
