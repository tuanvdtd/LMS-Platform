// it-course-platform/src/app/learn/[courseSlug]/page.tsx
import type { Metadata } from 'next';
import { ResumeRedirect } from './_components/resume-redirect';

// LearnShell (layout) đọc useParams trong Suspense → validate bỏ segment con → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Vào học | SkillPath' };

// /learn/<slug> → bài đang học dở (spec §5).
export default function LearnIndexPage() {
  return <ResumeRedirect />;
}
