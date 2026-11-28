'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowRight, BrainCircuit, Bug, ChartColumn, Check, Database, Ellipsis, Gamepad2, Infinity as InfinityIcon, Layers,
  Monitor, Network, Plus, Server, Smartphone, type LucideIcon,
} from 'lucide-react';
import { LogoMark } from '@/components/shared/logo-mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { LEARNER_LEVELS, OCCUPATION_LABEL, type LearnerLevel, type Occupation } from '@/types/preferences';
import { STEP_COUNT, useOnboarding } from './use-onboarding';
import { TopicSearch } from './topic-search';
import type { TrailState } from './onboarding-trail';

const OnboardingTrail = dynamic(() => import('./onboarding-trail').then((m) => m.OnboardingTrail), { ssr: false });

const OCCUPATIONS = Object.keys(OCCUPATION_LABEL) as Occupation[];

const OCCUPATION_ICON: Record<Occupation, LucideIcon> = {
  frontend_developer: Monitor,
  backend_developer: Server,
  fullstack_developer: Layers,
  mobile_developer: Smartphone,
  devops_engineer: InfinityIcon,
  data_engineer: Database,
  data_analyst: ChartColumn,
  ml_engineer: BrainCircuit,
  qa_engineer: Bug,
  software_architect: Network,
  game_developer: Gamepad2,
  other: Ellipsis,
};

const LEVEL_HINT: Record<LearnerLevel, string> = {
  beginner: 'Mới làm quen với lập trình hoặc mới học cú pháp cơ bản.',
  intermediate: 'Đã tự làm được vài dự án nhỏ, muốn hiểu sâu hơn.',
  advanced: 'Đã đi làm hoặc vững nền tảng, cần kiến thức chuyên sâu.',
};

const STEPS = [
  { name: 'Nghề', title: 'Bạn đang học để làm nghề gì?', lead: 'Chúng tôi dùng câu trả lời để gợi ý khoá học hợp với bạn.' },
  { name: 'Kỹ năng', title: 'Bạn quan tâm kỹ năng nào?', lead: 'Chọn bao nhiêu cũng được, có thể để trống.' },
  { name: 'Trình độ', title: 'Bạn đang ở trình độ nào?', lead: 'Giúp chúng tôi gợi ý khoá học không quá dễ, không quá khó.' },
] as const;

// Khớp artboard Trail 420×820 và TrailWide 400×120 (rive/trail.mjs): nhãn đứng cạnh cột mốc của cảnh
const TALL_LABEL = [['61.5%', '67.6%'], ['61.5%', '44.9%'], ['61.5%', '23.9%'], ['68%', '9%']];
const WIDE_LABEL_X = ['21.5%', '47.5%', '73%', '90%'];

const optionRow =
  'group/opt flex min-h-16 cursor-pointer items-center gap-3.5 border-b border-border py-3 text-[15px] font-medium transition-colors has-checked:text-primary has-disabled:cursor-not-allowed has-disabled:opacity-60';
const optionIcon =
  'grid size-10 shrink-0 place-items-center rounded-[10px] bg-secondary text-muted-foreground transition-colors group-hover/opt:text-foreground group-has-checked/opt:bg-primary group-has-checked/opt:text-primary-foreground [&_svg]:size-5';
const radioInput =
  'size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-muted-foreground/50 bg-background outline-none transition-[border-color,border-width] not-checked:group-hover/opt:border-foreground checked:border-[6px] checked:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed';

type Milestone = { name: string; status: string | null; done: boolean; current: boolean };

// Ba vạch giống biển mốc "Trình độ" trong cảnh Lumi
function LevelBars({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-5">
      {[6, 10, 14].map((h, i) => (
        <rect key={h} x={2.5 + i * 5.5} y={17 - h} width={4} height={h} rx={1.5} fill="currentColor" opacity={i < n ? 1 : 0.28} />
      ))}
    </svg>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-ink-foreground">
      <LogoMark className="h-7 text-ink-foreground" />
      <span className="text-lg font-semibold">aolumi</span>
    </span>
  );
}

