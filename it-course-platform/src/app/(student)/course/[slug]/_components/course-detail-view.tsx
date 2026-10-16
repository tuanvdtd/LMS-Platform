import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  Check,
  ChevronRight,
  CirclePlay,
  Code2,
  FileQuestion,
  Gauge,
  Globe,
  MessageSquare,
  RefreshCw,
  Signal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { RatingStars } from '@/components/shared/product-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { categoryHref, topicHref } from '@/lib/category-links';
import { cn } from '@/lib/utils';
import { countItems, formatHoursMinutes, type CourseDetail, type CurriculumSection } from '@/types/catalog';
import { formatPrice, LANGUAGE_LABEL, SKILL_LEVEL_LABEL } from '@/types/instructor-course';
import { BuyBox } from './buy-box';
import { CurriculumAccordion } from './curriculum-accordion';
import { PausingVideo } from '@/components/shared/pausing-video';

const focusRing = 'outline-none focus-visible:ring-3 focus-visible:ring-ring/50';
const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

// Trang chi tiết khoá public (spec public-catalog §4.3), bố cục wireframe B: hero tối, khối mua phủ lên hero và dính phải.
// Server component; chỉ accordion, dialog xem thử, nút mua là client.
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
  const items = sections.flatMap((s) => s.items);
  const quiz = countItems(items, 'quiz');
  const code = countItems(items, 'coding_exercise');
  const hasFinalTest = countItems(items, 'practice_test') > 0;

  const practice: [LucideIcon, string][] = [[CirclePlay, `${course.lectureCount} bài giảng`]];
  if (quiz) practice.push([FileQuestion, `${quiz} quiz chấm ngay`]);
  if (code) practice.push([Code2, `${code} bài code chấm tự động`]);
  if (hasFinalTest) practice.push([Award, 'Chứng chỉ QR']);

  const includes: [LucideIcon, string][] = [[CirclePlay, `${formatHoursMinutes(course.totalDurationSec)} video`]];
  if (quiz || code) includes.push([FileQuestion, [quiz && `${quiz} quiz`, code && `${code} bài code`].filter(Boolean).join(' · ') + ' chấm tự động']);
  if (hasFinalTest) includes.push([Award, 'Chứng chỉ có mã QR']);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Hero: nền tối cố định (không theo token để dark mode vẫn tối) */}
      <div className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-4 py-10 lg:pr-[388px]">
          {crumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-1 text-sm">
                {crumbs.map((c, i) => (
                  <li key={c.href} className="flex items-center gap-1">
                    {i > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
                    <Link href={c.href} className={cn('inline-flex min-h-6 items-center rounded-sm font-medium text-white/80 hover:text-white hover:underline', focusRing)}>
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="text-2xl leading-tight font-bold text-balance break-words md:text-4xl">{course.title}</h1>
          {course.subtitle && <p className="text-base text-pretty text-white/80 md:text-lg">{course.subtitle}</p>}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {course.ratingCount === 0 ? (
              <span className="text-white/75">Chưa có đánh giá</span>
            ) : (
              <span className="flex items-center gap-1.5">
                <b className="font-bold">{course.ratingAvg.toFixed(1)}</b>
                <RatingStars rating={course.ratingAvg} size="md" />
                <a href="#danh-gia" className={cn('inline-flex min-h-6 items-center rounded-sm text-white/75 underline-offset-2 hover:underline', focusRing)}>
                  ({course.ratingCount.toLocaleString('vi-VN')} đánh giá)
                </a>
              </span>
            )}
            {course.enrollmentCount > 0 && (
              <span className="flex items-center gap-1 text-white/75">
                <Users className="size-4" aria-hidden /> {course.enrollmentCount.toLocaleString('vi-VN')} học viên
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/75">
            <span className="flex items-center gap-2">
              <Avatar className="size-6">
                {course.instructor.image && <AvatarImage src={course.instructor.image} alt="" />}
                <AvatarFallback className="text-xs">{course.instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>
                Giảng viên{' '}
                <a href="#giang-vien" className={cn('rounded-sm font-medium text-white hover:underline', focusRing)}>
                  {course.instructor.name}
                </a>
              </span>
            </span>
            {course.level && (
              <span className="flex items-center gap-1">
                <Signal className="size-4" aria-hidden /> {SKILL_LEVEL_LABEL[course.level]}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Globe className="size-4" aria-hidden /> {lang}
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="size-4" aria-hidden /> Cập nhật {dateFmt.format(new Date(course.updatedAt))}
            </span>
          </div>

          <ul aria-label="Thực hành & đánh giá" className="mt-2 flex flex-wrap gap-2 text-sm">
            {practice.map(([Icon, label]) => (
              <li key={label} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3">
                <Icon className="size-4" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Khối mua: mobile nằm ngay dưới hero; desktop phủ lên hero và dính phải khi cuộn */}
      <div className="px-4 pt-6 lg:pointer-events-none lg:absolute lg:inset-0 lg:p-0">
        <div className="mx-auto flex h-full max-w-screen-xl justify-end lg:px-4 lg:pt-10">
          <aside aria-label="Mua khoá học" className="w-full lg:pointer-events-auto lg:w-[340px]">
            {/* top-20: chừa header site (sticky, cao 57px) + 23px */}
            <div className="overflow-hidden rounded-2xl border bg-card shadow-lg lg:sticky lg:top-20">
              {course.promoVideoUrl ? (
                <PausingVideo
                  src={course.promoVideoUrl}
                  controls
                  preload="metadata"
                  poster={course.thumbnailUrl}
                  className="aspect-video w-full bg-black"
                  aria-label={`Video giới thiệu: ${course.title}`}
                />
              ) : (
                <div className="relative aspect-video bg-muted">
                  <Image src={course.thumbnailUrl} alt={course.title} fill unoptimized sizes="340px" className="object-cover" />
                </div>
              )}
              <div className="flex flex-col gap-3 p-5">
                {/* useSearchParams dưới cacheComponents phải nằm trong Suspense */}
                <Suspense fallback={<p className="text-3xl font-extrabold text-foreground">{formatPrice(course.priceAmount)}</p>}>
                  <BuyBox course={{ id: course.id, slug: course.slug, priceAmount: course.priceAmount }} />
                </Suspense>
                <div className="mt-1 border-t pt-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Khoá học gồm</p>
                  <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {includes.map(([Icon, label]) => (
                      <li key={label} className="flex items-center gap-2">
                        <Icon className="size-4 shrink-0" aria-hidden /> {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 pt-8 pb-28 lg:pr-[388px] lg:pb-16">
        {course.learningObjectives.length > 0 && (
          <section className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Bạn sẽ học được</h2>
            <ul className="grid gap-x-6 gap-y-2.5 md:grid-cols-2">
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
            <h2 className="mb-1 text-lg font-semibold text-foreground">Kỹ năng được đánh giá</h2>
            <p className="mb-3 text-sm text-muted-foreground">Điểm quiz và bài code ở các kỹ năng này được cập nhật vào hồ sơ năng lực của bạn.</p>
            <ul className="flex flex-wrap gap-2">
              {course.topics.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={topicHref(t.slug)}
                    className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium text-foreground hover:bg-secondary', focusRing)}
                  >
                    <Gauge className="size-3.5 text-muted-foreground" aria-hidden /> {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="noi-dung">
          {sections.length > 0 ? (
            <CurriculumAccordion slug={course.slug} sections={sections} />
          ) : (
            <>
              <h2 className="mb-3 text-lg font-semibold text-foreground">Nội dung khoá học</h2>
              <p className="text-sm text-muted-foreground">Chưa tải được nội dung khoá học.</p>
            </>
          )}
        </section>

        {(course.requirements.length > 0 || course.targetAudience.length > 0) && (
          <section className="flex flex-col gap-6">
            <TextList title="Yêu cầu" items={course.requirements} />
            <TextList title="Dành cho ai" items={course.targetAudience} />
          </section>
        )}

        {course.description && (
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">Mô tả</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{course.description}</p>
          </section>
        )}

        <section id="giang-vien" className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Giảng viên</h2>
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {course.instructor.image && <AvatarImage src={course.instructor.image} alt={course.instructor.name} />}
              <AvatarFallback className="text-lg">{course.instructor.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start">
              <Link href={`/instructors/${course.instructor.id}`} className={cn('rounded-sm font-semibold text-primary hover:underline', focusRing)}>
                {course.instructor.name}
              </Link>
              {course.instructor.headline && <p className="text-sm text-muted-foreground">{course.instructor.headline}</p>}
              <Link
                href={`/instructors/${course.instructor.id}`}
                className={cn('mt-1 inline-flex min-h-6 items-center gap-1 rounded-sm text-sm font-medium text-primary hover:underline', focusRing)}
              >
                Xem hồ sơ <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* Phân bố sao và danh sách đánh giá chờ API; giờ chỉ có điểm trung bình + số lượt */}
        <section id="danh-gia">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Đánh giá của học viên</h2>
          {course.ratingCount === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center">
              <MessageSquare className="size-6 text-muted-foreground" aria-hidden />
              <p className="font-semibold text-foreground">Chưa có đánh giá nào</p>
              <p className="max-w-sm text-sm text-muted-foreground">Học viên đầu tiên hoàn thành khoá và đánh giá sẽ hiện ở đây.</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border bg-card p-6">
              <b className="text-5xl leading-none font-bold text-foreground">{course.ratingAvg.toFixed(1)}</b>
              <div className="flex flex-col gap-1">
                <RatingStars rating={course.ratingAvg} size="md" />
                <span className="text-sm text-muted-foreground">{course.ratingCount.toLocaleString('vi-VN')} đánh giá</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-foreground marker:text-muted-foreground">
        {items.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
