import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, BookOpen, Clock, Star, Users } from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { formatHoursMinutes, type CourseCard } from '@/types/catalog';
import { formatPrice, SKILL_LEVEL_LABEL } from '@/types/instructor-course';

// Lưới card dùng chung để card cùng bề rộng (~235–320px) ở mọi trang. Dưới sm card là hàng ngang 1 cột.
// COURSE_GRID cho vùng rộng hết container; COURSE_GRID_WITH_SIDEBAR cho trang danh sách có cột bộ lọc (lg+).
export const COURSE_GRID = 'grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
export const COURSE_GRID_WITH_SIDEBAR = 'grid gap-4 sm:grid-cols-2 md:grid-cols-3';

// Thẻ khoá học từ API public catalog. Server-safe: không state, không handler.
// Chỉ hiện dữ liệu API có: không có cờ bán chạy/mới/giá gốc nên không vẽ các badge đó.
// Dưới sm: hàng ngang (ảnh nhỏ trái, tên · giảng viên · đánh giá · giá) để một màn thấy 4–5 khoá;
// phụ đề, dòng meta và "Xem chi tiết" chỉ hiện từ sm, vì cả card đã là link.
export function CatalogCourseCard({ course }: { course: CourseCard }) {
  return (
    <Link
      href={`/course/${course.slug}`}
      className="group card-interactive @container flex h-full gap-3 overflow-hidden p-3 sm:flex-col sm:gap-0 sm:p-0"
    >
      <div className="relative flex aspect-video w-28 shrink-0 items-center justify-center self-start overflow-hidden rounded-md bg-muted sm:w-full sm:rounded-none">
        {/* Khoá chưa có ảnh bìa: BE trả chuỗi rỗng → không render <img src=""> (ảnh vỡ + tải lại trang). */}
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            unoptimized
            sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, (min-width:640px) 50vw, 112px"
            className="object-cover"
          />
        ) : (
          <BookOpen className="size-6 text-muted-foreground sm:size-8" aria-hidden />
        )}
      </div>

      {/* Dưới sm thân card xếp hàng có xuống dòng: tên và giảng viên chiếm cả dòng, đánh giá rồi giá chung một dòng. */}
      <div className="flex min-w-0 flex-1 flex-wrap content-start items-center gap-x-2.5 gap-y-1.5 sm:flex-col sm:flex-nowrap sm:items-stretch sm:gap-3 sm:p-4">
        <div className="flex w-full flex-col gap-1.5">
          <h3 className="line-clamp-2 text-sm leading-snug font-bold text-foreground sm:text-base">
            {course.title}
          </h3>
          {/* Luôn giữ chỗ 2 dòng để card cùng hàng thẳng nhau, khoá không có phụ đề không bị hở dưới đáy */}
          <p className="hidden min-h-[2lh] text-sm text-muted-foreground sm:line-clamp-2">{course.subtitle}</p>
        </div>

        <p className="w-full truncate text-xs text-foreground/80 sm:text-sm">{course.instructor.name}</p>

        {course.ratingCount === 0 ? (
          <span className="w-fit rounded-full border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Khoá mới</span>
        ) : (
          <div className="flex items-center gap-1 text-sm sm:gap-1.5">
            {/* Dưới sm chỉ 1 sao để đánh giá và giá vừa một dòng. */}
            <Star size={12} className="fill-rating text-rating sm:hidden" aria-hidden />
            <span className="font-bold text-warning">{course.ratingAvg.toFixed(1)}</span>
            <span className="hidden sm:contents">
              <RatingStars rating={course.ratingAvg} />
            </span>
            <span className="text-xs text-muted-foreground">({course.ratingCount.toLocaleString('vi-VN')})</span>
          </div>
        )}

        {/* Meta chỉ hiện khi card đủ rộng (≥ 16.5rem): card hẹp của lưới 3–4 cột ở tablet bỏ dòng này cho gọn. */}
        <ul className="hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums @[16.5rem]:sm:flex">
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

        <div className="flex items-center justify-between gap-3 sm:mt-auto sm:border-t sm:pt-3">
          <span className="text-base font-extrabold whitespace-nowrap text-foreground tabular-nums sm:text-lg">
            {formatPrice(course.priceAmount)}
          </span>
          {/* Card hẹp (lưới 3–4 cột ~235px): chỉ còn mũi tên để giá và CTA không xuống dòng. */}
          <span className="hidden items-center gap-1 text-sm font-semibold whitespace-nowrap text-primary sm:flex">
            <span className="hidden @[16.5rem]:inline">Xem chi tiết</span>
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
