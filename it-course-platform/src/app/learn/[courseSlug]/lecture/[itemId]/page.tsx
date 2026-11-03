// …/lecture/[itemId]/page.tsx
import type { Metadata } from 'next';
import { learnItemMetadata } from '@/lib/api/catalog';
import LectureView from './_components/lecture-view';

export async function generateMetadata({ params }: PageProps<'/learn/[courseSlug]/lecture/[itemId]'>): Promise<Metadata> {
  const { courseSlug, itemId } = await params;
  return learnItemMetadata(courseSlug, itemId, 'Học bài | SkillPath');
}

export default async function LecturePage({ params }: PageProps<'/learn/[courseSlug]/lecture/[itemId]'>) {
  const { courseSlug, itemId } = await params;
  return <LectureView key={itemId} courseSlug={courseSlug} itemId={itemId} />;
}
