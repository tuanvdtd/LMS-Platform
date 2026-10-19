import type { Metadata } from 'next';
import Image from 'next/image';
import { Check, ChevronDown, CodeXml, ListChecks, MessageCircle, Play } from 'lucide-react';
import { SiteFooter } from '@/components/layout/site-footer';
import { getCategoryTree } from '@/lib/api/categories';
import { TeachCta } from './_components/teach-cta';

export const metadata: Metadata = { title: 'Trở thành giảng viên | SkillPath' };

// Landing tuyển giảng viên (spec teach-landing §4, wireframe A). Số khối theo wireframe.
// Số thật: 70% = mặc định revenue_share_pct; ví dụ chia lấy từ spec revenue-share.
const FACTS = [
  { label: 'Doanh thu', value: '70%' },
  { label: 'Phí bắt đầu', value: '0đ' },
  { label: 'Duyệt khoá', value: '3–5 ngày' },
];

const LESSON_KINDS = [
  { icon: Play, title: 'Video bài giảng', desc: 'Tải lên, hệ thống tự xử lý chất lượng phát. Học viên xem tiếp từ chỗ dừng.' },
  { icon: ListChecks, title: 'Quiz tự chấm', desc: 'Bạn soạn câu hỏi một lần, điểm và giải thích hiện ngay sau khi nộp.' },
  { icon: CodeXml, title: 'Bài tập code chấm tự động', desc: 'Viết test case, bài nộp được chạy và chấm Accepted / Wrong Answer — bạn không phải chấm tay.' },
];

const SAMPLE_LESSONS = [
  { icon: Play, title: '1.1 Cài đặt môi trường', meta: '08:24' },
  { icon: ListChecks, title: '1.2 Kiểm tra: module và require', meta: '10 câu' },
  { icon: CodeXml, title: '1.3 Viết hàm đọc file JSON', meta: '5 test' },
];

const SPLITS = [
  { label: 'Khoá 500.000đ', note: 'học viên trả đủ giá', you: '350.000đ', platform: '150.000đ' },
  { label: 'Cùng khoá, dùng mã giảm còn 200.000đ', note: null, you: '140.000đ', platform: '60.000đ' },
];

const STEPS = [
  { title: 'Bật vai trò giảng viên', desc: 'Một cú bấm ở trang này. Không cần nộp hồ sơ trước.' },
  { title: 'Soạn khoá và gửi duyệt', desc: 'Đội kiểm duyệt phản hồi trong 3–5 ngày làm việc.' },
  { title: 'Xác minh khi bán có phí', desc: 'Khoá miễn phí xuất bản ngay sau khi duyệt, không cần xác minh.' },
];

const FAQ = [
  { q: 'Dạy trên SkillPath có mất phí không?', a: 'Không. Bật vai trò, soạn khoá và xuất bản khoá miễn phí đều không mất phí.' },
  { q: 'Khi nào tôi phải xác minh danh tính?', a: 'Khi đặt giá cho khoá. Khoá miễn phí không cần.' },
  { q: 'Doanh thu được chia thế nào?', a: 'Bạn nhận 70% số tiền học viên thực trả cho mỗi đơn.' },
  { q: 'Duyệt khoá mất bao lâu?', a: '3–5 ngày làm việc. Bị từ chối thì có ghi lý do để bạn sửa và gửi lại.' },
];

const NEEDS = [
  { title: 'Một chủ đề bạn đã làm thực tế', desc: 'Thứ bạn biết người mới hay vấp ở đâu.' },
  { title: 'Chương đầu tiên', desc: 'Các chương sau soạn dần, lưu nháp lúc nào cũng được.' },
  { title: 'Không cần hồ sơ trước', desc: 'Xác minh danh tính chỉ khi bạn đặt giá cho khoá.' },
];

