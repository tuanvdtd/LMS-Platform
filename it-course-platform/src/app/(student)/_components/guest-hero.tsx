import Link from 'next/link';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SKILLS = [
  { name: 'React', value: 35, label: 'Yếu', bar: 'bg-[var(--skill-weak)]' },
  { name: 'JavaScript', value: 72, label: 'Khá', bar: 'bg-[var(--skill-mid)]' },
  { name: 'HTML & CSS', value: 90, label: 'Vững', bar: 'bg-[var(--skill-strong)]' },
];

// Khối 2 trang chủ khách (wireframe A, hero "Tối"). Thẻ năng lực là minh hoạ tĩnh, có nhãn "Ví dụ".
export function GuestHero() {
  return (
    <section className="relative overflow-hidden bg-foreground text-background dark:bg-card">
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 size-[520px] rounded-full bg-primary opacity-30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-48 size-[420px] rounded-full bg-brand-accent opacity-15 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div className="flex min-w-0 flex-col gap-5">
          <h1 className="text-4xl leading-tight font-extrabold text-white md:text-5xl">
            Học lập trình theo <span className="text-[color-mix(in_oklab,var(--primary),white_40%)]">năng lực thực tế</span>
          </h1>
          <p className="max-w-xl text-lg text-white/75">
            SkillPath chấm bài trắc nghiệm và bài code tự động, rồi gợi ý bài cần ôn và khoá nên học tiếp, kèm lý do.
          </p>
          <form action="/courses" role="search" className="flex w-full max-w-xl gap-2 text-foreground">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                name="q"
                required
                aria-label="Tìm khoá học"
                placeholder="Bạn muốn học gì? React, SQL…"
                className="h-11 w-full min-w-0 rounded-md border border-input bg-background pr-3 pl-9 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <button type="submit" className={cn(buttonVariants({ size: 'lg' }), 'max-sm:hidden')}>Tìm</button>
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register" className={buttonVariants({ size: 'lg' })}>Bắt đầu miễn phí</Link>
            <Link href="/courses" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'text-white hover:bg-white/10 hover:text-white')}>
              Khám phá khoá học <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>

        <div className="relative text-foreground">
          <div className="absolute -top-4 -right-2 hidden items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-lg ring-1 ring-foreground/10 sm:flex">
            <span className="size-2 rounded-full bg-brand-accent" aria-hidden />
            Bài code vừa chấm: Accepted 8/8
          </div>
          <div className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Ví dụ hồ sơ năng lực">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Hồ sơ năng lực</p>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Ví dụ</span>
            </div>
            <ul className="grid gap-3">
              {SKILLS.map((s) => (
                <li key={s.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground tabular-nums">{s.value}% · {s.label}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className={cn('h-full rounded-full', s.bar)} style={{ width: `${s.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-3 rounded-xl border bg-muted p-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--primary-light)] text-primary">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Gợi ý vì bạn đạt 35% ở React</p>
                <p className="truncate text-sm font-semibold">Ôn lại: React Hooks — useEffect và gọi API</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
