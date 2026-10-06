'use client';

import { X } from 'lucide-react';
import { TopicSearch } from '@/app/onboarding/_components/topic-search';
import { Button } from '@/components/ui/button';
import type { CourseTopic, Ref } from '@/types/instructor-course';
import { addTopic, MAX_TOPICS, removeTopic, setPrimary } from './course-topics';

// "Khoá học dạy những gì?" — tối đa 3 topic, đúng 1 chủ đề chính (spec 2026-10-06 D2, D3).
// Ô tìm là combobox dùng chung với onboarding; topic đã chọn nằm trong một danh sách,
// mỗi dòng: radio chọn chủ đề chính + nút bỏ.
export function TopicPicker({
  value,
  onChange,
  invalid,
}: {
  value: CourseTopic[];
  onChange: (topics: CourseTopic[]) => void;
  invalid?: boolean;
}) {
  const full = value.length >= MAX_TOPICS;
  const isSelected = (id: string) => value.some((t) => t.id === id);

  return (
    <div className="flex flex-col gap-3">
      <TopicSearch
        id="topic-search"
        label="Tìm chủ đề"
        placeholder={full ? `Đã đủ ${MAX_TOPICS} chủ đề, bỏ bớt để thêm` : 'Tìm chủ đề, ví dụ: React'}
        disabled={full}
        invalid={invalid}
        isSelected={isSelected}
        onToggle={(t: Ref) => onChange(isSelected(t.id) ? removeTopic(value, t.id) : addTopic(value, t))}
      />

      {value.length > 0 && (
        <fieldset className="rounded-lg border">
          <legend className="sr-only">Chủ đề chính</legend>
          <ul className="divide-y">
            {value.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-1 pr-1.5 pl-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1.5 text-sm">
                  <input
                    type="radio"
                    name="primary-topic"
                    aria-label={`Đặt ${t.name} làm chủ đề chính`}
                    className="size-4 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-muted-foreground/50 bg-background transition-[border-color,border-width] not-checked:hover:border-foreground checked:border-[5px] checked:border-primary"
                    checked={t.isPrimary}
                    onChange={() => onChange(setPrimary(value, t.id))}
                  />
                  <span className="min-w-0 truncate font-medium">{t.name}</span>
                  {t.isPrimary && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Chủ đề chính
                    </span>
                  )}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={`Bỏ chủ đề ${t.name}`}
                  onClick={() => onChange(removeTopic(value, t.id))}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  );
}
