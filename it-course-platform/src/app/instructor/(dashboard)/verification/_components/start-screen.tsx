import { ArrowRight, Camera, Check, Clock, IdCard, Landmark, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApplicationView } from '@/types/instructor-application';
import { formatVnd, PAYOUT_MIN_VND } from '@/types/revenue';
import { StepFooter } from './step-footer';

const PREPARE = [
  { icon: IdCard, text: 'Căn cước hoặc hộ chiếu còn hạn' },
  { icon: Camera, text: 'Điện thoại hoặc máy tính có camera để chụp giấy tờ và khuôn mặt' },
  { icon: Landmark, text: 'Một tài khoản ngân hàng để nhận doanh thu, nên đứng tên bạn' },
  { icon: PenLine, text: 'Đoạn giới thiệu bản thân từ 50 từ: bạn đã làm gì, giỏi mảng nào' },
];

// Màn mở đầu khi chưa có đơn: nói trước cần gì và được gì, để không ai bỏ ngang giữa chừng vì bất ngờ.
export function StartScreen({ view, onStart }: { view: ApplicationView; onStart: () => void }) {
  const gets = [
    'Đặt giá trả phí cho khoá học của bạn',
    `Chi trả hằng tháng khi đủ ${formatVnd(PAYOUT_MIN_VND)}, chưa đủ thì cộng dồn`,
    'Khoá miễn phí vẫn xuất bản như cũ trong lúc chờ duyệt',
  ];
  return (
    <section aria-labelledby="start-title" className="rounded-2xl border bg-card">
      <div className="grid gap-x-12 gap-y-10 p-6 sm:p-8 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <h2 id="start-title" className="text-xl font-bold text-balance">
            Bạn nhận được
          </h2>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-5xl font-extrabold tracking-tight text-primary tabular-nums">{view.revenueSharePct}%</span>
            <span className="text-sm text-foreground/85">doanh thu mỗi lượt bán khoá của bạn</span>
          </p>
          <ul className="flex flex-col gap-2.5">
            {gets.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-foreground/85">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-balance">Cần chuẩn bị</h2>
          <ul className="flex flex-col gap-3.5">
            {PREPARE.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-sm text-foreground/85">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <p.icon className="size-4" aria-hidden />
                </span>
                <span className="pt-1.5">{p.text}</span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 shrink-0" aria-hidden />
            Khoảng 10 phút. Aolumi duyệt trong khoảng 2 ngày làm việc.
          </p>
        </div>
      </div>
      <StepFooter>
        <Button onClick={onStart}>
          Bắt đầu
          <ArrowRight data-icon="inline-end" />
        </Button>
      </StepFooter>
    </section>
  );
}
