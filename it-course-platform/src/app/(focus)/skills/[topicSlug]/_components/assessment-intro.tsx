'use client';

import Link from 'next/link';
import { ArrowLeft, ListChecks, LogOut, Play, Redo2, ShieldQuestion, Undo2, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatClock, formatWait, MASTERY_COLOR, MASTERY_LABEL, masteryLevel } from '@/lib/skills';
import type { SkillTopic } from '@/types/skills';
import { useCountdown } from './use-countdown';

const RULES = [
  { icon: Timer, text: '12 câu · 15 phút' },
  { icon: Undo2, text: 'Không quay lại câu trước' },
  { icon: ShieldQuestion, text: 'Không biết thì bấm "Tôi không biết" — đừng đoán, đoán bừa làm kết quả kém chính xác' },
  { icon: LogOut, text: 'Rời trang thì đồng hồ vẫn chạy' },
];

export const BACK_LINK = 'Về hồ sơ năng lực';

export function AssessmentIntro({
  topic,
  nextAvailableAt,
  resume,
  starting,
  onStart,
}: {
  topic: SkillTopic;
  nextAvailableAt: string | null;
  // Lượt dở: deadline (ms, giờ server) + độ lệch đồng hồ. null = không có lượt dở.
  resume: { deadlineMs: number; offsetMs: number } | null;
  starting: boolean;
  onStart: () => void;
}) {
  // Hook gọi vô điều kiện; không có lượt dở / chờ thì tham số chỉ là giá trị đệm.
  const resumeLeft = useCountdown(resume?.deadlineMs ?? 0, resume?.offsetMs ?? 0);
  const waitLeft = useCountdown(nextAvailableAt ? Date.parse(nextAvailableAt) : 0, 0);

  const resuming = !!topic.inProgressAttemptId && !!resume && resumeLeft > 0;
  const waiting = !resuming && !!nextAvailableAt && waitLeft > 0;
  const level = topic.pct === null ? null : masteryLevel(topic.pct);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <Link href="/skills" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {BACK_LINK}
      </Link>

      <section className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Đánh giá kỹ năng {topic.name}</h1>
          {level && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Hiện tại
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold text-foreground" style={{ borderColor: MASTERY_COLOR[level] }}>
                <span aria-hidden className="size-2 rounded-full" style={{ background: MASTERY_COLOR[level] }} />
                <span className="font-mono">{topic.pct}%</span> · {MASTERY_LABEL[level]}
              </span>
            </p>
          )}
        </div>

        <ul className="flex flex-col gap-3">
          {RULES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-foreground">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              {text}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button size="lg" className="h-11 w-full sm:w-auto" disabled={starting || waiting} onClick={onStart}>
            {resuming ? <Play data-icon="inline-start" aria-hidden /> : waiting ? <Redo2 data-icon="inline-start" aria-hidden /> : <ListChecks data-icon="inline-start" aria-hidden />}
            {starting
              ? 'Đang mở…'
              : resuming
                ? `Làm tiếp (còn ${formatClock(resumeLeft)})`
                : waiting
                  ? `Làm lại ${formatWait(waitLeft).toLowerCase()}`
                  : 'Bắt đầu'}
          </Button>
        </div>
      </section>
    </main>
  );
}

// Khớp bố cục màn giới thiệu: link quay lại, thẻ có tiêu đề, 4 dòng luật, nút.
export function AssessmentIntroSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10" role="status" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="mb-4 h-5 w-40" />
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:p-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-7 w-40 rounded-full" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="size-5 shrink-0 rounded" />
              <Skeleton className={cn('h-5', i === 3 ? 'w-full' : 'w-2/3')} />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full sm:ml-auto sm:w-44" />
      </div>
    </div>
  );
}
