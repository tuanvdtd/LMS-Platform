// PRNG có seed: chạy seed bao nhiêu lần cũng ra cùng một bộ dữ liệu.
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DAY = 86_400_000;
export const HOUR = 3_600_000;

export const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
export const chance = (rng: Rng, p: number) => rng() < p;
export const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];

export function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = rng() * total;
  for (const [v, w] of items) if ((x -= w) < 0) return v;
  return items[items.length - 1][0];
}

export const daysAgo = (now: Date, d: number) => new Date(now.getTime() - d * DAY);
export const addMs = (d: Date, ms: number) => new Date(d.getTime() + ms);
export const maxDate = (...ds: Date[]) => new Date(Math.max(...ds.map((d) => d.getTime())));
export const minDate = (...ds: Date[]) => new Date(Math.min(...ds.map((d) => d.getTime())));
export const between = (rng: Rng, a: Date, b: Date) => new Date(a.getTime() + rng() * (b.getTime() - a.getTime()));

const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const slugSuffix = (rng: Rng) => Array.from({ length: 6 }, () => pick(rng, [...SLUG_ALPHABET])).join('');
