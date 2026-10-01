'use client';

import axios from 'axios';
import type { FieldValues, Path, UseFormHandleSubmit, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-sm/relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

// Thanh lưu dính đáy, chỉ hiện khi form có thay đổi (spec C3: không autosave, Lưu chỉ bật khi có thay đổi).
export function SaveBar({
  isDirty,
  isSubmitting,
  locked,
  onDiscard,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  locked: boolean;
  onDiscard: () => void;
}) {
  if (!isDirty || locked) return null;
  return (
    <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-xl bg-slate-900 py-2.5 pr-2.5 pl-4 text-slate-50 shadow-xl">
      <span className="size-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
      <span className="flex-1 text-sm">Bạn có thay đổi chưa lưu</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-slate-200 hover:bg-slate-800 hover:text-white"
        disabled={isSubmitting}
        onClick={onDiscard}
      >
        Huỷ thay đổi
      </Button>
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? 'Đang lưu…' : 'Lưu'}
      </Button>
    </div>
  );
}

// Hàm lưu cho dialog "Lưu & tiếp tục": chạy validate + onSubmit, trả true nếu lưu xong.
export function submitToPromise<T extends FieldValues>(
  handleSubmit: UseFormHandleSubmit<T>,
  onSubmit: (values: T) => Promise<boolean>,
) {
  return () =>
    new Promise<boolean>((resolve) => {
      void handleSubmit(
        async (values) => resolve(await onSubmit(values)),
        () => resolve(false),
      )();
    });
}

type ApiFieldError = { path: string[]; message: string };

// Lỗi khi lưu (spec §5.3, §7): 400 → lỗi dưới từng ô theo path; 409 COURSE_LOCKED → khoá form;
// còn lại (mạng/500/400 không có path) → toast, giữ nguyên dữ liệu form.
// toField đổi path API → tên field của form (mặc định nối bằng dấu chấm).
export function applySaveError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  onLocked: () => void,
  toField: (path: string[]) => string = (path) => path.join('.'),
) {
  const res = axios.isAxiosError(err) ? err.response : undefined;
  if (res?.status === 409 && res.data?.code === 'COURSE_LOCKED') {
    onLocked();
    return;
  }
  const errors = res?.status === 400 ? (res.data?.errors as ApiFieldError[] | undefined) : undefined;
  if (errors?.length && errors.every((e) => e.path.length > 0)) {
    for (const e of errors) setError(toField(e.path) as Path<T>, { message: e.message });
    return;
  }
  toast.error('Lưu thất bại, thử lại');
}
