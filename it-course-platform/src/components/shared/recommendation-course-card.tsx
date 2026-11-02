import { Lightbulb } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { reasonText } from '@/lib/recommendations';
import type { RecommendedCourse } from '@/types/recommendations';

// Card catalog + một dòng giải thích vì sao gợi ý.
export function RecommendationCourseCard({ course }: { course: RecommendedCourse }) {
  return (
    <div className="flex h-full flex-col gap-2">
      {/* Luôn cao 2 dòng để các card trong cùng hàng thẳng đỉnh dù lý do dài ngắn khác nhau. */}
      <p className="flex min-h-[2lh] items-start gap-1.5 text-xs text-muted-foreground">
        <Lightbulb className="mt-px size-3.5 shrink-0 text-primary" aria-hidden />
        <span className="line-clamp-2">{reasonText(course.reason)}</span>
      </p>
      <div className="flex-1">
        <CatalogCourseCard course={course} />
      </div>
    </div>
  );
}
