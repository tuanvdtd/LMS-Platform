import type { Metadata } from 'next';
import { ExerciseAnalyticsView } from './_components/exercise-analytics-view';

export const metadata: Metadata = { title: 'Phân tích bài code | Aolumi' };

export default async function ExerciseAnalyticsPage({ params }: PageProps<'/instructor/analytics/assessments/exercises/[exerciseId]'>) {
  const { exerciseId } = await params;
  return <ExerciseAnalyticsView exerciseId={exerciseId} />;
}
