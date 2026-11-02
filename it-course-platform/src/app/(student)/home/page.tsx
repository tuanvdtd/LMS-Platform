import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CourseGridSkeleton } from '@/components/skeletons/course-grid-skeleton';
import FeaturedCourses from '../_components/featured-courses';
import { PersonalHome } from './_components/personal-home';

export const metadata: Metadata = { title: 'Trang chủ | SkillPath' };

// Trang chủ người đã đăng nhập. proxy.ts rewrite '/' → '/home' khi có cookie session, nên trang '/' của khách
// không phải đọc cookie và render tĩnh được. Phần cá nhân hoá tải ở client (cần cookie phiên).
export default function MemberHomePage() {
  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-12 px-4 py-8">
      <PersonalHome />
      <Suspense fallback={<CourseGridSkeleton />}>
        <FeaturedCourses />
      </Suspense>
    </div>
  );
}
