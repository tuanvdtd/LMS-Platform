import type { Metadata } from 'next';
import { ProblemsView } from './_components/problems-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Bài tập lập trình | SkillPath' };

export default function ProblemsPage() {
  return <ProblemsView />;
}
