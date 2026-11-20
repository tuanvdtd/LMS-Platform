import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CircleCheck,
  CircleHelp,
  ClipboardCheck,
  Clock,
  Hourglass,
  PencilLine,
  ShieldCheck,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AskScene, SelfStudyScene, TeachScene } from './guest-illustrations';
import { Reveal, RevealItem, RevealList, VerdictDemo } from './guest-motion';

const inner = 'mx-auto w-full max-w-screen-xl px-4 py-20 lg:py-28';
const h2 = 'text-3xl font-extrabold tracking-tight text-foreground md:text-4xl';
const lead = 'mt-3 max-w-2xl text-lg/relaxed text-secondary-foreground';

// ─── Nỗi đau → cách giải ────────────────────────────────────────────────────────

const PAINS: [string, string][] = [
  ['Xem hết video nhưng không chắc mình làm được', 'Nộp bài code, máy chấm trả kết quả từng test trong vài giây.'],
  ['Không biết mình yếu ở topic nào', 'Bài đánh giá 12 câu cho ra mức thành thạo của bạn ở từng topic.'],
  ['Không biết nên học gì tiếp', 'Gợi ý khoá kèm lý do, dựa trên chính kết quả của bạn.'],
];

export function PainSection() {
  return (
    <section aria-labelledby="guest-pain" className="bg-background">
      <div className={cn(inner, 'grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16')}>
        <Reveal className="order-2 lg:order-1">
          <SelfStudyScene />
        </Reveal>
        <div className="order-1 lg:order-2">
          <Reveal>
            <h2 id="guest-pain" className={h2}>Tự học lập trình, khó nhất là biết mình đang ở đâu</h2>
            <p className={lead}>Ba câu hỏi người tự học hay gặp, và cách Aolumi trả lời bằng số liệu của chính bạn.</p>
          </Reveal>
          <RevealList className="mt-8 grid gap-4">
            {PAINS.map(([pain, fix]) => (
              <RevealItem key={pain} className="rounded-2xl border bg-card p-5 shadow-xs">
                <p className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CircleHelp className="size-4 shrink-0" aria-hidden />
                  {pain}
                </p>
                <p className="mt-2 flex items-start gap-2.5 font-semibold text-foreground">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {fix}
                </p>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      </div>
    </section>
  );
}

// ─── Hai điểm khác biệt, mỗi điểm là một mảnh giao diện ──────────────────────────

function AssessmentFragment() {
  const options = ['Sau mỗi lần render', 'Một lần, sau lần render đầu tiên', 'Trước lần render đầu tiên', 'Khi component bị gỡ khỏi trang'];
  return (
    <figure aria-label="Ví dụ màn hình bài đánh giá kỹ năng" className="rounded-xl border bg-card p-5 shadow-lg">
      <div aria-hidden>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Bài đánh giá · React JS</p>
          <span className="flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-warning">
            <Clock className="size-3.5" />
            08:42
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">Câu 7/12</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[58%] rounded-full bg-primary" />
          </div>
        </div>
        <p className="mt-4 font-semibold">useEffect với mảng phụ thuộc rỗng chạy khi nào?</p>
        <div className="mt-3 grid gap-2">
          {options.map((o, i) => (
            <div
              key={o}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                i === 1 ? 'border-primary bg-primary-soft font-medium text-foreground' : 'text-secondary-foreground',
              )}
            >
              <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border-2', i === 1 ? 'border-primary' : 'border-muted-foreground/40')}>
                {i === 1 && <span className="size-1.5 rounded-full bg-primary" />}
              </span>
              {o}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Trả lời đúng thì câu sau khó hơn.</p>
      </div>
    </figure>
  );
}

const FEATURES: { id: string; title: string; body: string; facts: string[]; visual: React.ReactNode }[] = [
  {
    id: 'grading',
    title: 'Nộp bài code, biết đúng sai từng test',
    body: 'Lời giải chạy trong sandbox cô lập với bộ test của giảng viên. Kết quả về sau vài giây, điểm tính theo số test đạt.',
    facts: ['Accepted, Wrong Answer, Time Limit, Runtime Error, Compile Error', 'Quiz trắc nghiệm cũng chấm ngay khi nộp', 'Xem lại từng lần nộp và kết quả'],
    visual: <VerdictDemo />,
  },
  {
    id: 'assessment',
    title: '15 phút để biết mình đang ở đâu',
    body: 'Bài đánh giá kỹ năng gồm 12 câu thích ứng: đúng thì câu sau khó hơn, sai thì dễ hơn. Điểm tính theo Elo, cho ra mức thành thạo của bạn ở từng topic.',
    facts: ['Câu hỏi do Aolumi soạn theo từng topic', 'Kết quả vào hồ sơ kỹ năng của bạn', 'Điểm quiz và bài code trong khoá không cộng vào, ai cũng được đo cùng một thước'],
    visual: <AssessmentFragment />,
  },
];

export function ShowcaseSection() {
  return (
    <section aria-labelledby="guest-showcase" className="border-y bg-muted">
      <div className={inner}>
        <Reveal className="max-w-2xl">
          <h2 id="guest-showcase" className={h2}>Mỗi bước học đều có con số đi kèm</h2>
          <p className={lead}>Hai thứ làm Aolumi khác một trang chỉ để xem video.</p>
        </Reveal>
        <div className="mt-16 grid gap-20 lg:gap-28">
          {FEATURES.map((f, i) => (
            <article key={f.id} aria-labelledby={`feat-${f.id}`} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={cn(i % 2 === 1 && 'lg:order-2')}>
                <Reveal>
                  <h3 id={`feat-${f.id}`} className="text-2xl font-bold tracking-tight">{f.title}</h3>
                  <p className="mt-3 max-w-lg text-base/relaxed text-secondary-foreground">{f.body}</p>
                </Reveal>
                <RevealList className="mt-6 grid gap-3">
                  {f.facts.map((fact) => (
                    <RevealItem key={fact} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      {fact}
                    </RevealItem>
                  ))}
                </RevealList>
              </div>
              <Reveal delay={0.15} className="rounded-2xl bg-secondary p-5 sm:p-8">
                {f.visual}
              </Reveal>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Giảng viên + kiểm duyệt ────────────────────────────────────────────────────

const TEACH_POINTS = [
  'Tạo khoá miễn phí ngay, khoá vẫn được duyệt trước khi lên catalog',
  'Tự soạn quiz và bài code chấm tự động cho học viên',
  'Hồ sơ chuyên môn được duyệt và có tài khoản ngân hàng thì bán được khoá có phí',
];

const FLOW: [string, string, LucideIcon, string][] = [
  ['Nháp', 'Soạn chương, bài giảng, quiz', PencilLine, 'bg-secondary text-secondary-foreground'],
  ['Chờ duyệt', 'Chuyên gia theo chủ đề xem xét', Hourglass, 'bg-warning-soft text-warning'],
  ['Đã duyệt', 'Hiển thị trên catalog', CircleCheck, 'bg-success-soft text-success'],
];

export function TeachSection() {
  return (
    <section aria-labelledby="guest-teach" className="bg-background">
      <div className={cn(inner, 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16')}>
        <div>
          <Reveal>
            <h2 id="guest-teach" className={h2}>Chia sẻ kiến thức IT của bạn</h2>
            <p className={lead}>Ai cũng trở thành giảng viên được ngay khi bấm một nút.</p>
          </Reveal>
          <RevealList className="mt-8 grid gap-3 text-secondary-foreground">
            {TEACH_POINTS.map((t) => (
              <RevealItem key={t} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </RevealItem>
            ))}
          </RevealList>
          <Reveal delay={0.2} className="mt-8 flex gap-3 rounded-xl border bg-muted p-4 text-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            <p>
              <span className="font-semibold">Duyệt bởi chuyên gia đúng lĩnh vực.</span> Người gửi khoá và người duyệt khoá không bao
              giờ là một người.
            </p>
          </Reveal>
          <Reveal delay={0.25} className="mt-8">
            <Link href="/teach" className={buttonVariants({ size: 'lg' })}>
              Trở thành giảng viên
            </Link>
          </Reveal>
        </div>
        <div className="relative">
          <Reveal>
            <TeachScene />
          </Reveal>
          <RevealList ordered className="relative -mt-10 grid gap-2 px-4 sm:mx-6 sm:-mt-16 sm:grid-cols-3 sm:px-0" >
            {FLOW.map(([title, desc, Icon, tone]) => (
              <RevealItem key={title} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg sm:flex-col sm:items-start">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', tone)}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      </div>
    </section>
  );
}

// ─── Hỏi đáp ─────────────────────────────────────────────────────────────────────

const FAQ: [string, string][] = [
  [
    'Học trên Aolumi có mất phí không?',
    'Tạo tài khoản và làm bài đánh giá kỹ năng không mất phí. Mỗi khoá có giá riêng, nhiều khoá miễn phí. Khoá có phí thanh toán bằng thẻ qua giỏ hàng.',
  ],
  [
    'Bài đánh giá kỹ năng hoạt động thế nào?',
    'Bạn chọn một topic và trả lời 12 câu trong 15 phút. Câu hỏi đổi độ khó theo câu trả lời của bạn, điểm tính bằng Elo. Kết quả là mức thành thạo topic đó trong hồ sơ kỹ năng.',
  ],
  [
    'Điểm quiz và bài code trong khoá có tính vào hồ sơ kỹ năng không?',
    'Không. Chúng được chấm để bạn biết từng bài đúng hay sai. Mức thành thạo chỉ đến từ bài đánh giá kỹ năng, để mọi người được đo bằng cùng một thước.',
  ],
  [
    'Chứng chỉ được cấp khi nào?',
    'Khi bạn hoàn thành mọi bài trong khoá. Chứng chỉ là file PDF có mã QR, ai quét mã cũng mở được trang xác thực.',
  ],
  [
    'Ai cũng dạy được trên Aolumi?',
    'Đúng vậy. Bấm "Trở thành giảng viên" là tạo được khoá miễn phí. Muốn bán khoá có phí, bạn cần hồ sơ chuyên môn được duyệt và tài khoản ngân hàng nhận doanh thu.',
  ],
  [
    'Khoá học được kiểm duyệt ra sao?',
    'Mọi khoá, kể cả khoá miễn phí, được moderator chuyên về lĩnh vực đó duyệt trước khi lên catalog. Bị từ chối thì giảng viên nhận lý do cụ thể để sửa và gửi lại.',
  ],
];

export function FaqSection() {
  return (
    <section aria-labelledby="guest-faq" className="border-t bg-muted">
      <div className={cn(inner, 'grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16')}>
        <div>
          <Reveal>
            <h2 id="guest-faq" className={h2}>Câu hỏi thường gặp</h2>
            <p className={lead}>Những điều người học và giảng viên hay hỏi trước khi bắt đầu.</p>
          </Reveal>
          <Reveal delay={0.15} className="mt-8 hidden max-w-md lg:block">
            <AskScene />
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <Accordion className="rounded-2xl border bg-card px-6 shadow-xs">
            {FAQ.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">{q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-base/relaxed text-secondary-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CTA cuối trang ──────────────────────────────────────────────────────────────
// Nền trắng + panel xanh sương: tách khỏi khối hỏi đáp (nền sương) phía trên và footer tối phía dưới.
// Mascot cùng hai "kết quả" lơ lửng khép lại câu chuyện của trang: chấm bài → gợi ý có lý do.

const START_STEPS: [string, string, string, LucideIcon][] = [
  ['Tạo tài khoản', 'Miễn phí, chưa cần chọn khoá.', '1 phút', UserPlus],
  ['Làm bài đánh giá kỹ năng', '12 câu, chấm mức thành thạo theo từng topic.', '15 phút', ClipboardCheck],
  ['Nhận gợi ý khoá học', 'Kèm lý do, dựa trên topic bạn còn yếu.', 'Ngay sau bài', Sparkles],
];

export function SignupSection() {
  return (
    <section aria-labelledby="guest-signup" className="bg-background">
      <div className="mx-auto w-full max-w-screen-xl px-4 py-20 lg:py-24">
        <Reveal className="grid items-center gap-10 overflow-hidden rounded-2xl border border-primary/15 bg-primary-soft px-6 py-12 sm:px-12 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div className="flex flex-col items-start gap-5">
            <h2 id="guest-signup" className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Bắt đầu học theo năng lực của bạn
            </h2>
            <p className="max-w-lg text-lg/relaxed text-secondary-foreground">
              Khoảng 20 phút từ lúc đăng ký đến khi bạn có hồ sơ kỹ năng và gợi ý khoá học đầu tiên.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/register" className={buttonVariants({ size: 'lg' })}>
                Bắt đầu miễn phí
              </Link>
              <Link href="/courses" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
                Khám phá khoá học <ArrowRight data-icon="inline-end" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
            <p className="text-sm font-semibold text-muted-foreground">3 bước để bắt đầu</p>
            <RevealList ordered className="mt-5 flex flex-col">
              {START_STEPS.map(([title, desc, time, Icon], i) => (
                <RevealItem key={title} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Đường nối giữa các bước, bỏ ở bước cuối */}
                  {i < START_STEPS.length - 1 && <span className="absolute top-10 bottom-1 left-5 w-px bg-border" aria-hidden />}
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealList>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
