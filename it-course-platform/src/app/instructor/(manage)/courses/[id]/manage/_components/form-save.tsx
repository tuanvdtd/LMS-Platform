'use client';

import axios from 'axios';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function SaveButton({ isDirty, isSubmitting, locked }: { isDirty: boolean; isSubmitting: boolean; locked: boolean }) {
  return (
    <Button type="submit" disabled={locked || !isDirty || isSubmitting}>
      {isSubmitting ? 'Đang lưu…' : 'Lưu'}
    </Button>
  );
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
