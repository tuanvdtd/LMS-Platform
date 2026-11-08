import type { Metadata } from 'next';
import { SkillsView } from './_components/skills-view';

export const metadata: Metadata = { title: 'Hồ sơ năng lực | SkillPath' };

export default function SkillsPage() {
  return <SkillsView />;
}
