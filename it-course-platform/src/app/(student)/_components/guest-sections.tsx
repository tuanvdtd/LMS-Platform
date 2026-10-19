import Link from 'next/link';
import { BadgeCheck, Check, CircleCheck, Hourglass, PencilLine, Route, Target, type LucideIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PILLARS: [LucideIcon, string, string][] = [
  [Target, 'Đánh giá năng lực tự động', 'Quiz và bài code chấm tự động trong sandbox. Bạn biết chính xác mình vững topic nào, hổng topic nào.'],
  [Route, 'Gợi ý có lý do', 'Mỗi gợi ý kèm lý do, ví dụ "vì bạn đạt 35% ở React". Chỉ học thứ bạn còn thiếu.'],
  [BadgeCheck, 'Chứng chỉ có mã QR', 'Hoàn thành khoá và đạt bài cuối khoá là có chứng chỉ, ai cũng quét QR để xác thực.'],
];

const STEPS = [
  ['Chọn mục tiêu', 'Cho biết nghề bạn hướng tới (Frontend, Backend, Data…) và kỹ năng muốn theo dõi.'],
  ['Học và làm bài', 'Xem bài giảng, làm quiz và bài code. Điểm được chấm ngay và cập nhật hồ sơ năng lực.'],
  ['Nhận gợi ý', 'Hệ thống chỉ ra topic còn yếu, gợi ý bài cần ôn và khoá nên học tiếp, kèm lý do.'],
];

const FLOW: [string, string, LucideIcon, string][] = [
  ['Nháp', 'Soạn chương, bài giảng, quiz', PencilLine, 'bg-secondary text-secondary-foreground'],
  ['Chờ duyệt', 'Chuyên gia theo chủ đề xem xét', Hourglass, 'bg-[color-mix(in_srgb,var(--status-pending)_18%,transparent)] text-[color-mix(in_oklab,var(--status-pending),black_45%)] dark:text-[var(--status-pending)]'],
  ['Đã duyệt', 'Hiển thị trên catalog', CircleCheck, 'bg-[color-mix(in_srgb,var(--status-approved)_16%,transparent)] text-[color-mix(in_oklab,var(--status-approved),black_40%)] dark:text-[var(--status-approved)]'],
];

const TEACH_POINTS = [
  'Tạo khoá miễn phí ngay, không cần xét duyệt hồ sơ',
  'Tự soạn quiz và bài code chấm tự động cho học viên',
  'Xác minh hồ sơ chuyên môn để bán khoá và nhận doanh thu',
];

const inner = 'mx-auto w-full max-w-screen-xl px-4 py-16 lg:py-20';

// Khối 5: điểm khác biệt
export function PillarsSection() {
  return (
    <section aria-labelledby="guest-pillars" className="border-y border-primary/10 bg-[var(--primary-light)]">
      <div className={inner}>
        <div className="mb-8 max-w-2xl">
          <h2 id="guest-pillars" className="text-2xl font-bold text-foreground md:text-3xl">Không chỉ xem video</h2>
          <p className="mt-2 text-secondary-foreground">Hệ thống đo năng lực của bạn rồi chỉ đường học tiếp.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map(([Icon, title, desc]) => (
            <div key={title} className="rounded-2xl border bg-card p-6 shadow-xs">
              <span className="mb-4 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><Icon className="size-5" aria-hidden /></span>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Khối 6: cách hoạt động
export function StepsSection() {
  return (
    <section aria-labelledby="guest-steps" className="bg-background">
      <div className={inner}>
        <h2 id="guest-steps" className="mb-8 text-2xl font-bold text-foreground md:text-3xl">Ba bước để học đúng chỗ</h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map(([title, desc], i) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-secondary-foreground">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Khối 7: CTA giảng viên (không có "Tìm hiểu quy trình": chưa có trang)
export function TeachSection() {
  return (
    <section aria-labelledby="guest-teach" className="border-y bg-secondary">
      <div className={inner}>
        <div className="grid overflow-hidden rounded-3xl border bg-card shadow-xs lg:grid-cols-2">
          <div className="flex flex-col gap-5 p-6 md:p-10">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">Dành cho giảng viên</p>
            <h2 id="guest-teach" className="text-2xl font-bold md:text-3xl">Chia sẻ kiến thức IT của bạn</h2>
            <ul className="grid gap-3 text-secondary-foreground">
              {TEACH_POINTS.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-3" aria-hidden /></span>
                  {t}
                </li>
              ))}
            </ul>
            <div className="pt-1">
              <Link href="/teach" className={buttonVariants({ size: 'lg' })}>Trở thành giảng viên</Link>
            </div>
          </div>
          <div className="relative flex flex-col justify-center gap-3 overflow-hidden bg-[var(--primary-light)] p-6 md:p-10">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-primary opacity-10 blur-3xl" />
            <p className="relative text-sm font-semibold text-secondary-foreground">Một khoá học đi từ nháp tới catalog</p>
            <ol className="relative grid gap-3">
              {FLOW.map(([title, desc, Icon, tone], i) => (
                <li key={title} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tone)}><Icon className="size-5" aria-hidden /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}/3</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

// Khối 8: CTA đăng ký cuối trang
export function SignupSection() {
  return (
    <section aria-labelledby="guest-signup" className="relative overflow-hidden border-b border-white/10 bg-[color-mix(in_oklab,var(--primary),var(--foreground)_72%)] text-white dark:bg-[color-mix(in_oklab,var(--primary),var(--background)_72%)]">
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-64 w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-40 blur-3xl" />
      <div className="relative mx-auto flex w-full max-w-screen-xl flex-col items-center gap-5 px-4 py-20 text-center">
        <h2 id="guest-signup" className="max-w-2xl text-3xl font-bold md:text-4xl">Bắt đầu học theo năng lực của bạn</h2>
        <p className="max-w-xl text-white/80">Tạo tài khoản miễn phí, chọn mục tiêu và nhận gợi ý đầu tiên sau bài kiểm tra.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register" className={buttonVariants({ size: 'lg' })}>Đăng ký miễn phí</Link>
          <Link href="/courses" className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'text-white ring-1 ring-white/25 hover:bg-white/10 hover:text-white')}>Khám phá khoá học</Link>
        </div>
      </div>
    </section>
  );
}
