import type { Metadata } from 'next';
import { Suspense } from 'react';
import CodeView, { CodeViewSkeleton } from './_components/code-view';

// LearnShell (layout) đọc useParams trong Suspense → validate bỏ segment con → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Bài tập lập trình | SkillPath' };

// CodeView đọc ?submission bằng useSearchParams → bọc Suspense.
export default async function CodePage({ params }: PageProps<'/learn/[courseSlug]/code/[itemId]'>) {
  const { courseSlug, itemId } = await params;
  return (
    <Suspense fallback={<CodeViewSkeleton />}>
      <CodeView key={`${courseSlug}/${itemId}`} courseSlug={courseSlug} itemId={itemId} />
    </Suspense>
  );
}
