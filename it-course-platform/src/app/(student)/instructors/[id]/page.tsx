import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BookOpen, Globe, Users } from 'lucide-react';
import { CatalogCourseCard } from '@/components/shared/catalog-course-card';
import { InstructorProfileSkeleton } from '@/components/skeletons/instructor-profile-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { getInstructor } from '@/lib/api/catalog';

export async function generateMetadata({ params }: PageProps<'/instructors/[id]'>): Promise<Metadata> {
  const ins = await getInstructor((await params).id);
  return { title: ins ? `${ins.name} | SkillPath` : 'Không tìm thấy giảng viên | SkillPath' };
}

// Hồ sơ giảng viên public.
// params là runtime data: await bên trong Suspense để điều hướng client không bị chặn.
export default function InstructorPage(props: PageProps<'/instructors/[id]'>) {
  return (
    <Suspense fallback={<InstructorProfileSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

async function Body({ params }: PageProps<'/instructors/[id]'>) {
  const ins = await getInstructor((await params).id);
  if (!ins) notFound();
  const students = ins.courses.reduce((s, c) => s + c.enrollmentCount, 0);
  const links = [
    { href: ins.website, label: 'Website' },
    { href: ins.socials.linkedin, label: 'LinkedIn' },
    { href: ins.socials.github, label: 'GitHub' },
    // Link do giảng viên tự nhập: chỉ nhận http(s), chặn javascript:/data:.
  ].filter((l): l is { href: string; label: string } => !!l.href && /^https?:\/\//i.test(l.href));

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10">
      <header className="mb-10 flex flex-col items-start gap-6 md:flex-row">
        <Avatar className="size-28 border-4">
          {ins.image && <AvatarImage src={ins.image} alt={ins.name} />}
          <AvatarFallback className="text-3xl">{ins.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Giảng viên</p>
          <h1 className="text-3xl font-extrabold break-words text-foreground">{ins.name}</h1>
          {ins.headline && <p className="mt-1 text-base text-muted-foreground">{ins.headline}</p>}

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-4 text-primary" aria-hidden />
              <dt className="sr-only">Số khoá học</dt>
              <dd>
                <strong className="text-foreground">{ins.courses.length}</strong>{' '}
                <span className="text-muted-foreground">khoá học</span>
              </dd>
            </div>
            {students > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="size-4 text-primary" aria-hidden />
                <dt className="sr-only">Tổng học viên</dt>
                <dd>
                  <strong className="text-foreground">{students.toLocaleString('vi-VN')}</strong>{' '}
                  <span className="text-muted-foreground">học viên</span>
                </dd>
              </div>
            )}
          </dl>

          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    <Globe data-icon="inline-start" aria-hidden />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {ins.bio && (
        <section className="mb-10 max-w-3xl">
          <h2 className="mb-3 text-lg font-bold text-foreground">Giới thiệu</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">{ins.bio}</p>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold text-foreground">Khoá học ({ins.courses.length})</h2>
        {ins.courses.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ins.courses.map((c) => (
              <CatalogCourseCard key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Giảng viên chưa có khoá học nào</p>
        )}
      </section>
    </div>
  );
}
