import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronRight, Target, ArrowRight } from 'lucide-react';
import { courses, recommendations, demoStudent } from '@/lib/mocks/data';
import { CourseCard, RecommendationCard, SkillMasteryBar } from '@/components/shared/product-ui';
import { CourseGridSkeleton } from '@/components/skeletons/course-grid-skeleton';
import { Button } from '@/components/ui/button';
import FeaturedCourses from '../_components/featured-courses';

export const metadata: Metadata = { title: 'Trang chủ | SkillPath' };

// Trang chủ người đã đăng nhập. proxy.ts rewrite '/' → '/home' khi có cookie session, nên trang '/' của khách
// không phải đọc cookie và render tĩnh được.
export default function MemberHomePage() {
  const weakSkills = demoStudent.skills
    .filter((s) => s.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-12">
      {/* Continue learning */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            Tiếp tục học
          </h2>
          <Link href="/my-learning" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.slice(0, 2).map((c) => (
            <CourseCard key={c.id} course={c} progress={c.id === 'c-1' ? 34 : 100} />
          ))}
        </div>
      </section>

      {/* Weak skills */}
      <section>
        <div
          className="rounded-2xl p-6 border"
          style={{ background: 'var(--primary-light)', borderColor: '#bfdbfe' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300">
              Kỹ năng bạn cần củng cố
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {weakSkills.map((skill) => (
              <div
                key={skill.skillId}
                className="rounded-xl p-4 bg-white dark:bg-slate-800"
                style={{ border: '1px solid var(--border)' }}
              >
                <SkillMasteryBar skill={skill} />
                <Link
                  href="/skills"
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Xem khoá ôn luyện <ArrowRight size={10} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations by reason */}
      {[
        { title: 'Lấp lỗ hổng kỹ năng', type: 'skill_gap', accent: true },
        { title: 'Bạn đã sẵn sàng học tiếp', type: 'prerequisite_met', accent: false },
        { title: 'Dành cho mục tiêu Frontend của bạn', type: 'goal', accent: false },
        { title: 'Học viên cùng track cũng mua', type: 'collaborative', accent: false },
      ].map(({ title, type, accent }) => {
        const recs = recommendations.filter((r) => r.reason.type === type);
        if (!recs.length) return null;
        return (
          <section key={type}>
            <div className="flex items-center justify-between mb-4">
              <h2
                className={`text-xl font-bold ${accent ? 'text-orange-500' : ''}`}
                style={accent ? {} : { color: 'var(--foreground)' }}
              >
                {title}
              </h2>
              <Button variant="link" className="h-auto gap-1 p-0 font-normal">
                Xem thêm <ChevronRight className="size-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recs.map((c) => (
                <RecommendationCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        );
      })}

      <Suspense fallback={<CourseGridSkeleton />}>
        <FeaturedCourses />
      </Suspense>
    </div>
  );
}
