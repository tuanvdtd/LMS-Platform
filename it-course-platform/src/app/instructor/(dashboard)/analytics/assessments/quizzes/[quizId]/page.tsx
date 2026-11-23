import type { Metadata } from 'next';
import { QuizAnalyticsView } from './_components/quiz-analytics-view';

export const metadata: Metadata = { title: 'Phân tích quiz | Aolumi' };

export default async function QuizAnalyticsPage({ params }: PageProps<'/instructor/analytics/assessments/quizzes/[quizId]'>) {
  const { quizId } = await params;
  return <QuizAnalyticsView quizId={quizId} />;
}
