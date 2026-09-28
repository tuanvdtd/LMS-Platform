import type { Metadata } from 'next';
import { ProblemsView } from './_components/problems-view';

export const metadata: Metadata = { title: 'Bài tập lập trình | SkillPath' };

export default function ProblemsPage() {
  return <ProblemsView />;
}
