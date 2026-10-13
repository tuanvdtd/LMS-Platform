'use client';

import { useState } from 'react';
import { Code2, FileQuestion, ListChecks, PlayCircle, type LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { formatHoursMinutes, type CurriculumSection } from '@/types/catalog';
import { formatDuration } from '@/types/curriculum';
import { PreviewDialog } from './preview-dialog';

type Item = CurriculumSection['items'][number];

const TYPE_ICON: Record<Item['type'], LucideIcon> = {
  lecture: PlayCircle,
  quiz: FileQuestion,
  practice_test: ListChecks,
  coding_exercise: Code2,
};

export function CurriculumAccordion({ slug, sections }: { slug: string; sections: CurriculumSection[] }) {
  const [preview, setPreview] = useState<Item | null>(null);

  return (
    <>
      <Accordion multiple defaultValue={sections[0] ? [sections[0].id] : []} className="overflow-hidden rounded-lg border">
        {sections.map((s) => {
          const total = s.items.reduce((sum, i) => sum + i.durationSec, 0);
          return (
            <AccordionItem key={s.id} value={s.id}>
              <AccordionTrigger className="items-center gap-3 rounded-none bg-secondary px-4 py-3 hover:no-underline">
                <span className="min-w-0 flex-1 font-semibold">{s.title}</span>
                <span className="shrink-0 text-xs font-normal text-muted-foreground">
                  {s.items.filter((i) => i.type === 'lecture').length} bài{total > 0 && ` · ${formatHoursMinutes(total)}`}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <ul className="divide-y">
                  {s.items.map((it) => {
                    const Icon = TYPE_ICON[it.type];
                    return (
                      <li key={it.id} className="flex min-h-11 items-center gap-3 px-4 py-2 text-sm">
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 break-words">{it.title}</span>
                        {it.isPreview && (
                          <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setPreview(it)}>
                            Xem thử
                          </Button>
                        )}
                        {it.durationSec > 0 && (
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatDuration(it.durationSec)}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
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
