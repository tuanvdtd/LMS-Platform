import type { Metadata } from 'next';
import { ExerciseEditor } from './_components/exercise-editor';

export const metadata: Metadata = { title: 'Soạn bài tập | SkillPath' };

export default async function ExercisePage({ params }: PageProps<'/instructor/courses/[id]/manage/exercises/[itemId]'>) {
  const { id, itemId } = await params;
  return <ExerciseEditor courseId={id} itemId={itemId} />;
}
