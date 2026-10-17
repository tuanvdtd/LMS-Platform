import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Users } from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { Badge } from '@/components/ui/badge';
import { formatHoursMinutes, type CourseCard } from '@/types/catalog';
import { formatPrice, SKILL_LEVEL_LABEL } from '@/types/instructor-course';

// Thẻ khoá học từ API public catalog (spec public-catalog §4.1). Server-safe: không state, không handler.
// Chỉ hiện dữ liệu API có: không có cờ bán chạy/mới/giá gốc nên không vẽ các badge đó.
export function CatalogCourseCard({ course }: { course: CourseCard }) {
  return (
    <Link
      href={`/course/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-xs outline-none transition-[translate,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={course.thumbnailUrl}
          alt={course.title}
          fill
          unoptimized
          sizes="(min-width:1280px) 30vw, (min-width:768px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {course.priceAmount === 0 && <Badge className="absolute top-3 left-3 shadow-sm">Miễn phí</Badge>}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1.5">
          {course.level && (
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">
              {SKILL_LEVEL_LABEL[course.level]}
            </span>
          )}
          <h3 className="line-clamp-2 text-base leading-snug font-bold text-foreground transition-colors group-hover:text-primary">
            {course.title}
          </h3>
          {course.subtitle && <p className="line-clamp-2 text-sm text-muted-foreground">{course.subtitle}</p>}
        </div>

        <p className="truncate text-sm text-foreground/80">{course.instructor.name}</p>

        {course.ratingCount === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có đánh giá</p>
        ) : (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-foreground">{course.ratingAvg.toFixed(1)}</span>
            <RatingStars rating={course.ratingAvg} />
            <span className="text-xs text-muted-foreground">({course.ratingCount.toLocaleString('vi-VN')})</span>
          </div>
        )}

        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-1">
            <BookOpen className="size-3.5" aria-hidden />
            {course.lectureCount} bài
          </li>
          <li className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatHoursMinutes(course.totalDurationSec)}
          </li>
          {course.enrollmentCount > 0 && (
            <li className="flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              {course.enrollmentCount.toLocaleString('vi-VN')} học viên
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <span className="text-lg font-extrabold text-foreground tabular-nums">{formatPrice(course.priceAmount)}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            Xem chi tiết
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
