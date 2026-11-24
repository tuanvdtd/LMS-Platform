// src/app/instructor/(dashboard)/_components/overview-reviews.tsx
import { Star } from 'lucide-react';
import { MessageButton } from '@/components/messages/message-button';
import { fmtDate, fmtNum } from '@/lib/analytics';
import type { InstructorOverview } from '@/types/analytics';
import { Panel } from '../analytics/_components/analytics-shell';

export function OverviewReviews({ reviews, rating, reviewCount }: { reviews: InstructorOverview['reviews']; rating: number | null; reviewCount: number }) {
  const max = Math.max(1, ...reviews.distribution.map((d) => d.count));
  return (
    <div id="reviews" className="flex scroll-mt-6 [&>section]:flex-1">
      <Panel title="Đánh giá">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <p className="text-3xl font-bold text-foreground">{rating === null ? '—' : rating.toFixed(1).replace('.', ',')}</p>
            <p className="text-xs text-muted-foreground">{fmtNum(reviewCount)} đánh giá</p>
          </div>
          <ul className="flex flex-1 flex-col gap-1" aria-label="Phân bố số sao">
            {reviews.distribution.map((d) => (
              <li key={d.stars} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-8 shrink-0 tabular-nums">{d.stars} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-primary" style={{ width: `${(d.count / max) * 100}%` }} />
                </span>
                <span className="w-8 shrink-0 text-right tabular-nums text-foreground">{fmtNum(d.count)}</span>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="text-sm font-semibold text-foreground">Đánh giá 1–2 sao mới nhất</h3>
        {reviews.low.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có đánh giá 1–2 sao</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.low.map((r) => (
              <li key={`${r.userId}:${r.courseId}`} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-xs text-muted-foreground">{r.courseTitle} · {fmtDate(r.createdAt)}</p>
                  <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Star className="size-3.5 text-warning" aria-hidden /> {r.rating} sao · {r.userName}
                  </p>
                  {r.comment && <p className="line-clamp-2 text-sm text-muted-foreground">{r.comment}</p>}
                </div>
                <MessageButton userId={r.userId} basePath="/instructor/messages" canMessage={r.canMessage} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
