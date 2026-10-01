import type { Metadata } from 'next';
import { MyCourses } from './_components/my-courses';

// Gate client ở instructor/layout.tsx không render children khi prerender → tắt instant validation.
export const instant = false;

export const metadata: Metadata = { title: 'Khoá học của tôi | SkillPath' };

export default function InstructorCoursesPage() {
  return <MyCourses />;
}
