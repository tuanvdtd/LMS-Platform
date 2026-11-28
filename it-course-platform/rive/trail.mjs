// Onboarding: Lumi đeo ba lô đi trên đường mòn qua 3 mốc (nghề, kỹ năng, trình độ) tới cờ đích.
// Input: step 0–3 đi bộ tới mốc (3 là đích), 10+n đứng thẳng ở mốc n; at 0–3 cho biển mốc;
// patches/patchesNow 0–6 và level/levelNow 0–3 theo cùng quy ước; pick (trigger); still 0/1 (giảm chuyển động: tắt các vòng lặp nền).
import { lumi, tr, path, a, lin, rad, stroke } from './scenes.mjs';
import { star, anim, msOf } from './moments.mjs';

const WARM = '#fde68a';
const TALL = {
  name: 'Trail', W: 420, H: 820, S: 0.4, k: 1, up: true, look: [3, 1], stride: 40,
  pts: [[176, 900], [124, 662], [188, 476], [124, 304], [170, 176]],
  road: 52, dash: [10, 16, 3], post: [-88, 0], plateY: -88, plateK: 0.86, postH: 70, pole: [54, 2],
  stars: [[40, 40], [92, 22], [300, 30], [372, 64], [130, 96], [36, 230], [394, 236], [330, 290], [62, 380]],
  bushes: [[18, 766, 0.95], [262, 796, 0.8], [16, 404, 0.7]],
  rocks: [[214, 622, 1], [76, 436, 0.8], [98, 236, 0.7], [96, 724, 0.6]],
  flies: [[70, 600], [250, 540], [180, 380], [60, 290], [290, 760], [300, 140]],
};
const WIDE = {
  name: 'TrailWide', W: 400, H: 120, S: 0.19, k: 0.52, up: false, look: [0, 3], stride: 19,
  pts: [[-60, 102], [54, 96], [158, 101], [260, 93], [330, 86]],
  road: 26, dash: [6, 9, 2], post: [32, 0], plateY: -129, plateK: 1, postH: 110, pole: [30, 1],
  stars: [[20, 14], [118, 22], [226, 12], [304, 30], [388, 16], [150, 46]],
  bushes: [[18, 104, 0.45], [124, 110, 0.4], [236, 112, 0.42]],
  rocks: [[106, 92, 0.4], [220, 90, 0.35], [318, 104, 0.35]],
  flies: [[40, 60], [200, 54], [260, 40]],
};
const PATCH = [[-96, -220, '#2563eb', 6], [-110, -164, '#16a34a', -8], [-14, -250, '#7c3aed', 10], [-110, -120, '#0891b2', -4], [-50, -212, '#e11d48', -10], [-128, -78, '#ca8a04', 6]];
const BARS = [[-9, 9], [0, 14], [9, 19]];
const FLAG_UP = -94, FLAG_DOWN = -24;
const f1 = (n) => Math.round(n * 10) / 10;
const pt = (q) => `${f1(q[0])} ${f1(q[1])}`;
const ease = (u) => 0.5 - Math.cos(Math.PI * u) / 2;

