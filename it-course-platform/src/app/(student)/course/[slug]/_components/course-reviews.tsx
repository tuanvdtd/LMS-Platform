'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { MessageButton } from '@/components/messages/message-button';
import { ReviewDialog } from '@/components/shared/review-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyReview, listReviews } from '@/lib/api/reviews';
import { authClient } from '@/lib/auth-client';
import { ratingSummary, STARS } from '@/lib/reviews';
import { fullTime, timeAgo } from '@/lib/time-ago';
import { cn } from '@/lib/utils';
import type { CourseReview, CourseReviewPage, MyReview, Stars } from '@/types/reviews';

const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

// Mục "Đánh giá của học viên": tự lấy số liệu từ API (không qua cache của trang) nên đổi ngay sau khi viết.
export function CourseReviews({ slug, instructorId }: { slug: string; instructorId?: string }) {
  const { data: session } = authClient.useSession();
  const signedIn = Boolean(session?.user);
  const isInstructor = Boolean(instructorId) && session?.user.id === instructorId;
  const [page, setPage] = useState<CourseReviewPage | null>(null);
  const [filter, setFilter] = useState<Stars | null>(null);
  const [failed, setFailed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [my, setMy] = useState<MyReview | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh, tải lại sau khi lưu).
  const seq = useRef(0);

  const load = useCallback(
    (rating: Stars | null) => {
      const id = ++seq.current;
      // Không đổi state đồng bộ ở đây: hàm này chạy trong effect. Lỗi cũ được xoá khi lần gọi mới thành công.
      listReviews(slug, { rating: rating ?? undefined }).then(
        (p) => { if (id === seq.current) { setPage(p); setFailed(false); } },
        () => { if (id === seq.current) setFailed(true); },
      );
    },
    [slug],
  );

  useEffect(() => load(filter), [load, filter]);

  // Chưa ghi danh hoặc là chủ khoá → 403: không có khối "Đánh giá của bạn".
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    getMyReview(slug).then((m) => { if (!cancelled) setMy(m); }, () => undefined);
    return () => { cancelled = true; };
  }, [signedIn, slug]);

  const loadMore = async () => {
    if (!page?.nextCursor) return;
    const id = seq.current;
    setLoadingMore(true);
    try {
      const next = await listReviews(slug, { rating: filter ?? undefined, cursor: page.nextCursor });
      if (id === seq.current) setPage({ ...next, items: [...page.items, ...next.items] });
    } catch {
      // Giữ danh sách đang có; nút vẫn còn để bấm lại.
    } finally {
      setLoadingMore(false);
    }
  };

  const summary = page && ratingSummary(page.distribution);

  return (
    <section id="danh-gia">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Đánh giá của học viên</h2>

      {my && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-sm font-semibold text-foreground">Đánh giá của bạn</p>
            {my.review ? (
              <>
                <RatingStars rating={my.review.rating} size="md" />
                {my.review.comment && <p className="text-sm whitespace-pre-line text-foreground">{my.review.comment}</p>}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Bạn thấy khoá học này thế nào? Chia sẻ để giúp người học khác.</p>
            )}
          </div>
          <Button variant={my.review ? 'outline' : 'default'} onClick={() => setDialogOpen(true)}>
            {my.review ? 'Sửa' : 'Viết đánh giá'}
          </Button>
        </div>
      )}

      {failed ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">Không tải được đánh giá.</p>
          <Button variant="outline" onClick={() => load(filter)}>Thử lại</Button>
        </div>
      ) : !page || !summary ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label="Đang tải đánh giá">
          <Skeleton className="h-28 w-full rounded-xl" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : summary.total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
          <MessageSquare className="size-6 text-muted-foreground" aria-hidden />
          <p className="font-semibold text-foreground">Chưa có đánh giá nào</p>
          <p className="max-w-sm text-sm text-muted-foreground">Học viên học được nửa khoá có thể để lại đánh giá đầu tiên.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-start gap-1 sm:w-40">
              <b className="text-5xl leading-none font-bold text-foreground tabular-nums">
                {summary.average.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </b>
              <RatingStars rating={summary.average} size="md" />
              <span className="text-sm text-muted-foreground">{summary.total.toLocaleString('vi-VN')} đánh giá</span>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-1">
              {[...STARS].reverse().map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    disabled={page.distribution[s] === 0}
                    aria-pressed={filter === s}
                    aria-label={`${s} sao: ${summary.pct[s]}% đánh giá. ${filter === s ? 'Bỏ lọc' : 'Chỉ xem mức này'}`}
                    onClick={() => setFilter(filter === s ? null : s)}
                    className={cn(
                      'flex min-h-9 w-full items-center gap-3 rounded-md px-2 text-sm hover:bg-muted disabled:pointer-events-none disabled:opacity-50',
                      focusRing,
                      filter === s && 'bg-muted font-semibold',
                    )}
                  >
                    <span className="flex w-8 shrink-0 items-center gap-1 tabular-nums">
                      {s} <Star className="size-3.5 fill-rating text-rating" aria-hidden />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted-foreground/15">
                      <span className="block h-full rounded-full bg-rating" style={{ width: `${summary.pct[s]}%` }} />
                    </span>
                    <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">{summary.pct[s]}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {filter && (
            <p className="mt-4 text-sm text-muted-foreground">
              Đang xem đánh giá {filter} sao.{' '}
              <button type="button" className={cn('font-medium text-foreground underline underline-offset-4', focusRing)} onClick={() => setFilter(null)}>
                Xem tất cả
              </button>
            </p>
          )}

          {page.items.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Chưa có đánh giá {filter} sao.</p>
          ) : (
            <ul className="mt-2 divide-y">
              {page.items.map((r) => <ReviewRow key={r.id} review={r} canMessage={isInstructor} />)}
            </ul>
          )}

          {page.nextCursor && (
            <Button variant="outline" className="mt-4" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? 'Đang tải…' : 'Xem thêm đánh giá'}
            </Button>
          )}
        </>
      )}

      {my && (
        <ReviewDialog
          courseSlug={slug}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          my={my}
          onSaved={(review) => { setMy({ ...my, review, canReview: true }); load(filter); }}
          onDeleted={() => { setMy({ ...my, review: null }); load(filter); }}
        />
      )}
    </section>
  );
}

function ReviewRow({ review, canMessage }: { review: CourseReview; canMessage: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // Chỉ hiện "Xem thêm" khi nhận xét thật sự bị cắt ở 5 dòng.
  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [review.comment]);

  return (
    <li className="flex gap-3 py-4">
      <Avatar>
        {review.author.image && <AvatarImage src={review.author.image} alt="" />}
        <AvatarFallback>{review.author.name.trim().charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{review.author.name}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <RatingStars rating={review.rating} />
          <time dateTime={review.createdAt} title={fullTime(review.createdAt)} className="text-xs text-muted-foreground">
            {timeAgo(review.createdAt)}
          </time>
        </div>
        {review.comment && (
          <>
            <p ref={ref} className={cn('text-sm leading-relaxed whitespace-pre-line text-foreground', !expanded && 'line-clamp-5')}>
              {review.comment}
            </p>
            {(clamped || expanded) && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
                className={cn('self-start text-sm font-medium text-foreground underline underline-offset-4', focusRing)}
              >
                {expanded ? 'Thu gọn' : 'Xem thêm'}
              </button>
            )}
          </>
        )}
        {canMessage && <MessageButton userId={review.author.id} basePath="/instructor/messages" className="mt-1 self-start" />}
      </div>
    </li>
  );
}
