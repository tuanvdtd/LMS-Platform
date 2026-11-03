import type { Metadata } from 'next';
import { Suspense } from 'react';
import { learnItemMetadata } from '@/lib/api/catalog';
import CodeView, { CodeViewSkeleton } from './_components/code-view';

export async function generateMetadata({ params }: PageProps<'/learn/[courseSlug]/code/[itemId]'>): Promise<Metadata> {
  const { courseSlug, itemId } = await params;
  return learnItemMetadata(courseSlug, itemId, 'Bài tập lập trình | SkillPath');
}

// CodeView đọc ?submission bằng useSearchParams → bọc Suspense.
export default async function CodePage({ params }: PageProps<'/learn/[courseSlug]/code/[itemId]'>) {
  const { courseSlug, itemId } = await params;
  return (
    <Suspense fallback={<CodeViewSkeleton />}>
      <CodeView key={`${courseSlug}/${itemId}`} courseSlug={courseSlug} itemId={itemId} />
    </Suspense>
  );
}
