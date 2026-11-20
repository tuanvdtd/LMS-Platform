'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, LoaderCircle } from 'lucide-react';
import { MotionConfig, motion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Đến nhanh rồi chậm dần (expo out): cảm giác "đặt xuống" chứ không nảy.
const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: '0px 0px -10% 0px' } as const;

// Người dùng bật "giảm chuyển động" thì Motion bỏ dịch chuyển, chỉ giữ đổi độ mờ.
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Một khối hiện dần khi cuộn tới, một lần. delay để so le tiêu đề → nội dung → hình trong cùng section.
export function Reveal({ children, delay = 0, y = 24, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const listV: Variants = { hidden: {}, shown: { transition: { staggerChildren: 0.09 } } };
const itemV: Variants = { hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

// Danh sách hiện lần lượt từng mục (so le 90ms).
export function RevealList({ children, ordered = false, className }: { children: ReactNode; ordered?: boolean; className?: string }) {
  const List = ordered ? motion.ol : motion.ul;
  return (
    <List className={className} variants={listV} initial="hidden" whileInView="shown" viewport={VIEWPORT}>
      {children}
    </List>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.li className={className} variants={itemV}>
      {children}
    </motion.li>
  );
}

// Thanh năng lực chạy từ 0 lên mức thật khi trang vừa tải (khoảnh khắc chính của hero).
export function GrowBar({ pct, delay, className }: { pct: number; delay: number; className?: string }) {
  return (
    <motion.div
      className={cn('h-full origin-left rounded-full', className)}
      style={{ width: `${pct}%` }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    />
  );
}

// Nhún nhẹ lên xuống, dùng cho mascot. Giảm chuyển động thì đứng yên.
export function Bob({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.2, ease: 'easeInOut', repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

const TESTS = [3, 2, 4, 3, 5, 9, 6, 10]; // ms mỗi test, cộng lại ra thời gian chạy hiển thị
const TOTAL_MS = TESTS.reduce((a, b) => a + b, 0);

// Ví dụ máy chấm: khi khung lọt vào màn hình, các test lần lượt chuyển từ "đang chấm" sang đạt, rồi hiện verdict.
// Mặc định (chưa có JS, giảm chuyển động) hiện sẵn kết quả cuối.
export function VerdictDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [passed, setPassed] = useState(TESTS.length);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let timer: number | undefined;
    // Quan sát sớm 300px để đặt lại về 0 trước khi người xem thấy, rồi chạy khi khung đã vào hẳn màn hình.
    const arm = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setPassed(0);
        arm.disconnect();
      },
      { rootMargin: '0px 0px 300px 0px' },
    );
    const run = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        run.disconnect();
        let n = 0;
        timer = window.setInterval(() => {
          n += 1;
          setPassed(n);
          if (n >= TESTS.length) window.clearInterval(timer);
        }, 260);
      },
      { threshold: 0.6 },
    );
    arm.observe(el);
    run.observe(el);
    return () => {
      arm.disconnect();
      run.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const done = passed >= TESTS.length;
  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-ink-border bg-ink text-ink-foreground shadow-lg">
      <div className="flex items-center justify-between border-b border-ink-border px-4 py-2.5 text-xs text-ink-muted">
        <span className="font-mono">softmax.py</span>
        <span>Python 3</span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-6">
        <code>
          <span className="text-ink-keyword">def</span> <span className="text-ink-title">softmax</span>(xs):{'\n'}
          {'    '}m = <span className="text-ink-builtin">max</span>(xs){'\n'}
          {'    '}e = [exp(x - m) <span className="text-ink-keyword">for</span> x <span className="text-ink-keyword">in</span> xs]{'\n'}
          {'    '}<span className="text-ink-keyword">return</span> [v / <span className="text-ink-builtin">sum</span>(e) <span className="text-ink-keyword">for</span> v <span className="text-ink-keyword">in</span> e]
        </code>
      </pre>
      <ol className="grid grid-cols-4 gap-1.5 border-t border-ink-border px-4 py-3" aria-label="Kết quả từng test">
        {TESTS.map((ms, i) => {
          const ok = i < passed;
          return (
            <li
              key={i}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] transition-colors duration-300',
                ok ? 'bg-ink-success/15 text-ink-success' : 'bg-ink-hover text-ink-muted',
              )}
            >
              {ok ? <CircleCheck className="size-3" aria-hidden /> : <LoaderCircle className="size-3 animate-spin motion-reduce:animate-none" aria-hidden />}
              <span className="sr-only">{ok ? 'Đạt' : 'Đang chấm'}</span>
              {i + 1}
              {ok && <span className="ml-auto opacity-70">{ms}ms</span>}
            </li>
          );
        })}
      </ol>
      <p className="flex items-center gap-2 border-t border-ink-border px-4 py-3 text-sm font-semibold" aria-live="polite">
        {done ? (
          <>
            <CircleCheck className="size-4 text-ink-success" aria-hidden />
            <span className="text-ink-success">Accepted</span>
            <span className="font-mono font-normal text-ink-muted">· {TESTS.length}/{TESTS.length} test · {TOTAL_MS} ms</span>
          </>
        ) : (
          <>
            <LoaderCircle className="size-4 animate-spin text-ink-muted motion-reduce:animate-none" aria-hidden />
            <span className="text-ink-muted">Đang chấm…</span>
            <span className="font-mono font-normal text-ink-muted">{passed}/{TESTS.length} test</span>
          </>
        )}
      </p>
    </div>
  );
}
