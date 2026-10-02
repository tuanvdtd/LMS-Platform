'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { ArrowDown, ArrowUp, FileText, FileVideo, Loader2, RotateCw, Search, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteLibraryFile, listLibraryFiles, uploadToLibrary } from '@/lib/api/library';
import { uploadErrorMessage } from '@/lib/upload';
import { cn } from '@/lib/utils';
import { formatBytes, PDF_MAX_BYTES } from '@/types/curriculum';
import {
  FILE_KIND_LABEL,
  LIBRARY_FILTERS,
  LIBRARY_PAGE_SIZE,
  type LibraryFile,
  type LibraryFilter,
  type LibraryPage,
  type LibraryQuery,
} from '@/types/library';
import { FileName, FileRowMenu, FileStatusBadge, formatDate, Pagination, UsagePopover } from './file-parts';

interface PendingUpload {
  key: string;
  name: string;
  percent: number;
  error: string | null;
  ctrl: AbortController;
}

const KindIcon = ({ file, className }: { file: Pick<LibraryFile, 'kind'>; className?: string }) => {
  const Icon = file.kind === 'video' ? FileVideo : FileText;
  return <Icon className={cn('size-5 shrink-0 text-muted-foreground', className)} />;
};

export function FileLibrary() {
  const [query, setQuery] = useState<LibraryQuery>({ page: 1, q: '', filter: 'all', order: 'desc' });
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // Gắn query + reloadKey vào kết quả: khác query hiện tại = đang tải lại (giữ dữ liệu cũ, không nháy khung chờ).
  const [result, setResult] = useState<{ page: LibraryPage; query: LibraryQuery; reloadKey: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);
  const [toDelete, setToDelete] = useState<LibraryFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery((q) => (q.q === search.trim() ? q : { ...q, q: search.trim(), page: 1 })), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const ctrl = new AbortController();
    listLibraryFiles(query, { signal: ctrl.signal }).then(
      (page) => {
        // Xoá dòng cuối của trang cuối → trang rỗng, lùi một trang.
        if (page.items.length === 0 && query.page > 1) setQuery((q) => ({ ...q, page: q.page - 1 }));
        else {
          setFailed(false);
          setResult({ page, query, reloadKey });
        }
      },
      () => !ctrl.signal.aborted && setFailed(true),
    );
    return () => ctrl.abort();
  }, [query, reloadKey]);

  const reload = () => {
    setFailed(false);
    setReloadKey((k) => k + 1);
  };
  const patchQuery = (patch: Partial<LibraryQuery>) => setQuery((q) => ({ ...q, page: 1, ...patch }));
  const patchUpload = (key: string, patch: Partial<PendingUpload>) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));
  const removeUpload = (key: string) => setUploads((list) => list.filter((u) => u.key !== key));

  function startUploads(files: FileList) {
    for (const file of Array.from(files)) {
      const key = crypto.randomUUID();
      const ctrl = new AbortController();
      const error = file.type !== 'application/pdf' ? 'Chỉ nhận file PDF' : file.size > PDF_MAX_BYTES ? 'PDF tối đa 1 GB' : null;
      setUploads((list) => [...list, { key, name: file.name, percent: 0, error, ctrl }]);
      if (error) continue;
      uploadToLibrary(file, { signal: ctrl.signal, onProgress: (percent) => patchUpload(key, { percent }) }).then(
        () => {
          removeUpload(key);
          toast.success(`Đã tải lên ${file.name}`);
          reload();
        },
        (err) => {
          const message = uploadErrorMessage(err);
          if (message === null) removeUpload(key);
          else patchUpload(key, { error: message });
        },
      );
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteLibraryFile(toDelete.id);
      toast.success('Đã xoá file');
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      toast.error(status === 409 ? 'File vừa được gắn vào bài giảng, không xoá được' : 'Xoá thất bại, thử lại');
    } finally {
      setDeleting(false);
      setToDelete(null);
      reload();
    }
  }

  const data = result?.page;
  const busy = !!result && (result.query !== query || result.reloadKey !== reloadKey);
  const libraryEmpty = !!data && data.counts.all === 0 && !query.q && uploads.length === 0;
  const filterItems = Object.fromEntries(
    LIBRARY_FILTERS.map((f) => [f.key, data ? `${f.label} · ${data.counts[f.key]}` : f.label]),
  ) as Record<LibraryFilter, string>;
  const SortIcon = query.order === 'desc' ? ArrowDown : ArrowUp;

  let body: React.ReactNode;
  if (failed) {
    body = (
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">Không tải được thư viện file.</p>
        <Button variant="outline" onClick={reload}>
          <RotateCw data-icon="inline-start" />
          Thử lại
        </Button>
      </div>
    );
  } else if (!data) {
    body = (
      <>
        <ul aria-busy="true" className="divide-y">
          {[46, 62, 38, 54, 30, 50, 42, 58].map((w, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="size-5 shrink-0 animate-pulse rounded bg-foreground/5 motion-reduce:animate-none" />
              <div className="h-3 flex-1">
                <div className="h-3 animate-pulse rounded-full bg-foreground/5 motion-reduce:animate-none" style={{ width: `${w}%` }} />
              </div>
              <div className="h-3 w-16 animate-pulse rounded-full bg-foreground/5 motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
        <span className="sr-only" role="status">
          Đang tải thư viện file
        </span>
      </>
    );
  } else if (libraryEmpty) {
    body = (
      <p className="px-4 py-6 text-center text-sm text-pretty text-muted-foreground">
        Chưa có file nào. Tải PDF lên ở đây hoặc ngay trong khung chương trình của khoá học.
      </p>
    );
  } else if (data.items.length === 0 && uploads.length === 0) {
    body = (
      <p className="px-4 py-6 text-center text-sm text-pretty text-muted-foreground">
        {query.q ? (
          <>
            Không có file nào khớp{' '}
            <span className="text-foreground" title={query.q}>
              “{query.q.length > 24 ? `${query.q.slice(0, 24)}…` : query.q}”
            </span>
            . Thử từ khoá khác.{' '}
            <Button
              variant="ghost"
              className="inline h-auto min-h-0 p-0 align-baseline font-medium text-foreground underline-offset-4 hover:bg-transparent hover:underline"
              onClick={() => {
                setSearch('');
                patchQuery({ q: '' });
                searchRef.current?.focus();
              }}
            >
              Xoá tìm kiếm
            </Button>
          </>
        ) : (
          'Không có file nào ở mục này.'
        )}
      </p>
    );
  }

  const th = 'px-4 py-2.5 text-left text-xs font-medium text-muted-foreground';
  const td = 'px-4 py-3 align-middle';
  const uploadRows = uploads.map((u) => ({
    ...u,
    cancel: (
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:bg-foreground/8"
        onClick={() => (u.error ? removeUpload(u.key) : u.ctrl.abort())}
        aria-label={`${u.error ? 'Bỏ' : 'Huỷ tải'} ${u.name}`}
      >
        <X />
      </Button>
    ),
    status: u.error ? (
      <p className="mt-1 text-xs text-red-700 dark:text-red-400">{u.error}</p>
    ) : (
      <div className="mt-1.5 flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={u.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Đang tải ${u.name}`}
          className="h-1 flex-1 rounded-full bg-foreground/5"
        >
          <div className="h-1 rounded-full bg-primary transition-[width]" style={{ width: `${u.percent}%` }} />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{u.percent}%</span>
      </div>
    ),
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-balance">Thư viện file</h1>
            <p className="mt-1 max-w-[55ch] text-sm text-pretty text-muted-foreground">
              {data ? `Đã dùng ${formatBytes(data.totalBytes)}. ` : ''}File đã tải lên dùng lại được ở mọi khoá học của bạn.
            </p>
          </div>
          <label className={cn(buttonVariants(), 'cursor-pointer has-focus-visible:ring-3 has-focus-visible:ring-ring/50')}>
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files?.length) startUploads(e.target.files);
                e.target.value = '';
              }}
            />
            <Upload data-icon="inline-start" />
            Tải lên PDF
          </label>
        </header>

        {!libraryEmpty && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select items={filterItems} value={query.filter} onValueChange={(v) => v && patchQuery({ filter: v as LibraryFilter })}>
              <SelectTrigger className="h-9 bg-card sm:hidden" aria-label="Lọc file">
                <span className="text-muted-foreground">Hiển thị:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LIBRARY_FILTERS.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {filterItems[f.key]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div role="tablist" aria-label="Lọc file" className="hidden gap-1 sm:flex">
              {LIBRARY_FILTERS.map((f) => {
                const selected = query.filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => patchQuery({ filter: f.key })}
                    className={cn(
                      'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-3 text-sm font-medium',
                      selected ? 'bg-secondary text-foreground' : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground',
                    )}
                  >
                    {f.label}
                    {data && <span className="text-xs font-normal text-foreground/70 tabular-nums">{data.counts[f.key]}</span>}
                  </button>
                );
              })}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên file"
                aria-label="Tìm file"
                className="bg-card pl-8"
              />
            </div>
          </div>
        )}

        <div className="@container overflow-hidden rounded-xl border bg-card" aria-busy={busy}>
          {body ?? (
            <div className={cn('transition-opacity', busy && 'opacity-60')}>
              <table className="hidden w-full sm:table">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className={cn(th, 'w-full')}>Tên file</th>
                    <th className={cn(th, 'hidden w-px @3xl:table-cell')}>Loại</th>
                    <th className={cn(th, 'w-px whitespace-nowrap')}>Dùng ở</th>
                    <th className={cn(th, 'w-px text-right whitespace-nowrap')}>Dung lượng</th>
                    <th className={cn(th, 'hidden w-px whitespace-nowrap @3xl:table-cell')} aria-sort={query.order === 'desc' ? 'descending' : 'ascending'}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => patchQuery({ order: query.order === 'desc' ? 'asc' : 'desc' })}
                      >
                        Ngày tải
                        <SortIcon className="size-3.5" />
                      </button>
                    </th>
                    <th className="w-12">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {uploadRows.map((u) => (
                    <tr key={u.key}>
                      <td className={cn(td, 'max-w-0')}>
                        <div className="flex min-w-0 items-center gap-3">
                          <KindIcon file={{ kind: 'document' }} />
                          <div className="min-w-0 flex-1">
                            <FileName name={u.name} />
                            {u.status}
                          </div>
                        </div>
                      </td>
                      <td className={cn(td, 'hidden text-sm text-muted-foreground @3xl:table-cell')}>PDF</td>
                      <td className={cn(td, 'text-sm text-muted-foreground')}>—</td>
                      <td className={cn(td, 'text-right text-sm text-muted-foreground')}>—</td>
                      <td className={cn(td, 'hidden text-sm text-muted-foreground @3xl:table-cell')}>—</td>
                      <td className="py-3 pr-2 text-right">{u.cancel}</td>
                    </tr>
                  ))}
                  {data?.items.map((f) => (
                    <tr key={f.id} className="hover:bg-secondary has-aria-expanded:bg-secondary">
                      <td className={cn(td, 'max-w-0')}>
                        <div className="flex min-w-0 items-center gap-3">
                          <KindIcon file={f} />
                          <FileName name={f.fileName} className="flex-1" />
                          <FileStatusBadge file={f} />
                        </div>
                      </td>
                      <td className={cn(td, 'hidden text-sm text-muted-foreground @3xl:table-cell')}>{FILE_KIND_LABEL[f.kind]}</td>
                      <td className={cn(td, 'text-sm whitespace-nowrap')}>
                        {f.usageCount > 0 ? (
                          <UsagePopover file={f} className="-mx-2 inline-flex h-8 items-center rounded-md px-2 hover:bg-foreground/8 aria-expanded:bg-foreground/8" />
                        ) : (
                          <span className="text-muted-foreground">Chưa dùng</span>
                        )}
                      </td>
                      <td className={cn(td, 'text-right text-sm whitespace-nowrap tabular-nums')}>{formatBytes(f.sizeBytes)}</td>
                      <td className={cn(td, 'hidden text-sm whitespace-nowrap text-muted-foreground tabular-nums @3xl:table-cell')}>
                        {formatDate(f.createdAt)}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <FileRowMenu file={f} onDelete={setToDelete} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* < sm: danh sách dòng, không cuộn ngang */}
              <ul className="divide-y sm:hidden">
                {uploadRows.map((u) => (
                  <li key={u.key} className="flex items-start gap-3 px-4 py-3">
                    <KindIcon file={{ kind: 'document' }} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <FileName name={u.name} />
                      {u.status}
                    </div>
                    {u.cancel}
                  </li>
                ))}
                {data?.items.map((f) => (
                  <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                    <KindIcon file={f} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <FileName name={f.fileName} />
                      <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                        <FileStatusBadge file={f} />
                        <span className="min-w-0 truncate tabular-nums">
                          {FILE_KIND_LABEL[f.kind]} · {formatBytes(f.sizeBytes)} ·{' '}
                          {f.usageCount > 0 ? (
                            <UsagePopover file={f} className="relative before:absolute before:-inset-x-1.5 before:-inset-y-2" />
                          ) : (
                            'Chưa dùng'
                          )}
                        </span>
                      </div>
                    </div>
                    <FileRowMenu file={f} onDelete={setToDelete} />
                  </li>
                ))}
              </ul>

              {data && data.total > 0 && (
                <Pagination
                  page={query.page}
                  pageSize={LIBRARY_PAGE_SIZE}
                  total={data.total}
                  onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá file?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="break-all">“{toDelete?.fileName}”</span> sẽ bị xoá khỏi thư viện và không khôi phục được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" disabled={deleting}>
              Huỷ
            </AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {deleting ? 'Đang xoá…' : 'Xoá file'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
