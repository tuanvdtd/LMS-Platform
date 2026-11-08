import type { Metadata } from 'next';
import { AssessmentView } from './_components/assessment-view';

export const metadata: Metadata = { title: 'Đánh giá kỹ năng | SkillPath' };

export default async function AssessmentPage({ params }: PageProps<'/skills/[topicSlug]'>) {
  const { topicSlug } = await params;
  return <AssessmentView topicSlug={topicSlug} />;
}
