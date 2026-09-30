import type { Metadata } from 'next';
import { QAView } from './_components/qa-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Hỏi đáp | SkillPath' };

export default function QAPage() {
  return <QAView />;
}
