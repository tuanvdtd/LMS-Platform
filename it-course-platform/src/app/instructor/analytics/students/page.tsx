import type { Metadata } from 'next';
import { StudentsView } from './_components/students-view';

export const metadata: Metadata = { title: 'Phân tích Học viên | SkillPath' };

export default function AnalyticsStudentsPage() {
  return <StudentsView />;
}
