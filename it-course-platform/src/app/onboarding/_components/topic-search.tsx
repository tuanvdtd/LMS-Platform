'use client';

import { useEffect, useId, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { searchTopics } from '@/lib/api/instructor-courses';
import type { Ref } from '@/types/instructor-course';

// Combobox tìm topic (ARIA combobox + listbox): debounce 250ms, huỷ request cũ khi gõ tiếp.
// Chọn một kết quả → onToggle(ref), xoá ô để tìm tiếp; topic đã chọn hiện dấu tick.
// Dùng ở onboarding và trang tổng quan khoá học (giảng viên).
export function TopicSearch({
  isSelected,
  onToggle,
  id,
  label = 'Tìm kỹ năng',
  placeholder = 'Tìm kỹ năng, ví dụ: Docker, Python…',
  disabled,
  invalid,
}: {
  isSelected: (id: string) => boolean;
  onToggle: (topic: Ref) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const listId = useId();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Ref[] | null>(null); // null = chưa có kết quả cho q hiện tại
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  const term = q.trim();
  useEffect(() => {
    if (!term) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      searchTopics(term, ctrl.signal).then(
        (r) => {
          setResults(r);
          setActive(r.length ? 0 : -1);
        },
        () => !ctrl.signal.aborted && setResults([]),
      );
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);

  const expanded = open && term !== '';

  function pick(t: Ref) {
    onToggle(t);
    setQ('');
    setResults(null);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const n = results?.length ?? 0;
    if (e.key === 'ArrowDown' && n) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % n);
    } else if (e.key === 'ArrowUp' && n) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? n - 1 : i - 1));
    } else if (e.key === 'Enter' && expanded && results && active >= 0) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        id={id}
        aria-label={label}
        aria-invalid={invalid}
        disabled={disabled}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        value={q}
        maxLength={50}
        autoComplete="off"
        placeholder={placeholder}
        className="h-11 bg-background pl-9 md:h-10"
        onChange={(e) => {
          setQ(e.target.value);
          setResults(null);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Kết quả tìm kỹ năng"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-lg"
        >
          {results === null && <li className="px-3 py-2.5 text-muted-foreground">Đang tìm…</li>}
          {results?.length === 0 && (
            <li className="px-3 py-2.5 text-muted-foreground">Không tìm thấy “{term}”</li>
          )}
          {results?.map((t, i) => {
            const selected = isSelected(t.id);
            return (
              <li
                key={t.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                // Giữ focus ở ô nhập, không để blur đóng danh sách trước khi click.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(t)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5',
                  i === active && 'bg-secondary',
                )}
              >
                <span className="min-w-0 truncate">{t.name}</span>
                {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
