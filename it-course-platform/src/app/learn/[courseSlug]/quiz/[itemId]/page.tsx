import type { Metadata } from 'next';
import { Suspense } from 'react';
import { learnItemMetadata } from '@/lib/api/catalog';
import QuizView from './_components/quiz-view';
import { QuizStartSkeleton } from './_components/quiz-start';

export async function generateMetadata({ params }: PageProps<'/learn/[courseSlug]/quiz/[itemId]'>): Promise<Metadata> {
  const { courseSlug, itemId } = await params;
  return learnItemMetadata(courseSlug, itemId, 'Làm bài kiểm tra | SkillPath');
}

// QuizView đọc ?attempt bằng useSearchParams → bọc Suspense.
export default async function QuizPage({ params }: PageProps<'/learn/[courseSlug]/quiz/[itemId]'>) {
  const { courseSlug, itemId } = await params;
  return (
    <Suspense fallback={<QuizStartSkeleton />}>
      <QuizView courseSlug={courseSlug} itemId={itemId} />
    </Suspense>
  );
}
