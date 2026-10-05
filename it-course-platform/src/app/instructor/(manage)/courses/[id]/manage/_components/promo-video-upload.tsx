'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Loader2, Upload, Video, X } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { removePromoVideo, setPromoVideo } from '@/lib/api/assets';
import { checkVideo, uploadErrorMessage, uploadPromo } from '@/lib/upload';
import { PROMO_MAX_BYTES } from '@/types/curriculum';
import { useCourse } from './course-provider';

// Video giới thiệu (spec video-upload §5.3): cùng khuôn ảnh bìa, ghi ngay khi xong, không làm form basics dirty.
export function PromoVideoUpload({ disabled }: { disabled: boolean }) {
  const { course, setCourse, patchCourse } = useCourse();
  const [phase, setPhase] = useState<'checking' | 'uploading' | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null); // lỗi mạng → nút "Thử lại"
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  useEffect(() => () => ctrlRef.current?.abort(), []);

  function fail(err: unknown, file?: File) {
    if (axios.isAxiosError(err) && err.response?.status === 409) return patchCourse({ status: 'in_review' });
    const message = uploadErrorMessage(err);
    setError(message);
    // 400 = BE từ chối chính file này → thử lại cũng vô ích.
    if (file && message && !(axios.isAxiosError(err) && err.response?.status === 400)) setFailedFile(file);
  }

  async function start(file: File | undefined) {
    if (!file || ctrlRef.current || disabled) return;
    setError(null);
    setFailedFile(null);
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setPhase('checking');
    try {
      const { problem } = await checkVideo(file, PROMO_MAX_BYTES, '200 MB');
      if (ctrl.signal.aborted) return;
      if (problem) return setError(problem);
      setProgress(0);
      setPhase('uploading');
      const key = await uploadPromo(file, { signal: ctrl.signal, onProgress: setProgress });
      ctrl.signal.throwIfAborted();
      setCourse(await setPromoVideo(course.id, key));
      toast.success('Đã cập nhật video giới thiệu');
    } catch (err) {
      fail(err, file);
    } finally {
      ctrlRef.current = null;
      setPhase(null);
    }
  }

  async function remove() {
    setError(null);
    setFailedFile(null);
    setRemoving(true);
    try {
      setCourse(await removePromoVideo(course.id));
      toast.success('Đã gỡ video giới thiệu');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) patchCourse({ status: 'in_review' });
      else toast.error('Gỡ video thất bại, thử lại');
    } finally {
      setRemoving(false);
      setConfirmRemove(false);
    }
  }

  let action: React.ReactNode;
  if (phase === 'checking' || (phase === 'uploading' && progress === 100)) {
    action = (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {phase === 'checking' ? 'Đang kiểm tra file…' : 'Đang xử lý video…'}
      </p>
    );
  } else if (phase === 'uploading') {
    action = (
      <div className="flex items-center gap-2">
        <Progress value={progress} className="flex-1" aria-label="Tiến độ tải video" />
        <span className="w-10 text-right text-xs tabular-nums">{progress}%</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => ctrlRef.current?.abort()}>
          Huỷ
        </Button>
      </div>
    );
  } else {
    action = (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          <Upload data-icon="inline-start" />
          {course.promoVideoUrl ? 'Thay video' : 'Tải video lên'}
        </Button>
        {course.promoVideoUrl && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => setConfirmRemove(true)}>
            <X data-icon="inline-start" />
            Gỡ
          </Button>
        )}
      </div>
    );
  }

  return (
    <div id="promo-video" className="grid scroll-mt-20 gap-4 rounded-lg transition-shadow sm:grid-cols-2">
      {course.promoVideoUrl ? (
        <video
          key={course.promoVideoUrl}
          src={course.promoVideoUrl}
          controls
          aria-label="Video giới thiệu hiện tại"
          preload="metadata"
          className="aspect-video w-full rounded-lg border bg-black"
        />
      ) : (
        <div className="flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed bg-muted text-[13px] text-muted-foreground">
          <Video />
          MP4 · tối đa 200 MB
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold">
          Video quảng cáo <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
        </p>
        <p className="text-[13px]/relaxed text-muted-foreground">
          1–2 phút giới thiệu khoá. Học viên xem video này dễ đăng ký hơn.
        </p>
        {action}
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4"
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
      <AlertDialog open={confirmRemove} onOpenChange={(open) => !open && !removing && setConfirmRemove(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ video giới thiệu?</AlertDialogTitle>
            <AlertDialogDescription>Video sẽ bị xoá khỏi trang khoá học và không khôi phục được.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" disabled={removing}>
              Huỷ
            </AlertDialogCancel>
            <Button variant="destructive" disabled={removing} onClick={() => void remove()}>
              {removing && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {removing ? 'Đang gỡ…' : 'Gỡ video'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