export default async function TeachPage() {
  const categories = await getCategoryTree();
  return (
    <>
      {/* 2 · Hero */}
      <section className="border-b">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="text-sm font-semibold text-primary">Dạy học trên SkillPath</p>
            <h1 className="text-4xl leading-tight font-extrabold text-balance md:text-5xl">
              Bạn đã viết code nhiều năm.<br className="max-sm:hidden" /> Giờ dạy lại điều đó.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Soạn khoá với video, quiz tự chấm và bài tập code có chấm tự động. Bắt đầu miễn phí — chỉ cần xác minh danh
              tính khi bạn bán khoá có phí.
            </p>
            <TeachCta />
            <dl className="mt-4 grid max-w-xl grid-cols-3 divide-x border-t pt-5">
              {FACTS.map(({ label, value }, i) => (
                <div key={label} className={i === 0 ? 'pr-4' : i === FACTS.length - 1 ? 'pl-4' : 'px-4'}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-bold whitespace-nowrap tabular-nums sm:text-2xl">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="relative">
            <Image
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000&q=80&auto=format&fit=crop"
              alt="Giảng viên hướng dẫn học viên viết code"
              width={1000}
              height={750}
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
            {/* TODO: dữ liệu mẫu */}
            <figcaption className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
              <MessageCircle className="size-4 text-primary" aria-hidden />
              <span><b>3 câu hỏi mới</b> trong Q&amp;A khoá Node.js</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 3 · Một khoá, đủ ba kiểu bài */}
      <section className="bg-muted">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex min-w-0 flex-col gap-6">
            <h2 className="text-3xl font-extrabold text-balance">Một khoá, đủ ba kiểu bài</h2>
            <ul className="grid gap-5">
              {LESSON_KINDS.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-pretty text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 rounded-xl border bg-card p-4 shadow-sm" role="img" aria-label="Ảnh màn soạn chương trình học">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold">Chương 1 · Nhập môn Node.js</p>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">3 bài</span>
            </div>
            <ul className="grid gap-2 text-sm">
              {SAMPLE_LESSONS.map(({ icon: Icon, title, meta }) => (
                <li key={title} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{title}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{meta}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-lg bg-foreground p-3 font-mono text-xs text-white/80 dark:bg-background">
              <p><span className="text-[var(--skill-strong)]">✓ Accepted</span> · 5/5 test · 42 ms</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 · Tiền về thế nào */}
      <section>
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-10 px-4 py-16 lg:grid-cols-[1fr_1.15fr]">
          <div className="flex min-w-0 flex-col gap-3">
            <h2 className="text-3xl font-extrabold text-balance">Bạn nhận 70% mỗi đơn</h2>
            <p className="text-pretty text-muted-foreground">
              Tính trên số tiền học viên thực trả, sau mã giảm giá. Tỷ lệ áp chung cho mọi giảng viên, không có hạng mức ẩn.
            </p>
          </div>
          <div className="grid min-w-0 gap-6">
            {SPLITS.map(({ label, note, you, platform }) => (
              <div key={label}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span>{label}</span>
                  {note && <span className="text-muted-foreground">{note}</span>}
                </div>
                <div className="flex h-10 overflow-hidden rounded-lg text-sm font-semibold">
                  <div className="flex w-[70%] items-center bg-primary px-3 text-primary-foreground">{`Bạn · ${you}`}</div>
                  <div className="flex flex-1 items-center bg-secondary px-3 text-secondary-foreground">{platform}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 · Ba bước */}
      <section className="border-y bg-muted">
        <div className="mx-auto max-w-screen-xl px-4 py-16">
          <h2 className="mb-10 text-3xl font-extrabold text-balance">Từ hôm nay đến khoá đầu tiên</h2>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map(({ title, desc }, i) => (
              <li key={title} className={`flex flex-col gap-2 border-t-2 pt-4 ${i === 0 ? 'border-foreground' : 'border-border'}`}>
                <span className="text-sm font-semibold text-muted-foreground">{`Bước ${i + 1}`}</span>
                <p className="text-lg font-bold">{title}</p>
                <p className="text-sm text-pretty text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 · Một giảng viên kể — TODO: dữ liệu mẫu, thay bằng giảng viên thật */}
      <section>
        <figure className="mx-auto grid max-w-screen-lg grid-cols-1 items-center gap-8 px-4 py-16 md:grid-cols-[auto_1fr]">
          <Image
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt=""
            width={160}
            height={160}
            className="size-28 rounded-2xl object-cover md:size-40"
          />
          <div className="flex min-w-0 flex-col gap-4">
            <blockquote className="text-2xl leading-snug font-semibold text-pretty">
              “Phần bài code chấm tự động là lý do tôi chọn dạy ở đây. Tôi soạn test một lần, 2.800 học viên nộp bài mà tôi
              không phải chấm bài nào.”
            </blockquote>
            <figcaption className="text-sm">
              <b>Lê Thị Minh</b> <span className="text-muted-foreground">· Data Engineer · khoá “SQL cho người làm dữ liệu”</span>
            </figcaption>
          </div>
        </figure>
      </section>

      {/* 7 · Câu hỏi thường gặp */}
      <section className="border-t">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 gap-8 px-4 py-16 lg:grid-cols-[1fr_1.6fr]">
          <h2 className="text-3xl font-extrabold text-balance">Câu hỏi thường gặp</h2>
          <div className="divide-y border-y">
            {FAQ.map(({ q, a }, i) => (
              <details key={q} open={i === 0} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="pb-4 text-sm text-pretty text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8 · CTA cuối */}
      <section className="border-t bg-muted">
        <div className="mx-auto grid max-w-screen-xl grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-[1fr_1fr]">
          <div className="flex min-w-0 flex-col gap-5">
            <h2 className="max-w-lg text-3xl font-extrabold text-balance">Khoá học đầu tiên bắt đầu từ một chương.</h2>
            <TeachCta />
          </div>
          <div className="min-w-0">
            <p className="mb-4 text-sm font-semibold text-muted-foreground">Để bắt đầu, bạn chỉ cần</p>
            <ul className="grid gap-4">
              {NEEDS.map(({ title, desc }) => (
                <li key={title} className="flex gap-3">
                  <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <b>{title}</b>
                    <br />
                    <span className="text-sm text-muted-foreground">{desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <SiteFooter categories={categories} />
    </>
  );
}
