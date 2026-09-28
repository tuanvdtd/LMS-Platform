import type { Metadata } from 'next';
import { QuestionsView } from './_components/questions-view';

export const metadata: Metadata = { title: 'Ngân hàng câu hỏi | SkillPath' };

export default function QuestionsPage() {
  return <QuestionsView />;
}
