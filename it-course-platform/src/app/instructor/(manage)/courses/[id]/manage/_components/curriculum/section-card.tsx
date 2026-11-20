'use client';

import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSection, renameSection } from '@/lib/api/curriculum';
import { cn } from '@/lib/utils';
import type { CurriculumSection } from '@/types/curriculum';
import { AddItemForm } from './add-forms';
import { useCurriculum } from './curriculum-context';
import { DragHandle } from './drag-handle';
import { InlineTitle } from './inline-title';
import { ItemRow } from './item-row';

// Thẻ phần: header nền xám, các mục là dòng liền nhau kẻ ngăn, dòng "+ Mục" ở cuối.
export function SectionCard({
  section,
  index,
  labels,
}: {
  section: CurriculumSection;
  index: number;
  labels: Map<string, string>;
}) {
  const { courseId, locked, busy, run, confirm } = useCurriculum();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: 'section' },
    disabled: locked || busy,
  });
  const name = `Phần ${index + 1}`;

  const remove = () => {
    const go = () => void run(() => deleteSection(courseId, section.id));
    if (section.items.length) confirm(`Xoá "${name}" cùng ${section.items.length} mục bên trong?`, go);
    else go();
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={name}
      className={cn(
        'overflow-hidden rounded-xl border bg-card',
        isDragging && 'relative z-10 opacity-80 shadow-xl',
      )}
    >
      <div className="flex items-center gap-3 border-b bg-muted/70 py-2.5 pr-3 pl-2">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${name}`} disabled={locked} {...attributes} {...listeners} />
        {/* Cùng nhịp với dòng mục bên dưới: "Phần 1" là nhãn nhỏ, tên phần đậm ngay dưới.
            ml-11 = ô icon 32px + gap 12px của dòng mục → tên phần và tên bài thẳng một cột. */}
        <div className="ml-11 flex min-w-0 flex-1 flex-col">
          <span className="pl-[calc(0.5rem+1px)] text-xs font-semibold text-muted-foreground">{name}</span>
          <InlineTitle
            className="-mt-0.5 [&_input]:text-base [&_input]:font-bold"
            value={section.title}
            label={`Tên ${name}`}
            disabled={locked}
            onSave={(title) => run(() => renameSection(courseId, section.id, title))}
          />
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={`Xoá ${name}`} disabled={locked} onClick={remove}>
          <Trash2 />
        </Button>
      </div>
      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {/* min-h: phần rỗng vẫn là vùng thả được */}
        <ul className="flex min-h-2 flex-col divide-y">
          {section.items.map((item) => (
            <ItemRow key={item.id} item={item} label={labels.get(item.id) ?? ''} />
          ))}
        </ul>
      </SortableContext>
      <div className={cn('px-2 py-1.5', section.items.length > 0 && 'border-t')}>
        <AddItemForm sectionId={section.id} />
      </div>
    </section>
  );
}
