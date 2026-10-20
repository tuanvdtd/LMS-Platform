// it-course-platform/src/app/learn/[courseSlug]/_components/course-outline.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Circle, CircleCheck, CirclePlay, Code2, FileQuestion, FileText, ListChecks, type LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/types/curriculum';
import type { LearnItem, LearnOutline } from '@/types/learn';
import { formatTotal, itemHref } from './learn-nav';

function kindOf(it: LearnItem): { icon: LucideIcon; label: string } {
  if (it.type === 'lecture') {
    return it.lectureKind === 'document' ? { icon: FileText, label: 'PDF' } : { icon: CirclePlay, label: formatDuration(it.durationSec) };
  }
  if (it.type === 'quiz') return { icon: FileQuestion, label: 'Quiz' };
  if (it.type === 'coding_exercise') return { icon: Code2, label: 'Bài code' };
  return { icon: ListChecks, label: 'Sắp có' };
}

// Mục lục khoá trong khung học (spec 2026-10-20-lecture-player §7.2). onNavigate: đóng ngăn trượt khi chọn bài.
export function CourseOutline({
  outline,
  currentId,
  onNavigate,
}: {
  outline: LearnOutline;
  currentId: string | undefined;
  onNavigate?: () => void;
}) {
  const slug = outline.course.slug;
  const currentSection = outline.sections.find((s) => s.items.some((i) => i.id === currentId))?.id;
  const [open, setOpen] = useState<string[]>(() => [currentSection ?? outline.sections[0]?.id].filter(Boolean) as string[]);
  // Chuyển sang bài ở phần khác → mở thêm phần đó (điều chỉnh state theo prop lúc render, không dùng effect).
  const [seenSection, setSeenSection] = useState(currentSection);
  if (currentSection !== seenSection) {
    setSeenSection(currentSection);
    if (currentSection && !open.includes(currentSection)) setOpen([...open, currentSection]);
  }
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentId]);
  const numbers = new Map(outline.sections.flatMap((s) => s.items).map((it, i) => [it.id, i + 1]));

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Accordion multiple value={open} onValueChange={setOpen}>
        {outline.sections.map((s, si) => {
          const done = s.items.filter((i) => i.completed).length;
          const videoSec = s.items.reduce((t, i) => t + (i.type === 'lecture' && i.lectureKind === 'video' ? i.durationSec : 0), 0);
          return (
            <AccordionItem key={s.id} value={s.id} className="border-b">
              <AccordionTrigger className="items-start gap-2 rounded-none bg-secondary/60 px-4 py-3 hover:no-underline focus-visible:ring-0 focus-visible:bg-secondary">
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-pretty text-foreground">
                    Phần {si + 1}: {s.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground tabular-nums">
                    {done}/{s.items.length}
                    {videoSec > 0 && ` · ${formatTotal(videoSec)}`}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <ul>
                  {s.items.map((it) => {
                    const href = itemHref(slug, it);
                    const active = it.id === currentId;
                    const { icon: Icon, label } = kindOf(it);
                    const body = (
                      <>
                        {it.completed ? (
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-500" aria-label="Đã hoàn thành" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug text-pretty">
                            {numbers.get(it.id)}. {it.title}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Icon className="size-3.5" aria-hidden /> {label}
                          </span>
                        </span>
                      </>
                    );
                    const row = 'flex min-h-11 items-start gap-3 px-4 py-2.5 outline-none focus-visible:bg-secondary';
                    return (
                      <li key={it.id}>
                        {href ? (
                          <Link
                            ref={active ? activeRef : undefined}
                            href={href}
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            className={cn(row, 'transition-colors', active ? 'bg-[var(--primary-light)] text-primary' : 'text-foreground hover:bg-secondary')}
                          >
                            {body}
                          </Link>
                        ) : (
                          <div className={cn(row, 'text-muted-foreground opacity-70')} aria-disabled="true">
                            {body}
                          </div>
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
    </div>
  );
}
