import type { Metadata } from 'next';
import LearnView from './_components/learn-view';

export const metadata: Metadata = { title: 'Học bài | SkillPath' };

export default async function LearnPage({ params }: PageProps<'/learn/[courseSlug]/[lessonId]'>) {
  const { courseSlug, lessonId } = await params;
  return <LearnView courseSlug={courseSlug} lessonId={lessonId} />;
}
