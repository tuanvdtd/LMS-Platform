// Đăng nhập / đăng ký: Lumi trong thư viện buổi tối, đặt trên nền ink. Input: lit 0–4 (số sách về kệ, mỗi cuốn bay riêng),
// 10+n (n cuốn đã nằm sẵn, không bay), mode 0 cầm laptop / 1 hạ laptop nhìn form /
// 2 giơ laptop che mặt / 3 hé mắt qua mép nắp, lookX -1..1, shake (trigger), enter (trigger), send (trigger: máy bay giấy bay ra cửa sổ).
import { lumi, tr, path, a, lin, rad, stroke } from './scenes.mjs';
import { K, ik, star, anim, msOf } from './moments.mjs';

const W = 520, H = 560, FLOOR = 500, S = 0.72, LX = 336;
const SHELF = { x0: 36, x1: 252, top: 150 };
const PLANKS = [250, 350, 450];
const LAP = { w: 112, h: 68 };
const SLOTS = [64, 88, 112, 136];
const SLOT_C = ['#2563eb', '#f97316', '#0f766e', '#7c3aed'];
const FLY_FROM = { x: 600, y: 250, r: 70 };
// [x tâm, chiều cao, rộng, màu, nghiêng] cho sách có sẵn trên kệ, đứng trên mặt ván
const DECOR = [
  [PLANKS[0], [[56, 74, 18, '#be123c'], [76, 66, 16, '#f59e0b'], [94, 80, 18, '#1e40af'], [113, 70, 16, '#0f766e'], [131, 62, 15, '#94a3b8'], [152, 72, 18, '#7c3aed', -10], [196, 60, 30, '#e2e8f0', 0, 'stack'], [232, 76, 18, '#f97316']]],
  [PLANKS[1], [[166, 70, 18, '#1d4ed8'], [186, 64, 16, '#be123c'], [205, 74, 18, '#16a34a'], [228, 58, 16, '#f59e0b', 12]]],
  [PLANKS[2], [[58, 66, 20, '#0f766e'], [80, 76, 18, '#f97316'], [100, 70, 16, '#1e3a8a'], [119, 62, 16, '#e11d48'], [160, 56, 34, '#cbd5e1', 0, 'stack'], [214, 74, 18, '#7c3aed'], [234, 68, 16, '#2563eb']]],
];
const WARM = '#fde68a';
// Lấy mẫu dày theo Bézier, mũi theo tiếp tuyến: keyframe thưa có easing từng đoạn làm máy bay khựng ở mỗi mốc
const PLANE_P = [[342, 446], [250, 330], [330, 170], [470, 110]];
const PLANE_LEN = 104;
const PLANE = (() => {
  const bez = (t, i) => (1 - t) ** 3 * PLANE_P[0][i] + 3 * (1 - t) ** 2 * t * PLANE_P[1][i] + 3 * (1 - t) * t ** 2 * PLANE_P[2][i] + t ** 3 * PLANE_P[3][i];
  const d = (t, i) => 3 * (1 - t) ** 2 * (PLANE_P[1][i] - PLANE_P[0][i]) + 6 * (1 - t) * t * (PLANE_P[2][i] - PLANE_P[1][i]) + 3 * t ** 2 * (PLANE_P[3][i] - PLANE_P[2][i]);
  const ease = (u) => 0.5 - Math.cos(Math.PI * u) / 2;
  const smooth = (a, b, u) => { const k = Math.min(1, Math.max(0, (u - a) / (b - a))); return k * k * (3 - 2 * k); };
  const out = [];
  for (let f = 0; f <= PLANE_LEN; f += 2) {
    const u = f / PLANE_LEN, t = ease(u);
    const bob = Math.sin(u * Math.PI * 3) * 3;
    out.push({ f, x: bez(t, 0), y: bez(t, 1) + bob, r: (Math.atan2(d(t, 1), d(t, 0)) * 180) / Math.PI + Math.sin(u * Math.PI * 4) * 4,
      k: 0.7 + 0.8 * smooth(0, 0.15, u) - 0.95 * smooth(0.7, 1, u), o: smooth(0, 0.06, u) * (1 - smooth(0.86, 1, u)) });
  }
  return out;
})();
const WIN_STARS = [[402, 108], [424, 130], [452, 172], [404, 178], [480, 188]];
const POT_X = 458;
const FLOWERS = [[POT_X - 16, 430, -28], [POT_X - 2, 418, -6], [POT_X + 14, 424, 22], [POT_X - 26, 448, -50], [POT_X + 24, 446, 46]];
const loopLayer = (name) => ({ name, states: [{ name, animation: name }], transitions: [{ from: 'entry', to: name }] });
const fadeX = (hex, alpha, x0, x1) => lin([[a(hex, 0), 0], [a(hex, alpha), 0.14], [a(hex, alpha), 0.86], [a(hex, 0), 1]], { x: x0, y: 0 }, { x: x1, y: 0 });
const darken = (hex, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0')).join('');
const shade = (c) => lin([[c, 0], [c, 0.55], [darken(c, 0.28), 1]], { x: -10, y: 0 }, { x: 10, y: 0 });

function library() {
  const p = 'B_';
  const L = lumi(p, undefined, LX, FLOOR, S);
  const ARMS = ['upperL', 'elbowL', 'lowerL', 'upperR', 'elbowR', 'lowerR'].map((s) => p + s);
  const HANDS = ['palmL', 'thumbL', 'palmR', 'thumbR'].map((s) => p + s);
  const decorRows = DECOR.flatMap(([y, books], r) => books.map((b, i) => ({ r, i, y, b })));

  const groups = [
    { id: 'cloud', x: 430, y: 128 },
    { id: 'lamp', x: LX - 10, y: 0 },
    { id: 'plane', x: PLANE[0].x, y: PLANE[0].y, opacity: 0 },
    ...PLANKS.map((y, r) => ({ id: `row${r}`, x: 0, y: 0 })),
    ...SLOTS.map((_, i) => ({ id: `slot${i}`, x: FLY_FROM.x, y: FLY_FROM.y, rotation: FLY_FROM.r, opacity: 0 })),
    ...[0, 1, 2].map((i) => ({ id: `glint${i}`, x: [54, 100, 146][i], y: [262, 252, 270][i] })),
    ...L.groups,
    { id: 'laptop', parent: p + 'breathe', x: 6, y: -64 },
    { id: 'notes', parent: p + 'hop', x: 78, y: -214 },
    { id: 'n0', parent: 'notes', x: 0, y: 0, opacity: 0 },
    { id: 'n1', parent: 'notes', x: 36, y: -14, opacity: 0 },
  ];

  const decorShapes = decorRows.map(({ r, i, y, b: [x, h, w, c, tilt = 0, kind] }) => kind === 'stack'
    ? { id: `d${r}_${i}`, type: 'rect', parent: `row${r}`, x, y: y - 9, width: w + 14, height: 18, cornerRadius: 3, fill: lin([[c, 0], ['#94a3b8', 1]], { x: 0, y: -9 }, { x: 0, y: 9 }) }
    : { id: `d${r}_${i}`, type: 'rect', parent: `row${r}`, x, y: y - h / 2, width: w, height: h, cornerRadius: 3, rotation: tilt, fill: shade(c) });
  const bandsOf = decorRows.filter(({ b }) => !b[5]).map(({ r, i, y, b: [x, h, w, , tilt = 0] }) => ({
    id: `db${r}_${i}`, type: 'rect', parent: `row${r}`, x, y: y - h * 0.72, width: w - 4, height: 4, cornerRadius: 1, rotation: tilt, fill: { color: a('#ffffff', 0.45) } }));

  const shapes = [
    { id: 'win', type: 'rect', x: 436, y: 150, width: 112, height: 120, cornerRadius: 10, fill: lin([['#0b1437', 0], ['#1e3a8a', 1]], { x: 0, y: -60 }, { x: 0, y: 60 }), stroke: { color: '#475569', thickness: 7 } },
    ...WIN_STARS.map(([x, y], i) => ({ id: `ws${i}`, type: 'ellipse', x, y, width: 3.2, height: 3.2, fill: { color: '#e0e7ff' } })),
    { id: 'moon', type: 'ellipse', x: 466, y: 118, width: 30, height: 30, fill: { color: WARM } },
    { id: 'moonCut', type: 'ellipse', x: 474, y: 111, width: 26, height: 26, fill: { color: '#0e1a48' } },
    ...[[0, 0, 40, 18], [-14, 4, 26, 14], [16, 4, 28, 14]].map(([x, y, w, h], i) => ({ id: `cl${i}`, type: 'ellipse', parent: 'cloud', x, y, width: w, height: h, fill: { color: a('#94a3b8', 0.35) } })),
    path('winBars', undefined, ['M436 93 L436 207', 'M383 150 L489 150'], stroke('#475569', 5)),
    { id: 'sill', type: 'rect', x: 436, y: 214, width: 128, height: 8, cornerRadius: 4, fill: { color: '#334155' } },
    { id: 'floor', type: 'rect', x: W / 2, y: FLOOR + 3, width: W, height: 6, cornerRadius: 3, fill: fadeX('#94a3b8', 0.3, -W / 2, W / 2) },
    { id: 'rug', type: 'ellipse', x: LX, y: FLOOR + 8, width: 270, height: 28, fill: { color: a('#60a5fa', 0.14) } },
    { id: 'shelfBack', type: 'rect', x: (SHELF.x0 + SHELF.x1) / 2, y: (SHELF.top + FLOOR) / 2, width: SHELF.x1 - SHELF.x0, height: FLOOR - SHELF.top, cornerRadius: 6, fill: { color: '#33261c' } },
    ...[SHELF.x0, SHELF.x1].map((x, i) => ({ id: `side${i}`, type: 'rect', x, y: (SHELF.top + FLOOR) / 2 - 6, width: 14, height: FLOOR - SHELF.top + 12, cornerRadius: 4, fill: lin([['#b07a48', 0], ['#7c4d26', 1]], { x: -7, y: 0 }, { x: 7, y: 0 }) })),
    { id: 'crown', type: 'rect', x: (SHELF.x0 + SHELF.x1) / 2, y: SHELF.top - 4, width: SHELF.x1 - SHELF.x0 + 26, height: 14, cornerRadius: 4, fill: lin([['#b07a48', 0], ['#7c4d26', 1]], { x: 0, y: -7 }, { x: 0, y: 7 }) },
    ...decorShapes, ...bandsOf,
    ...SLOTS.map((_, i) => ({ id: `slotGap${i}`, type: 'rect', x: SLOTS[i], y: PLANKS[1] - 34, width: 18, height: 64, cornerRadius: 3, fill: { color: a('#000000', 0.25) } })),
    ...PLANKS.map((y, r) => ({ id: `plank${r}`, type: 'rect', x: (SHELF.x0 + SHELF.x1) / 2, y: y + 5, width: SHELF.x1 - SHELF.x0, height: 10, cornerRadius: 2, fill: lin([['#a06a3a', 0], ['#6e4220', 1]], { x: 0, y: -5 }, { x: 0, y: 5 }) })),
    path('cone', 'lamp', 'M-30 262 L30 262 L124 500 L-124 500 Z', { fill: lin([[a(WARM, 0.3), 0], [a(WARM, 0.03), 1]], { x: 0, y: 262 }, { x: 0, y: 500 }) }),
    { id: 'pool', type: 'ellipse', parent: 'lamp', x: 0, y: FLOOR + 4, width: 270, height: 30, fill: rad([[a(WARM, 0.24), 0], [a(WARM, 0), 1]], { x: 0, y: 0 }, { x: 135, y: 0 }) },
    { id: 'cord', type: 'rect', parent: 'lamp', x: 0, y: 117, width: 2, height: 234, fill: lin([[a('#64748b', 0), 0], ['#64748b', 0.35]], { x: 0, y: -117 }, { x: 0, y: 117 }) },
    path('shade', 'lamp', 'M-13 234 L13 234 L34 262 L-34 262 Z', { fill: lin([['#16a34a', 0], ['#14532d', 1]], { x: -34, y: 0 }, { x: 34, y: 0 }) }),
    { id: 'shadeRim', type: 'rect', parent: 'lamp', x: 0, y: 262, width: 70, height: 4, cornerRadius: 2, fill: { color: '#fbbf24' } },
    { id: 'bulb', type: 'ellipse', parent: 'lamp', x: 0, y: 266, width: 18, height: 9, fill: { color: '#fffbeb' } },
    { id: 'pot', type: 'rect', x: POT_X, y: FLOOR - 22, width: 46, height: 44, cornerRadius: 8, fill: lin([['#ea7a3f', 0], ['#b4532a', 1]], { x: -23, y: 0 }, { x: 23, y: 0 }) },
    { id: 'potBand', type: 'rect', parent: undefined, x: POT_X, y: FLOOR - 26, width: 46, height: 5, fill: { color: a('#7c2d12', 0.35) } },
    { id: 'potHi', type: 'rect', x: POT_X - 13, y: FLOOR - 14, width: 5, height: 20, cornerRadius: 2.5, fill: { color: a('#ffffff', 0.3) } },
    { id: 'potRim', type: 'rect', x: POT_X, y: FLOOR - 42, width: 54, height: 10, cornerRadius: 4, fill: lin([['#dc5a22', 0], ['#a23b12', 1]], { x: 0, y: -5 }, { x: 0, y: 5 }) },
    { id: 'soil', type: 'ellipse', x: POT_X, y: FLOOR - 46, width: 42, height: 7, fill: { color: '#3f2a1a' } },
    ...FLOWERS.map(([x, y, r], i) => ({ id: `leaf${i}`, type: 'ellipse', x, y, width: 18, height: 52, rotation: r, fill: lin([['#22c55e', 0], ['#15803d', 1]], { x: 0, y: -26 }, { x: 0, y: 26 }) })),
    ...SLOTS.flatMap((x, i) => [
      { id: `slotS${i}`, type: 'rect', parent: `slot${i}`, x: 0, y: 0, width: 18, height: 64, cornerRadius: 3, fill: shade(SLOT_C[i]) },
      { id: `slotB${i}`, type: 'rect', parent: `slot${i}`, x: 0, y: -18, width: 14, height: 4, cornerRadius: 1, fill: { color: a('#ffffff', 0.6) } },
      { id: `slotA${i}`, type: 'ellipse', parent: `slot${i}`, x: 0, y: 6, width: 8, height: 8, stroke: { color: '#fde68a', thickness: 1.8 } },
    ]),
    ...[0, 1, 2].map((i) => ({ ...star(`glintS${i}`, 0, 0, [18, 14, 12][i], ['#fde68a', '#f97316', '#fde68a'][i]), parent: `glint${i}`, scaleX: 1, scaleY: 1 })),
    ...L.shapes.filter((s) => !ARMS.includes(s.id) && !HANDS.includes(s.id)),
    path(p + 'shut', p + 'eyes', ['M-22 1 Q-14 7 -6 1', 'M6 1 Q14 7 22 1'], { ...stroke(K.deep, 3.4), opacity: 0 }),
    path(p + 'browSad', p + 'brows', ['M-25 -25 Q-17 -27 -9 -33', 'M9 -33 Q17 -27 25 -25'], { ...stroke(K.deep, 3.8), opacity: 0 }),
    path(p + 'browUp', p + 'brows', ['M-25 -29 Q-17 -36 -9 -31', 'M9 -31 Q17 -36 25 -29'], { ...stroke(K.deep, 3.8), opacity: 0 }),
    ...L.shapes.filter((s) => ARMS.includes(s.id)),
    { id: 'screenLight', type: 'ellipse', parent: 'laptop', x: 0, y: -46, width: 170, height: 110, fill: rad([[a('#93c5fd', 0.28), 0], [a('#93c5fd', 0), 1]], { x: 0, y: 0 }, { x: 85, y: 0 }) },
    { id: 'deck', type: 'rect', parent: 'laptop', x: 0, y: LAP.h / 2 + 4, width: LAP.w + 10, height: 8, cornerRadius: 4, fill: lin([['#94a3b8', 0], ['#475569', 1]], { x: 0, y: -4 }, { x: 0, y: 4 }) },
    { id: 'lid', type: 'rect', parent: 'laptop', x: 0, y: 0, width: LAP.w, height: LAP.h, cornerRadius: 8, fill: lin([['#f1f5f9', 0], ['#cbd5e1', 0.55], ['#94a3b8', 1]], { x: 0, y: -LAP.h / 2 }, { x: 0, y: LAP.h / 2 }) },
    { id: 'lidEdge', type: 'rect', parent: 'laptop', x: 0, y: -LAP.h / 2 + 3, width: LAP.w - 12, height: 2.5, cornerRadius: 1.25, fill: { color: '#ffffff' } },
    { id: 'logoGlow', type: 'ellipse', parent: 'laptop', x: 0, y: 0, width: 50, height: 50, fill: rad([[a('#60a5fa', 0.6), 0], [a('#60a5fa', 0), 1]], { x: 0, y: 0 }, { x: 25, y: 0 }) },
    { id: 'logoBowl', type: 'ellipse', parent: 'laptop', x: -3, y: 0, width: 18, height: 18, fill: { color: '#2563eb' } },
    { id: 'logoStem', type: 'rect', parent: 'laptop', x: 8, y: 0, width: 6, height: 18, cornerRadius: 3, fill: { color: '#2563eb' } },
    { id: 'logoEye', type: 'ellipse', parent: 'laptop', x: -3, y: 0, width: 8, height: 8, fill: { color: '#dbeafe' } },
    ...L.shapes.filter((s) => HANDS.includes(s.id)),
    { id: 'planeS', type: 'polygon', parent: 'plane', x: 0, y: 0, closed: true, fill: { color: '#f8fafc' }, stroke: { color: '#94a3b8', thickness: 1.2, join: 'round' },
      points: [{ x: 18, y: 0 }, { x: -13, y: -10 }, { x: -6, y: 0 }, { x: -13, y: 10 }] },
    path('planeFold', 'plane', 'M-6 0 L18 0', stroke('#cbd5e1', 1.2)),
    ...['n0', 'n1'].flatMap((g) => [
      { id: g + 'h', type: 'ellipse', parent: g, x: 0, y: 0, width: 20, height: 15, rotation: -22, fill: { color: '#c7d2fe' } },
      path(g + 's', g, 'M8 -3 L8 -40 Q18 -34 24 -26', stroke('#c7d2fe', 4.5)),
    ]),
  ];

  const hold = (bx, by, tilt = 0) => {
    const l = ik('L', [bx - LAP.w / 2 + 10, by]), r = ik('R', [bx + LAP.w / 2 - 10, by]);
    return { [`${p}armL|rotation`]: l.r1, [`${p}foreL|rotation`]: l.r2, [`${p}armR|rotation`]: r.r1, [`${p}foreR|rotation`]: r.r2, 'laptop|x': bx, 'laptop|y': by, 'laptop|rotation': tilt };
  };
  const B = {
    ...hold(6, -64),
    [`${p}hop|y`]: 0, [`${p}hop|rotation`]: 0, [`${p}hop|scaleY`]: 1,
    [`${p}eyesOpen|opacity`]: 1, [`${p}eyesOpen|scaleY`]: 1, [`${p}shut|opacity`]: 0, [`${p}cheeks|opacity`]: 0.6,
    [`${p}browS|opacity`]: 1, [`${p}browUp|opacity`]: 0, [`${p}brows|y`]: 0, [`${p}pupils|y`]: 0,
    'n0|opacity': 0, 'n1|opacity': 0, 'n0|y': 0, 'n1|y': -14,
  };
  const set = (o) => Object.entries(o).map(([k, v]) => { const [t, pr] = k.split('|'); return tr(t, pr, [[0, v]]); });
  const MODES = [
    anim('m0', 1, B, set({ [`${p}pupils|y`]: 2 })),
    anim('m1', 1, B, set({ ...hold(8, -64, 8), [`${p}hop|rotation`]: 3, [`${p}browS|opacity`]: 0, [`${p}browUp|opacity`]: 1 })),
    anim('m2', 150, B, [
      ...set({ ...hold(6, -116), [`${p}eyesOpen|opacity`]: 0, [`${p}shut|opacity`]: 1 }),
      tr(p + 'hop', 'rotation', [[0, -2], [75, -4], [150, -2]]),
      tr('n0', 'opacity', [[0, 0], [10, 1], [70, 1], [90, 0], [150, 0]]), tr('n0', 'y', [[0, 0, 'linear'], [90, -60, 'hold'], [150, -60]]),
      tr('n1', 'opacity', [[0, 0], [60, 0], [70, 1], [130, 1], [150, 0]]), tr('n1', 'y', [[0, -14, 'hold'], [60, -14, 'linear'], [150, -74]]),
    ], 'loop'),
    anim('m3', 1, B, set({ ...hold(6, -86), [`${p}eyesOpen|scaleY`]: 0.5, [`${p}browS|opacity`]: 0, [`${p}browUp|opacity`]: 1 })),
  ];

  const SLOT_Y = PLANKS[1] - 32, FLY = 40, LEAVE = 30;
  const pose1 = (name, tracks) => ({ name, fps: 60, duration: 1, loop: 'oneShot', tracks });
  const slotAnims = SLOTS.flatMap((x, i) => {
    const g = `slot${i}`;
    const at = (bx, by, r, o) => [tr(g, 'x', [[0, bx]]), tr(g, 'y', [[0, by]]), tr(g, 'rotation', [[0, r]]), tr(g, 'opacity', [[0, o]])];
    return [
      pose1(`off${i}`, at(FLY_FROM.x, FLY_FROM.y, FLY_FROM.r, 0)),
      pose1(`on${i}`, at(x, SLOT_Y, 0, 1)),
      { name: `fly${i}`, fps: 60, duration: FLY, loop: 'oneShot', tracks: [
        tr(g, 'x', [[0, FLY_FROM.x, 'out'], [36, x], [FLY, x]]),
        tr(g, 'y', [[0, FLY_FROM.y, 'out'], [16, 170, 'in'], [36, SLOT_Y], [FLY, SLOT_Y]]),
        tr(g, 'rotation', [[0, FLY_FROM.r], [28, -12], [34, 6], [FLY, 0]]),
        tr(g, 'opacity', [[0, 0], [6, 1], [FLY, 1]]),
      ] },
      { name: `leave${i}`, fps: 60, duration: LEAVE, loop: 'oneShot', tracks: [
        tr(g, 'x', [[0, x, 'in'], [LEAVE, FLY_FROM.x]]),
        tr(g, 'y', [[0, SLOT_Y, 'out'], [12, 230, 'in'], [LEAVE, FLY_FROM.y]]),
        tr(g, 'rotation', [[0, 0], [LEAVE, -FLY_FROM.r]]),
        tr(g, 'opacity', [[0, 1], [24, 1], [LEAVE, 0]]),
      ] },
    ];
  });
  const glint = (o) => [0, 1, 2].flatMap((i) => [tr(`glint${i}`, 'scaleX', [[0, o]]), tr(`glint${i}`, 'scaleY', [[0, o]])]);
  const at = (op, n) => ({ input: 'lit', op, value: n });
  const slotLayer = (i) => ({ name: `slot${i}`, states: ['off', 'fly', 'on', 'leave'].map((n) => ({ name: `${n}${i}`, animation: `${n}${i}` })), transitions: [
    { from: 'entry', to: `off${i}` },
    { from: `off${i}`, to: `on${i}`, condition: at('>=', 10 + i + 1) },
    { from: `off${i}`, to: `fly${i}`, condition: at('>=', i + 1) },
    { from: `fly${i}`, to: `on${i}`, exitTimeMs: msOf(FLY) },
    { from: `fly${i}`, to: `leave${i}`, durationMs: 120, condition: at('<', i + 1) },
    { from: `on${i}`, to: `leave${i}`, condition: at('<', i + 1) },
    { from: `leave${i}`, to: `off${i}`, exitTimeMs: msOf(LEAVE) },
    { from: `leave${i}`, to: `fly${i}`, durationMs: 120, condition: at('>=', i + 1) },
  ] });
  const one = (name, tracks) => ({ name, fps: 60, duration: 1, loop: 'oneShot', tracks });

  const wobble = (r) => [[0, 0], [6, -3 + r], [12, 3 - r], [18, -2], [24, 2], [32, 0]];
  const shake = { name: 'shake', fps: 60, duration: 72, loop: 'oneShot', tracks: [
    ...PLANKS.map((_, r) => tr(`row${r}`, 'y', [[0, 0], [4, -3], [8, 0], [12, -2], [16, 0]])),
    tr(p + 'browSad', 'opacity', [[0, 0, 'hold'], [4, 1, 'hold'], [64, 0]]),
    tr(p + 'browS', 'opacity', [[0, 0]]), tr(p + 'browUp', 'opacity', [[0, 0]]),
    tr(p + 'faceLook', 'x', [[0, 0], [8, -4], [16, 4], [24, -4], [32, 3], [40, 0]]),
    tr('laptop', 'rotation', wobble(0).map(([f, v]) => [f, v * 1.5])),
    tr(p + 'hop', 'scaleY', [[0, 1], [6, 0.93], [40, 0.97], [60, 1]]),
  ] };
  const send = { name: 'send', fps: 60, duration: PLANE_LEN + 6, loop: 'oneShot', tracks: [
    tr('plane', 'opacity', PLANE.map((q) => [q.f, q.o, 'linear'])),
    tr('plane', 'x', PLANE.map((q) => [q.f, q.x, 'linear'])), tr('plane', 'y', PLANE.map((q) => [q.f, q.y, 'linear'])),
    tr('plane', 'rotation', PLANE.map((q) => [q.f, q.r, 'linear'])),
    tr('plane', 'scaleX', PLANE.map((q) => [q.f, q.k, 'linear'])), tr('plane', 'scaleY', PLANE.map((q) => [q.f, q.k, 'linear'])),
    tr('logoGlow', 'scaleX', [[0, 1], [8, 1.9], [26, 1]]), tr('logoGlow', 'scaleY', [[0, 1], [8, 1.9], [26, 1]]),
    tr(p + 'hop', 'y', [[0, 0], [4, 0, 'out'], [12, -8, 'in'], [20, 0]]),
    tr(p + 'pupils', 'x', [[0, 0], [24, -3], [60, 1], [90, 4], [PLANE_LEN + 6, 2]]),
    tr(p + 'pupils', 'y', [[0, 2], [24, -3], [90, -4], [PLANE_LEN + 6, -2]]),
    tr(p + 'faceLook', 'y', [[0, 0], [30, -2], [PLANE_LEN + 6, -1]]),
  ] };
  const enter = { name: 'enter', fps: 60, duration: 60, loop: 'oneShot', tracks: [
    tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [4, 0]]), tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [4, 1]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [4, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 0, 'hold'], [4, 1]]),
    tr(p + 'hop', 'y', [[0, 0], [6, 0, 'out'], [18, -18, 'in'], [30, 0]]),
  ] };

  const others = (k) => [0, 1, 2, 3].filter((j) => j !== k);
  return { name: 'Library', width: W, height: H, groups, shapes, animations: [
    ...MODES, ...slotAnims, pose1('gOff', glint(0)), pose1('gOn', glint(1)), one('none', []), shake, enter, send,
    one('look0', [tr(p + 'faceLook', 'x', [[0, 0]]), tr(p + 'pupils', 'x', [[0, 0]])]),
    one('lookL', [tr(p + 'faceLook', 'x', [[0, -5]]), tr(p + 'pupils', 'x', [[0, -4]])]),
    one('lookR', [tr(p + 'faceLook', 'x', [[0, 5]]), tr(p + 'pupils', 'x', [[0, 4]])]),
    { name: 'room', fps: 60, duration: 720, loop: 'loop', tracks: [
      tr('cloud', 'x', [[0, 430], [360, 446], [720, 430]]),
      tr('lamp', 'rotation', [[0, -1.2], [360, 1.2], [720, -1.2]]),
      tr('cone', 'opacity', [[0, 1], [200, 0.88], [420, 1], [560, 0.92], [720, 1]]),
      ...WIN_STARS.map((_, i) => tr(`ws${i}`, 'opacity', [[0, 1], [120 + i * 60, 0.3], [360 + i * 40, 1], [720, 1]])),
      ...[0, 1, 2].map((i) => tr(`glint${i}`, 'rotation', [[0, 0, 'linear'], [720, 90 * (i % 2 ? -1 : 1)]])),
      ...FLOWERS.map((_, i) => tr(`leaf${i}`, 'rotation', [[0, FLOWERS[i][2]], [180 + i * 40, FLOWERS[i][2] + 4], [360 + i * 40, FLOWERS[i][2] - 2], [720, FLOWERS[i][2]]])),
    ] },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: { name: 'Library', inputs: [
    { name: 'lit', type: 'number', initial: 0 }, { name: 'mode', type: 'number', initial: 0 }, { name: 'lookX', type: 'number', initial: 0.6 },
    { name: 'shake', type: 'trigger' }, { name: 'enter', type: 'trigger' }, { name: 'send', type: 'trigger' },
  ], layers: [
    loopLayer('idle'), loopLayer('blink'), loopLayer('room'),
    ...SLOTS.map((_, i) => slotLayer(i)),
    { name: 'glint', states: [{ name: 'gOff', animation: 'gOff' }, { name: 'gOn', animation: 'gOn' }], transitions: [
      { from: 'entry', to: 'gOff' },
      { from: 'gOff', to: 'gOn', durationMs: 300, condition: at('>=', 4) },
      { from: 'gOn', to: 'gOff', durationMs: 200, condition: at('<', 4) },
    ] },
    { name: 'mode', states: MODES.map((m) => ({ name: m.name, animation: m.name })), transitions: [
      { from: 'entry', to: 'm0' },
      ...[0, 1, 2, 3].flatMap((j) => others(j).map((k) => ({ from: `m${j}`, to: `m${k}`, durationMs: 240, condition: { input: 'mode', op: '==', value: k } }))),
    ] },
    { name: 'lookBase', states: [{ name: 'look0', animation: 'look0' }], transitions: [{ from: 'entry', to: 'look0' }] },
    { name: 'look', states: [{ name: 'look', blend1d: { input: 'lookX', animations: [{ animation: 'lookL', value: -1 }, { animation: 'lookR', value: 1 }] } }], transitions: [{ from: 'entry', to: 'look' }] },
    { name: 'react', states: [{ name: 'none', animation: 'none' }, { name: 'shake', animation: 'shake' }, { name: 'enter', animation: 'enter' }, { name: 'send', animation: 'send' }], transitions: [
      { from: 'none', to: 'send', condition: { input: 'send' } },
      { from: 'send', to: 'none', exitTimeMs: msOf(PLANE_LEN + 6) },
      { from: 'entry', to: 'none' },
      { from: 'none', to: 'shake', condition: { input: 'shake' } },
      { from: 'shake', to: 'none', exitTimeMs: 1200 },
      { from: 'none', to: 'enter', condition: { input: 'enter' } },
      { from: 'shake', to: 'enter', condition: { input: 'enter' } },
    ] },
  ] } };
}

export const libraryArtboard = library();
