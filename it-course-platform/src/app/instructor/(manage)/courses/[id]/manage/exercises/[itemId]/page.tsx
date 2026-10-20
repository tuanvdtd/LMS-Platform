import type { Metadata } from 'next';
import { ExerciseEditor } from './_components/exercise-editor';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Soạn bài tập | SkillPath' };

export default async function ExercisePage({ params }: PageProps<'/instructor/courses/[id]/manage/exercises/[itemId]'>) {
  const { id, itemId } = await params;
  return <ExerciseEditor courseId={id} itemId={itemId} />;
}
