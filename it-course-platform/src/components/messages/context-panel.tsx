'use client';
// src/components/messages/context-panel.tsx — Cột thông tin người đối diện (giảng viên xem học viên: tiến độ, hoạt động, đánh giá).

import Link from 'next/link';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { formatDate } from '@/lib/admin-users';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/messages/user-avatar';
import type { ConversationCourse, ConversationDetail } from '@/types/message';

function Review({ review }: { review: NonNullable<ConversationCourse['review']> }) {
  const [open, setOpen] = useState(false);
  const long = (review.comment?.length ?? 0) > 140;
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1 text-xs font-semibold">
        <Star aria-hidden className="size-3.5 fill-current text-brand-accent" />
        <span aria-label={`Đánh giá ${review.rating} trên 5 sao`}>{review.rating}/5</span>
        <span className="font-normal text-muted-foreground">· {formatDate(review.createdAt)}</span>
      </p>
      {review.comment && <p className={open ? 'text-xs whitespace-pre-wrap' : 'line-clamp-4 text-xs whitespace-pre-wrap'}>{review.comment}</p>}
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-fit rounded text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

export function ContextPanel({ detail }: { detail: ConversationDetail }) {
  const { other, courses } = detail;
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <UserAvatar user={other} size="lg" className="size-16" />
        <p className="text-sm font-bold">{other.name}</p>
        <Link href={`/u/${other.id}`} className="text-xs font-medium text-primary hover:underline">
          Xem trang cá nhân
        </Link>
      </div>
      {courses.length > 0 && <Separator />}
      <ul className="flex flex-col gap-4" aria-label="Khoá học">
        {courses.map((c) => (
          <li key={c.id} className="flex flex-col gap-2">
            <Link href={`/course/${c.slug}`} className="text-sm font-semibold hover:text-primary hover:underline">
              {c.title}
            </Link>
            {c.otherIsStudent && (
              <>
                <div className="flex items-center gap-2">
                  <Progress value={c.progressPct ?? 0} aria-label={`Tiến độ ${c.title}`} />
                  <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{c.progressPct ?? 0}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.lastAccessedAt ? `Hoạt động gần nhất: ${formatDate(c.lastAccessedAt)}` : 'Chưa vào học'}
                </p>
                {c.review ? <Review review={c.review} /> : <p className="text-xs text-muted-foreground">Chưa đánh giá</p>}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
