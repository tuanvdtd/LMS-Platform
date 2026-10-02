'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { getFileUrl, getFileUsages } from '@/lib/api/library';
import { cn } from '@/lib/utils';
import type { FileUsage, LibraryFile } from '@/types/library';

// Tên cắt GIỮA, giữ đuôi (.pdf) — cắt cuối thì mất đúng phần nói loại file.
export function FileName({ name, className }: { name: string; className?: string }) {
  const keep = Math.min(name.length, 16);
  return (
    <p className={cn('flex min-w-0 text-sm font-medium', className)} title={name}>
      <span className="truncate">{name.slice(0, name.length - keep)}</span>
      <span className="shrink-0">{name.slice(name.length - keep)}</span>
    </p>
  );
}

// Chỉ file ngoại lệ có badge; file sẵn sàng thì không.
export function FileStatusBadge({ file }: { file: LibraryFile }) {
  if (file.status === 'processing')
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        Đang xử lý
      </span>
    );
  if (file.status === 'failed')
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-red-700 dark:bg-destructive/20 dark:text-red-300">
        Tải lên lỗi
      </span>
    );
  return null;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// "N bài giảng" → popover liệt kê bài giảng đang dùng (tải khi mở).
export function UsagePopover({ file, className }: { file: LibraryFile; className?: string }) {
  const [open, setOpen] = useState(false);
  const [usages, setUsages] = useState<FileUsage[] | 'error' | null>(null);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    getFileUsages(file.id, { signal: ctrl.signal }).then(setUsages, () => !ctrl.signal.aborted && setUsages('error'));
    return () => ctrl.abort();
  }, [open, file.id]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'font-medium whitespace-nowrap text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground',
          className,
        )}
      >
        {file.usageCount} bài giảng
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-1 p-1">
        <p className="px-2 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">Đang dùng ở {file.usageCount} bài giảng</p>
        {usages === null ? (
          <div className="flex flex-col gap-2 px-2 py-1.5" aria-busy="true">
            {Array.from({ length: Math.min(file.usageCount, 3) }, (_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : usages === 'error' ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Không tải được danh sách bài giảng.</p>
        ) : (
          usages.map((u) => (
            <Link
              key={u.itemId}
              href={`/instructor/courses/${u.courseId}/manage/curriculum`}
              className="block rounded-md px-2 py-1.5 hover:bg-secondary"
            >
              <span className="block truncate text-sm font-medium">{u.lectureTitle}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {u.courseTitle} · {u.sectionTitle}
              </span>
            </Link>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

// Mở tab trước rồi mới gán URL: mở sau await thì trình duyệt chặn popup.
async function openFile(file: LibraryFile, download: boolean) {
  const tab = download ? null : window.open('', '_blank');
  try {
    const url = await getFileUrl(file.id, download);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
  } catch {
    tab?.close();
    toast.error('Không mở được file, thử lại');
  }
}

export function FileRowMenu({ file, onDelete }: { file: LibraryFile; onDelete: (file: LibraryFile) => void }) {
  const inUse = file.usageCount > 0;
  const viewable = file.status === 'ready';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-foreground/8 aria-expanded:bg-foreground/8"
            aria-label={`Thao tác với ${file.fileName}`}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {viewable && (
          <>
            <DropdownMenuItem onClick={() => void openFile(file, false)}>
              <ExternalLink />
              Mở file
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void openFile(file, true)}>
              <Download />
              Tải xuống
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem variant="destructive" disabled={inUse} onClick={() => onDelete(file)}>
          <Trash2 />
          Xoá file
        </DropdownMenuItem>
        {inUse && (
          <p className="px-1.5 pb-1.5 text-xs text-pretty text-muted-foreground">
            Đang dùng ở {file.usageCount} bài giảng, gỡ khỏi bài giảng trước.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Cửa sổ 7 ô (tính cả …) khi quá 7 trang.
function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages];
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, '…', page - 1, page, page + 1, '…', pages];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const count = total.toLocaleString('vi-VN');
  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-3">
      <p className="text-sm text-muted-foreground tabular-nums">
        {pages > 1 && (
          <span className="hidden sm:inline">
            {from} tới {to} trong{' '}
          </span>
        )}
        {count} file
      </p>
      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Trang trước">
            <ChevronLeft />
          </Button>
          <span className="px-2 text-sm tabular-nums sm:hidden">
            {page} / {pages}
          </span>
          {pageWindow(page, pages).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="hidden w-9 text-center text-sm text-muted-foreground sm:inline">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={cn(
                  'hidden h-9 min-w-9 items-center justify-center rounded-lg border border-transparent px-2 text-sm font-medium tabular-nums sm:inline-flex',
                  p === page ? 'bg-secondary text-foreground' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground',
                )}
              >
                {p}
              </button>
            ),
          )}
          <Button variant="ghost" size="icon" disabled={page === pages} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">
            <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  );
}
