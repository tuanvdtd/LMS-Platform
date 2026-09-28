import type { Metadata } from 'next';
import QuizView from './_components/quiz-view';

export const metadata: Metadata = { title: 'Làm bài kiểm tra | SkillPath' };

export default async function QuizPage({ params }: PageProps<'/learn/[courseSlug]/quiz/[quizId]'>) {
  const { courseSlug } = await params;
  return <QuizView courseSlug={courseSlug} />;
}
