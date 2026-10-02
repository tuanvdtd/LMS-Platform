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
      <div className="flex items-center gap-2 border-b bg-muted/70 py-2 pr-3 pl-2">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${name}`} disabled={locked} {...attributes} {...listeners} />
        <span className="shrink-0 text-[15px] font-bold">{name}:</span>
        <InlineTitle
          className="[&_input]:text-[15px] [&_input]:font-semibold"
          value={section.title}
          label={`Tên ${name}`}
          disabled={locked}
          onSave={(title) => run(() => renameSection(courseId, section.id, title))}
        />
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
      <div className={cn('px-3 py-1.5', section.items.length > 0 && 'border-t')}>
        <AddItemForm sectionId={section.id} />
      </div>
    </section>
  );
}