export function OnboardingView() {
  const ob = useOnboarding();
  const { step, saving, arrived } = ob;
  const busy = saving || arrived;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef(step);
  const [shown, setShown] = useState({ step, forward: true });
  if (shown.step !== step) setShown({ step, forward: step > shown.step });

  // Đổi bước thì đưa tiêu điểm lên tiêu đề bước (trình đọc màn hình đọc câu hỏi mới).
  // So với bước trước thay vì cờ lần đầu: StrictMode chạy effect 2 lần lúc mount.
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const isLast = step === STEP_COUNT - 1;
  const reached = arrived ? STEP_COUNT : step;
  const topicCount = ob.topics.length;
  const answers = [
    ob.occupation && OCCUPATION_LABEL[ob.occupation],
    topicCount ? ob.topics.slice(0, 2).map((t) => t.name).join(', ') + (topicCount > 2 ? ` +${topicCount - 2}` : '') : null,
    ob.level && SKILL_LEVEL_LABEL[ob.level],
  ];
  const milestones: Milestone[] = [
    ...STEPS.map((s, i) => ({
      name: s.name,
      done: i < reached,
      current: i === reached,
      status: answers[i] || (i === reached ? 'Đang chọn' : i < reached ? (i === 1 ? 'Để trống' : 'Bỏ qua') : null),
    })),
    { name: 'Đích', status: 'Gợi ý khoá học', done: arrived, current: false },
  ];
  const trail: TrailState = {
    step: reached,
    patches: topicCount,
    level: ob.level ? LEARNER_LEVELS.indexOf(ob.level) + 1 : 0,
    pickKey: ob.pickKey,
    instantPatches: !ob.topicsTouched,
    instantLevel: !ob.levelTouched,
  };

  const exit = (onInk: boolean) => (
    <Button
      variant="ghost"
      disabled={busy}
      onClick={ob.saveAndExit}
      className={onInk ? 'text-ink-foreground hover:bg-ink-hover hover:text-ink-foreground' : undefined}
    >
      {ob.occupation ? 'Lưu rồi thoát' : 'Để sau'}
    </Button>
  );

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
      <aside className="hidden overflow-hidden bg-ink lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="flex h-16 shrink-0 items-center px-8">
          <Wordmark />
        </div>
        <div className="flex min-h-0 flex-1 items-end justify-center">
          <div className="relative aspect-[420/820]" style={{ width: 'min(100%, calc((100dvh - 4rem) * 420 / 820))' }}>
            <OnboardingTrail artboard="Trail" state={trail} className="absolute inset-0" />
            <ol aria-label="Các bước thiết lập">
              {milestones.map((m, i) => (
                <li
                  key={m.name}
                  aria-current={m.current ? 'step' : undefined}
                  className="absolute w-[150px] text-sm last:w-[120px]"
                  style={{ left: TALL_LABEL[i][0], top: TALL_LABEL[i][1] }}
                >
                  <MilestoneLabel m={m} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="bg-ink lg:hidden">
          <div className="flex h-14 items-center justify-between pr-2 pl-4">
            <Wordmark />
            {exit(true)}
          </div>
          <div className="mx-auto max-w-lg">
            <div className="relative aspect-[400/120] sm:[mask-image:linear-gradient(90deg,transparent,#000_7%,#000_95%,transparent)]">
              <OnboardingTrail artboard="TrailWide" state={trail} className="absolute inset-0" />
            </div>
            <ol aria-label="Các bước thiết lập" className="relative h-8">
              {milestones.map((m, i) => (
                <li
                  key={m.name}
                  aria-current={m.current ? 'step' : undefined}
                  className={cn(
                    'absolute top-0 -translate-x-1/2 text-xs font-semibold whitespace-nowrap',
                    m.current ? 'text-ink-foreground' : m.done ? 'text-ink-success' : 'text-ink-muted',
                  )}
                  style={{ left: WIDE_LABEL_X[i] }}
                >
                  {m.done && i < STEP_COUNT && <Check className="mr-0.5 inline size-3.5 align-[-2px]" aria-hidden />}
                  {m.name}
                </li>
              ))}
            </ol>
          </div>
        </header>

        <div className="mx-auto hidden h-16 w-full max-w-[56rem] items-center justify-between px-10 lg:flex">
          <p aria-hidden className="text-sm font-semibold text-muted-foreground tabular-nums">
            Bước {step + 1}/{STEP_COUNT}
          </p>
          {exit(false)}
        </div>

        <main className="mx-auto w-full max-w-[56rem] flex-1 px-4 pt-7 pb-10 sm:px-8 lg:px-10 lg:pt-8">
          <div
            key={step}
            className={cn(
              'animate-in duration-300 ease-out fade-in motion-reduce:animate-none',
              shown.forward ? 'slide-in-from-right-4' : 'slide-in-from-left-4',
            )}
          >
            <h1 ref={headingRef} tabIndex={-1} className="text-[26px] leading-tight font-bold tracking-tight text-balance outline-none sm:text-[32px]">
              <span className="sr-only">
                Bước {step + 1} trên {STEP_COUNT}:{' '}
              </span>
              {STEPS[step].title}
            </h1>
            <p className="mt-2.5 text-[15px] text-pretty text-muted-foreground sm:text-base">{STEPS[step].lead}</p>

            <div className="mt-7 sm:mt-9">
              {step === 0 && (
                <fieldset disabled={busy}>
                  <legend className="sr-only">{STEPS[0].title}</legend>
                  <div className="grid gap-x-10 sm:grid-cols-2">
                    {OCCUPATIONS.map((o) => {
                      const Icon = OCCUPATION_ICON[o];
                      return (
                        <label key={o} className={optionRow}>
                          <span className={optionIcon}>
                            <Icon aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">{OCCUPATION_LABEL[o]}</span>
                          <input
                            type="radio"
                            name="occupation"
                            value={o}
                            checked={ob.occupation === o}
                            onChange={() => ob.chooseOccupation(o)}
                            className={radioInput}
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <TopicSearch isSelected={ob.isSelected} onToggle={ob.toggleTopic} disabled={busy} />
                  <fieldset disabled={busy}>
                    <legend className="mb-3.5 text-sm font-semibold">Phổ biến với học viên như bạn</legend>
                    {ob.popularLoading ? (
                      <div className="flex flex-wrap gap-2" aria-hidden>
                        {[96, 120, 84, 132, 104, 90, 118, 76].map((w, i) => (
                          <span key={i} className="h-10 animate-pulse rounded-full bg-muted" style={{ width: w }} />
                        ))}
                      </div>
                    ) : ob.chips.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có gợi ý cho nghề này. Tìm kỹ năng ở ô phía trên.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {ob.chips.map((t) => {
                          const on = ob.isSelected(t.id);
                          return (
                            <label
                              key={t.id}
                              className={cn(
                                'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border pr-4 pl-3 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-60',
                                on
                                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                                  : 'border-border bg-background hover:border-foreground/30 hover:bg-muted',
                              )}
                            >
                              <input type="checkbox" checked={on} onChange={() => ob.toggleTopic(t)} className="sr-only" />
                              {on ? <Check className="size-4" aria-hidden /> : <Plus className="size-4 text-muted-foreground" aria-hidden />}
                              {t.name}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                  <p aria-live="polite" className="text-sm text-muted-foreground">
                    {topicCount ? (
                      <>
                        Đã chọn <span className="font-semibold text-foreground">{topicCount} kỹ năng</span>
                      </>
                    ) : (
                      'Chưa chọn kỹ năng nào'
                    )}
                  </p>
                </div>
              )}

              {step === 2 && (
                <fieldset disabled={busy}>
                  <legend className="sr-only">{STEPS[2].title}</legend>
                  <div>
                    {LEARNER_LEVELS.map((l, i) => (
                      <label key={l} className={cn(optionRow, 'min-h-20 items-start py-4 sm:items-center')}>
                        <span className={optionIcon}>
                          <LevelBars n={i + 1} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block">{SKILL_LEVEL_LABEL[l]}</span>
                          <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{LEVEL_HINT[l]}</span>
                        </span>
                        <input
                          type="radio"
                          name="level"
                          value={l}
                          checked={ob.level === l}
                          onChange={() => ob.chooseLevel(l)}
                          className={cn(radioInput, 'mt-2.5 sm:mt-0')}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          </div>
        </main>

        <footer className="sticky bottom-0 z-30 border-t border-border bg-background">
          <div className="mx-auto flex h-[72px] max-w-[56rem] items-center justify-between gap-3 px-4 sm:px-8 lg:px-10">
            {step > 0 ? (
              <Button variant="outline" size="lg" disabled={busy} onClick={ob.back}>
                Quay lại
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {isLast && (
                <Button variant="ghost" size="lg" disabled={busy} onClick={ob.skip}>
                  Bỏ qua
                </Button>
              )}
              <Button
                size="lg"
                disabled={!ob.canNext}
                isLoading={busy}
                // Chặn bấm đúp: cú thứ hai không nhảy qua bước kế tiếp.
                onClick={(e) => e.detail <= 1 && ob.next()}
              >
                {isLast ? 'Hoàn tất' : 'Tiếp theo'}
                {!isLast && <ArrowRight aria-hidden />}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MilestoneLabel({ m }: { m: Milestone }) {
  return (
    <>
      <span className={cn('flex items-center gap-1.5 font-semibold', m.current || m.done ? 'text-ink-foreground' : 'text-ink-muted')}>
        {m.done && <Check className="size-4 text-ink-success" aria-hidden />}
        {m.current && <span className="size-2 rounded-full bg-ink-builtin" aria-hidden />}
        {m.name}
      </span>
      {m.status && (
        <span className={cn('mt-0.5 block text-[13px] leading-snug text-pretty', m.done ? 'text-ink-success' : 'text-ink-muted')}>
          {m.status}
        </span>
      )}
    </>
  );
}
