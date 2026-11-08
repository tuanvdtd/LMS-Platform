import Link from 'next/link';
import { MASTERY_COLOR, MASTERY_LABEL, layoutSkillGraph, masteryLevel } from '@/lib/skills';
import type { SkillsOverview } from '@/types/skills';

const W = 136, H = 60, GX = 56, GY = 16;

export function SkillGraph({ topics, edges }: Pick<SkillsOverview, 'topics' | 'edges'>) {
  const sorted = [...topics].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const pos = new Map(layoutSkillGraph(sorted.map((t) => t.id), edges).map((p) => [p.id, p]));
  const layers = Math.max(...[...pos.values()].map((p) => p.layer)) + 1;
  const rows = Math.max(...[...pos.values()].map((p) => p.row)) + 1;
  const width = layers * (W + GX) - GX;
  const height = rows * (H + GY) - GY;
  const at = (id: string) => ({ x: pos.get(id)!.layer * (W + GX), y: pos.get(id)!.row * (H + GY) });

  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="graph-title">
      <h2 id="graph-title" className="mb-4 font-bold text-foreground">Sơ đồ lộ trình kỹ năng</h2>
      <div className="overflow-x-auto p-1">
        <div className="relative" style={{ width, height, minWidth: width }}>
          <svg width={width} height={height} className="absolute inset-0" aria-hidden>
            {edges.filter((e) => pos.has(e.topicId) && pos.has(e.requiresId)).map((e) => {
              const a = at(e.requiresId), b = at(e.topicId);
              const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2, mx = (x1 + x2) / 2;
              return (
                <path key={`${e.requiresId}-${e.topicId}`} d={`M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                  fill="none" stroke="var(--border)" strokeWidth={2} />
              );
            })}
          </svg>
          {sorted.map((t) => {
            const { x, y } = at(t.id);
            const level = t.pct === null ? null : masteryLevel(t.pct);
            const status = level ? `${t.pct}% ${MASTERY_LABEL[level]}` : 'Chưa đo';
            return (
              <Link
                key={t.id}
                href={`/skills/${t.slug}`}
                aria-label={`${t.name} — ${status}`}
                className="absolute flex flex-col justify-center rounded-xl border-2 bg-card px-3 outline-none transition-colors hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50"
                style={{ left: x, top: y, width: W, height: H, borderColor: level ? MASTERY_COLOR[level] : 'var(--border)' }}
              >
                <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">{t.name}</span>
                <span className={level ? 'font-mono text-xs font-bold text-foreground' : 'text-xs text-muted-foreground'}>
                  {level ? `${t.pct}%` : 'Chưa đo'}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {([['strong', 'Vững (≥ 70%)'], ['mid', 'Trung bình (40–69%)'], ['weak', 'Yếu (< 40%)']] as const).map(([k, label]) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: MASTERY_COLOR[k] }} aria-hidden />{label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-border" aria-hidden />Chưa đo
        </li>
      </ul>
    </section>
  );
}
