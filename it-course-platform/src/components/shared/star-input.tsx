'use client';

import { useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { RATING_LABEL, STARS } from '@/lib/reviews';
import { cn } from '@/lib/utils';
import type { Stars } from '@/types/reviews';

// Chọn 1–5 sao. value = 0 nghĩa là chưa chọn.
export function StarInput({ value, onChange, disabled }: { value: number; onChange: (v: Stars) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = hover || value;

  const move = (e: React.KeyboardEvent, current: number) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(5, Math.max(1, (current || 0) + step)) as Stars;
    onChange(next);
    refs.current[next - 1]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <div role="radiogroup" aria-label="Số sao" className="flex" onMouseLeave={() => setHover(0)}>
        {STARS.map((s) => (
          <button
            key={s}
            ref={(el) => { refs.current[s - 1] = el; }}
            type="button"
            role="radio"
            aria-checked={value === s}
            aria-label={`${s} sao: ${RATING_LABEL[s]}`}
            // Roving tabindex: Tab vào đúng sao đang chọn (hoặc sao đầu khi chưa chọn), mũi tên để đổi.
            tabIndex={value === s || (!value && s === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onKeyDown={(e) => move(e, value)}
            className="flex size-11 items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <Star className={cn('size-7 transition-colors', s <= shown ? 'fill-rating text-rating' : 'text-border')} aria-hidden />
          </button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {shown ? RATING_LABEL[shown as Stars] : 'Chọn số sao'}
      </span>
    </div>
  );
}
