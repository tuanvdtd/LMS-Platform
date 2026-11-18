'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { Circle, CircleCheck, ImagePlus, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { listMyCourses, searchTopics } from '@/lib/api/instructor-courses';
import { cn } from '@/lib/utils';
import { IMAGE_ACCEPT, imageProblem, uploadPostImage } from './upload-image';

// Cột thẻ bên phải trang soạn: Xuất bản (điều kiện), Ảnh bìa, Tóm tắt, Chủ đề, Khoá học liên quan.

export type Topic = { id: string; slug: string; name: string };

const TOPICS_MAX = 3;
const NO_COURSE = 'none';

// Một thẻ của cột phải: tiêu đề + phần phụ bên phải tiêu đề (bộ đếm, trạng thái) + nội dung.
export function Panel({ id, title, aside, children }: { id?: string; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  const hid = useId();
  return (
    <section id={id} aria-labelledby={hid} className="scroll-mt-32 rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id={hid} className="text-sm font-semibold text-foreground">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// Ảnh bìa: khung 16:9 (đúng tỉ lệ thẻ bài ở /blog). Trang đọc cắt lại thành 21:9.
export function CoverSlot({ value, onChange, error }: { value: string | null; onChange: (url: string | null) => void; error?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function pick(file: File | undefined) {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) return void toast.error(problem);
    setUploading(true);
    try {
      onChange(await uploadPostImage(file));
    } catch {
      toast.error('Tải ảnh thất bại, thử lại');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        hidden
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <Skeleton className="aspect-video w-full rounded-lg" aria-label="Đang tải ảnh bìa" />
      ) : value ? (
        <>
          <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
            <Image src={value} alt="" fill unoptimized sizes="320px" className="object-cover" />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Đổi ảnh
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Gỡ ảnh
            </Button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/50 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-primary-soft hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50',
            error && 'border-destructive',
          )}
        >
          <ImagePlus className="size-5" aria-hidden />
          Chọn ảnh bìa
        </button>
      )}
      <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{error ?? 'JPG, PNG hoặc WebP, tối đa 5 MB.'}</p>
    </div>
  );
}

// Chủ đề hiện như chip ở trang đọc; nút "Thêm chủ đề" mở ô tìm.
export function TopicPicker({ value, onChange, error }: { value: Topic[]; onChange: (t: Topic[]) => void; error?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Topic[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const full = value.length >= TOPICS_MAX;

  // Gõ xong 250 ms mới tìm; lượt cũ bị huỷ để kết quả không về sai thứ tự.
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => searchTopics(term, ctrl.signal).then(setResults, () => undefined), 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  const shown = q.trim() ? (results ?? []).filter((t) => !value.some((v) => v.id === t.id)).slice(0, 8) : [];

  return (
    <div className="flex flex-col gap-1.5">
      <ul aria-label="Chủ đề của bài" className="flex flex-wrap items-center gap-2">
        {value.map((t) => (
          <li key={t.id} className="inline-flex h-7 items-center gap-0.5 rounded-full bg-primary-soft pr-1 pl-3 text-xs font-semibold text-primary">
            {t.name}
            <button
              type="button"
              aria-label={`Bỏ chủ đề ${t.name}`}
              className="flex size-6 items-center justify-center rounded-full outline-none hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onChange(value.filter((v) => v.id !== t.id))}
            >
              <X className="size-3" aria-hidden />
            </button>
          </li>
        ))}
        {!full && (
          <li>
            <Popover
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (!o) {
                  setQ('');
                  setResults(null);
                }
              }}
            >
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    aria-describedby={error ? `${id}-err` : undefined}
                    className={cn(
                      'inline-flex h-7 items-center gap-1 rounded-full border border-dashed px-3 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50',
                      error && 'border-destructive text-destructive',
                    )}
                  />
                }
              >
                <Plus className="size-3.5" aria-hidden />
                {value.length ? 'Thêm chủ đề' : 'Chọn chủ đề (1–3)'}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 gap-2 p-2" initialFocus={inputRef}>
                <Input
                  ref={inputRef}
                  value={q}
                  placeholder="Tìm chủ đề, ví dụ React"
                  aria-label="Tìm chủ đề"
                  onChange={(e) => {
                    setQ(e.target.value);
                    if (!e.target.value.trim()) setResults(null);
                  }}
                />
                {shown.length > 0 && (
                  <ul aria-label="Kết quả" className="flex max-h-56 flex-col overflow-y-auto">
                    {shown.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className="w-full rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                          onClick={() => {
                            const next = [...value, t];
                            onChange(next);
                            setQ('');
                            setResults(null);
                            if (next.length >= TOPICS_MAX) setOpen(false);
                            else inputRef.current?.focus();
                          }}
                        >
                          {t.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="px-1 text-xs text-muted-foreground">
                  {q.trim() && results && shown.length === 0
                    ? 'Không thấy chủ đề phù hợp.'
                    : `Còn chọn được ${TOPICS_MAX - value.length} chủ đề. Dùng để lọc bài ở trang Blog.`}
                </p>
              </PopoverContent>
            </Popover>
          </li>
        )}
      </ul>
      {error && (
        <p id={`${id}-err`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Khoá đã xuất bản của chính người viết. Tài khoản admin không có khu giảng viên (403) → ẩn hẳn.
export function RelatedCourseSelect({ value, onChange, error }: { value: string | null; onChange: (id: string | null) => void; error?: string }) {
  const [courses, setCourses] = useState<{ id: string; title: string }[] | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    listMyCourses().then(
      (all) => setCourses(all.filter((c) => c.status === 'published').map((c) => ({ id: c.id, title: c.title }))),
      () => setHidden(true),
    );
  }, []);

  if (hidden) return null;
  const items: Record<string, string> = { [NO_COURSE]: 'Không gắn khoá', ...Object.fromEntries((courses ?? []).map((c) => [c.id, c.title])) };

  return (
    <Panel id="field-relatedCourseId" title="Khoá học liên quan">
      <div className="flex flex-col gap-2">
        {courses ? (
          <Select items={items} value={value ?? NO_COURSE} onValueChange={(v) => onChange(!v || v === NO_COURSE ? null : v)}>
            <SelectTrigger className="w-full" aria-label="Khoá học liên quan" aria-invalid={!!error || undefined}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(items).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error ?? (courses && courses.length === 0 ? 'Bạn chưa có khoá học nào đang bán.' : 'Hiện thành thẻ khoá học ở cuối bài.')}
        </p>
      </div>
    </Panel>
  );
}

export type CheckItem = { label: string; done: boolean; optional?: boolean };

// Điều kiện xuất bản, đổi ngay khi gõ. Trạng thái nói bằng icon + chữ, không chỉ bằng màu.
export function PublishChecklist({ items }: { items: CheckItem[] }) {
  const missing = items.filter((i) => !i.optional && !i.done).length;
  return (
    <Panel
      title="Xuất bản"
      aside={
        <span className={cn('text-xs font-medium', missing ? 'text-warning' : 'text-success')}>{missing ? `Còn thiếu ${missing}` : 'Đủ điều kiện'}</span>
      }
    >
      <ul className="flex flex-col gap-2">
        {items.map((i) => (
          <li key={i.label} className="flex items-start gap-2.5 text-sm">
            {i.done ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={cn(i.done ? 'text-foreground' : 'text-muted-foreground')}>
              {i.label}
              {i.optional && <span className="text-muted-foreground"> (không bắt buộc)</span>}
              <span className="sr-only">{i.done ? ': đã có' : ': chưa có'}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
