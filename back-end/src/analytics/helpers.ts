// Làm tròn số trả cho FE + gom nhóm (target ES2023 chưa có Map.groupBy).
export const r1 = (x: number | null) => (x === null ? null : Math.round(x * 10) / 10);
export const r3 = (x: number | null) => (x === null ? null : Math.round(x * 1000) / 1000);

export function groupBy<T, K>(xs: readonly T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of xs) {
    const k = key(x);
    const list = m.get(k);
    if (list) list.push(x);
    else m.set(k, [x]);
  }
  return m;
}
