import type { Metadata } from 'next';
import { MyCourses } from './_components/my-courses';

export const metadata: Metadata = { title: 'Khoá học của tôi | Aolumi' };

export default function InstructorCoursesPage() {
  return <MyCourses />;
}
