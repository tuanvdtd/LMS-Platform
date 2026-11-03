// it-course-platform/src/app/learn/[courseSlug]/_components/course-outline.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Circle, CircleCheck, CirclePlay, Code2, FileQuestion, FileText, ListChecks, RotateCcw, type LucideIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePointerFocus } from '@/lib/use-pointer-focus';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/types/curriculum';
import type { LearnItem, LearnOutline } from '@/types/learn';
import { formatTotal, itemHref } from './learn-nav';

// tone: màu icon theo loại; chip: nền + chữ cho ô icon lớn. Màu chỉ để phân loại (DESIGN: bài giảng primary,
// quiz tertiary, bài code cam đất) — luôn đi kèm nhãn chữ.
type Kind = { icon: LucideIcon; label: string; tone: string; chip: string };
const LECTURE = { tone: 'text-primary', chip: 'bg-primary-soft text-primary' };
export function kindOf(it: LearnItem): Kind {
  if (it.type === 'lecture') {
    return it.lectureKind === 'document'
      ? { icon: FileText, label: 'PDF', ...LECTURE }
      : { icon: CirclePlay, label: formatDuration(it.durationSec), ...LECTURE };
  }
  if (it.type === 'quiz') return { icon: FileQuestion, label: 'Quiz', tone: 'text-tertiary', chip: 'bg-tertiary-soft text-tertiary' };
  if (it.type === 'coding_exercise') {
    return { icon: Code2, label: 'Bài code', tone: 'text-brand-accent-strong', chip: 'bg-brand-accent-soft text-brand-accent-strong' };
  }
  return { icon: ListChecks, label: 'Sắp có', tone: 'text-muted-foreground', chip: 'bg-muted text-muted-foreground' };
}

// Mục lục khoá trong khung học. onNavigate: đóng ngăn trượt khi chọn bài.
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
  const reviewIds = new Set(outline.review.map((r) => r.itemId));
  // Ngăn trượt render ngoài gốc khung học (portal) → mục lục tự mang usePointerFocus.
  const pointerFocus = usePointerFocus();
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Mở một chương → cuộn mượt cho tiêu đề chương lên sát mép trên khung (như Udemy) → mọi bài của chương lọt khung nhìn.
  // Phải chờ panel đủ cao (khung đầu còn h-0 do starting-style): cuộn sớm thì vùng cuộn chưa dài ra, trình duyệt kẹp đích.
  function revealSection(id: string, tries = 10) {
    const box = scrollerRef.current;
    const section = box?.querySelector<HTMLElement>(`[data-section="${id}"]`);
    const panel = section?.querySelector<HTMLElement>('[data-slot=accordion-content]');
    if (!box || !section || !panel) return;
    if (panel.offsetHeight < panel.scrollHeight && tries > 0) {
      requestAnimationFrame(() => revealSection(id, tries - 1));
      return;
    }
    const top = box.scrollTop + section.getBoundingClientRect().top - box.getBoundingClientRect().top;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }
  function onOpenChange(next: string[]) {
    const opened = next.find((v) => !open.includes(v));
    setOpen(next);
    if (opened) requestAnimationFrame(() => revealSection(opened));
  }

  return (
    <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto" {...pointerFocus}>
      {outline.review.length > 0 && (
        <details open className="group border-b bg-(--skill-weak-bg)/60">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
            <RotateCcw className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">Ôn lại ({outline.review.length} bài)</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
          </summary>
          <ul className="pb-2">
            {outline.review.map((r) => (
              <li key={r.itemId}>
                <Link
                  href={`/learn/${slug}/lecture/${r.itemId}`}
                  onClick={onNavigate}
                  className="flex flex-col gap-0.5 px-4 py-2 text-sm outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <span className="text-pretty text-foreground">{r.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Sai {r.wrongCount} câu ở {r.quizzes.map((q) => q.title).join(', ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
      {/* Mở/đóng chương không giãn chiều cao (như Udemy): danh sách hiện ngay để revealSection có đủ vùng cuộn. */}
      <Accordion multiple value={open} onValueChange={onOpenChange} className="[&_[data-slot=accordion-content]]:animate-none">
        {outline.sections.map((s, si) => {
          const done = s.items.filter((i) => i.completed).length;
          const videoSec = s.items.reduce((t, i) => t + (i.type === 'lecture' && i.lectureKind === 'video' ? i.durationSec : 0), 0);
          return (
            <AccordionItem key={s.id} value={s.id} data-section={s.id} className="border-b">
              <AccordionTrigger className="items-start gap-2 rounded-none border-0 bg-secondary/60 px-4 py-3 hover:no-underline focus-visible:border-0 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-pretty text-foreground">
                    Phần {si + 1}: {s.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-xs font-normal text-muted-foreground tabular-nums">
                    {done === s.items.length && s.items.length > 0 && (
                      <CircleCheck className="size-3.5 text-success" aria-label="Đã xong phần này" />
                    )}
                    {done}/{s.items.length} bài
                    {videoSec > 0 && ` · ${formatTotal(videoSec)}`}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="p-0 [&_a]:no-underline">
                <ul>
                  {s.items.map((it) => {
                    const href = itemHref(slug, it);
                    const active = it.id === currentId;
                    const { icon: Icon, label, tone } = kindOf(it);
                    const body = (
                      <>
                        {it.completed ? (
                          <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-label="Đã hoàn thành" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug text-pretty">
                            {numbers.get(it.id)}. {it.title}
                          </span>
                          {/* Bài đang học: meta theo màu primary (muted trên nền primary-soft chỉ đạt 4.37:1). */}
                          <span className={cn('mt-0.5 flex items-center gap-1 text-xs', active ? 'text-primary' : 'text-muted-foreground')}>
                            <Icon className={cn('size-3.5', href && tone)} aria-hidden /> {label}
                            {/* Chữ foreground trên nền nhạt để đủ tương phản ở cả 2 theme, giống PassBadge. */}
                            {reviewIds.has(it.id) && (
                              <span className="ml-1 rounded-sm bg-(--skill-weak-bg) px-1.5 py-px font-medium text-foreground">Nên ôn</span>
                            )}
                          </span>
                        </span>
                      </>
                    );
                    const row = 'flex min-h-11 items-start gap-3 px-4 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset';
                    return (
                      <li key={it.id}>
                        {href ? (
                          <Link
                            ref={active ? activeRef : undefined}
                            href={href}
                            onClick={onNavigate}
                            aria-current={active ? 'page' : undefined}
                            // text-primary! thắng [&_a]:hover:text-foreground của AccordionContent → hover không làm mất màu bài đang học.
                            className={cn(row, 'transition-colors', active ? 'bg-primary-soft text-primary!' : 'text-foreground hover:bg-secondary')}
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
