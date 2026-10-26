import type { Metadata } from 'next';
import { MyCourses } from './_components/my-courses';

export const metadata: Metadata = { title: 'Khoá học của tôi | SkillPath' };

export default function InstructorCoursesPage() {
  return <MyCourses />;
}
