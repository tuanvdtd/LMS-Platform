import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}

// Phân trang shadcn (ui/pagination): mỗi trang là <Link> → URL là nguồn sự thật, giữ bộ lọc + sắp xếp.
// Dùng chung cho /courses và /blog.
export function LinkPagination({ page, pages, href }: { page: number; pages: number; href: (n: number) => string }) {
  // Đầu/cuối: vẫn render để thanh không nhảy, nhưng khoá tương tác.
  const edge = (disabled: boolean) =>
    disabled ? { 'aria-disabled': true, tabIndex: -1, className: 'pointer-events-none opacity-50' } : {};
  return (
    <Pagination className="border-t pt-8">
      <PaginationContent className="gap-1">
        <PaginationItem>
          <PaginationPrevious href={href(Math.max(1, page - 1))} {...edge(page <= 1)} />
        </PaginationItem>
        <PaginationItem className="px-2 text-sm tabular-nums sm:hidden">
          {page} / {pages}
        </PaginationItem>
        {pageWindow(page, pages).map((n, i) => (
          <PaginationItem key={n === '…' ? `gap-${i}` : n} className="hidden sm:block">
            {n === '…' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={href(n)} isActive={n === page} aria-label={`Trang ${n}`}>
                {n}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href={href(Math.min(pages, page + 1))} {...edge(page >= pages)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
