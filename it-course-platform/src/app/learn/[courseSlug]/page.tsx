// it-course-platform/src/app/learn/[courseSlug]/page.tsx
import type { Metadata } from 'next';
import { ResumeRedirect } from './_components/resume-redirect';

export const metadata: Metadata = { title: 'Vào học | SkillPath' };

// /learn/<slug> → bài đang học dở.
export default function LearnIndexPage() {
  return <ResumeRedirect />;
}
