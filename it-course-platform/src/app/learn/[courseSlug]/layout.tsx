// it-course-platform/src/app/learn/[courseSlug]/layout.tsx
import { Suspense } from 'react';
import { LearnShellSkeleton } from '@/components/skeletons/learn-shell-skeleton';
import { LearnShell } from './_components/learn-shell';

// Khung học chung cho bài giảng / quiz / bài code.
// useParams trong LearnShell cần Suspense khi trang được prerender tĩnh (param chỉ biết lúc request).
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LearnShellSkeleton />}>
      <LearnShell>{children}</LearnShell>
    </Suspense>
  );
}
