'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { StarInput } from '@/components/shared/star-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api/checkout';
import { apiErrorCode } from '@/lib/api/learn-quiz';
import { deleteMyReview, saveMyReview } from '@/lib/api/reviews';
import { REVIEW_COMMENT_MAX } from '@/lib/reviews';
import type { MyReview, OwnReview } from '@/types/reviews';

type Props = {
  courseSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  my: MyReview;
  onSaved: (review: OwnReview) => void;
  onDeleted: () => void;
};

// Viết / sửa / xoá đánh giá của chính mình. Dùng ở trang học và trang chi tiết khoá.
export function ReviewDialog({ open, onOpenChange, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Nội dung chỉ mount khi mở → mỗi lần mở là form mới điền theo đánh giá hiện có. */}
        {open && <Body {...rest} close={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ courseSlug, my, onSaved, onDeleted, close }: Omit<Props, 'open' | 'onOpenChange'> & { close: () => void }) {
  const [rating, setRating] = useState(my.review?.rating ?? 0);
  const [comment, setComment] = useState(my.review?.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // BE là nơi quyết định cuối: nếu nó từ chối vì chưa đủ tiến độ thì chuyển sang màn giải thích.
  const [blockedPct, setBlockedPct] = useState<number | null>(my.canReview ? null : my.progressPct);
  const editing = my.review !== null;
  const tooLong = comment.trim().length > REVIEW_COMMENT_MAX;

  if (blockedPct !== null) {
    // Làm tròn như thanh tiến độ của trang học để hai nơi hiện cùng một số; chặn dưới ngưỡng để 49,6% không hiện thành 50%.
    const pct = Math.min(Math.round(blockedPct), my.minProgressPct - 1);
    return (
      <>
        <DialogHeader>
          <DialogTitle>Chưa thể đánh giá khoá học</DialogTitle>
          <DialogDescription>
            Học được {my.minProgressPct}% khoá để đánh giá. Bạn đang ở {pct}%.
          </DialogDescription>
        </DialogHeader>
        <Progress value={pct} aria-label={`Tiến độ khoá học ${pct}%`} />
        <DialogFooter>
          <Button onClick={close}>Đã hiểu</Button>
        </DialogFooter>
      </>
    );
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const review = await saveMyReview(courseSlug, { rating, comment: comment.trim() });
      toast.success(editing ? 'Đã lưu thay đổi' : 'Đã gửi đánh giá');
      onSaved(review);
      close();
    } catch (e) {
      if (apiErrorCode(e) === 'REVIEW_PROGRESS_REQUIRED') {
        const pct = (e as { response?: { data?: { progressPct?: unknown } } }).response?.data?.progressPct;
        setBlockedPct(typeof pct === 'number' ? pct : my.progressPct);
      } else setError(apiMessage(e, 'Không gửi được đánh giá, thử lại sau'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteMyReview(courseSlug);
      toast.success('Đã xoá đánh giá');
      onDeleted();
      close();
    } catch (e) {
      setConfirmDelete(false);
      setError(apiMessage(e, 'Không xoá được đánh giá, thử lại sau'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? 'Sửa đánh giá' : 'Đánh giá khoá học'}</DialogTitle>
        <DialogDescription>Đánh giá của bạn giúp người học khác chọn khoá phù hợp.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <StarInput value={rating} onChange={setRating} disabled={busy} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-comment" className="text-sm font-medium text-foreground">
            Nhận xét <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
          </label>
          <Textarea
            id="review-comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={busy}
            placeholder="Nội dung có dễ hiểu không? Cách giảng thế nào? Bạn học được gì?"
            aria-invalid={tooLong}
            aria-describedby="review-comment-count"
          />
          <p id="review-comment-count" className={tooLong ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
            {comment.trim().length}/{REVIEW_COMMENT_MAX}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <DialogFooter className="sm:justify-between">
        {editing ? (
          <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirmDelete(true)}>
            Xoá đánh giá
          </Button>
        ) : (
          <span />
        )}
        <Button disabled={busy || rating === 0 || tooLong} onClick={save}>
          {busy ? 'Đang gửi…' : editing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
        </Button>
      </DialogFooter>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá đánh giá của bạn?</AlertDialogTitle>
            <AlertDialogDescription>Số sao và nhận xét sẽ bị gỡ khỏi khoá học. Bạn có thể viết lại sau.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Giữ lại</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={remove}>
              Xoá đánh giá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