function spline(P) {
  return P.slice(0, -1).map((p1, i) => {
    const p0 = P[Math.max(0, i - 1)], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    return [p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2];
  });
}
const bez = (s, t) => [0, 1].map((i) => (1 - t) ** 3 * s[0][i] + 3 * (1 - t) ** 2 * t * s[1][i] + 3 * (1 - t) * t ** 2 * s[2][i] + t ** 3 * s[3][i]);
function table(segs, n = 240) {
  const pts = [bez(segs[0], 0)], len = [0];
  for (const s of segs) for (let i = 1; i <= n; i++) {
    const q = bez(s, i / n), l = pts.at(-1);
    len.push(len.at(-1) + Math.hypot(q[0] - l[0], q[1] - l[1]));
    pts.push(q);
  }
  const at = (d) => {
    const i = len.findIndex((v) => v >= d);
    if (i < 0) return pts.at(-1);
    if (i === 0) return pts[0];
    const t = (d - len[i - 1]) / (len[i] - len[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
  };
  return { L: len.at(-1), at };
}
function smooth(q) {
  let d = `M${pt(q[0])}`;
  for (let i = 1; i < q.length - 1; i++) d += ` Q${pt(q[i])} ${pt([(q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2])}`;
  return `${d} L${pt(q.at(-1))}`;
}

// still = 1: vòng lặp nền đứng ở khung đầu để giảm chuyển động không dừng giữa nhịp thở/chớp mắt
const stillable = (name) => ({ name, states: [{ name, animation: name }, { name: `${name}Still`, animation: `${name}0` }], transitions: [
  { from: 'entry', to: name },
  { from: name, to: `${name}Still`, condition: { input: 'still', op: '==', value: 1 } },
  { from: `${name}Still`, to: name, condition: { input: 'still', op: '==', value: 0 } },
] });
const one = (name, tracks) => ({ name, fps: 60, duration: 1, loop: 'oneShot', tracks });

function trail(c) {
  const p = 'L_', { k, S } = c;
  const segs = spline(c.pts);
  const M = c.pts.slice(1);
  const F = M[3];
  const POLE = [F[0] + c.pole[0], F[1] + c.pole[1]];
  const L = lumi(p, undefined, M[0][0], M[0][1], S);
  const SP = [[POLE[0] + 30 * k, POLE[1] - 120 * k, WARM, 22 * k], [POLE[0] - 40 * k, POLE[1] - 150 * k, '#f97316', 16 * k],
    [POLE[0] + 58 * k, POLE[1] - 70 * k, '#93c5fd', 14 * k], [POLE[0] + 84 * k, POLE[1] - 30 * k, WARM, 13 * k]];

  const road = smooth(segs.flatMap((s) => Array.from({ length: 16 }, (_, i) => bez(s, i / 16))).concat([F]));
  const all = table(segs);
  const [dl, dg, dw] = c.dash;
  const dashes = [];
  for (let d = 0; d + dl < all.L; d += dl + dg) dashes.push(`M${pt(all.at(d))} L${pt(all.at(d + dl))}`);
  const segD = (s) => smooth(Array.from({ length: 17 }, (_, i) => bez(s, i / 16)));
  const litW = c.road * 0.1;
  const litPaths = (id, d, on) => [
    path(`${id}G`, undefined, d, stroke(a('#60a5fa', 0.22), litW * 3.2, on ? {} : { trim: { start: 0, end: 0 } })),
    path(id, undefined, d, stroke(a('#93c5fd', 0.85), litW, on ? {} : { trim: { start: 0, end: 0 } })),
  ];

  const groups = [
    { id: 'dawnG', x: POLE[0] - 10 * k, y: POLE[1] - 40 * k },
    { id: 'dawnS', parent: 'dawnG', x: 0, y: 0, scaleY: 0.72 },
    ...c.stars.map(([x, y], i) => ({ id: `st${i}`, x, y })),
    ...c.bushes.map(([x, y, s], i) => ({ id: `bu${i}`, x, y, scaleX: s, scaleY: s })),
    ...M.slice(0, 3).flatMap(([x, y], i) => [{ id: `hg${i}`, x, y }, { id: `hgS${i}`, parent: `hg${i}`, x: 0, y: 2 * k, scaleY: 0.27 }]),
    ...M.slice(0, 3).flatMap(([x, y], i) => [
      { id: `mk${i}`, x: x + c.post[0], y: y + c.post[1], scaleX: k, scaleY: k },
      { id: `pl${i}`, parent: `mk${i}`, x: 0, y: c.plateY, scaleX: c.plateK, scaleY: c.plateK },
      { id: `pg${i}`, parent: `pl${i}`, x: 0, y: 0 },
      { id: `pgS${i}`, parent: `pg${i}`, x: 0, y: 0, scaleY: 0.78 },
      { id: `ic${i}`, parent: `pl${i}`, x: 0, y: 0, opacity: 0.45 },
      { id: `ck${i}`, parent: `pl${i}`, x: 25, y: -18, scaleX: 0, scaleY: 0 },
    ]),
    ...BARS.map(([x], b) => ({ id: `lbOn${b}`, parent: 'ic2', x, y: 10, scaleY: 0 })),
    { id: 'poleG', x: POLE[0], y: POLE[1], scaleX: k, scaleY: k },
    { id: 'flag', parent: 'poleG', x: 2, y: FLAG_DOWN, scaleX: 0.3 },
    { id: 'flagWave', parent: 'flag', x: 0, y: 0 },
    { id: 'burst', x: POLE[0], y: POLE[1] - 70 * k, opacity: 0, scaleX: 0.6, scaleY: 0.6 },
    { id: 'burstSc', parent: 'burst', x: 0, y: 0, scaleY: 0.83 },
    ...c.flies.map(([x, y], i) => ({ id: `fl${i}`, x, y })),
    ...L.groups,
    ...PATCH.flatMap(([x, y, , r], i) => [
      { id: `pt${i}`, parent: p + 'breathe', x, y, rotation: r, scaleX: 0, scaleY: 0 },
      { id: `ptG${i}`, parent: `pt${i}`, x: 0, y: 0, scaleX: 1.45, scaleY: 1.45 },
    ]),
  ];

  const wood = (w, h) => lin([['#b07a48', 0], ['#7c4d26', 1]], { x: -w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 });
  const icons = [
    [{ id: 'ic0a', type: 'rect', parent: 'ic0', x: 0, y: 3, width: 24, height: 16, cornerRadius: 3.5, stroke: { color: '#ffffff', thickness: 2.4 } },
      path('ic0b', 'ic0', ['M-5 -5 L-5 -8.5 L5 -8.5 L5 -5', 'M-12 2 L12 2'], stroke('#ffffff', 2.4))],
    [path('ic1a', 'ic1', ['M-7 -7 L-13 0 L-7 7', 'M7 -7 L13 0 L7 7', 'M2.5 -9 L-2.5 9'], stroke('#ffffff', 2.6))],
    BARS.map(([x, h], b) => ({ id: `lbOff${b}`, type: 'rect', parent: 'ic2', x, y: 10 - h / 2, width: 5.5, height: h, cornerRadius: 2, fill: { color: a('#ffffff', 0.38) } })),
  ];
  const plates = M.slice(0, 3).flatMap((_, i) => [
    { id: `hl${i}`, type: 'ellipse', parent: `hgS${i}`, x: 0, y: 0, width: 200 * S, height: 200 * S, opacity: 0, fill: rad([[a('#3b82f6', 0.55), 0], [a('#3b82f6', 0), 1]], { x: 0, y: 0 }, { x: 100 * S, y: 0 }) },
    { id: `ps${i}`, type: 'ellipse', parent: `mk${i}`, x: 0, y: 2, width: 26, height: 7, fill: { color: a('#000000', 0.3) } },
    { id: `post${i}`, type: 'rect', parent: `mk${i}`, x: 0, y: -c.postH / 2, width: 7, height: c.postH, cornerRadius: 2, fill: wood(7, c.postH) },
    { id: `plGlow${i}`, type: 'ellipse', parent: `pgS${i}`, x: 0, y: 0, width: 88, height: 88, opacity: 0, fill: rad([[a('#60a5fa', 0.5), 0], [a('#60a5fa', 0), 1]], { x: 0, y: 0 }, { x: 44, y: 0 }) },
    { id: `plFut${i}`, type: 'rect', parent: `pl${i}`, x: 0, y: 0, width: 58, height: 42, cornerRadius: 11, fill: { color: '#1e293b' }, stroke: { color: '#3b4a61', thickness: 2.5 } },
    { id: `plCur${i}`, type: 'rect', parent: `pl${i}`, x: 0, y: 0, width: 58, height: 42, cornerRadius: 11, opacity: 0, fill: lin([['#3b82f6', 0], ['#1d4ed8', 1]], { x: 0, y: -21 }, { x: 0, y: 21 }), stroke: { color: '#93c5fd', thickness: 2.5 } },
    { id: `plDone${i}`, type: 'rect', parent: `pl${i}`, x: 0, y: 0, width: 58, height: 42, cornerRadius: 11, opacity: 0, fill: lin([['#22c55e', 0], ['#15803d', 1]], { x: 0, y: -21 }, { x: 0, y: 21 }), stroke: { color: '#86efac', thickness: 2.5 } },
    { id: `plHi${i}`, type: 'rect', parent: `pl${i}`, x: 0, y: -16, width: 40, height: 2.5, cornerRadius: 1.25, fill: { color: a('#ffffff', 0.22) } },
    ...icons[i],
    { id: `ckS${i}`, type: 'ellipse', parent: `ck${i}`, x: 0, y: 0, width: 20, height: 20, fill: { color: '#22c55e' }, stroke: { color: '#0f172a', thickness: 3 } },
    path(`ckP${i}`, `ck${i}`, 'M-4.5 0.5 L-1.4 3.6 L4.6 -3.4', stroke('#ffffff', 2.4)),
  ]);
  const lit = BARS.map(([, h], b) => ({ id: `lbLit${b}`, type: 'rect', parent: `lbOn${b}`, x: 0, y: -h / 2, width: 5.5, height: h, cornerRadius: 2, fill: { color: WARM } }));

  const patchGlyph = (i) => [
    () => ({ ...star(`pg_${i}`, 0, 0, 15, '#ffffff'), parent: `ptG${i}`, scaleX: 1, scaleY: 1 }),
    () => ({ id: `pg_${i}`, type: 'ellipse', parent: `ptG${i}`, x: 0, y: 0, width: 10, height: 10, stroke: { color: '#ffffff', thickness: 2.6 } }),
    () => path(`pg_${i}`, `ptG${i}`, ['M-3 -5 L3 0 L-3 5'], stroke('#ffffff', 2.8)),
    () => ({ id: `pg_${i}`, type: 'rect', parent: `ptG${i}`, x: 0, y: 0, width: 8, height: 8, rotation: 45, cornerRadius: 1.5, fill: { color: '#ffffff' } }),
    () => path(`pg_${i}`, `ptG${i}`, ['M-1 -6 L-4 1 L1 1 L-1 6 L4 -1 L-1 -1 Z'], { fill: { color: '#ffffff' } }),
    () => path(`pg_${i}`, `ptG${i}`, ['M0 -5.5 L5 4 L-5 4 Z'], { fill: { color: '#ffffff' } }),
  ][i]();
  const patches = PATCH.flatMap(([, , color], i) => [
    { id: `pb${i}`, type: 'ellipse', parent: `ptG${i}`, x: 0, y: 0, width: 28, height: 28, fill: { color }, stroke: { color: '#fff7ed', thickness: 2.6 } },
    { id: `pd${i}`, type: 'ellipse', parent: `ptG${i}`, x: 0, y: 0, width: 20, height: 20, stroke: { color: a('#ffffff', 0.45), thickness: 1.2 } },
    patchGlyph(i),
  ]);

  const pack = [
    { id: 'packBody', type: 'rect', parent: p + 'breathe', x: -72, y: -146, width: 132, height: 160, cornerRadius: 32, fill: lin([['#fdba74', 0], ['#f97316', 0.42], ['#c2410c', 1]], { x: -66, y: -80 }, { x: 66, y: 80 }) },
    { id: 'packSeam', type: 'rect', parent: p + 'breathe', x: -72, y: -146, width: 114, height: 140, cornerRadius: 26, stroke: { color: a('#7c2d12', 0.35), thickness: 2 } },
    { id: 'packPocket', type: 'rect', parent: p + 'breathe', x: -132, y: -88, width: 28, height: 54, cornerRadius: 11, fill: lin([['#ea580c', 0], ['#9a3412', 1]], { x: -14, y: 0 }, { x: 14, y: 0 }) },
    { id: 'packRoll', type: 'rect', parent: p + 'breathe', x: -58, y: -250, width: 126, height: 30, cornerRadius: 15, fill: lin([['#f1f5f9', 0], ['#94a3b8', 1]], { x: 0, y: -16 }, { x: 0, y: 16 }) },
    ...[-104, -12].map((x, i) => ({ id: `rollTie${i}`, type: 'rect', parent: p + 'breathe', x, y: -250, width: 7, height: 32, cornerRadius: 2, fill: { color: '#7c2d12' } })),
    { id: 'packFlap', type: 'rect', parent: p + 'breathe', x: -66, y: -214, width: 124, height: 46, cornerRadius: 20, fill: lin([['#fb923c', 0], ['#c2410c', 1]], { x: 0, y: -24 }, { x: 0, y: 24 }) },
    { id: 'packHi', type: 'rect', parent: p + 'breathe', x: -128, y: -150, width: 6, height: 50, cornerRadius: 3, fill: { color: a('#ffffff', 0.25) } },
  ];
  const strap = [
    path('strap', p + 'bowl', 'M-40 -70 Q-66 -34 -70 26', stroke('#c2410c', 14)),
    path('strapHi', p + 'bowl', 'M-44 -64 Q-67 -31 -71 18', { ...stroke('#fdba74', 3.5), opacity: 0.7 }),
    { id: 'buckle', type: 'rect', parent: p + 'bowl', x: -62, y: 4, width: 18, height: 10, rotation: 8, cornerRadius: 3, fill: { color: '#e2e8f0' }, stroke: { color: '#7c2d12', thickness: 2 } },
  ];
  const [shadow, ...rest] = L.shapes;
  const bodyAt = rest.findIndex((s) => s.id === p + 'body') + 1;

  const hillW = 360 * k;
  const shapes = [
    { id: 'dawn', type: 'ellipse', parent: 'dawnS', x: 0, y: 0, width: 340 * k, height: 340 * k, fill: rad([[a(WARM, 0.26), 0], [a(WARM, 0.08), 0.55], [a(WARM, 0), 1]], { x: 0, y: 0 }, { x: 170 * k, y: 0 }) },
    ...c.stars.map((_, i) => ({ id: `stS${i}`, type: 'ellipse', parent: `st${i}`, x: 0, y: 0, width: 2.6, height: 2.6, fill: { color: '#e0e7ff' } })),
    path('hill', undefined, `M${pt([POLE[0] - 150 * k, POLE[1] + 46 * k])} Q${pt([POLE[0] - 30 * k, POLE[1] - 44 * k])} ${pt([POLE[0] + 130 * k, POLE[1] + 46 * k])} Z`, { fill: lin([['#1c2a45', 0], [a('#172238', 0), 1]], { x: 0, y: POLE[1] - 10 * k }, { x: 0, y: POLE[1] + 46 * k }) }),
    path('roadEdge', undefined, road, stroke('#1e293b', c.road)),
    path('roadTop', undefined, road, stroke('#243248', c.road - 8 * k)),
    path('dashes', undefined, dashes, stroke('#475569', dw)),
    ...litPaths('litS', segD(segs[0]), true),
    ...[1, 2, 3].flatMap((j) => litPaths(`lit${j - 1}`, segD(segs[j]), false)),
    ...c.rocks.flatMap(([x, y, s], i) => [
      { id: `rk${i}`, type: 'ellipse', x, y, width: 26 * s, height: 15 * s, fill: lin([['#475569', 0], ['#334155', 1]], { x: 0, y: -7 * s }, { x: 0, y: 7 * s }) },
      { id: `rkH${i}`, type: 'ellipse', x: x - 4 * s, y: y - 3 * s, width: 9 * s, height: 4 * s, fill: { color: a('#ffffff', 0.12) } },
    ]),
    ...c.bushes.flatMap((_, i) => [[-14, 4, 30, 26], [12, 3, 34, 30], [0, -8, 32, 30]].map(([x, y, w, h], j) => ({
      id: `bs${i}_${j}`, type: 'ellipse', parent: `bu${i}`, x, y, width: w, height: h,
      fill: lin([['#22c55e', 0], ['#166534', 0.55], ['#14532d', 1]], { x: -w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }) }))),
    ...plates, ...lit,
    { id: 'mound', type: 'ellipse', x: POLE[0] - 4 * k, y: POLE[1] + 3 * k, width: 100 * k, height: 20 * k, fill: { color: '#1e293b' } },
    { id: 'pole', type: 'rect', parent: 'poleG', x: 0, y: -48, width: 5, height: 96, cornerRadius: 2.5, fill: lin([['#e2e8f0', 0], ['#94a3b8', 1]], { x: -2.5, y: 0 }, { x: 2.5, y: 0 }) },
    { id: 'knob', type: 'ellipse', parent: 'poleG', x: 0, y: -97, width: 9, height: 9, fill: { color: WARM } },
    path('flagS', 'flagWave', 'M0 0 L52 0 L43 15 L52 30 L0 30 Z', { fill: lin([['#fb923c', 0], ['#ea580c', 1]], { x: 0, y: 0 }, { x: 52, y: 30 }) }),
    { id: 'flagBowl', type: 'ellipse', parent: 'flagWave', x: 18, y: 15, width: 13, height: 13, stroke: { color: '#ffffff', thickness: 3.2 } },
    { id: 'flagStem', type: 'rect', parent: 'flagWave', x: 26.5, y: 15, width: 3.6, height: 14, cornerRadius: 1.8, fill: { color: '#ffffff' } },
    { id: 'burstS', type: 'ellipse', parent: 'burstSc', x: 0, y: 0, width: 240 * k, height: 240 * k, fill: rad([[a(WARM, 0.42), 0], [a(WARM, 0), 1]], { x: 0, y: 0 }, { x: 120 * k, y: 0 }) },
    shadow, ...pack, ...patches,
    ...rest.slice(0, bodyAt), ...strap, ...rest.slice(bodyAt),
    ...c.flies.flatMap((_, i) => [
      { id: `flG${i}`, type: 'ellipse', parent: `fl${i}`, x: 0, y: 0, width: 16 * Math.max(k, 0.6), height: 16 * Math.max(k, 0.6), fill: rad([[a('#d9f99d', 0.5), 0], [a('#d9f99d', 0), 1]], { x: 0, y: 0 }, { x: 8 * Math.max(k, 0.6), y: 0 }) },
      { id: `flS${i}`, type: 'ellipse', parent: `fl${i}`, x: 0, y: 0, width: 3.4, height: 3.4, fill: { color: '#ecfccb' } },
    ]),
    ...SP.map(([x, y, col, s], i) => star(`spark${i}`, x, y, s, col)),
  ];

  // Tư thế đứng ở mốc: nhìn về phía form (desktop: sang phải; mobile: xuống dưới)
  const [lx, ly] = c.look;
  const base = ([x, y], over = {}) => ({
    [`${p}lumi|x`]: x, [`${p}lumi|y`]: y,
    [`${p}hop|y`]: 0, [`${p}hop|rotation`]: 0, [`${p}hop|scaleX`]: 1, [`${p}hop|scaleY`]: 1,
    [`${p}legL|y`]: -40, [`${p}legR|y`]: -40,
    [`${p}armL|rotation`]: 28, [`${p}foreL|rotation`]: -16, [`${p}armR|rotation`]: -18, [`${p}foreR|rotation`]: 28,
    [`${p}pupils|x`]: lx, [`${p}pupils|y`]: ly, [`${p}faceLook|x`]: lx * 0.8, [`${p}faceLook|y`]: ly * 0.5,
    [`${p}eyesOpen|opacity`]: 1, [`${p}eyesHappy|opacity`]: 0, [`${p}mouth|opacity`]: 1, [`${p}mouthOpen|opacity`]: 0, [`${p}cheeks|opacity`]: 0.6,
    'flag|y': FLAG_DOWN, 'flag|scaleX': 0.3, 'burst|opacity': 0, 'burst|scaleX': 0.6, 'burst|scaleY': 0.6,
    ...Object.fromEntries(SP.flatMap((_, i) => [[`spark${i}|scaleX`, 0], [`spark${i}|scaleY`, 0], [`spark${i}|rotation`, 0]])),
    ...over,
  });
  const ARRIVED = {
    [`${p}eyesOpen|opacity`]: 0, [`${p}eyesHappy|opacity`]: 1, [`${p}mouth|opacity`]: 0, [`${p}mouthOpen|opacity`]: 1, [`${p}cheeks|opacity`]: 0.9,
    [`${p}armR|rotation`]: -150, [`${p}foreR|rotation`]: 18, [`${p}armL|rotation`]: 36, [`${p}foreL|rotation`]: -12,
    [`${p}pupils|x`]: 3, [`${p}pupils|y`]: -3, [`${p}faceLook|x`]: 3,
    'flag|y': FLAG_UP, 'flag|scaleX': 1, 'burst|opacity': 0.55, 'burst|scaleX': 1, 'burst|scaleY': 1,
  };
  const litOf = (i) => Object.fromEntries([0, 1, 2].flatMap((j) => [[`lit${j}|trimEnd`, j < i ? 1 : 0], [`lit${j}G|trimEnd`, j < i ? 1 : 0]]));
  const rests = M.map((m, i) => base(m, { ...litOf(i), ...(i === 3 ? ARRIVED : {}) }));

  const walkTracks = (from, to, D, rest0, rest1) => {
    const T = table([segs[Math.min(from, to) + 1]]);
    const rev = to < from, seg = Math.min(from, to), n = Math.max(3, Math.round(T.L / c.stride));
    const dir = Math.sign(M[to][0] - M[from][0]) || 1;
    const keys = {};
    const push = (key, f, v) => (keys[key] ??= []).push([f, v, 'linear']);
    for (let f = 0; f <= D; f += 2) {
      const e = ease(f / D), [x, y] = T.at((rev ? 1 - e : e) * T.L), s = Math.sin(Math.PI * n * e);
      push(`${p}lumi|x`, f, x); push(`${p}lumi|y`, f, y);
      push(`${p}hop|y`, f, -Math.abs(s) * 13); push(`${p}hop|rotation`, f, s * 4); push(`${p}hop|scaleY`, f, 1 + Math.abs(s) * 0.03);
      push(`${p}legL|y`, f, -40 - Math.max(0, s) * 10); push(`${p}legR|y`, f, -40 - Math.max(0, -s) * 10);
      push(`${p}armL|rotation`, f, 28 + s * 18); push(`${p}armR|rotation`, f, -18 + s * 18);
      push(`lit${seg}|trimEnd`, f, rev ? 1 - e : e); push(`lit${seg}G|trimEnd`, f, rev ? 1 - e : e);
    }
    const look = (key, walkV, a0, a1) => tr(key.split('|')[0], key.split('|')[1], [[0, a0], [10, walkV], [D - 10, walkV], [D, a1]]);
    return [
      ...Object.entries(keys).map(([key, frames]) => tr(key.split('|')[0], key.split('|')[1], frames)),
      look(`${p}pupils|x`, dir * 3, rest0[`${p}pupils|x`], rest1[`${p}pupils|x`]),
      look(`${p}pupils|y`, c.up ? -3 : 0, rest0[`${p}pupils|y`], rest1[`${p}pupils|y`]),
      look(`${p}faceLook|x`, dir * 3, rest0[`${p}faceLook|x`], rest1[`${p}faceLook|x`]),
    ];
  };
  const D = 60;
  const walks = [];
  for (let i = 0; i < 3; i++) {
    const fwd = `w${i}${i + 1}`, back = `w${i + 1}${i}`;
    if (i < 2) walks.push(anim(fwd, D, rests[i], walkTracks(i, i + 1, D, rests[i], rests[i + 1])));
    walks.push(anim(back, D, rests[i], [
      ...walkTracks(i + 1, i, D, rests[i + 1], rests[i]),
      ...(i === 2 ? [tr('flag', 'y', [[0, FLAG_UP], [24, FLAG_DOWN]]), tr('flag', 'scaleX', [[0, 1], [24, 0.3]]),
        tr('burst', 'opacity', [[0, 0.55], [20, 0]]), tr(p + 'eyesHappy', 'opacity', [[0, 1, 'hold'], [6, 0]]), tr(p + 'eyesOpen', 'opacity', [[0, 0, 'hold'], [6, 1]]),
        tr(p + 'mouthOpen', 'opacity', [[0, 1, 'hold'], [6, 0]]), tr(p + 'mouth', 'opacity', [[0, 0, 'hold'], [6, 1]]), tr(p + 'cheeks', 'opacity', [[0, 0.9], [12, 0.6]])] : []),
    ]));
  }
  const W0 = 44, END = 84;
  const fin = rests[3], up = (arm) => fin[`${p}${arm}|rotation`];
  const toFlag = walkTracks(2, 3, W0, rests[2], { ...rests[2], [`${p}pupils|x`]: 3, [`${p}pupils|y`]: -3, [`${p}faceLook|x`]: 3 });
  const keep = (t) => !/(hop\||armL\||armR\|)/.test(`${t.target}|${t.property}`);
  const tail = (key, frames) => {
    const prev = toFlag.find((t) => `${t.target}|${t.property}` === key);
    const [tg, pr] = key.split('|');
    return tr(tg, pr, [...(prev ? prev.keyframes.map((kf) => [kf.frame, kf.value, 'linear']) : []), ...frames]);
  };
  walks.push(anim('w23', END, rests[2], [
    ...toFlag.filter(keep),
    tail(`${p}hop|y`, [[W0 + 4, 0, 'out'], [W0 + 14, -30], [W0 + 20, -32, 'in'], [W0 + 28, 0], [END, 0]]),
    tail(`${p}hop|scaleY`, [[W0 + 3, 0.88], [W0 + 8, 1.08], [W0 + 24, 1.02], [W0 + 29, 0.92], [W0 + 36, 1]]),
    tail(`${p}hop|rotation`, [[W0 + 6, 0], [END, 0]]),
    tr(p + 'hop', 'scaleX', [[0, 1], [W0, 1], [W0 + 3, 1.1], [W0 + 8, 0.95], [W0 + 29, 1.06], [W0 + 36, 1]]),
    tail(`${p}armL|rotation`, [[W0 + 8, 156], [W0 + 26, 150], [END, up('armL')]]),
    tail(`${p}armR|rotation`, [[W0 + 8, -156], [W0 + 26, -150], [END, up('armR')]]),
    tr(p + 'foreL', 'rotation', [[0, -16], [W0, -16], [W0 + 8, 0], [END, fin[`${p}foreL|rotation`]]]),
    tr(p + 'foreR', 'rotation', [[0, 28], [W0, 28], [W0 + 8, 12], [END, fin[`${p}foreR|rotation`]]]),
    ...[['eyesOpen', 1, 0], ['eyesHappy', 0, 1], ['mouth', 1, 0], ['mouthOpen', 0, 1]].map(([id, v0, v1]) => tr(p + id, 'opacity', [[0, v0, 'hold'], [W0 + 4, v1]])),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [W0 + 4, 0.9]]),
    tr('flag', 'y', [[0, FLAG_DOWN], [W0 - 12, FLAG_DOWN, 'out'], [W0 + 16, FLAG_UP]]),
    tr('flag', 'scaleX', [[0, 0.3], [W0 - 4, 0.3, 'out'], [W0 + 16, 1.08], [W0 + 24, 1]]),
    tr('burst', 'opacity', [[0, 0], [W0 + 4, 0, 'out'], [W0 + 16, 0.9], [END, 0.55]]),
    tr('burst', 'scaleX', [[0, 0.6], [W0 + 4, 0.6, 'out'], [W0 + 18, 1.12], [END, 1]]),
    tr('burst', 'scaleY', [[0, 0.6], [W0 + 4, 0.6, 'out'], [W0 + 18, 1.12], [END, 1]]),
    ...SP.flatMap((_, i) => {
      const t = W0 + 8 + i * 4;
      return [tr(`spark${i}`, 'scaleX', [[0, 0], [t, 0], [t + 8, 1.1], [t + 20, 0]]), tr(`spark${i}`, 'scaleY', [[0, 0], [t, 0], [t + 8, 1.1], [t + 20, 0]]),
        tr(`spark${i}`, 'rotation', [[0, 0], [t, 0], [t + 20, 90]])];
    }),
  ]));
  const atAnims = rests.map((r, i) => anim(`at${i}`, 1, r, []));

  const moveLayer = { name: 'move', states: [...atAnims, ...walks].map((an) => ({ name: an.name, animation: an.name })), transitions: [
    { from: 'entry', to: 'at0' },
    ...[0, 1, 2, 3].flatMap((i) => [
      ...[0, 1, 2, 3].filter((j) => j !== i).map((j) => ({ from: `at${i}`, to: `at${j}`, condition: { input: 'step', op: '==', value: 10 + j } })),
      ...(i < 3 ? [{ from: `at${i}`, to: `w${i}${i + 1}`, condition: { input: 'step', op: '==', value: i + 1 } }] : []),
      ...(i > 0 ? [{ from: `at${i}`, to: `w${i}${i - 1}`, condition: { input: 'step', op: '==', value: i - 1 } }] : []),
    ]),
    ...walks.map((w) => ({ from: w.name, to: `at${w.name[2]}`, exitTimeMs: msOf(w.duration) })),
  ] };

  const plateAnims = [0, 1, 2].flatMap((i) => {
    const set = (fut, cur, done, ic) => [tr(`plFut${i}`, 'opacity', [[0, fut]]), tr(`plCur${i}`, 'opacity', [[0, cur]]), tr(`plDone${i}`, 'opacity', [[0, done]]),
      tr(`ic${i}`, 'opacity', [[0, ic]]), tr(`plGlow${i}`, 'opacity', [[0, cur]]), tr(`hl${i}`, 'opacity', [[0, cur]])];
    const K = c.plateK, pop = (peak) => [tr(`pl${i}`, 'scaleX', [[0, K], [8, K * peak], [20, K]]), tr(`pl${i}`, 'scaleY', [[0, K], [8, K * peak], [20, K]])];
    return [
      { name: `pf${i}`, fps: 60, duration: 1, loop: 'oneShot', tracks: [...set(1, 0, 0, 0.45), tr(`ck${i}`, 'scaleX', [[0, 0]]), tr(`ck${i}`, 'scaleY', [[0, 0]]), tr(`pl${i}`, 'scaleX', [[0, K]]), tr(`pl${i}`, 'scaleY', [[0, K]])] },
      { name: `pc${i}`, fps: 60, duration: 24, loop: 'oneShot', tracks: [...set(0, 1, 0, 1), tr(`ck${i}`, 'scaleX', [[0, 0]]), tr(`ck${i}`, 'scaleY', [[0, 0]]), ...pop(1.08)] },
      { name: `pd${i}`, fps: 60, duration: 24, loop: 'oneShot', tracks: [...set(0, 0, 1, 1), ...pop(1.05),
        tr(`ck${i}`, 'scaleX', [[0, 0], [4, 0, 'back'], [16, 1]]), tr(`ck${i}`, 'scaleY', [[0, 0], [4, 0, 'back'], [16, 1]])] },
    ];
  });
  const at = (op, value) => ({ input: 'at', op, value });
  const plateLayer = (i) => ({ name: `plate${i}`, states: ['pf', 'pc', 'pd'].map((n) => ({ name: `${n}${i}`, animation: `${n}${i}` })), transitions: [
    { from: 'entry', to: `pf${i}` },
    { from: `pf${i}`, to: `pc${i}`, durationMs: 200, condition: at('==', i) },
    { from: `pf${i}`, to: `pd${i}`, durationMs: 200, condition: at('>', i) },
    { from: `pc${i}`, to: `pd${i}`, durationMs: 200, condition: at('>', i) },
    { from: `pc${i}`, to: `pf${i}`, durationMs: 200, condition: at('<', i) },
    { from: `pd${i}`, to: `pc${i}`, durationMs: 200, condition: at('==', i) },
    { from: `pd${i}`, to: `pf${i}`, durationMs: 200, condition: at('<', i) },
  ] });

  // Lớp bật/tắt từng món (patch trên ba lô, vạch trình độ): `name` để động, `nameNow` để đặt thẳng
  const toggleLayer = (id, input, idx, on, off, appear, vanish) => ({ name: id, states: [
    { name: `${id}Off`, animation: off }, { name: `${id}On`, animation: on }, { name: `${id}In`, animation: appear.name }, { name: `${id}Out`, animation: vanish.name },
  ], transitions: [
    { from: 'entry', to: `${id}Off` },
    { from: `${id}Off`, to: `${id}On`, condition: { input: `${input}Now`, op: '>=', value: idx + 1 } },
    { from: `${id}Off`, to: `${id}In`, condition: { input, op: '>=', value: idx + 1 } },
    { from: `${id}In`, to: `${id}On`, exitTimeMs: msOf(appear.duration) },
    { from: `${id}In`, to: `${id}Out`, durationMs: 100, condition: { input, op: '<', value: idx + 1 } },
    { from: `${id}On`, to: `${id}Out`, condition: { input, op: '<', value: idx + 1 } },
    { from: `${id}Out`, to: `${id}Off`, exitTimeMs: msOf(vanish.duration) },
    { from: `${id}Out`, to: `${id}In`, durationMs: 100, condition: { input, op: '>=', value: idx + 1 } },
  ] });
  const patchAnims = PATCH.flatMap(([, , , r], i) => {
    const g = `pt${i}`, s = (v) => [tr(g, 'scaleX', v), tr(g, 'scaleY', v)];
    return [
      one(`ptOff${i}`, [...s([[0, 0]]), tr(g, 'rotation', [[0, r]])]),
      one(`ptOn${i}`, [...s([[0, 1]]), tr(g, 'rotation', [[0, r]])]),
      { name: `ptIn${i}`, fps: 60, duration: 20, loop: 'oneShot', tracks: [...s([[0, 0], [9, 1.32], [15, 0.92], [20, 1]]), tr(g, 'rotation', [[0, r - 50], [12, r + 8], [20, r]])] },
      { name: `ptOut${i}`, fps: 60, duration: 14, loop: 'oneShot', tracks: [...s([[0, 1], [4, 1.15], [14, 0]]), tr(g, 'rotation', [[0, r], [14, r + 40]])] },
    ];
  });
  const barAnims = BARS.flatMap((_, b) => {
    const g = `lbOn${b}`;
    return [
      one(`lbOff${b}A`, [tr(g, 'scaleY', [[0, 0]])]),
      one(`lbOn${b}A`, [tr(g, 'scaleY', [[0, 1]])]),
      { name: `lbIn${b}`, fps: 60, duration: 16 + b * 4, loop: 'oneShot', tracks: [tr(g, 'scaleY', [[0, 0], [b * 4, 0, 'out'], [b * 4 + 10, 1.25], [b * 4 + 16, 1]])] },
      { name: `lbOut${b}`, fps: 60, duration: 10, loop: 'oneShot', tracks: [tr(g, 'scaleY', [[0, 1], [10, 0]])] },
    ];
  });

  const pickAnim = { name: 'pick', fps: 60, duration: 46, loop: 'oneShot', tracks: [
    tr(p + 'hop', 'y', [[0, 0], [5, 0, 'out'], [14, -14, 'in'], [23, 0], [46, 0]]),
    tr(p + 'hop', 'scaleY', [[0, 1], [5, 0.92], [12, 1.05], [23, 0.96], [30, 1]]),
    tr(p + 'armR', 'rotation', [[0, -18], [12, -128], [20, -108], [28, -128], [46, -18]]),
    tr(p + 'foreR', 'rotation', [[0, 28], [12, -24], [28, -24], [46, 28]]),
    ...[['eyesOpen', 1, 0], ['eyesHappy', 0, 1], ['mouth', 1, 0], ['mouthOpen', 0, 1]].map(([id, v0, v1]) => tr(p + id, 'opacity', [[0, v0, 'hold'], [4, v1, 'hold'], [40, v0]])),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [6, 0.95], [36, 0.95], [46, 0.6]]),
  ] };

  const LOOP = 480;
  const wave = (n, a0, a1) => Array.from({ length: n * 2 + 1 }, (_, j) => [(j * LOOP) / (n * 2), j % 2 ? a1 : a0]);
  const world = { name: 'world', fps: 60, duration: LOOP, loop: 'loop', tracks: [
    tr('dawnG', 'scaleX', wave(2, 1, 1.06)), tr('dawnG', 'scaleY', wave(2, 1, 1.06)),
    ...c.stars.map((_, i) => tr(`st${i}`, 'opacity', [[0, 1], [60 + i * 37, 0.25], [180 + i * 29, 1], [LOOP, 1]])),
    ...c.bushes.map((_, i) => tr(`bu${i}`, 'rotation', wave(2, -1.2, 1.2).map(([f, v]) => [f, i % 2 ? -v : v]))),
    ...[0, 1, 2].flatMap((i) => [tr(`pg${i}`, 'scaleX', wave(4, 1, 1.2)), tr(`pg${i}`, 'scaleY', wave(4, 1, 1.2)), tr(`hg${i}`, 'scaleX', wave(4, 1, 1.12)), tr(`hg${i}`, 'scaleY', wave(4, 1, 1.12))]),
    tr('flagWave', 'rotation', wave(5, -3, 2.5)), tr('flagWave', 'scaleX', wave(5, 1, 0.93)),
    ...c.flies.flatMap(([x, y], i) => {
      const r = 14 * Math.max(k, 0.5), ph = i * 1.7;
      const fr = Array.from({ length: 9 }, (_, j) => j * (LOOP / 8));
      return [
        tr(`fl${i}`, 'x', fr.map((f) => [f, f1(x + Math.cos((f / LOOP) * Math.PI * 2 + ph) * r), 'cubic'])),
        tr(`fl${i}`, 'y', fr.map((f) => [f, f1(y + Math.sin((f / LOOP) * Math.PI * 4 + ph) * r * 0.6), 'cubic'])),
        tr(`fl${i}`, 'opacity', [[0, 0.2], [80 + i * 40, 1], [200 + i * 30, 0.3], [LOOP, 0.2]]),
      ];
    }),
  ] };

  return { name: c.name, width: c.W, height: c.H, groups, shapes, animations: [
    ...atAnims, ...walks, ...plateAnims, ...patchAnims, ...barAnims, pickAnim, one('none', []),
    ...[world, { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle }, { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink }]
      .flatMap((an) => [an, one(`${an.name}0`, an.tracks.map((t) => tr(t.target, t.property, [[0, t.keyframes[0].value]])))]),
  ], stateMachine: { name: c.name, inputs: [
    { name: 'step', type: 'number', initial: 0 }, { name: 'at', type: 'number', initial: 0 },
    { name: 'patches', type: 'number', initial: 0 }, { name: 'patchesNow', type: 'number', initial: -1 },
    { name: 'level', type: 'number', initial: 0 }, { name: 'levelNow', type: 'number', initial: -1 },
    { name: 'pick', type: 'trigger' }, { name: 'still', type: 'number', initial: 0 },
  ], layers: [
    stillable('idle'), stillable('blink'), stillable('world'),
    moveLayer,
    ...PATCH.map((_, i) => toggleLayer(`pt${i}`, 'patches', i, `ptOn${i}`, `ptOff${i}`, patchAnims[i * 4 + 2], patchAnims[i * 4 + 3])),
    ...BARS.map((_, b) => toggleLayer(`lb${b}`, 'level', b, `lbOn${b}A`, `lbOff${b}A`, barAnims[b * 4 + 2], barAnims[b * 4 + 3])),
    ...[0, 1, 2].map(plateLayer),
    { name: 'react', states: [{ name: 'none', animation: 'none' }, { name: 'pick', animation: 'pick' }], transitions: [
      { from: 'entry', to: 'none' },
      { from: 'none', to: 'pick', condition: { input: 'pick' } },
      { from: 'pick', to: 'none', exitTimeMs: msOf(46) },
    ] },
  ] } };
}

export const trailArtboard = trail(TALL);
export const trailWideArtboard = trail(WIDE);
