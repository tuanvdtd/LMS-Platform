'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { History, ImageOff } from 'lucide-react';
import { PausingVideo } from '@/components/shared/pausing-video';
import { Skeleton } from '@/components/ui/skeleton';
import { getApproval } from '@/lib/api/course-approvals';
import { cn } from '@/lib/utils';
import type { AdminApprovalDetail } from '@/types/course-approval';
import { LANGUAGE_LABEL, SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { QueueMessage } from '../../../_components/queue';
import { BackLink, fmtDate, fmtDateTime, Panel, ReviewStatusBadge } from '../../../_components/review-ui';
import { CurriculumReview } from './curriculum-review';
import { ReviewActions } from './review-actions';

const LIST = '/admin/course-approvals';

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa khai báo</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm text-foreground">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
              <span className="min-w-0 text-pretty">{t}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Trang duyệt khoá: header khoá → nội dung (mô tả, giáo trình) bên trái, cột Quyết định dính bên phải.
export function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminApprovalDetail | null>(null);
  const [loadError, setLoadError] = useState<'notFound' | 'failed' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect).
  useEffect(() => {
    let stale = false;
    getApproval(id).then(
      (d) => {
        if (!stale) setDetail(d);
      },
      (e) => {
        if (!stale) setLoadError(axios.isAxiosError(e) && e.response?.status === 404 ? 'notFound' : 'failed');
      },
    );
    return () => {
      stale = true;
    };
  }, [id, reloadKey]);

  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink href={LIST}>Hàng đợi duyệt khoá</BackLink>
        <div className="rounded-xl border bg-card shadow-sm">
          {loadError === 'notFound' ? (
            <QueueMessage kind="empty" title="Không tìm thấy yêu cầu duyệt" text="Yêu cầu không tồn tại hoặc đã bị xoá cùng khoá học." />
          ) : (
            <QueueMessage
              kind="error"
              title="Không tải được yêu cầu duyệt"
              text="Kiểm tra kết nối rồi thử lại."
              onRetry={() => {
                setLoadError(null);
                setReloadKey((k) => k + 1);
              }}
            />
          )}
        </div>
      </div>
    );
  }
  if (!detail) return <ApprovalDetailSkeleton />;

  const { approval, course, sections, quizzes, history } = detail;
  const cat = course.category;
  const lastRejected = approval.status === 'pending' && history[0]?.status === 'rejected' ? history[0] : null;
  const facts: [string, React.ReactNode][] = [
    ['Danh mục', cat ? [cat.parent?.name, cat.name].filter(Boolean).join(' › ') : 'Chưa chọn'],
    ['Cấp độ', course.level ? SKILL_LEVEL_LABEL[course.level] : 'Chưa chọn'],
    ['Ngôn ngữ', LANGUAGE_LABEL[course.language]],
    [
      'Giảng viên',
      <>
        {approval.submittedBy.name}
        <span className="block text-xs font-normal break-all text-muted-foreground">{approval.submittedBy.email}</span>
      </>,
    ],
  ];

  return (
    <div className="flex flex-col gap-5">
      <BackLink href={LIST}>Hàng đợi duyệt khoá</BackLink>

      <header className="flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-start">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL ảnh bìa từ storage ngoài, không qua next/image
          <img src={course.thumbnailUrl} alt="Ảnh bìa khoá học" className="aspect-video w-full shrink-0 rounded-lg border object-cover sm:w-60" />
        ) : (
          <div className="grid aspect-video w-full shrink-0 place-items-center rounded-lg border bg-muted text-sm text-muted-foreground sm:w-60">
            <span className="flex items-center gap-2">
              <ImageOff className="size-4" aria-hidden /> Chưa có ảnh bìa
            </span>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ReviewStatusBadge status={approval.status} />
            <span className="text-xs text-muted-foreground tabular-nums">
              {history.length === 0 ? 'Lần gửi đầu tiên' : `Lần gửi thứ ${history.length + 1}`} · gửi {fmtDateTime(approval.createdAt)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-balance text-foreground">{course.title}</h1>
            {course.subtitle && <p className="text-pretty text-muted-foreground">{course.subtitle}</p>}
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm lg:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k as string} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="font-medium text-pretty break-words text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          {course.topics.length > 0 && (
            <ul aria-label="Chủ đề" className="flex flex-wrap gap-1.5">
              {course.topics.map((t) => (
                <li
                  key={t.id}
                  className={
                    t.isPrimary
                      ? 'rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary'
                      : 'rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground'
                  }
                >
                  {t.name}
                  {t.isPrimary && <span className="font-normal"> · chủ đề chính</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Gửi lại: câu hỏi đầu tiên của người duyệt là "lần trước bắt sửa gì, đã sửa chưa?". history mới nhất trước. */}
          {lastRejected?.reason && (
            <div className="flex items-start gap-3 rounded-xl border border-danger-border bg-danger-soft p-4 text-sm">
              <History className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-semibold text-danger">Lần trước bị từ chối ({fmtDate(lastRejected.reviewedAt ?? lastRejected.createdAt)}) vì:</p>
                <p className="whitespace-pre-line text-foreground">{lastRejected.reason}</p>
                <p className="text-xs text-muted-foreground">Kiểm tra giảng viên đã sửa các điểm này chưa.</p>
              </div>
            </div>
          )}
          {course.promoVideoUrl && (
            <Panel title="Video giới thiệu">
              <PausingVideo controls src={course.promoVideoUrl} className="aspect-video w-full rounded-lg bg-black" />
            </Panel>
          )}
          <Panel title="Mô tả khoá học">
            <div className="flex flex-col gap-6">
              {course.description ? (
                <p className="max-w-[60ch] text-sm leading-relaxed whitespace-pre-line text-foreground">{course.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Giảng viên chưa viết mô tả.</p>
              )}
              <BulletList title="Học viên sẽ học được" items={course.learningObjectives} />
              <div className="grid gap-6 sm:grid-cols-2">
                <BulletList title="Yêu cầu" items={course.requirements} />
                <BulletList title="Đối tượng học viên" items={course.targetAudience} />
              </div>
            </div>
          </Panel>
          <CurriculumReview approvalId={approval.id} sections={sections} quizzes={quizzes} />
          {history.length > 0 && (
            <Panel title="Lịch sử gửi duyệt" meta={`${history.length} lần trước`}>
              <ol className="ml-1.5 flex flex-col gap-4 border-l pl-5">
                {history.map((h) => (
                  <li key={h.id} className="relative flex flex-col gap-1.5 text-sm">
                    <span
                      className={cn(
                        'absolute top-1.5 -left-[25.5px] size-2.5 rounded-full ring-4 ring-card',
                        h.status === 'rejected' ? 'bg-danger' : h.status === 'approved' ? 'bg-success' : 'bg-warning',
                      )}
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <ReviewStatusBadge status={h.status} />
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Gửi {fmtDateTime(h.createdAt)}
                        {h.reviewedBy && ` · ${h.reviewedBy.name} xử lý ${fmtDateTime(h.reviewedAt)}`}
                      </span>
                    </div>
                    {h.reason && <p className="max-w-[60ch] whitespace-pre-line text-muted-foreground">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>

        {/* Mobile: Quyết định lên trước nội dung (khỏi cuộn hết giáo trình mới tới nút). Desktop: cột phải, dính. */}
        <div className="order-first lg:sticky lg:top-20 lg:order-none">
          <ReviewActions detail={detail} onChange={setDetail} />
        </div>
      </div>
    </div>
  );
}

// Cùng hình trang thật: link quay lại, header khoá, nội dung trái + cột quyết định phải.
export function ApprovalDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true" aria-label="Đang tải yêu cầu duyệt">
      <Skeleton className="h-8 w-48" />
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row">
        <Skeleton className="aspect-video w-full rounded-lg sm:w-60" />
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </div>
  );
}
