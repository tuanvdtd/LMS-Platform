// …/lecture/[itemId]/page.tsx
import type { Metadata } from 'next';
import { learnItemMetadata } from '@/lib/api/catalog';
import LectureView from './_components/lecture-view';

export async function generateMetadata({ params }: PageProps<'/learn/[courseSlug]/lecture/[itemId]'>): Promise<Metadata> {
  const { courseSlug, itemId } = await params;
  return learnItemMetadata(courseSlug, itemId, 'Học bài | SkillPath');
}

export default async function LecturePage({ params, searchParams }: PageProps<'/learn/[courseSlug]/lecture/[itemId]'>) {
  const [{ courseSlug, itemId }, sp] = await Promise.all([params, searchParams]);
  const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined);
  // Link thông báo Hỏi đáp: ?tab=qa&question=<id>&answer=<id>
  return (
    <LectureView
      key={itemId}
      courseSlug={courseSlug}
      itemId={itemId}
      tab={one(sp.tab)}
      question={one(sp.question)}
      answer={one(sp.answer)}
    />
  );
}
