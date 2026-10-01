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
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
      <DialogTrigger render={<Button variant="accent" />}>
        <Plus data-icon="inline-start" /> Tạo khoá học
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle className="text-xl">Đặt tên cho khoá học</DialogTitle>
            <DialogDescription>
              Chưa nghĩ ra tên hay? Cứ đặt tạm, bạn đổi được bất cứ lúc nào trong Trang tổng quan.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!errors.title || undefined}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="new-course-title">Tên khoá học</FieldLabel>
              <span className="font-mono text-xs text-muted-foreground">{MAX - title.length}</span>
            </div>
            <Input
              id="new-course-title"
              autoFocus
              maxLength={MAX}
              placeholder="Ví dụ: NestJS từ cơ bản đến triển khai"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'new-course-title-error' : undefined}
              {...register('title')}
            />
            {errors.title ? (
              <FieldError id="new-course-title-error">{errors.title.message}</FieldError>
            ) : (
              <FieldDescription>Bấm Enter để tạo nhanh.</FieldDescription>
            )}
          </Field>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Huỷ</DialogClose>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Đang tạo…' : 'Tạo khoá học'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
