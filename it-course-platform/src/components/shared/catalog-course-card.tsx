import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { Badge } from '@/components/ui/badge';
import { formatHoursMinutes, type CourseCard } from '@/types/catalog';
import { formatPrice, SKILL_LEVEL_LABEL } from '@/types/instructor-course';

// Thẻ khoá học từ API public catalog (spec public-catalog §4.1). Server-safe: không state, không handler.
export function CatalogCourseCard({ course }: { course: CourseCard }) {
  return (
    <Link
      href={`/course/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card outline-none transition-shadow duration-200 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          unoptimized
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-foreground group-hover:text-primary">
          {course.title}
        </h3>
        <p className="truncate text-xs text-muted-foreground">{course.instructor.name}</p>
        {course.ratingCount === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có đánh giá</p>
        ) : (
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-foreground">{course.ratingAvg.toFixed(1)}</span>
            <RatingStars rating={course.ratingAvg} />
            <span className="text-muted-foreground">({course.ratingCount.toLocaleString('vi-VN')})</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>
            {course.lectureCount} bài · {formatHoursMinutes(course.totalDurationSec)}
          </span>
          {course.level && <Badge variant="secondary">{SKILL_LEVEL_LABEL[course.level]}</Badge>}
        </div>
        {course.enrollmentCount > 0 && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="size-3" aria-hidden />
            {course.enrollmentCount.toLocaleString('vi-VN')} học viên
          </p>
        )}
        <p className="mt-auto pt-1 text-base font-bold text-foreground">{formatPrice(course.priceAmount)}</p>
      </div>
    </Link>
  );
}
