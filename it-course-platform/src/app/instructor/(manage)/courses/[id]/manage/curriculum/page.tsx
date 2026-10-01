import type { Metadata } from 'next';
import { CurriculumEditor } from '../_components/curriculum/curriculum-editor';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Khung chương trình | SkillPath' };

export default function CurriculumPage() {
  return <CurriculumEditor />;
}
