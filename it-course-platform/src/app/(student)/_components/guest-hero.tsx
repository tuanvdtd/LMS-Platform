import Link from 'next/link';
import { ArrowRight, BadgeCheck, Circle, CircleCheck, CirclePlay, CodeXml, ShieldCheck } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MascotFigure } from './guest-illustrations';
import { Bob, GrowBar, Reveal, RevealItem, RevealList } from './guest-motion';

type LessonState = 'done' | 'current' | 'todo';
const LESSONS: [string, string, LessonState][] = [
  ['useState và render lại', 'Video · 12:30', 'done'],
  ['useEffect và gọi API', 'Video · 18:05', 'done'],
  ['Viết custom hook useFetch', 'Bài code', 'current'],
  ['Quy tắc của Hooks', 'Quiz · 8 câu', 'todo'],
];
const DONE = 8;
const TOTAL = 14;

const TRUST: [typeof ShieldCheck, string][] = [
  [ShieldCheck, 'Mọi khoá đều qua kiểm duyệt'],
  [BadgeCheck, 'Chứng chỉ xác thực bằng mã QR'],
];

// Hero trang chủ khách: nền ink phẳng (không blob, không quầng sáng). Hai phía của nền tảng trong một thẻ:
// khoá do giảng viên chia sẻ (đã duyệt) và tiến độ của người tự học trong khoá đó. Thanh tiến độ chạy từ 0 khi tải.
export function GuestHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      <div className="relative mx-auto grid w-full max-w-screen-xl grid-cols-1 items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
        <div className="flex min-w-0 flex-col gap-6">
          <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-balance md:text-[3.25rem]">
            Chia sẻ khoá học IT, <span className="whitespace-nowrap text-ink-builtin">tự học</span> theo cách của bạn
          </h1>
          <p className="max-w-xl text-lg/relaxed text-ink-foreground/80">
            Giảng viên chia sẻ khoá học thực chiến, mọi khoá được duyệt trước khi lên catalog. Người học tự học theo nhịp
            riêng, nộp bài code là có kết quả và biết nên học gì tiếp.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {/* Không dùng bóng màu trên nền tối (thành quầng sáng). */}
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'shadow-none hover:shadow-none')}>
              Bắt đầu miễn phí
            </Link>
            <Link
              href="/teach"
              className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'text-ink-foreground hover:bg-ink-hover hover:text-ink-foreground')}
            >
              Chia sẻ khoá học của bạn <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-ink-muted">
            {TRUST.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 text-ink-success" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-md text-card-foreground lg:mt-0 lg:mr-0">
          <Bob className="absolute -top-14 -left-3 z-10 w-20 sm:-top-16 sm:-left-10 sm:w-28">
            <MascotFigure className="w-full drop-shadow-lg" />
          </Bob>
          <Reveal delay={0.9} y={12} className="absolute -top-4 -right-2 z-10 hidden sm:block">
            <span className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-lg ring-1 ring-foreground/10">
              <CircleCheck className="size-3.5 text-success" aria-hidden />
              Accepted · <span className="font-mono">8/8 test</span>
            </span>
          </Reveal>
          <div className="rounded-2xl border border-ink-border bg-card p-6 shadow-xl" aria-label="Ví dụ khoá học và tiến độ tự học">
            <div className="flex items-start gap-3 pl-14 sm:pl-12">
              <div className="min-w-0 flex-1">
                <p className="font-bold">React Hooks từ cơ bản đến thực chiến</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Trần Minh Anh chia sẻ · {TOTAL} bài</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Đã duyệt bởi chuyên gia Frontend
                </p>
              </div>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">Ví dụ</span>
            </div>

            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium">Tiến độ của bạn</span>
                <span className="font-mono font-semibold tabular-nums">{DONE}/{TOTAL} bài</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <GrowBar pct={(DONE / TOTAL) * 100} delay={0.3} className="bg-primary" />
              </div>
            </div>

            <RevealList ordered className="mt-5 grid gap-1">
              {LESSONS.map(([title, meta, state]) => (
                <RevealItem
                  key={title}
                  className={cn('flex items-center gap-3 rounded-lg px-3 py-2', state === 'current' && 'bg-primary-soft')}
                >
                  {state === 'done' && <CircleCheck className="size-4 shrink-0 text-success" aria-label="Đã học" />}
                  {state === 'current' && <CirclePlay className="size-4 shrink-0 text-primary" aria-label="Đang học" />}
                  {state === 'todo' && <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="Chưa học" />}
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-sm',
                      state === 'current' && 'font-semibold text-primary',
                      state === 'done' && 'text-muted-foreground',
                    )}
                  >
                    {title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    {meta === 'Bài code' && <CodeXml className="size-3.5" aria-hidden />}
                    {meta}
                  </span>
                </RevealItem>
              ))}
            </RevealList>
          </div>
        </div>
      </div>
    </section>
  );
}
