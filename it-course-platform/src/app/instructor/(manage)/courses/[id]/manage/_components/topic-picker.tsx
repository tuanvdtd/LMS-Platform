'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchTopics } from '@/lib/api/instructor-courses';
import type { Ref } from '@/types/instructor-course';

// "Khoá học chủ yếu dạy gì?" — tìm topic theo tên, debounce 300ms, huỷ request cũ khi gõ tiếp.
export function TopicPicker({
  value,
  onChange,
  invalid,
}: {
  value: Ref | null;
  onChange: (topic: Ref | null) => void;
  invalid?: boolean;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Ref[]>([]);

  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      searchTopics(term, ctrl.signal).then(setResults, () => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  if (value) {
    return (
      <div id="topic-search" className="flex items-center gap-2">
        <Badge variant="secondary">{value.name}</Badge>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Bỏ chọn chủ đề" onClick={() => onChange(null)}>
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        id="topic-search"
        value={q}
        maxLength={50}
        autoComplete="off"
        placeholder="Ví dụ: React, Docker, Python"
        aria-invalid={invalid}
        onChange={(e) => {
          setQ(e.target.value);
          if (!e.target.value.trim()) setResults([]);
        }}
      />
      {q.trim() && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover py-1 shadow-md">
          {results.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => {
                  onChange(t);
                  setQ('');
                  setResults([]);
                }}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
