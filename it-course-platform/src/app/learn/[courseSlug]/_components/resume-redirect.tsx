// it-course-platform/src/app/learn/[courseSlug]/_components/resume-redirect.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { flatItems, itemHref } from './learn-nav';
import { useLearnShell } from './learn-shell';
import { StateMessage } from './state-message';

export function ResumeRedirect() {
  const { outline } = useLearnShell();
  const router = useRouter();
  const items = flatItems(outline);
  const slug = outline.course.slug;
  const resumed = items.find((i) => i.id === outline.resumeItemId);
  const target = [resumed, ...items].find((i) => i && itemHref(slug, i));
  const href = target ? itemHref(slug, target) : null;

  useEffect(() => {
    if (href) router.replace(href);
  }, [href, router]);

  if (!href) {
    return <StateMessage icon={BookOpen} title="Khoá học chưa có bài nào" text="Giảng viên chưa xuất bản bài học, quay lại sau nhé." />;
  }
  return (
    <div className="p-4" role="status" aria-busy="true" aria-label="Đang mở bài học">
      <Skeleton className="aspect-video w-full" />
    </div>
  );
}
