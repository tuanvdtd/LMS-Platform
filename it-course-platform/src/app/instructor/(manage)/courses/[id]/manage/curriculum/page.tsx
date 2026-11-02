import type { Metadata } from 'next';
import { CurriculumEditor } from '../_components/curriculum/curriculum-editor';
import { PageSlide } from '../_components/page-slide';

export const metadata: Metadata = { title: 'Khung chương trình | SkillPath' };

export default function CurriculumPage() {
  return (
    <PageSlide>
      <CurriculumEditor />
    </PageSlide>
  );
}
