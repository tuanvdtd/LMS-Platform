import type { Metadata } from 'next';
import { SkillQuestionsView } from './_components/skill-questions-view';

export const metadata: Metadata = { title: 'Câu hỏi kỹ năng | SkillPath Admin' };

export default async function AdminSkillTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  return <SkillQuestionsView topicId={topicId} />;
}
