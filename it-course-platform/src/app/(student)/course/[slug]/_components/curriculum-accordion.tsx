'use client';

import { useState } from 'react';
import { CirclePlay, Code2, FileQuestion, ListChecks, Play, type LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { curriculumSummary, type CurriculumSection } from '@/types/catalog';
import { formatDuration } from '@/types/curriculum';
import { PreviewDialog } from './preview-dialog';

type Item = CurriculumSection['items'][number];

const TYPE: Record<Item['type'], { icon: LucideIcon; tag?: string }> = {
  lecture: { icon: CirclePlay },
  quiz: { icon: FileQuestion, tag: 'Quiz' },
  practice_test: { icon: ListChecks, tag: 'Kiểm tra' },
  coding_exercise: { icon: Code2, tag: 'Bài code' },
};

export function CurriculumAccordion({ slug, sections }: { slug: string; sections: CurriculumSection[] }) {
  const [preview, setPreview] = useState<Item | null>(null);
  const [open, setOpen] = useState<string[]>(sections[0] ? [sections[0].id] : []);
  const allOpen = open.length === sections.length;
  const all = sections.flatMap((s) => s.items);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Nội dung khoá học</h2>
          <p className="text-sm text-muted-foreground">
            {sections.length} chương · {curriculumSummary(all)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(allOpen ? [] : sections.map((s) => s.id))}
          className="h-8 cursor-pointer rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-[var(--primary-light)] focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {allOpen ? 'Thu gọn tất cả' : 'Mở tất cả'}
        </button>
      </div>

      <Accordion multiple value={open} onValueChange={setOpen} className="divide-y overflow-hidden rounded-xl border bg-card">
        {sections.map((s, si) => (
          <AccordionItem key={s.id} value={s.id} className="not-last:border-b-0">
            <AccordionTrigger className="items-center gap-4 rounded-none px-5 py-4 hover:no-underline focus-visible:bg-secondary focus-visible:ring-0">
              <span className="w-6 shrink-0 font-mono text-sm text-muted-foreground tabular-nums">{String(si + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-pretty text-foreground">{s.title}</span>
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{curriculumSummary(s.items)}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <ul>
                {s.items.map((it) => {
                  const { icon: Icon, tag } = TYPE[it.type];
                  return (
                    <li key={it.id} className="flex min-h-10 items-center gap-3 py-1.5 pr-5 pl-5 text-sm sm:pl-[60px]">
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 flex-1 text-pretty text-foreground">
                        {it.title}
                        {tag && (
                          <span className="ml-1 inline-flex h-5 items-center rounded bg-secondary px-1.5 align-middle text-xs font-semibold text-secondary-foreground">
                            {tag}
                          </span>
                        )}
                      </span>
                      {it.isPreview && (
                        <button
                          type="button"
                          onClick={() => setPreview(it)}
                          className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-primary no-underline outline-none hover:bg-[var(--primary-light)] focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <Play className="size-3.5" aria-hidden /> Xem thử
                        </button>
                      )}
                      <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground tabular-nums">
                        {it.durationSec > 0 ? formatDuration(it.durationSec) : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {preview && (
        <PreviewDialog
          slug={slug}
          itemId={preview.id}
          title={preview.title}
          open
          onOpenChange={(o) => !o && setPreview(null)}
        />
      )}
    </>
  );
}
