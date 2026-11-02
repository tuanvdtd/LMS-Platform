import type { Metadata } from 'next';
import { PageSlide } from '../../_components/page-slide';
import { QuizEditor } from './_components/quiz-editor';

export const metadata: Metadata = { title: 'Soạn quiz | SkillPath' };

export default async function QuizPage({ params }: PageProps<'/instructor/courses/[id]/manage/quizzes/[itemId]'>) {
  const { id, itemId } = await params;
  return (
    <PageSlide>
      <QuizEditor courseId={id} itemId={itemId} />
    </PageSlide>
  );
}
