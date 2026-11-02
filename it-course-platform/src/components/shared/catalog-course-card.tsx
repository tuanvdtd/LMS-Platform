import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, BookOpen, Clock, Users } from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { formatHoursMinutes, type CourseCard } from '@/types/catalog';
import { formatPrice, SKILL_LEVEL_LABEL } from '@/types/instructor-course';

// Thẻ khoá học từ API public catalog. Server-safe: không state, không handler.
// Chỉ hiện dữ liệu API có: không có cờ bán chạy/mới/giá gốc nên không vẽ các badge đó.
export function CatalogCourseCard({ course }: { course: CourseCard }) {
  return (
    <Link
      href={`/course/${course.slug}`}
      className="group card-interactive flex h-full flex-col overflow-hidden"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-muted">
        {/* Khoá chưa có ảnh bìa: BE trả chuỗi rỗng → không render <img src=""> (ảnh vỡ + tải lại trang). */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width:1280px) 30vw, (min-width:768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <BookOpen className="size-8 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="line-clamp-2 text-base leading-snug font-bold text-foreground">
            {course.title}
          </h3>
          {/* Luôn giữ chỗ 2 dòng để card cùng hàng thẳng nhau, khoá không có phụ đề không bị hở dưới đáy */}
          <p className="line-clamp-2 min-h-[2lh] text-sm text-muted-foreground">{course.subtitle}</p>
        </div>

        <p className="truncate text-sm text-foreground/80">{course.instructor.name}</p>

        {course.ratingCount === 0 ? (
          <span className="w-fit rounded-full border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Khoá mới</span>
        ) : (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-bold text-warning">{course.ratingAvg.toFixed(1)}</span>
            <RatingStars rating={course.ratingAvg} />
            <span className="text-xs text-muted-foreground">({course.ratingCount.toLocaleString('vi-VN')})</span>
          </div>
        )}

        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
          {course.level && (
            <li className="flex items-center gap-1">
              <BarChart3 className="size-3.5" aria-hidden />
              {SKILL_LEVEL_LABEL[course.level]}
            </li>
          )}
          {/* Khoá chưa có bài/video: ẩn hẳn thay vì hiện "0 bài · 0 phút" như một dữ kiện */}
          {course.lectureCount > 0 && (
            <li className="flex items-center gap-1">
              <BookOpen className="size-3.5" aria-hidden />
              {course.lectureCount} bài
            </li>
          )}
          {course.totalDurationSec > 0 && (
            <li className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {formatHoursMinutes(course.totalDurationSec)}
            </li>
          )}
          {course.enrollmentCount > 0 && (
            <li className="flex items-center gap-1" title={`${course.enrollmentCount.toLocaleString('vi-VN')} học viên`}>
              <Users className="size-3.5" aria-hidden />
              {course.enrollmentCount.toLocaleString('vi-VN')}
              <span className="sr-only"> học viên</span>
            </li>
          )}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
          <span className="text-lg font-extrabold text-foreground tabular-nums">{formatPrice(course.priceAmount)}</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            Xem chi tiết
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
