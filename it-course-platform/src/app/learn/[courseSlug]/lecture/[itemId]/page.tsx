// …/lecture/[itemId]/page.tsx
import type { Metadata } from 'next';
import LectureView from './_components/lecture-view';

// LearnShell (layout) đọc useParams trong Suspense → validate bỏ segment con → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Học bài | SkillPath' };

export default async function LecturePage({ params }: PageProps<'/learn/[courseSlug]/lecture/[itemId]'>) {
  const { courseSlug, itemId } = await params;
  return <LectureView key={itemId} courseSlug={courseSlug} itemId={itemId} />;
}
