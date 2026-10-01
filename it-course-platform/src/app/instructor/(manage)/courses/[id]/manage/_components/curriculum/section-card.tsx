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
      className={cn('flex flex-col gap-2 rounded-xl border bg-card p-3', isDragging && 'relative z-10 opacity-70 shadow-xl')}
    >
      <div className="flex items-center gap-2">
        <DragHandle ref={setActivatorNodeRef} label={`Kéo để đổi chỗ ${name}`} disabled={locked} {...attributes} {...listeners} />
        <span className="shrink-0 text-sm font-bold">{name}:</span>
        <InlineTitle
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
        <ul className="flex min-h-10 flex-col gap-1.5 sm:pl-7">
          {section.items.map((item) => (
            <ItemRow key={item.id} item={item} label={labels.get(item.id) ?? ''} />
          ))}
        </ul>
      </SortableContext>
      <div className="sm:pl-7">
        <AddItemForm sectionId={section.id} />
      </div>
    </section>
  );
}
