import type { Metadata } from 'next';
import { ClassSkillsView } from './_components/class-skills-view';

export const metadata: Metadata = { title: 'Năng lực lớp | Aolumi' };

export default function AnalyticsSkillsPage() {
  return <ClassSkillsView />;
}
