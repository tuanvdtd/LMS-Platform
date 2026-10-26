'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CircleCheck, Lightbulb, Lock, Target } from 'lucide-react';
import { Markdown } from '@/components/markdown';
import { SkillTagBadge } from '@/components/shared/product-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  CPU_LIMIT_MS,
  type Difficulty,
  type Language,
  LANGUAGES,
  type LearnExercise,
  MEMORY_LIMIT_KB,
  type SubmissionSummary,
} from '@/types/exercise';
import { CodeEditor } from './editor-panel';
import { formatKb, formatMs, IoBlock, PANEL_TABS } from './result-panel';
import { SubmissionHistory } from './submission-history';

const DIFFICULTY: Record<Difficulty, { label: string; dot: string }> = {
  easy: { label: 'Dễ', dot: 'bg-(--skill-strong)' },
  medium: { label: 'Trung bình', dot: 'bg-(--skill-mid)' },
  hard: { label: 'Khó', dot: 'bg-(--skill-weak)' },
};

function Statement({
  courseSlug,
  exercise: ex,
  language,
}: {
  courseSlug: string;
  exercise: LearnExercise;
  language: Language;
}) {
  const difficulty = DIFFICULTY[ex.difficulty];
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-pretty text-foreground">{ex.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <span className={cn('size-1.5 rounded-full', difficulty.dot)} aria-hidden />
            {difficulty.label}
          </Badge>
          {ex.completed && (
            <Badge variant="outline">
              <CircleCheck className="text-(--verdict-ac)" aria-hidden />
              Đã hoàn thành
            </Badge>
          )}
          {ex.bestScore !== null && (
            <span className="text-sm text-muted-foreground">
              Điểm cao nhất: <strong className="font-semibold text-foreground">{ex.bestScore}</strong>/100
            </span>
          )}
        </div>
        {ex.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ex.topics.map((t) => (
              <SkillTagBadge key={t.id} name={t.name} />
            ))}
          </div>
        )}
      </header>

      {ex.learningObjective && (
        <p className="flex items-start gap-2 rounded-lg bg-(--primary-light) px-3 py-2 text-sm text-foreground">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="font-semibold">Mục tiêu: </span>
            {ex.learningObjective}
          </span>
        </p>
      )}

      <Markdown>{ex.instructions}</Markdown>

      {ex.publicTests.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="examples-heading">
          <h2 id="examples-heading" className="text-base font-semibold text-foreground">Ví dụ</h2>
          {ex.publicTests.map((t, i) => (
            <div key={t.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
              <span className="text-sm font-medium text-muted-foreground">Ví dụ {i + 1}</span>
              <IoBlock label="Input" value={t.input} />
              <IoBlock label="Output" value={t.expectedOutput} />
            </div>
          ))}
          {ex.hiddenTestCount > 0 && (
            <p className="text-sm text-muted-foreground">+ {ex.hiddenTestCount} test ẩn</p>
          )}
        </section>
      )}

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Giới hạn thời gian:</dt>
          <dd className="font-mono text-foreground">{formatMs(CPU_LIMIT_MS[language])}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">Bộ nhớ:</dt>
          <dd className="font-mono text-foreground">{formatKb(MEMORY_LIMIT_KB)}</dd>
        </div>
      </dl>

      {ex.relatedItem && (
        <Link
          href={`/learn/${courseSlug}/lecture/${ex.relatedItem.id}`}
          className="flex min-h-11 w-fit items-center gap-2 rounded-md text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BookOpen className="size-4 shrink-0" aria-hidden />
          Xem lại bài giảng: {ex.relatedItem.title}
        </Link>
      )}
    </div>
  );
}

