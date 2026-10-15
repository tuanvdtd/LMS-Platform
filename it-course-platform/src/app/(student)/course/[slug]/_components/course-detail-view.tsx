import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Check, ChevronRight, Clock, Globe, Signal, Users } from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { badgeVariants } from '@/components/ui/badge';
import { categoryHref, topicHref } from '@/lib/category-links';
import { cn } from '@/lib/utils';
import { formatHoursMinutes, type CourseDetail, type CurriculumSection } from '@/types/catalog';
import { formatPrice, LANGUAGE_LABEL, SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { BuyBox } from './buy-box';
import { CurriculumAccordion } from './curriculum-accordion';

const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';
const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

// Trang chi tiết khoá public (spec public-catalog §4.3). Server component; chỉ accordion, dialog xem thử, nút giỏ là client.
export default function CourseDetailView({ course, sections }: { course: CourseDetail; sections: CurriculumSection[] }) {
  const { category } = course;
  const crumbs = category
    ? category.parent
      ? [
          { label: category.parent.name, href: categoryHref(category.parent.slug) },
          { label: category.name, href: categoryHref(category.parent.slug, category.slug) },
        ]
      : [{ label: category.name, href: categoryHref(category.slug) }]
    : [];
  const lang = LANGUAGE_LABEL[course.language as keyof typeof LANGUAGE_LABEL] ?? course.language;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-slate-800 px-4 py-10 text-white">
        <div className="mx-auto max-w-screen-xl lg:pr-[352px]">
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-3">
              <ol className="flex flex-wrap items-center gap-1 text-sm">
                {crumbs.map((c, i) => (
                  <li key={c.href} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3.5 text-slate-400" aria-hidden />}
                    <Link href={c.href} className={cn('rounded-sm font-medium text-sky-300 hover:underline', focusRing)}>
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="mb-3 text-2xl leading-tight font-extrabold break-words md:text-3xl">{course.title}</h1>
          {course.subtitle && <p className="mb-4 text-slate-300">{course.subtitle}</p>}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {course.ratingCount === 0 ? (
              <span className="text-slate-300">Chưa có đánh giá</span>
            ) : (
              <span className="flex items-center gap-1">
                <span className="font-bold text-amber-400">{course.ratingAvg.toFixed(1)}</span>
                <RatingStars rating={course.ratingAvg} />
                <span className="text-slate-300">({course.ratingCount.toLocaleString('vi-VN')} đánh giá)</span>
              </span>
            )}
            {course.enrollmentCount > 0 && (
              <span className="flex items-center gap-1 text-slate-300">
                <Users className="size-3.5" aria-hidden /> {course.enrollmentCount.toLocaleString('vi-VN')} học viên
              </span>
            )}
          </div>
          <p className="mb-3 text-sm text-slate-300">
            Giảng viên{' '}
            <Link
              href={`/instructors/${course.instructor.id}`}
              className={cn('rounded-sm font-medium text-sky-300 underline-offset-2 hover:underline', focusRing)}
            >
              {course.instructor.name}
            </Link>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
            <li className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden /> Cập nhật {dateFmt.format(new Date(course.updatedAt))}
            </li>
            <li className="flex items-center gap-1">
              <Globe className="size-3.5" aria-hidden /> {lang}
            </li>
            {course.level && (
              <li className="flex items-center gap-1">
                <Signal className="size-3.5" aria-hidden /> {SKILL_LEVEL_LABEL[course.level]}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="mx-auto grid max-w-screen-xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Sidebar: mobile lên đầu, desktop dính bên phải */}
        <aside aria-label="Mua khoá học" className="order-first lg:order-none lg:col-start-2 lg:row-start-1">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-lg lg:sticky lg:top-20">
            {course.promoVideoUrl ? (
              <video
                src={course.promoVideoUrl}
                controls
                preload="metadata"
                poster={course.thumbnailUrl}
                className="aspect-video w-full bg-black"
                aria-label={`Video giới thiệu: ${course.title}`}
              />
            ) : (
              <div className="relative aspect-video bg-muted">
                <Image src={course.thumbnailUrl} alt={course.title} fill unoptimized sizes="320px" className="object-cover" />
              </div>
            )}
            <div className="flex flex-col gap-4 p-5">
              {/* useSearchParams dưới cacheComponents phải nằm trong Suspense */}
              <Suspense fallback={<p className="text-2xl font-extrabold text-foreground">{formatPrice(course.priceAmount)}</p>}>
                <BuyBox course={{ id: course.id, slug: course.slug, priceAmount: course.priceAmount }} />
              </Suspense>
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BookOpen className="size-4" aria-hidden /> {course.lectureCount} bài học
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="size-4" aria-hidden /> Tổng thời lượng {formatHoursMinutes(course.totalDurationSec)}
                </li>
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
          {course.learningObjectives.length > 0 && (
            <section className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 text-lg font-bold text-foreground">Bạn sẽ học được</h2>
              <ul className="grid gap-2 md:grid-cols-2">
                {course.learningObjectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.topics.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-foreground">Chủ đề liên quan</h2>
              <ul className="flex flex-wrap gap-2">
                {course.topics.map((t) => (
                  <li key={t.slug}>
                    <Link href={topicHref(t.slug)} className={cn(badgeVariants({ variant: 'outline' }), 'h-8 px-3 text-sm')}>
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="mb-1 text-lg font-bold text-foreground">Nội dung khoá học</h2>
            {sections.length > 0 && (
              <p className="mb-4 text-sm text-muted-foreground">
                {sections.length} chương · {course.lectureCount} bài · {formatHoursMinutes(course.totalDurationSec)}
              </p>
            )}
            {sections.length > 0 ? (
              <CurriculumAccordion slug={course.slug} sections={sections} />
            ) : (
              <p className="text-sm text-muted-foreground">Chưa tải được nội dung khoá học.</p>
            )}
          </section>

          <TextList title="Yêu cầu" items={course.requirements} />

          {course.description && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-foreground">Mô tả</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{course.description}</p>
            </section>
          )}

          <TextList title="Dành cho ai" items={course.targetAudience} />

          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">Giảng viên</h2>
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                {course.instructor.image && <AvatarImage src={course.instructor.image} alt={course.instructor.name} />}
                <AvatarFallback className="text-lg">{course.instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href={`/instructors/${course.instructor.id}`}
                  className={cn('rounded-sm font-bold text-primary hover:underline', focusRing)}
                >
                  {course.instructor.name}
                </Link>
                {course.instructor.headline && <p className="text-sm text-muted-foreground">{course.instructor.headline}</p>}
                <Link
                  href={`/instructors/${course.instructor.id}`}
                  className={cn('mt-1 inline-flex items-center gap-1 rounded-sm text-sm text-primary hover:underline', focusRing)}
                >
                  Xem hồ sơ <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-foreground">{title}</h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-foreground">
        {items.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </section>
  );
}
