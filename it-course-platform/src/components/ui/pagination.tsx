'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

function pageWindow(page: number, pageCount: number): (number | '…')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pageCount];
  if (page >= pageCount - 3) return [1, '…', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  return [1, '…', page - 1, page, page + 1, '…', pageCount];
}

export function Pagination({ page, pageCount, onPageChange }: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const pages = pageWindow(page, pageCount);

  return (
    <nav aria-label="Phân trang" className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" size="icon" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="px-1 text-sm tabular-nums sm:hidden">{page} / {pageCount}</span>
      <span className="hidden items-center gap-1 sm:flex">
        {pages.map((number, index) => number === '…' ? (
          <span key={`gap-${index}`} className="w-9 text-center text-sm text-muted-foreground" aria-hidden="true">…</span>
        ) : (
          <Button
            key={number}
            variant={number === page ? 'secondary' : 'ghost'}
            size="icon"
            aria-label={`Trang ${number}`}
            aria-current={number === page ? 'page' : undefined}
            onClick={() => onPageChange(number)}
          >
            {number}
          </Button>
        ))}
      </span>
      <Button variant="ghost" size="icon" aria-label="Trang sau" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
