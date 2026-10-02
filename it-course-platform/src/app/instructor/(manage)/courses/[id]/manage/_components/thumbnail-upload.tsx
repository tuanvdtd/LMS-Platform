'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { setThumbnail } from '@/lib/api/assets';
import { uploadErrorMessage, uploadThumbnail } from '@/lib/upload';
import { THUMBNAIL_MAX_BYTES, THUMBNAIL_MIN } from '@/types/curriculum';
import { useCourse } from './course-provider';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Kiểm ở FE trước cho nhanh; BE kiểm lại magic bytes + kích thước (spec §4.3).
async function checkImage(file: File): Promise<string | null> {
  if (!TYPES.includes(file.type)) return 'Chỉ nhận ảnh JPG, PNG hoặc WebP';
  if (file.size > THUMBNAIL_MAX_BYTES) return 'Ảnh tối đa 5 MB';
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    if (width >= THUMBNAIL_MIN.width && height >= THUMBNAIL_MIN.height) return null;
    return `Ảnh ${width}×${height} px, cần tối thiểu ${THUMBNAIL_MIN.width}×${THUMBNAIL_MIN.height} px`;
  } catch {
    return 'Không đọc được ảnh';
  }
}

// Ảnh bìa ghi ngay khi tải xong (spec §5.3), không đi theo nút Lưu và không làm form basics dirty.
export function ThumbnailUpload({ disabled }: { disabled: boolean }) {
  const { course, setCourse, patchCourse } = useCourse();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null); // file PUT lỗi → nút "Thử lại" (spec §6)
  const inputRef = useRef<HTMLInputElement>(null);

  async function start(file: File | undefined) {
    if (!file) return;
    setError(null);
    setFailedFile(null);
    const problem = await checkImage(file);
    if (problem) return setError(problem);
    setProgress(0);
    try {
      const key = await uploadThumbnail(file, { onProgress: setProgress });
      setCourse(await setThumbnail(course.id, key));
      toast.success('Đã cập nhật ảnh bìa');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) patchCourse({ status: 'in_review' });
      else {
        const message = uploadErrorMessage(err);
        setError(message);
        // 400 = BE từ chối chính file này → thử lại cũng vô ích.
        if (message && !(axios.isAxiosError(err) && err.response?.status === 400)) setFailedFile(file);
      }
    } finally {
      setProgress(null);
    }
  }

  return (
    <div id="thumbnail" className="grid scroll-mt-20 gap-4 rounded-lg transition-shadow sm:grid-cols-2">
      {course.thumbnailUrl ? (
        <Image
          src={course.thumbnailUrl}
          alt="Ảnh bìa hiện tại"
          width={375}
          height={211}
          unoptimized
          className="aspect-video w-full rounded-lg border object-cover"
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-muted text-[13px] text-muted-foreground">
          <ImageIcon />
          750 × 422 px
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold">Ảnh bìa</p>
        <p className="text-[13px]/relaxed text-muted-foreground">
          JPG, PNG hoặc WebP, tối thiểu 750×422 px, tối đa 5 MB, không chèn chữ quá nhiều. Ảnh hiển thị ở trang khoá và
          thẻ tìm kiếm.
        </p>
        {progress !== null ? (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" aria-label="Tiến độ tải ảnh" />
            <span className="w-10 text-right text-xs tabular-nums">{progress}%</span>
          </div>
        ) : (
          <div>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
              <Upload data-icon="inline-start" />
              {course.thumbnailUrl ? 'Thay ảnh' : 'Tải ảnh lên'}
            </Button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            void start(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {error && (
          <div className="flex items-center gap-2">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            {failedFile && (
              <Button type="button" variant="outline" size="xs" disabled={disabled} onClick={() => void start(failedFile)}>
                Thử lại
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
