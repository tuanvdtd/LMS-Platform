'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Compass } from 'lucide-react';
import { EnrollmentCard } from '@/components/shared/enrollment-card';
import { CourseCardSkeleton } from '@/components/skeletons/course-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { RecommendationCourseCard } from '@/components/shared/recommendation-course-card';
import { buttonVariants } from '@/components/ui/button';
import { getMyEnrollments } from '@/lib/api/checkout';
import { getPreferences } from '@/lib/api/preferences';
import { getRecommendations } from '@/lib/api/recommendations';
import { unmeasuredTopics } from '@/lib/recommendations';
import type { MyEnrollment } from '@/types/checkout';
import { OCCUPATION_LABEL, type Preferences } from '@/types/preferences';
import type { RecommendationGroup } from '@/types/recommendations';
import { COURSE_GRID } from '@/components/shared/catalog-course-card';

const CONTINUE_LIMIT = 4;

// Mỗi khối tự ẩn khi lỗi / rỗng: trang chủ vẫn còn "Khoá nổi bật".
export function PersonalHome() {
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([]);
  const [groups, setGroups] = useState<RecommendationGroup[] | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  useEffect(() => {
    getMyEnrollments().then(setEnrollments, () => undefined);
    // Lỗi → coi như rỗng để bỏ khung giữ chỗ.
    getRecommendations().then(setGroups, () => setGroups([]));
    getPreferences().then(setPrefs, () => undefined);
  }, []);

  const continuing = enrollments
    .filter((e) => !e.completedAt)
    .sort((a, b) => (b.lastAccessedAt ?? '').localeCompare(a.lastAccessedAt ?? ''))
    .slice(0, CONTINUE_LIMIT);
  // Chỉ mời khi chắc chắn chưa có mục tiêu (đã tải xong preferences), tránh nháy lúc đang tải.
  const askGoal = groups?.length === 0 && prefs !== null && !prefs.occupation && prefs.topics.length === 0;
  // BE không trả nhóm rỗng nên luôn có courses[0].
  const title = (g: RecommendationGroup) => {
    const r = g.courses[0].reason;
    if (r.type === 'gap') return 'Bù lỗ hổng kỹ năng';
    return r.type === 'occupation' ? `Dành cho ${OCCUPATION_LABEL[r.occupation]}` : 'Theo mục tiêu của bạn';
  };

  return (
    <>
      {continuing.length > 0 && (
        <section aria-labelledby="continue-heading">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="continue-heading" className="text-xl font-bold text-foreground">Tiếp tục học</h2>
            <Link
              href="/my-learning"
              className="flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Xem tất cả <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {continuing.map((e) => <EnrollmentCard key={e.course.id} enrollment={e} />)}
          </ul>
        </section>
      )}

      {askGoal && (
        <section
          aria-labelledby="ask-goal-heading"
          className="flex flex-col items-start gap-3 rounded-2xl bg-(--primary-light) p-6 sm:flex-row sm:items-center"
        >
          <Compass className="size-6 shrink-0 text-primary" aria-hidden />
          <div className="flex flex-1 flex-col gap-1">
            <h2 id="ask-goal-heading" className="text-base font-bold text-foreground">Bạn muốn học gì?</h2>
            <p className="text-sm text-foreground">Chọn nghề và kỹ năng muốn học để nhận gợi ý khoá học phù hợp.</p>
          </div>
          <Link href="/onboarding" className={buttonVariants({ className: 'h-11' })}>Chọn mục tiêu</Link>
        </section>
      )}

      {/* Giữ chỗ khi đang tải gợi ý để "Khoá nổi bật" (render ở server) không bị đẩy xuống. */}
      {groups === null && (
        <section role="status" aria-busy="true" aria-label="Đang tải gợi ý">
          <Skeleton className="mb-4 h-7 w-64" />
          <div className={COURSE_GRID}>
            {Array.from({ length: 4 }, (_, i) => <CourseCardSkeleton key={i} />)}
          </div>
        </section>
      )}

      {groups?.map((g) => {
        const unmeasured = unmeasuredTopics(g.courses);
        return (
          <section key={g.type} aria-labelledby={`rec-${g.type}`}>
            <h2 id={`rec-${g.type}`} className="mb-4 text-xl font-bold text-foreground">{title(g)}</h2>
            {unmeasured.length > 0 && (
              <p className="-mt-2 mb-4 text-sm text-muted-foreground">
                Bạn chưa đo {unmeasured.join(', ')}.{' '}
                <Link
                  href="/skills"
                  className="rounded-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  Làm bài đánh giá
                </Link>{' '}
                để nhận gợi ý chính xác hơn.
              </p>
            )}
            <div className={COURSE_GRID}>
              {g.courses.map((c) => <RecommendationCourseCard key={c.id} course={c} />)}
            </div>
          </section>
        );
      })}
    </>
  );
}
