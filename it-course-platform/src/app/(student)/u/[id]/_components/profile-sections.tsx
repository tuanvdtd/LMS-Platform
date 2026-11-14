import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, CircleCheck, Lock } from 'lucide-react';
import { CatalogCourseCard, COURSE_GRID_WITH_SIDEBAR } from '@/components/shared/catalog-course-card';
import type { PublicProfile } from '@/types/profile';

const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const dateOf = (iso: string) => dateFmt.format(new Date(iso));
const rowLink =
  'rounded-sm font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50';

// Danh sách mục có nội dung, theo đúng thứ tự hiển thị. Dùng chung cho thân trang và mục lục neo.
export function sectionsOf(p: PublicProfile) {
  const l = p.learning;
  return [
    p.bio && { id: 'gioi-thieu', label: 'Giới thiệu' },
    p.teaching && { id: 'giang-day', label: 'Giảng dạy', count: p.teaching.courses.length },
    l?.skills.length && { id: 'ky-nang', label: 'Kỹ năng', count: l.skills.length },
    l?.inProgress.length && { id: 'dang-hoc', label: 'Đang học', count: l.inProgress.length },
    l?.completed.length && { id: 'da-hoan-thanh', label: 'Đã hoàn thành', count: l.completed.length },
    l?.certificates.length && { id: 'chung-chi', label: 'Chứng chỉ', count: l.certificates.length },
  ].filter((s): s is { id: string; label: string; count?: number } => !!s);
}

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t pt-8 first:border-t-0 first:pt-0">
      <h2 id={`${id}-h`} className="mb-5 flex items-baseline gap-2.5 text-2xl font-extrabold tracking-tight text-foreground">
        {title}
        {count !== undefined && <span className="text-base font-medium text-muted-foreground tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

function Thumb({ src }: { src: string }) {
  return (
    <div className="relative flex aspect-video w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted sm:w-28">
      {src ? (
        <Image src={src} alt="" fill unoptimized sizes="112px" className="object-cover" />
      ) : (
        <BookOpen className="size-5 text-muted-foreground" aria-hidden />
      )}
    </div>
  );
}

// Một dòng khoá học trong sổ: ảnh nhỏ, tên + giảng viên, cột phải là tiến độ hoặc ngày xong.
function CourseRow({ course, children }: { course: { slug: string; title: string; thumbnailUrl: string; instructorName: string }; children: React.ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
      <Thumb src={course.thumbnailUrl} />
      <div className="min-w-0 flex-1 basis-48">
        <Link href={`/course/${course.slug}`} className={`${rowLink} line-clamp-2 text-sm leading-snug sm:text-base`}>
          {course.title}
        </Link>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{course.instructorName}</p>
      </div>
      {children}
    </li>
  );
}

export function ProfileSections({ profile: p }: { profile: PublicProfile }) {
  const l = p.learning;
  const hasLearning = !!l && (l.skills.length > 0 || l.inProgress.length > 0 || l.completed.length > 0 || l.certificates.length > 0);

  return (
    <div className="flex min-w-0 flex-col gap-10">
      {p.bio && (
        <Section id="gioi-thieu" title="Giới thiệu">
          <p className="max-w-[68ch] text-base leading-relaxed whitespace-pre-line text-foreground">{p.bio}</p>
        </Section>
      )}

      {p.teaching && (
        <Section id="giang-day" title="Giảng dạy" count={p.teaching.courses.length}>
          {p.teaching.courses.length ? (
            <div className={COURSE_GRID_WITH_SIDEBAR}>
              {p.teaching.courses.map((c) => (
                <CatalogCourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{p.name} chưa xuất bản khoá học nào.</p>
          )}
        </Section>
      )}

      {l && l.skills.length > 0 && (
        <Section id="ky-nang" title="Kỹ năng" count={l.skills.length}>
          <p className="mb-4 max-w-[68ch] text-sm text-muted-foreground">
            Điểm đo bằng bài đánh giá kỹ năng trên SkillPath, không phải tự khai.
          </p>
          <ul className="divide-y border-y">
            {/* Trang công khai: thanh một màu + con số. Không gắn nhãn Yếu / Vững hay tô đỏ lên hồ sơ của người khác. */}
            {l.skills.map((s) => (
              <li key={s.slug} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_3rem]">
                <Link href={`/topic/${s.slug}`} className={`${rowLink} truncate text-sm`}>
                  {s.name}
                </Link>
                <div
                  role="meter"
                  aria-label={`${s.name}: ${s.pct}%`}
                  aria-valuenow={s.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="order-last col-span-2 h-2 overflow-hidden rounded-full bg-secondary sm:order-none sm:col-span-1"
                >
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-right font-mono text-sm font-semibold text-foreground tabular-nums">{s.pct}%</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {l && l.inProgress.length > 0 && (
        <Section id="dang-hoc" title="Đang học" count={l.inProgress.length}>
          <ul className="divide-y border-y">
            {l.inProgress.map((c) => (
              <CourseRow key={c.slug} course={c}>
                <div className="flex w-full items-center gap-3 sm:w-44">
                  <div
                    role="progressbar"
                    aria-label={`Đã học ${c.progressPct}%`}
                    aria-valuenow={c.progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${c.progressPct}%` }} />
                  </div>
                  <span className="w-10 text-right font-mono text-sm font-semibold text-foreground tabular-nums">{c.progressPct}%</span>
                </div>
              </CourseRow>
            ))}
          </ul>
        </Section>
      )}

      {l && l.completed.length > 0 && (
        <Section id="da-hoan-thanh" title="Đã hoàn thành" count={l.completed.length}>
          <ul className="divide-y border-y">
            {l.completed.map((c) => (
              <CourseRow key={c.slug} course={c}>
                <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <CircleCheck className="size-4" aria-hidden />
                  Xong ngày <span className="tabular-nums">{dateOf(c.completedAt)}</span>
                </p>
              </CourseRow>
            ))}
          </ul>
        </Section>
      )}

      {l && l.certificates.length > 0 && (
        <Section id="chung-chi" title="Chứng chỉ" count={l.certificates.length}>
          <ul className="divide-y border-y">
            {l.certificates.map((c) => (
              <li key={c.serialNo} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3.5">
                <Award className="size-5 shrink-0 text-brand-accent-strong" aria-hidden />
                <div className="min-w-0 flex-1 basis-48">
                  <Link href={`/course/${c.courseSlug}`} className={`${rowLink} line-clamp-2 text-sm leading-snug sm:text-base`}>
                    {c.courseTitle}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Cấp ngày <span className="tabular-nums">{dateOf(c.issuedAt)}</span>
                    <span className="mx-1.5" aria-hidden>
                      ·
                    </span>
                    <span className="font-mono text-xs">{c.serialNo}</span>
                  </p>
                </div>
                <Link
                  href={`/verify/${c.serialNo}`}
                  className="inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  Xác thực<span className="sr-only"> chứng chỉ {c.courseTitle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Phần học tập không có gì để hiện: nói rõ là riêng tư hay chỉ là chưa có, đừng để trang trống. */}
      {!hasLearning && (
        <p className="flex max-w-[68ch] items-start gap-2.5 border-t pt-8 text-sm text-muted-foreground first:border-t-0 first:pt-0">
          {l ? (
            <>
              <BookOpen className="mt-0.5 size-4 shrink-0" aria-hidden />
              {p.name} chưa có khoá học, chứng chỉ hay điểm kỹ năng nào để hiển thị.
            </>
          ) : (
            <>
              <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
              {p.name} để phần học tập ở chế độ riêng tư. Khoá đang học, chứng chỉ và điểm kỹ năng không hiển thị ở đây.
            </>
          )}
        </p>
      )}
    </div>
  );
}
