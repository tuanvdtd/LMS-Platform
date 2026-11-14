import { ArrowUpRight, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import type { PublicProfile } from '@/types/profile';
import { OwnerBar } from './owner-bar';
import { ProfileSections, sectionsOf } from './profile-sections';

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

// Toàn bộ trang cá nhân từ một PublicProfile: bìa, khối tên, số liệu, thanh mục, các mục nội dung.
export function ProfileView({ p }: { p: PublicProfile }) {
  const role = p.verified ? 'Giảng viên đã xác minh' : p.isInstructor ? 'Giảng viên' : 'Học viên';
  const stats = facts(p);
  const links = linksOf(p);
  const sections = sectionsOf(p);

  return (
    <article>
      <OwnerBar id={p.id} learningPublic={p.learningPublic} />

      {/* Bìa: dải màu đặc do người dùng chọn + lưới chấm lệch nền một bậc. Không ảnh, không gradient. */}
      <div data-cover={p.coverTone} className="relative h-28 overflow-hidden md:h-44">
        <svg aria-hidden className="absolute inset-0 size-full text-(--cover-mark)">
          <pattern id="cover-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="2" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#cover-dots)" />
        </svg>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
          <Avatar className="-mt-12 size-24 ring-4 ring-background md:-mt-16 md:size-36">
            {p.image && <AvatarImage src={p.image} alt="" />}
            <AvatarFallback className="bg-secondary text-4xl font-extrabold text-secondary-foreground md:text-5xl">
              {p.name.trim().charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 md:pb-1">
            <h1 className="flex flex-wrap items-center gap-x-2.5 text-3xl leading-tight font-extrabold tracking-tight break-words text-foreground">
              {p.name}
              {p.verified && <BadgeCheck className="size-6 shrink-0 text-success" aria-hidden />}
            </h1>
            {p.headline && <p className="mt-1 text-base text-muted-foreground">{p.headline}</p>}
          </div>
          {links.length > 0 && (
            <ul className="flex flex-wrap gap-2 md:pb-1">
              {links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    {l.label}
                    <ArrowUpRight data-icon="inline-end" />
                    <span className="sr-only"> (mở tab mới)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </header>

        <ul className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
          <li className="font-semibold text-foreground">{role}</li>
          {stats.map((f) => (
            <li key={f.label}>
              <strong className="mr-1 font-mono font-semibold text-foreground tabular-nums">{num(f.n)}</strong>
              {f.label}
            </li>
          ))}
          <li>Tham gia từ tháng {joinedFmt.format(new Date(p.joinedAt))}</li>
        </ul>

        {/* Thanh mục dính dưới header (h-16): link neo thường, không cần JS. Chỉ hiện khi có từ 2 mục. */}
        {sections.length > 1 ? (
          <nav aria-label="Trên trang này" className="sticky top-16 z-10 mt-6 border-b bg-background">
            <ul className="flex gap-6 overflow-x-auto text-sm font-medium">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex h-11 items-center gap-1.5 whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground focus-visible:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="mt-6 border-b" />
        )}

        <div className="pt-8 pb-20">
          <ProfileSections profile={p} />
        </div>
      </div>
    </article>
  );
}
