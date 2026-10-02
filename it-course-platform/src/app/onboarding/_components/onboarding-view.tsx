'use client';

import { useEffect, useRef } from 'react';
import { BookOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { LEARNER_LEVELS, OCCUPATION_LABEL, type Occupation } from '@/types/preferences';
import { STEP_COUNT, useOnboarding } from './use-onboarding';
import { TopicSearch } from './topic-search';

const OCCUPATIONS = Object.keys(OCCUPATION_LABEL) as Occupation[];

const STEPS = [
  { title: 'Bạn đang học để làm nghề gì?', lead: 'Chúng tôi dùng câu trả lời để gợi ý khoá học hợp với bạn.' },
  { title: 'Bạn quan tâm kỹ năng nào?', lead: 'Chọn bao nhiêu cũng được, có thể để trống.' },
  { title: 'Bạn đang ở trình độ nào?', lead: 'Giúp chúng tôi gợi ý khoá học không quá dễ, không quá khó.' },
] as const;

// Card radio: input thật (Tab/mũi tên/Space), cả card là vùng bấm.
const radioCard =
  'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted has-checked:border-primary has-checked:ring-2 has-checked:ring-primary/20 has-disabled:cursor-not-allowed has-disabled:opacity-60';
const radioInput =
  'size-5 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-muted-foreground/50 bg-background outline-none transition-[border-color,border-width] not-checked:hover:border-foreground checked:border-[6px] checked:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed';

export function OnboardingView() {
  const ob = useOnboarding();
  const { step, saving } = ob;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const prevStep = useRef(step);

  // Đổi bước thì đưa tiêu điểm lên tiêu đề bước (trình đọc màn hình đọc câu hỏi mới).
  // So với bước trước thay vì cờ lần đầu: StrictMode chạy effect 2 lần lúc mount.
  useEffect(() => {
    if (prevStep.current === step) return;
    prevStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const isLast = step === STEP_COUNT - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <BookOpen size={16} className="text-primary-foreground" />
            </span>
            <span className="text-lg font-bold">
              Skill<span className="text-primary">Path</span>
            </span>
          </span>
          <Button variant="ghost" disabled={saving} onClick={ob.saveAndExit}>
            Lưu rồi thoát
          </Button>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
          <p className="mb-2 text-sm font-medium tabular-nums text-muted-foreground">
            Bước {step + 1}/{STEP_COUNT}
          </p>
          <div
            role="progressbar"
            aria-label="Tiến độ thiết lập"
            aria-valuemin={1}
            aria-valuemax={STEP_COUNT}
            aria-valuenow={step + 1}
            className="flex gap-1.5"
          >
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < step ? 'bg-primary' : i === step ? 'bg-primary/30' : 'bg-secondary',
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-8 pb-10 sm:px-6 sm:pt-12">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-balance outline-none sm:text-3xl"
        >
          {STEPS[step].title}
        </h1>
        <p className="mt-2 text-sm text-pretty text-muted-foreground sm:text-base">{STEPS[step].lead}</p>

        <div className="mt-8">
          {step === 0 && (
            <fieldset disabled={saving}>
              <legend className="sr-only">{STEPS[0].title}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {OCCUPATIONS.map((o) => (
                  <label key={o} className={radioCard}>
                    <input
                      type="radio"
                      name="occupation"
                      value={o}
                      checked={ob.occupation === o}
                      onChange={() => ob.setOccupation(o)}
                      className={radioInput}
                    />
                    {OCCUPATION_LABEL[o]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <TopicSearch isSelected={ob.isSelected} onToggle={ob.toggleTopic} />
              <fieldset disabled={saving}>
                <legend className="mb-3 text-sm font-semibold">Phổ biến với học viên như bạn</legend>
                {ob.chips.length === 0 && !ob.popularLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có gợi ý cho nghề này. Tìm kỹ năng ở ô phía trên.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {ob.chips.map((t) => {
                      const on = ob.isSelected(t.id);
                      return (
                        <label
                          key={t.id}
                          className={cn(
                            'inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-60',
                            on
                              ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                              : 'border-border bg-background hover:border-foreground/40 hover:bg-muted',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => ob.toggleTopic(t)}
                            className="sr-only"
                          />
                          {on && <Check className="size-4" aria-hidden />}
                          {t.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <fieldset disabled={saving}>
              <legend className="sr-only">{STEPS[2].title}</legend>
              <div className="grid gap-3">
                {LEARNER_LEVELS.map((l) => (
                  <label key={l} className={radioCard}>
                    <input
                      type="radio"
                      name="level"
                      value={l}
                      checked={ob.level === l}
                      onChange={() => ob.setLevel(l)}
                      className={radioInput}
                    />
                    {SKILL_LEVEL_LABEL[l]}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 border-t border-border bg-background">
        <div className="mx-auto flex h-18 max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
          {step > 0 ? (
            <Button variant="outline" size="lg" disabled={saving} onClick={ob.back}>
              Quay lại
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {isLast && (
              <Button variant="ghost" size="lg" disabled={saving} onClick={ob.skip}>
                Bỏ qua
              </Button>
            )}
            <Button
              size="lg"
              disabled={!ob.canNext}
              isLoading={saving}
              // Chặn bấm đúp: cú thứ hai không nhảy qua bước kế tiếp.
              onClick={(e) => e.detail <= 1 && ob.next()}
            >
              {isLast ? 'Hoàn tất' : 'Tiếp theo'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
