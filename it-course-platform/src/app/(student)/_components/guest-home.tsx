import { Suspense } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';
import { getCategoryTree } from '@/lib/api/categories';
import { CategoryCards } from './category-cards';
import { GuestFeatured } from './guest-featured';
import { GuestHero } from './guest-hero';
import { PillarsSection, SignupSection, StepsSection, TeachSection } from './guest-sections';

// Trang chủ khách (spec guest-ui §4.3, wireframe A + hero "Tối", không E). Số khối theo wireframe.
export async function GuestHome() {
  const categories = await getCategoryTree();
  return (
    <>
      <GuestHero />
      <CategoryCards categories={categories} />
      <Suspense fallback={<FeaturedFallback />}>
        <GuestFeatured categories={categories} />
      </Suspense>
      <PillarsSection />
      <StepsSection />
      <TeachSection />
      <SignupSection />
      <SiteFooter categories={categories} />
    </>
  );
}

// Cùng khung với khối 4 thật để không xô layout khi dữ liệu tới.
function FeaturedFallback() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-16 lg:py-20" role="status" aria-busy="true" aria-label="Đang tải">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <CourseCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
