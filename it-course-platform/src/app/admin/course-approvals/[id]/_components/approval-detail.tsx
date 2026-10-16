'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getApproval } from '@/lib/api/course-approvals';
import type { AdminApprovalDetail } from '@/types/course-approval';
import { LANGUAGE_LABEL, SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { CurriculumReview } from './curriculum-review';
import { ReviewActions } from './review-actions';
import { PausingVideo } from '@/components/shared/pausing-video';

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

// Trang duyệt khoá (spec pricing-submit-review §5.3): nội dung khoá bên trái, thao tác duyệt bên phải.
export function ApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<AdminApprovalDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Chỉ setState trong callback (lint react-hooks/set-state-in-effect).
  useEffect(() => {
    let stale = false;
    getApproval(id).then(
      (d) => {
        if (!stale) setDetail(d);
      },
      (e) => {
        if (stale) return;
        if (axios.isAxiosError(e) && e.response?.status === 404) setNotFound(true);
        else toast.error('Không tải được yêu cầu duyệt');
      },
    );
    return () => {
      stale = true;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Không tìm thấy yêu cầu duyệt</p>
        <Link href="/admin/course-approvals" className="text-sm text-primary hover:underline">
          ← Danh sách
        </Link>
      </div>
    );
  }
  if (!detail) return <Skeleton className="h-96 w-full" />;

  const { approval, course, sections, quizzes } = detail;
  const cat = course.category;

  return (
    <div className="space-y-4">
      <Link href="/admin/course-approvals" className="text-sm text-primary hover:underline">
        ← Danh sách
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold">{course.title}</h1>
            {course.subtitle && <p className="mt-1 text-muted-foreground">{course.subtitle}</p>}
          </div>

          {course.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL ảnh bìa từ storage ngoài, không qua next/image
            <img src={course.thumbnailUrl} alt="Ảnh bìa khoá học" className="aspect-video w-full max-w-xl rounded-xl border object-cover" />
          )}
          {course.promoVideoUrl && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold">Video giới thiệu</h2>
              <PausingVideo controls src={course.promoVideoUrl} className="aspect-video w-full max-w-xl rounded-xl bg-black" />
            </div>
          )}

          <section className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Cấp độ</dt>
                <dd className="font-medium">{course.level ? SKILL_LEVEL_LABEL[course.level] : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ngôn ngữ</dt>
                <dd className="font-medium">{LANGUAGE_LABEL[course.language]}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Thể loại</dt>
                <dd className="font-medium">{cat ? [cat.parent?.name, cat.name].filter(Boolean).join(' › ') : '—'}</dd>
              </div>
            </dl>
            <div>
              <div className="mb-1 text-muted-foreground">Chủ đề</div>
              <div className="flex flex-wrap gap-2">
                {course.topics.length === 0 && <span>—</span>}
                {course.topics.map((t) => (
                  <Badge key={t.id} variant={t.isPrimary ? 'default' : 'secondary'}>
                    {t.name}
                    {t.isPrimary && ' (chính)'}
                  </Badge>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div>
              <h2 className="mb-2 text-sm font-semibold">Mô tả</h2>
              <p className="whitespace-pre-line text-sm">{course.description || 'Chưa có mô tả'}</p>
            </div>
            <BulletList title="Học viên sẽ học được" items={course.learningObjectives} />
            <BulletList title="Yêu cầu" items={course.requirements} />
            <BulletList title="Đối tượng học viên" items={course.targetAudience} />
          </section>

          <CurriculumReview approvalId={approval.id} sections={sections} quizzes={quizzes} />
        </div>

        <div className="self-start lg:sticky lg:top-6">
          <ReviewActions detail={detail} onChange={setDetail} />
        </div>
      </div>
    </div>
  );
}
