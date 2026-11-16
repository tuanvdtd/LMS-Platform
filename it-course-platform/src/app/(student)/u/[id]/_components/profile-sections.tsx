import Image from 'next/image';
import Link from 'next/link';
import { Award, BookOpen, ChevronDown, CircleCheck, Lock } from 'lucide-react';
import { CatalogCourseCard, COURSE_GRID_WITH_SIDEBAR } from '@/components/shared/catalog-course-card';
import type { PublicProfile } from '@/types/profile';

const dateFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const dateOf = (iso: string) => dateFmt.format(new Date(iso));
const rowLink =
  'rounded-sm font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50';

// Số mục hiện sẵn; phần còn lại nằm trong <details> "Xem thêm" để người có vài chục chứng chỉ không đẩy trang dài ra.
const CERT_FIRST = 6;
const ROW_FIRST = 5;

// Danh sách mục có nội dung, theo đúng thứ tự hiển thị. Dùng chung cho thân trang và thanh mục.
export function sectionsOf(p: PublicProfile) {
  const l = p.learning;
  return [
    p.bio && { id: 'gioi-thieu', label: 'Giới thiệu' },
    p.teaching && { id: 'giang-day', label: 'Giảng dạy' },
    l?.skills.length && { id: 'ky-nang', label: 'Kỹ năng' },
    l?.inProgress.length && { id: 'dang-hoc', label: 'Đang học' },
    l?.completed.length && { id: 'da-hoan-thanh', label: 'Đã hoàn thành' },
    l?.certificates.length && { id: 'chung-chi', label: 'Chứng chỉ' },
  ].filter((s): s is { id: string; label: string } => !!s);
}

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
  return (
    // scroll-mt: header (4rem) + thanh mục dính (2.75rem) + khoảng thở.
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32">
      <h2 id={`${id}-h`} className="mb-4 flex items-baseline gap-2 text-xl font-bold tracking-tight text-foreground">
        {title}
        {count !== undefined && <span className="text-sm font-medium text-muted-foreground tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

// Phần dư của một danh sách dài: đóng sẵn, mở bằng <details> gốc của trình duyệt (không cần JS, Ctrl+F vẫn tìm thấy).
function More({ count, noun, children }: { count: number; noun: string; children: React.ReactNode }) {
  if (count <= 0) return null;
  return (
    <details className="group">
      <summary className="mt-4 inline-flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-sm text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 group-open:hidden [&::-webkit-details-marker]:hidden">
        Xem thêm {count} {noun}
        <ChevronDown className="size-4" aria-hidden />
      </summary>
      {children}
    </details>
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

type RowCourse = { slug: string; title: string; thumbnailUrl: string; instructorName: string };

// Một dòng khoá học: ảnh nhỏ, tên + giảng viên, cột phải là tiến độ hoặc ngày xong.
function CourseRow({ course, children }: { course: RowCourse; children: React.ReactNode }) {
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

// Danh sách dòng có giới hạn: ROW_FIRST dòng đầu, phần còn lại sau "Xem thêm".
function Rows<T>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  const rest = items.slice(ROW_FIRST);
  return (
    <>
      <ul className="divide-y border-y">{items.slice(0, ROW_FIRST).map(render)}</ul>
      <More count={rest.length} noun="khoá học">
        <ul className="divide-y border-b">{rest.map(render)}</ul>
      </More>
    </>
  );
}

type Cert = NonNullable<PublicProfile['learning']>['certificates'][number];

// Thẻ chứng chỉ gọn: cả thẻ là link sang trang xác thực. Lưới 1 → 2 → 3 cột nên 6 thẻ chỉ chiếm hai hàng.
function CertCard({ c }: { c: Cert }) {
  return (
    <li>
      <Link href={`/verify/${c.serialNo}`} className="card-interactive flex h-full items-start gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-accent-soft text-brand-accent-strong">
          <Award className="size-5" aria-hidden />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="line-clamp-2 text-sm leading-snug font-semibold text-foreground">{c.courseTitle}</span>
          <span className="text-xs text-muted-foreground">
            Cấp ngày <span className="tabular-nums">{dateOf(c.issuedAt)}</span>
          </span>
          <span className="truncate font-mono text-xs text-muted-foreground">{c.serialNo}</span>
        </span>
      </Link>
    </li>
  );
}

const CERT_GRID = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

export function ProfileSections({ profile: p }: { profile: PublicProfile }) {
  const l = p.learning;
  const hasLearning = !!l && (l.skills.length > 0 || l.inProgress.length > 0 || l.completed.length > 0 || l.certificates.length > 0);

  return (
    <div className="flex min-w-0 flex-col gap-12">
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
          <p className="mb-5 max-w-[68ch] text-sm text-muted-foreground">
            Điểm đo bằng bài đánh giá kỹ năng trên SkillPath, không phải tự khai.
          </p>
          <ul className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
            {/* Trang công khai: thanh một màu + con số. Không gắn nhãn Yếu / Vững hay tô đỏ lên hồ sơ của người khác. */}
            {l.skills.map((s) => (
              <li key={s.slug} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <Link href={`/topic/${s.slug}`} className={`${rowLink} truncate`}>
                    {s.name}
                  </Link>
                  <span className="font-mono font-semibold text-foreground tabular-nums">{s.pct}%</span>
                </div>
                <div
                  role="meter"
                  aria-label={`${s.name}: ${s.pct}%`}
                  aria-valuenow={s.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {l && l.inProgress.length > 0 && (
        <Section id="dang-hoc" title="Đang học" count={l.inProgress.length}>
          <Rows
            items={l.inProgress}
            render={(c) => (
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
            )}
          />
        </Section>
      )}

      {l && l.completed.length > 0 && (
        <Section id="da-hoan-thanh" title="Đã hoàn thành" count={l.completed.length}>
          <Rows
            items={l.completed}
            render={(c) => (
              <CourseRow key={c.slug} course={c}>
                <p className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <CircleCheck className="size-4" aria-hidden />
                  Xong ngày <span className="tabular-nums">{dateOf(c.completedAt)}</span>
                </p>
              </CourseRow>
            )}
          />
        </Section>
      )}

      {l && l.certificates.length > 0 && (
        <Section id="chung-chi" title="Chứng chỉ" count={l.certificates.length}>
          <p className="mb-4 text-sm text-muted-foreground">Bấm vào một chứng chỉ để mở trang xác thực của nó.</p>
          <ul className={CERT_GRID}>
            {l.certificates.slice(0, CERT_FIRST).map((c) => (
              <CertCard key={c.serialNo} c={c} />
            ))}
          </ul>
          <More count={l.certificates.length - CERT_FIRST} noun="chứng chỉ">
            <ul className={`${CERT_GRID} mt-3`}>
              {l.certificates.slice(CERT_FIRST).map((c) => (
                <CertCard key={c.serialNo} c={c} />
              ))}
            </ul>
          </More>
        </Section>
      )}

      {/* Phần học tập không có gì để hiện: nói rõ là riêng tư hay chỉ là chưa có, đừng để trang trống. */}
      {!hasLearning && (
        <p className="flex max-w-[68ch] items-start gap-2.5 text-sm text-muted-foreground">
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
