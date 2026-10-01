import type { Metadata } from 'next';
import { QuestionsView } from './_components/questions-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Ngân hàng câu hỏi | SkillPath' };

export default function QuestionsPage() {
  return <QuestionsView />;
}
