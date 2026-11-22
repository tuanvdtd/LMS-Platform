import { VERDICT_META } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { Verdict, Verdicts } from '@/types/analytics';

const FILL: Record<Verdict, string> = {
  accepted: 'bg-success',
  wrong_answer: 'bg-danger',
  time_limit_exceeded: 'bg-warning',
  runtime_error: 'bg-tertiary',
  compile_error: 'bg-tertiary/60',
};

// Thanh chồng tỉ lệ kết quả bài nộp; aria-label đọc đủ số liệu, legend có chữ để không phụ thuộc màu.
export function VerdictBar({ verdicts, legend = false }: { verdicts: Verdicts; legend?: boolean }) {
  const shown = (Object.keys(VERDICT_META) as Verdict[]).filter((v) => verdicts[v] > 0);
  const total = shown.reduce((s, v) => s + verdicts[v], 0);
  if (!total) return <span className="text-sm text-muted-foreground">Chưa có bài nộp</span>;
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-2.5 w-full min-w-32 overflow-hidden rounded-full bg-secondary"
        role="img"
        aria-label={shown.map((v) => `${VERDICT_META[v].label} ${verdicts[v]}`).join(', ')}
      >
        {shown.map((v) => (
          <div key={v} className={FILL[v]} style={{ width: `${(100 * verdicts[v]) / total}%` }} />
        ))}
      </div>
      {legend && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {shown.map((v) => (
            <li key={v} className="flex items-center gap-1.5">
              <span className={cn('size-2.5 rounded-full', FILL[v])} aria-hidden />
              {VERDICT_META[v].label}
              <span className="font-mono text-foreground">{verdicts[v]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
