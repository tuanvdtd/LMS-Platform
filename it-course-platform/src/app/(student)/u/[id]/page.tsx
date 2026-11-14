import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BadgeCheck, CalendarDays, GraduationCap, Presentation } from 'lucide-react';
import { ProfileSkeleton } from '@/components/skeletons/profile-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getProfile } from '@/lib/api/catalog';
import type { PublicProfile } from '@/types/profile';
import { OwnerBar } from './_components/owner-bar';
import { ProfileSections, sectionsOf } from './_components/profile-sections';

export async function generateMetadata({ params }: PageProps<'/u/[id]'>): Promise<Metadata> {
  const p = await getProfile((await params).id);
  if (!p) return { title: 'Không tìm thấy người dùng | SkillPath' };
  return { title: `${p.name} | SkillPath`, description: p.headline ?? `Trang cá nhân của ${p.name} trên SkillPath` };
}

// Trang cá nhân công khai của mọi người dùng; giảng viên có thêm phần giảng dạy.
// params là runtime data: await bên trong Suspense để điều hướng client không bị chặn.
export default function ProfilePage(props: PageProps<'/u/[id]'>) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Body {...props} />
    </Suspense>
  );
}

const joinedFmt = new Intl.DateTimeFormat('vi-VN', { month: 'numeric', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
const num = (n: number) => n.toLocaleString('vi-VN');

// Chỉ đếm thứ có thật; ô nào bằng 0 thì bỏ, không hiện "0 chứng chỉ" như một thành tích.
function facts(p: PublicProfile) {
  const l = p.learning;
  return [
    { n: p.teaching?.courses.length ?? 0, label: 'khoá giảng dạy' },
    { n: p.teaching?.studentCount ?? 0, label: 'học viên' },
    { n: l?.completed.length ?? 0, label: 'khoá đã hoàn thành' },
    { n: l?.certificates.length ?? 0, label: 'chứng chỉ' },
    { n: l?.skills.length ?? 0, label: 'kỹ năng đã đo' },
  ].filter((f) => f.n > 0);
}

// Link do giảng viên tự nhập: chỉ nhận http(s), chặn javascript:/data:.
function linksOf(p: PublicProfile) {
  return [
    { href: p.website, label: 'Website' },
    { href: p.socials.linkedin, label: 'LinkedIn' },
    { href: p.socials.github, label: 'GitHub' },
  ].filter((l): l is { href: string; label: string } => !!l.href && /^https?:\/\//i.test(l.href));
}

async function Body({ params }: PageProps<'/u/[id]'>) {
  const p = await getProfile((await params).id);
  if (!p) notFound();
  const initial = p.name.trim().charAt(0).toUpperCase() || '?';
  const Role = p.verified ? BadgeCheck : p.isInstructor ? Presentation : GraduationCap;
  const role = p.verified ? 'Giảng viên đã xác minh' : p.isInstructor ? 'Giảng viên' : 'Học viên';
  const stats = facts(p);
  const links = linksOf(p);
  const sections = sectionsOf(p);

  return (
    <article>
      <OwnerBar id={p.id} learningPublic={p.learningPublic} />

      <header data-cover={p.coverTone} className="relative isolate overflow-hidden">
        {/* Hoạ tiết bìa: chữ cái đầu của tên, khổ lớn, chân chữ chìm dưới mép bìa. */}
        <span
          aria-hidden
          className="cover-mark pointer-events-none absolute right-[3%] -bottom-[0.24em] -z-10 text-[clamp(13rem,30vw,27rem)] leading-none font-extrabold text-(--cover-mark) select-none"
        >
          {initial}
        </span>

        <div className="mx-auto flex max-w-screen-xl flex-col gap-6 px-4 pt-10 pb-9 md:flex-row md:items-end md:gap-8 md:pt-20 md:pb-12">
          <Avatar className="size-24 rounded-2xl after:rounded-2xl after:border-(--cover-fg)/25 after:mix-blend-normal md:size-36 dark:after:mix-blend-normal">
            {p.image && <AvatarImage src={p.image} alt="" className="rounded-2xl" />}
            <AvatarFallback className="rounded-2xl bg-(--cover-mark) text-4xl font-extrabold text-(--cover-fg) md:text-6xl">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight break-words md:text-6xl">{p.name}</h1>
            {p.headline && <p className="mt-3 max-w-2xl text-lg leading-snug text-(--cover-soft) md:text-xl">{p.headline}</p>}
            <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-(--cover-soft)">
              <li className="flex items-center gap-1.5 font-semibold text-(--cover-fg)">
                <Role className="size-4" aria-hidden />
                {role}
              </li>
              <li className="flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden />
                Tham gia từ tháng {joinedFmt.format(new Date(p.joinedAt))}
              </li>
            </ul>
          </div>
        </div>
      </header>

      {(stats.length > 0 || links.length > 0) && (
        <div className="border-b">
          <div className="mx-auto flex max-w-screen-xl flex-wrap items-baseline justify-between gap-x-8 gap-y-3 px-4 py-4">
            <ul className="flex flex-wrap items-baseline gap-x-7 gap-y-2 text-sm text-muted-foreground">
              {stats.map((f) => (
                <li key={f.label}>
                  <strong className="mr-1.5 text-lg font-extrabold text-foreground tabular-nums">{num(f.n)}</strong>
                  {f.label}
                </li>
              ))}
            </ul>
            {links.length > 0 && (
              <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-6 items-center rounded-sm font-semibold text-foreground underline decoration-border decoration-2 outline-none hover:decoration-primary focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {l.label}
                      <span className="sr-only"> (mở tab mới)</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-screen-xl gap-x-14 px-4 pt-10 pb-20 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <ProfileSections profile={p} />

        {/* Mục lục neo: link thường, không cần JS. Chỉ hiện ở màn rộng và khi có từ 2 mục. */}
        {sections.length > 1 && (
          <nav aria-label="Trên trang này" className="hidden lg:block">
            <ul className="sticky top-24 flex flex-col border-l text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px flex min-h-9 items-center justify-between gap-3 border-l border-transparent py-1.5 pl-4 text-muted-foreground outline-none hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground"
                  >
                    {s.label}
                    {s.count !== undefined && <span className="text-xs tabular-nums">{s.count}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </article>
  );
}
