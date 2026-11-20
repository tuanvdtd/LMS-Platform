import { Suspense } from 'react';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';
import { getCategoryTree } from '@/lib/api/categories';
import { CategoryCards } from './category-cards';
import { GuestFeatured } from './guest-featured';
import { GuestHero } from './guest-hero';
import { MotionProvider } from './guest-motion';
import { FaqSection, PainSection, ShowcaseSection, SignupSection, TeachSection } from './guest-sections';
import { COURSE_GRID } from '@/components/shared/catalog-course-card';

// Trang chủ khách. Thứ tự là mạch lập luận: lời hứa (hero) → nỗi đau của người tự học → hai điểm khác biệt
// có mảnh giao diện làm bằng chứng → duyệt khoá → giảng viên và kiểm duyệt → hỏi đáp → đăng ký.
// Nền xen kẽ trắng / sương để chia nhịp.
export async function GuestHome() {
  const categories = await getCategoryTree();
  return (
    <MotionProvider>
      <GuestHero />
      <PainSection />
      <ShowcaseSection />
      <CategoryCards categories={categories} />
      <Suspense fallback={<FeaturedFallback />}>
        <GuestFeatured categories={categories} />
      </Suspense>
      <TeachSection />
      <FaqSection />
      <SignupSection />
    </MotionProvider>
  );
}

// Cùng khung với khối 4 thật để không xô layout khi dữ liệu tới.
function FeaturedFallback() {
  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 py-16 lg:py-20" role="status" aria-busy="true" aria-label="Đang tải">
      <div className={COURSE_GRID}>
        {Array.from({ length: 4 }, (_, i) => <CourseCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
