import type { Metadata } from 'next';
import { StudentsView } from './_components/students-view';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Phân tích Học viên | SkillPath' };

export default function AnalyticsStudentsPage() {
  return <StudentsView />;
}
