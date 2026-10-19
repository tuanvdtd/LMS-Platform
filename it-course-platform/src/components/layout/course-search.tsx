'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { searchCourses } from '@/lib/api/catalog-client';
import type { CourseCard, CourseList } from '@/types/catalog';

const SKELETON_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2'] as const;

// Ô tìm khoá trên header: gõ ≥ 2 ký tự → debounce 250ms gọi /courses?q=&limit=6,
// huỷ request cũ khi gõ tiếp. Khuôn combobox theo TopicSearch, nhưng mặc định không chọn dòng nào
// để Enter vẫn đi /courses?q= như trước; ↑↓ đi qua các khoá và dòng "Xem tất cả".
export function CourseSearch({
  className = 'flex',
  autoFocus,
  onSubmitted,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
}) {
  const listId = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [result, setResult] = useState<CourseList | null>(null); // null = đang tải cho term hiện tại
  const [error, setError] = useState(false);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);

  const term = q.trim();
  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      searchCourses(term, ctrl.signal).then(setResult, () => !ctrl.signal.aborted && setError(true));
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term]);

  const items = result?.items ?? [];
  const expanded = open && term.length >= 2;
  const listShown = expanded && items.length > 0; // listbox chỉ tồn tại khi có khoá để chọn
  const footerIdx = items.length;
  const shown = term.length > 24 ? `${term.slice(0, 24)}…` : term;

  function close() {
    setOpen(false);
    setActive(-1);
  }

  // Chuyển trang thì bỏ focus khỏi ô; giữ q và result để focus lại thì gợi ý cũ hiện ngay.
  function navigate(href: string) {
    inputRef.current?.blur();
    close();
    router.push(href);
    onSubmitted?.();
  }

  function goSearch() {
    if (term) navigate(`/courses?q=${encodeURIComponent(term)}`);
  }

  function goCourse(c: CourseCard) {
    navigate(`/course/${c.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return; // đang ghép dấu (Telex/IME); Safari báo keyCode 229 cho Enter chốt từ
    const count = items.length ? items.length + 1 : 0; // các khoá + dòng "Xem tất cả"
    if (e.key === 'ArrowDown' && count) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % count);
    } else if (e.key === 'ArrowUp' && count) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (e.key === 'Enter' && expanded && active >= 0 && active < items.length) {
      e.preventDefault(); // chặn form submit
      goCourse(items[active]);
    } else if (e.key === 'Escape') {
      close();
    }
    // Enter còn lại (chưa chọn / đang ở "Xem tất cả") → form submit → goSearch
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        goSearch();
      }}
      className={cn('relative', className)}
      role="search"
    >
      <div className="flex h-11 w-full items-center gap-2.5 rounded-full border bg-muted/70 px-4 transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-3 focus-within:ring-ring/20 hover:bg-muted">
        <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        <Input
          ref={inputRef}
          type="text"
          enterKeyHint="search"
          role="combobox"
          aria-label="Tìm kiếm khoá học"
          aria-expanded={listShown}
          aria-controls={listShown ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={listShown && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          maxLength={100}
          value={q}
          autoFocus={autoFocus}
          placeholder="Tìm kiếm khoá học, kỹ năng, công nghệ..."
          className="h-auto flex-1 border-0 bg-transparent p-0 text-sm shadow-none placeholder:text-secondary-foreground/80 focus-visible:ring-0 dark:bg-transparent"
          onChange={(e) => {
            const next = e.target.value;
            // Chỉ reset khi term đổi: thêm dấu cách cuối không chạy lại effect, reset thì skeleton kẹt.
            if (next.trim() !== term) {
              setResult(null);
              setError(false);
            }
            setQ(next);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          // Esc đóng nhưng focus vẫn ở ô → click lại không phát onFocus.
          onClick={() => setOpen(true)}
          onBlur={close}
        />
      </div>

      <span className="sr-only" role="status">
        {!expanded ? '' : error ? 'Không tải được gợi ý' : result === null ? 'Đang tìm khoá học' : items.length ? `${items.length} gợi ý` : 'Không tìm thấy khoá học'}
      </span>

      {expanded && (
        // Chặn mousedown cả khung (dòng, footer, thanh cuộn): giữ focus ở ô, blur không gỡ dropdown trước click.
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[calc(100dvh-8rem)] origin-top animate-in overflow-y-auto rounded-xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-150 ease-out fade-in-0 zoom-in-95 slide-in-from-top-1"
        >
          {error ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Không tải được gợi ý. Nhấn Enter để xem trang kết quả.
            </p>
          ) : result === null ? (
            <ul aria-busy="true" className="p-1.5">
              {SKELETON_WIDTHS.map((w) => (
                <li key={w} className="flex h-14 items-center gap-3 px-2.5">
                  <Skeleton className="h-9 w-16 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className={cn('h-3 rounded-full', w)} />
                    <Skeleton className="h-2.5 w-1/4 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Không tìm thấy khoá học nào cho <span className="text-foreground">&ldquo;{shown}&rdquo;</span>. Thử từ
              khoá khác.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Gợi ý khoá học" className="p-1.5">
              {items.map((c, i) => (
                <li
                  key={c.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goCourse(c)}
                  className={cn(
                    'flex h-14 cursor-pointer items-center gap-3 rounded-lg px-2.5',
                    i === active && 'bg-accent',
                  )}
                >
                  <Image
                    src={c.thumbnailUrl}
                    alt=""
                    width={64}
                    height={36}
                    unoptimized
                    className="h-9 w-16 shrink-0 rounded-md object-cover ring-1 ring-foreground/5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{c.instructor.name}</p>
                  </div>
                </li>
              ))}
              <li aria-hidden className="-mx-1.5 my-1.5 border-t border-border" />
              <li
                id={`${listId}-${footerIdx}`}
                role="option"
                aria-selected={active === footerIdx}
                onMouseEnter={() => setActive(footerIdx)}
                onClick={goSearch}
                className={cn(
                  'flex h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-primary',
                  active === footerIdx && 'bg-accent',
                )}
              >
                <Search className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate">Xem tất cả kết quả cho &ldquo;{shown}&rdquo;</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">{result.total}<span className="sr-only"> khoá học</span></span>
              </li>
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
