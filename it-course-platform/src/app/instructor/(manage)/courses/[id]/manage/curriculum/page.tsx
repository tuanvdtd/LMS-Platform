import type { Metadata } from 'next';
import { CurriculumEditor } from '../_components/curriculum/curriculum-editor';

export const metadata: Metadata = { title: 'Khung chương trình | SkillPath' };

export default function CurriculumPage() {
  return <CurriculumEditor />;
}
