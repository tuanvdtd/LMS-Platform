'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCourse } from '@/lib/api/instructor-courses';

const MAX = 60;
const schema = z.object({
  title: z.string().trim().min(1, 'Nhập tên khoá học').max(MAX, `Tối đa ${MAX} ký tự`),
});
type Values = z.infer<typeof schema>;

// Không có wizard: chỉ nhập tên rồi vào trang quản lý (spec C1).
export function CreateCourseDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { title: '' } });
  const title = useWatch({ control, name: 'title' });

  async function onSubmit(values: Values) {
    try {
      const { id } = await createCourse(values.title);
      setOpen(false);
      reset();
      router.push(`/instructor/courses/${id}/manage/goals`);
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.status === 400
          ? (err.response.data?.errors?.[0]?.message as string | undefined)
          : undefined;
      if (message) setError('title', { message });
      else toast.error('Tạo khoá học thất bại, thử lại');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" /> Tạo khoá học
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Tạo khoá học</DialogTitle>
            <DialogDescription>Đặt một tên tạm, bạn có thể đổi lại sau ở Trang tổng quan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-course-title">Tên khoá học</Label>
            <div className="relative">
              <Input
                id="new-course-title"
                autoFocus
                maxLength={MAX}
                placeholder="Ví dụ: Lập trình React từ số 0"
                className="pr-12"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'new-course-title-error' : undefined}
                {...register('title')}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
                {MAX - title.length}
              </span>
            </div>
            {errors.title && (
              <p id="new-course-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Đang tạo…' : 'Tạo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