// shown giữ ở ProblemPanel: TabsContent không active bị unmount.
function Hints({ hints, shown, onShowMore }: { hints: string[]; shown: number; onShowMore: () => void }) {
  if (hints.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Bài này không có gợi ý.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Thử tự giải trước, mở từng gợi ý khi thật sự cần.</p>
      {shown > 0 && (
        <ol className="flex flex-col gap-2">
          {hints.slice(0, shown).map((h, i) => (
            <li key={i} className="flex flex-col gap-1 rounded-lg border bg-card p-3 motion-safe:animate-in motion-safe:fade-in">
              <span className="text-xs font-semibold text-muted-foreground">Gợi ý {i + 1}</span>
              <p className="text-sm whitespace-pre-wrap text-foreground">{h}</p>
            </li>
          ))}
        </ol>
      )}
      {shown < hints.length && (
        <Button variant="outline" className="w-fit max-md:h-11" onClick={onShowMore}>
          <Lightbulb data-icon="inline-start" aria-hidden />
          Xem gợi ý {shown + 1}
        </Button>
      )}
    </div>
  );
}

function Solution({ exercise: ex, language }: { exercise: LearnExercise; language: Language }) {
  const solution = ex.solution;
  if (!solution) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <p className="max-w-xs text-sm text-muted-foreground">Hoàn thành bài (Accepted) để xem lời giải</p>
      </div>
    );
  }
  const langs = ex.languages.filter((l) => solution.codes[l]);
  const lang = langs.includes(language) ? language : langs[0];
  return (
    <div className="flex flex-col gap-4">
      {lang && (
        <section className="flex flex-col gap-2" aria-labelledby="solution-code-heading">
          <h2 id="solution-code-heading" className="text-base font-semibold text-foreground">
            Lời giải mẫu ({LANGUAGES[lang]})
          </h2>
          <CodeEditor language={lang} value={solution.codes[lang] ?? ''} readOnly ariaLabel={`Lời giải mẫu ${LANGUAGES[lang]}`} />
        </section>
      )}
      {solution.explanation && (
        <section className="flex flex-col gap-2" aria-labelledby="solution-explain-heading">
          <h2 id="solution-explain-heading" className="text-base font-semibold text-foreground">Giải thích</h2>
          <Markdown>{solution.explanation}</Markdown>
        </section>
      )}
    </div>
  );
}

// Khung trái: Đề bài / Gợi ý / Lịch sử nộp / Lời giải.
export function ProblemPanel({
  courseSlug,
  exercise,
  language,
  history,
  selectedId,
  openingId,
  onOpenSubmission,
  className,
}: {
  courseSlug: string;
  exercise: LearnExercise;
  language: Language;
  history: SubmissionSummary[];
  selectedId: string | null;
  openingId: string | null;
  onOpenSubmission: (id: string) => void;
  className?: string;
}) {
  const [hintsShown, setHintsShown] = useState(0);
  return (
    <Tabs defaultValue="statement" className={cn('min-h-0 gap-0 bg-background', className)}>
      <div className="border-b bg-card px-2">
        <TabsList variant="line" className={PANEL_TABS} aria-label="Nội dung bài tập">
          <TabsTrigger value="statement" className="flex-none px-3">Đề bài</TabsTrigger>
          <TabsTrigger value="hints" className="flex-none px-3">Gợi ý</TabsTrigger>
          <TabsTrigger value="history" className="flex-none px-3">Lịch sử nộp</TabsTrigger>
          <TabsTrigger value="solution" className="flex-none px-3">
            {!exercise.solution && <Lock aria-hidden />}
            Lời giải
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="statement" className="min-h-0 overflow-y-auto p-4">
        <Statement courseSlug={courseSlug} exercise={exercise} language={language} />
      </TabsContent>
      <TabsContent value="hints" className="min-h-0 overflow-y-auto p-4">
        <Hints hints={exercise.hints} shown={hintsShown} onShowMore={() => setHintsShown((n) => n + 1)} />
      </TabsContent>
      <TabsContent value="history" className="min-h-0 overflow-y-auto p-4">
        <SubmissionHistory history={history} selectedId={selectedId} openingId={openingId} onOpen={onOpenSubmission} />
      </TabsContent>
      <TabsContent value="solution" className="min-h-0 overflow-y-auto p-4">
        <Solution exercise={exercise} language={language} />
      </TabsContent>
    </Tabs>
  );
}
