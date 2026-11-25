// 3 cảnh cho các section dưới hero. Lumi nhân bản từ khung hero (lumi-spec), đổi tiền tố id.
import { lumiArtboard } from './lumi-spec.mjs';

const W = 480, H = 360;
const a = (hex, alpha) => '#' + Math.round(alpha * 255).toString(16).padStart(2, '0') + hex.slice(1);
const lin = (stops, start, end) => ({ gradient: { type: 'linear', stops: stops.map(([color, position]) => ({ color, position })), start, end } });
const rad = (stops, start, end) => ({ gradient: { type: 'radial', stops: stops.map(([color, position]) => ({ color, position })), start, end } });
const stroke = (color, thickness, extra = {}) => ({ stroke: { color, thickness, cap: 'round', join: 'round', ...extra } });

// Path đơn giản (chỉ M/L/Q) → subpath cho writer, copy gọn từ lumi-spec
function sub(d) {
  const t = d.match(/[MLQZ]|-?\d*\.?\d+/gi); let i = 0, op = ''; const n = () => parseFloat(t[i++]);
  const pts = []; let closed = false; const deg = (x, y) => (Math.atan2(y, x) * 180) / Math.PI;
  while (i < t.length) {
    if (/[MLQZ]/i.test(t[i])) op = t[i++].toUpperCase();
    if (op === 'M' || op === 'L') { pts.push({ x: n(), y: n() }); op = 'L'; }
    else if (op === 'Q') { const p0 = pts[pts.length - 1]; const qx = n(), qy = n(), x = n(), y = n();
      p0.out = [p0.x + (2 / 3) * (qx - p0.x), p0.y + (2 / 3) * (qy - p0.y)]; pts.push({ x, y, in: [x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y)] }); }
    else if (op === 'Z') { closed = true; op = ''; }
  }
  if (closed && pts.length > 1) { const f = pts[0], l = pts[pts.length - 1]; if (Math.abs(f.x - l.x) < 1e-6 && Math.abs(f.y - l.y) < 1e-6) { f.in = l.in; pts.pop(); } }
  return { closed, points: pts.map((p) => {
    if (!p.in && !p.out) return { x: p.x, y: p.y };
    const o = p.out ? [p.out[0] - p.x, p.out[1] - p.y] : null, ii = p.in ? [p.in[0] - p.x, p.in[1] - p.y] : null;
    return { x: p.x, y: p.y, cubic: { rotation: o ? deg(...o) : deg(-ii[0], -ii[1]), outDistance: o ? Math.hypot(...o) : 0, inRotation: ii ? deg(...ii) : deg(-o[0], -o[1]), inDistance: ii ? Math.hypot(...ii) : 0 } };
  }) };
}
const path = (id, parent, d, paint, x = 0, y = 0) => ({ id, type: 'polygon', parent, x, y, subpaths: [].concat(d).map(sub), ...paint });

// Track kiểu [frame, value, interp-từ-key-này]
const EASE = { cubic: 'ease-in-out', linear: 'linear', hold: 'hold', out: 'emphasized-decel', in: 'emphasized-accel', back: 'ease-out-back' };
const tr = (target, property, frames) => ({ target, property, keyframes: frames.map(([frame, value], i) => {
  const prev = frames[i - 1]; const e = i === 0 ? undefined : EASE[prev[2] ?? 'cubic'] ?? prev[2];
  return e ? { frame, value, easing: e } : { frame, value };
}) });

// Nhân bản Lumi: đổi tiền tố, đặt gốc ở (x,y) với tỉ lệ s; bỏ sao (của hero) và tuỳ chọn bóng.
function lumi(p, parent, x, y, s, pose = {}) {
  const skip = (id) => id === 'sparkles' || id.startsWith('spark');
  const groups = lumiArtboard.groups.filter((g) => !skip(g.id)).map((g) => {
    const out = { ...g, id: p + g.id, parent: g.parent ? p + g.parent : parent };
    if (g.id === 'lumi') Object.assign(out, { x, y, scaleX: s, scaleY: s });
    if (pose[g.id] !== undefined) out.rotation = pose[g.id];
    return out;
  });
  const shapes = lumiArtboard.shapes.filter((sh) => !skip(sh.id)).map((sh) => ({ ...sh, id: p + sh.id, parent: p + sh.parent }));
  // idle + chớp mắt của hero, đổi target (bỏ track tay để cảnh tự điều khiển tay)
  const pick = (name, dropArms) => lumiArtboard.animations.find((an) => an.name === name).tracks
    .filter((t) => !(dropArms && /^(arm|fore)/.test(t.target)))
    .map((t) => ({ ...t, target: p + t.target }));
  return { groups, shapes, idle: pick('idle', true), blink: pick('blink') };
}
// Bật/tắt mặt cười trong khoảng [from, to]
const smile = (p, from, to) => [
  tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [from, 0, 'hold'], [to, 1, 'hold']]),
  tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [from, 1, 'hold'], [to, 0, 'hold']]),
  tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [from, 0, 'hold'], [to, 1, 'hold']]),
  tr(p + 'mouthOpen', 'opacity', [[0, 0, 'hold'], [from, 1, 'hold'], [to, 0, 'hold']]),
  tr(p + 'cheeks', 'opacity', [[0, 0.6], [from - 8, 0.6], [from, 0.9], [to - 8, 0.9], [to, 0.6]]),
];

// Nền sân khấu chung: xanh đêm chuyển sắc, bo 28
const stage = (id) => ({ id, type: 'rect', x: W / 2, y: H / 2, width: W, height: H, cornerRadius: 28, fill: lin([['#1b2f74', 0], ['#0f1d4f', 0.55], ['#0b1437', 1]], { x: 0, y: -H / 2 }, { x: 0, y: H / 2 }) });
const glowDot = (id, parent, x, y, r, color, alpha) => ({ id, type: 'ellipse', parent, x, y, width: r * 2, height: r * 2, fill: rad([[a(color, alpha), 0], [a(color, 0), 1]], { x: 0, y: 0 }, { x: r, y: 0 }) });
const Q = ['M-4.6 -4 Q-4.6 -9.5 0.4 -9.5 Q5.6 -9.5 5.6 -4.6 Q5.6 -0.8 0.4 1.2 L0.4 3.6'];
const CHECK = 'M-5.5 0.5 L-1.8 4.2 L5.8 -4.4';

// State machine chung của cảnh: Lumi thở + chớp mắt + vòng lặp của cảnh (lớp sau đè lớp trước)
const sceneSM = (name) => ({ name, layers: [
  { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
  { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
  { name: 'scene', states: [{ name: 'loop', animation: 'loop' }], transitions: [{ from: 'entry', to: 'loop' }] },
] });

// ─── 1. Study: tự học ban đêm ─────────────────────────────────────────────
// Laptop quay lưng về người xem (nắp bạc, logo "a" phát sáng); Lumi ngồi sau máy, ló mặt, hai tay gõ phím
// (vai nhấp xen kẽ), ánh màn hình hắt lên mặt; dòng code bay lên từ sau nắp về phía các bong bóng "?".
function study() {
  const p = 'S_';
  const L = lumi(p, undefined, 206, 258, 0.8, { armL: -20, foreL: -40, armR: 20, foreR: 40 });
  const BUB = [[298, 96], [356, 62], [414, 70]];
  const CODE = [[30, '#c4b5fd'], [40, '#79c0ff'], [24, '#fdba74'], [36, '#79c0ff'], [28, '#c4b5fd'], [34, '#fdba74']];
  const EMIT = [12, 56, 150, 236, 318, 396]; // frame bắt đầu của từng dòng code
  const groups = [
    { id: 'win', x: 90, y: 86 }, { id: 'stars', parent: 'win', x: 0, y: 0 },
    { id: 'lampLight', x: 0, y: 0, opacity: 0.8 },
    ...BUB.map(([x, y], i) => ({ id: `bub${i}`, x, y })),
    ...BUB.map((_, i) => ({ id: `q${i}`, parent: `bub${i}`, x: 0, y: 0 })),
    { id: 'steam', x: 56, y: 236 },
    ...L.groups,
    ...CODE.map((_, i) => ({ id: `code${i}`, x: 262 + (i % 3) * 8, y: 206, opacity: 0 })),
    { id: 'lid', x: 200, y: 234 },
  ];
  const shapes = [
    stage('bg'),
    { id: 'winFrame', type: 'rect', parent: 'win', x: 0, y: 0, width: 128, height: 104, cornerRadius: 14, fill: lin([['#0a1238', 0], ['#101c52', 1]], { x: 0, y: -52 }, { x: 0, y: 52 }), stroke: { color: '#2b3f86', thickness: 3 } },
    glowDot('moonGlow', 'win', 30, -22, 28, '#fde68a', 0.35),
    { id: 'moon', type: 'ellipse', parent: 'win', x: 30, y: -22, width: 28, height: 28, fill: { color: '#fde68a' } },
    { id: 'moonCut', type: 'ellipse', parent: 'win', x: 37, y: -28, width: 24, height: 24, fill: { color: '#0d1746' } },
    ...[[-44, -26, 2.4], [-20, 6, 1.8], [-48, 28, 2], [8, 32, 1.6], [44, 20, 2.2]].map(([x, y, r], i) => ({ id: `star${i}`, type: 'ellipse', parent: 'stars', x, y, width: r * 2, height: r * 2, fill: { color: '#f8fafc' } })),
    { id: 'winBarV', type: 'rect', parent: 'win', x: 0, y: 0, width: 3, height: 100, fill: { color: '#2b3f86' } },
    { id: 'winBarH', type: 'rect', parent: 'win', x: 0, y: 2, width: 124, height: 3, fill: { color: '#2b3f86' } },
    { id: 'cone', type: 'polygon', parent: 'lampLight', x: 0, y: 0, closed: true, points: [{ x: 404, y: 156 }, { x: 452, y: 156 }, { x: 476, y: 270 }, { x: 372, y: 270 }], fill: lin([[a('#fde68a', 0.42), 0], [a('#fde68a', 0), 1]], { x: 0, y: 156 }, { x: 0, y: 270 }) },
    { id: 'lampPole', type: 'rect', x: 428, y: 208, width: 5, height: 100, fill: { color: '#334155' } },
    { id: 'lampBase', type: 'rect', x: 428, y: 262, width: 30, height: 10, cornerRadius: 4, fill: { color: '#334155' } },
    path('lampShade', undefined, 'M402 158 Q428 116 454 158 Z', { fill: lin([['#fb923c', 0], ['#c2410c', 1]], { x: 402, y: 130 }, { x: 454, y: 158 }) }),
    // Dòng code chui ra sau lưng Lumi rồi bay về phía bong bóng
    ...CODE.map(([w, c], i) => ({ id: `codeS${i}`, type: 'rect', parent: `code${i}`, x: 0, y: 0, width: w, height: 5, cornerRadius: 2.5, fill: { color: c } })),
    ...L.shapes,
    // Ánh màn hình hắt lên mặt Lumi
    glowDot('screenGlow', undefined, 200, 198, 92, '#93c5fd', 0.42),
    // Nắp laptop nhìn từ phía sau + logo chữ "a" phát sáng
    { id: 'lidBack', type: 'rect', parent: 'lid', x: 0, y: 0, width: 144, height: 76, cornerRadius: 10, fill: lin([['#e2e8f0', 0], ['#cbd5e1', 0.5], ['#94a3b8', 1]], { x: 0, y: -38 }, { x: 0, y: 38 }) },
    { id: 'lidEdge', type: 'rect', parent: 'lid', x: 0, y: -36.5, width: 136, height: 3, cornerRadius: 1.5, fill: { color: '#f8fafc' } },
    glowDot('logoGlow', 'lid', 0, -2, 20, '#60a5fa', 0.55),
    { id: 'logoBowl', type: 'ellipse', parent: 'lid', x: -2, y: -2, width: 16, height: 16, fill: { color: '#2563eb' } },
    { id: 'logoStem', type: 'rect', parent: 'lid', x: 8, y: -2, width: 5, height: 16, cornerRadius: 2.5, fill: { color: '#2563eb' } },
    { id: 'logoEye', type: 'ellipse', parent: 'lid', x: -2, y: -2, width: 7, height: 7, fill: { color: '#dbeafe' } },
    { id: 'hinge', type: 'rect', x: 200, y: 272, width: 152, height: 5, cornerRadius: 2.5, fill: { color: a('#0b1437', 0.6) } },
    { id: 'desk', type: 'rect', x: 240, y: 294, width: 456, height: 44, cornerRadius: 10, fill: lin([['#22336f', 0], ['#14224f', 1]], { x: 0, y: -22 }, { x: 0, y: 22 }) },
    { id: 'deskTop', type: 'rect', x: 240, y: 274, width: 456, height: 6, cornerRadius: 3, fill: { color: '#2e4590' } },
    { id: 'mug', type: 'rect', x: 56, y: 258, width: 28, height: 28, cornerRadius: 6, fill: { color: '#e2e8f0' } },
    path('mugHandle', undefined, 'M70 252 Q82 258 70 266', stroke('#e2e8f0', 4)),
    path('steam0', 'steam', 'M-6 0 Q-10 -6 -6 -12 Q-2 -18 -6 -24', stroke('#cbd5e1', 2.5)),
    path('steam1', 'steam', 'M5 2 Q1 -4 5 -10 Q9 -16 5 -22', stroke('#cbd5e1', 2.5)),
    ...BUB.flatMap((_, i) => [
      { id: `bubC${i}`, type: 'ellipse', parent: `bub${i}`, x: 0, y: 0, width: 32, height: 32, fill: { color: '#f8fafc' } },
      path(`qS${i}`, `q${i}`, Q, stroke('#2563eb', 3)),
      { id: `qD${i}`, type: 'ellipse', parent: `q${i}`, x: 0.4, y: 8, width: 3.6, height: 3.6, fill: { color: '#2563eb' } },
      path(`ck${i}`, `bub${i}`, CHECK, stroke('#16a34a', 3.4, { trim: { start: 0, end: 0 } })),
    ]),
  ];
  const t = [];
  // Lúc Lumi ngẩng lên nhìn bong bóng được giải thì ngừng gõ
  const GLANCE = [[112, 152], [192, 232], [272, 312]];
  const glancing = (f) => GLANCE.some(([s0, e0]) => f > s0 && f < e0);
  // Gõ phím: hai vai nhấp xen kẽ 4°, nhịp 14 frame; ngẩng lên thì đứng yên ở tư thế gõ
  const type = (base, amp, phase) => {
    const k = [];
    for (let f = 0; f <= 480; f += 7) k.push([f, glancing(f) ? base : base + (Math.floor(f / 7 + phase) % 2 ? amp : 0)]);
    return k;
  };
  t.push(tr(p + 'armL', 'rotation', type(-20, -4, 0)), tr(p + 'armR', 'rotation', type(20, 4, 1)));
  t.push(tr(p + 'faceLook', 'y', type(0, 1, 0)));
  // Mắt: nhìn xuống màn hình, ngẩng lên phía bong bóng khi nó được giải
  const look = (down, up) => [[0, down], ...GLANCE.flatMap(([s0, e0]) => [[s0, down], [s0 + 8, up, 'out'], [e0 - 6, up], [e0 + 2, down]]), [480, down]];
  t.push(tr(p + 'pupils', 'y', look(3, -4)), tr(p + 'pupils', 'x', look(-1, 3)));
  t.push(...smile(p, 300, 360));
  // Dòng code: hiện ở mép nắp, bay chéo lên phải về phía bong bóng rồi tan
  EMIT.forEach((s0, i) => {
    t.push(tr(`code${i}`, 'opacity', [[0, 0], [s0, 0], [s0 + 10, 1], [s0 + 50, 0.9], [s0 + 78, 0], [480, 0]]));
    t.push(tr(`code${i}`, 'y', [[0, 206, 'hold'], [s0, 206], [s0 + 78, 128, 'out'], [s0 + 79, 206, 'hold'], [480, 206]]));
    t.push(tr(`code${i}`, 'x', [[0, 262 + (i % 3) * 8, 'hold'], [s0, 262 + (i % 3) * 8], [s0 + 78, 318 + (i % 3) * 30, 'out'], [s0 + 79, 262 + (i % 3) * 8, 'hold'], [480, 262 + (i % 3) * 8]]));
  });
  BUB.forEach(([, y0], i) => {
    const f = 120 + i * 80;
    t.push(tr(`q${i}`, 'scaleX', [[0, 1], [f, 1], [f + 10, 0, 'in'], [384, 0], [396, 1, 'back']]));
    t.push(tr(`q${i}`, 'scaleY', [[0, 1], [f, 1], [f + 10, 0, 'in'], [384, 0], [396, 1, 'back']]));
    t.push(tr(`ck${i}`, 'trimEnd', [[0, 0], [f + 8, 0], [f + 24, 1, 'out'], [370, 1], [386, 0]]));
    t.push(tr(`bub${i}`, 'y', [[0, y0], [60 + i * 40, y0 - 6], [180 + i * 40, y0 + 2], [480, y0]]));
  });
  t.push(tr('screenGlow', 'opacity', [[0, 0.85], [120, 1], [240, 0.8], [360, 1], [480, 0.85]]));
  [[120, 0], [160, 40], [240, 90], [120, 60], [160, 120]].forEach(([per, off], i) => {
    const k = []; for (let f = 0; f <= 480; f += per / 2) k.push([f, ((f + off) / (per / 2)) % 2 < 1 ? 1 : 0.25]);
    t.push(tr(`star${i}`, 'opacity', k));
  });
  t.push(tr('moonGlow', 'opacity', [[0, 0.7], [240, 1], [480, 0.7]]));
  t.push(tr('lampLight', 'opacity', [[0, 0.8], [120, 0.62], [240, 0.85], [360, 0.66], [480, 0.8]]));
  [[0, [0, 120, 240, 360]], [1, [60, 180, 300]]].forEach(([i, starts]) => {
    const y = starts[0] ? [[0, 0, 'hold']] : [], op = starts[0] ? [[0, 0]] : [];
    for (const s0 of starts) { y.push([s0, 0, 'linear'], [s0 + 100, -14, 'hold'], [s0 + 101, 0, 'hold']); op.push([s0, 0], [s0 + 40, 0.7], [s0 + 100, 0]); }
    y.push([480, 0]); op.push([480, 0]);
    t.push(tr(`steam${i}`, 'y', y), tr(`steam${i}`, 'opacity', op));
  });
  return { name: 'Study', width: W, height: H, groups, shapes, animations: [
    { name: 'loop', fps: 60, duration: 480, loop: 'loop', tracks: t },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: sceneSM('Study') };
}

// ─── 2. Teach: giảng viên soạn khoá, khoá được duyệt ─────────────────────
function teach() {
  const p = 'T_';
  const L = lumi(p, undefined, 100, 300, 0.74, {}); // chân cao hơn mép dưới: 3 thẻ trạng thái HTML đè lên đáy cảnh
  const groups = [
    { id: 'board', x: 322, y: 158 },
    ...[0, 1, 2].map((i) => ({ id: `row${i}`, parent: 'board', x: 0, y: -28 + i * 42 })),
    ...[0, 1, 2].map((i) => ({ id: `ok${i}`, parent: `row${i}`, x: 96, y: 0 })),
    { id: 'wait2', parent: 'row2', x: 96, y: 0, scaleX: 0, scaleY: 0 },
    { id: 'burst', parent: 'board', x: 96, y: 56 },
    ...L.groups,
    { id: 'stick', parent: p + 'handR', x: 0, y: 6 },
  ];
  const ROW = [['#2563eb', 104], ['#7c3aed', 86], ['#f97316', 70]];
  const shapes = [
    stage('bg'),
    glowDot('boardGlow', 'board', 0, 0, 170, '#60a5fa', 0.16),
    { id: 'card', type: 'rect', parent: 'board', x: 0, y: 0, width: 272, height: 200, cornerRadius: 18, fill: { color: '#f8fafc' } },
    { id: 'title', type: 'rect', parent: 'board', x: -60, y: -74, width: 116, height: 11, cornerRadius: 5.5, fill: { color: '#1e293b' } },
    { id: 'subtitle', type: 'rect', parent: 'board', x: -32, y: -56, width: 172, height: 7, cornerRadius: 3.5, fill: { color: '#94a3b8' } },
    ...ROW.flatMap(([c, w], i) => [
      { id: `rowBg${i}`, type: 'rect', parent: `row${i}`, x: 0, y: 0, width: 240, height: 32, cornerRadius: 9, fill: { color: '#e9eef6' } },
      { id: `icon${i}`, type: 'rect', parent: `row${i}`, x: -100, y: 0, width: 18, height: 18, cornerRadius: 5, fill: { color: c } },
      { id: `txt${i}`, type: 'rect', parent: `row${i}`, x: -84 + w / 2, y: 0, width: w, height: 8, cornerRadius: 4, fill: { color: '#94a3b8' } },
      { id: `okC${i}`, type: 'ellipse', parent: `ok${i}`, x: 0, y: 0, width: 20, height: 20, fill: { color: '#16a34a' } },
      path(`okK${i}`, `ok${i}`, CHECK, stroke('#ffffff', 2.6, { trim: { start: 0, end: 1 } })),
    ]),
    { id: 'waitC', type: 'ellipse', parent: 'wait2', x: 0, y: 0, width: 20, height: 20, fill: { color: '#d97706' } },
    path('waitK', 'wait2', ['M-3.6 -5 L3.6 -5 L0 0 L3.6 5 L-3.6 5 L0 0 Z'], { fill: { color: '#ffffff' } }),
    ...[0, 1, 2, 3].map((i) => ({ id: `bst${i}`, type: 'polygon', parent: 'burst', x: [-18, 20, 26, -8][i], y: [-14, -12, 12, 18][i], closed: true, scaleX: 0, scaleY: 0, fill: { color: ['#fde68a', '#f97316', '#93c5fd', '#fde68a'][i] },
      points: Array.from({ length: 8 }, (_, k) => { const r = k % 2 ? 2 : 6; const tt = (k * Math.PI) / 4 - Math.PI / 2; return { x: r * Math.cos(tt), y: r * Math.sin(tt) }; }) })),
    ...L.shapes,
    { id: 'stickS', type: 'rect', parent: 'stick', x: 0, y: 40, width: 5, height: 78, cornerRadius: 2.5, fill: lin([['#fdba74', 0], ['#c2410c', 1]], { x: -2.5, y: 0 }, { x: 2.5, y: 0 }) },
    { id: 'stickTip', type: 'ellipse', parent: 'stick', x: 0, y: 80, width: 8, height: 8, fill: { color: '#fde68a' } },
  ];
  const t = [];
  // 0–60 trạng thái đủ; 60–80 xoá; dòng vào lần lượt, dấu tích, dòng 3 chờ duyệt → được duyệt
  [0, 1, 2].forEach((i) => {
    const f = 90 + i * 70;
    t.push(tr(`row${i}`, 'opacity', [[0, 1], [60, 1], [78, 0, 'hold'], [f, 0], [f + 18, 1, 'out']]));
    t.push(tr(`row${i}`, 'x', [[0, 0, 'hold'], [80, 24, 'hold'], [f, 24], [f + 22, 0, 'out']]));
  });
  [[0, 130], [1, 200]].forEach(([i, f]) => {
    t.push(tr(`ok${i}`, 'scaleX', [[0, 1, 'hold'], [80, 0, 'hold'], [f, 0], [f + 12, 1, 'back']]));
    t.push(tr(`ok${i}`, 'scaleY', [[0, 1, 'hold'], [80, 0, 'hold'], [f, 0], [f + 12, 1, 'back']]));
    t.push(tr(`okK${i}`, 'trimEnd', [[0, 1, 'hold'], [80, 0, 'hold'], [f + 8, 0], [f + 22, 1, 'out']]));
  });
  t.push(tr('wait2', 'scaleX', [[0, 0, 'hold'], [270, 0], [282, 1, 'back'], [300, 1], [312, 1.12], [324, 1], [340, 1], [350, 0, 'in']]));
  t.push(tr('wait2', 'scaleY', [[0, 0, 'hold'], [270, 0], [282, 1, 'back'], [300, 1], [312, 1.12], [324, 1], [340, 1], [350, 0, 'in']]));
  t.push(tr('ok2', 'scaleX', [[0, 1, 'hold'], [80, 0, 'hold'], [348, 0], [362, 1, 'back']]));
  t.push(tr('ok2', 'scaleY', [[0, 1, 'hold'], [80, 0, 'hold'], [348, 0], [362, 1, 'back']]));
  t.push(tr('okK2', 'trimEnd', [[0, 1, 'hold'], [80, 0, 'hold'], [356, 0], [372, 1, 'out']]));
  [0, 1, 2, 3].forEach((i) => {
    const f = 352 + i * 4;
    t.push(tr(`bst${i}`, 'scaleX', [[0, 0], [f, 0], [f + 10, 1.2, 'out'], [f + 30, 0]]));
    t.push(tr(`bst${i}`, 'scaleY', [[0, 0], [f, 0], [f + 10, 1.2, 'out'], [f + 30, 0]]));
  });
  // Tay phải cầm que chỉ: chỉ dòng 1 → 2 → 3, xong hạ xuống
  t.push(tr(p + 'armR', 'rotation', [[0, -24], [86, -24], [104, -156, 'out'], [150, -152], [158, -147], [176, -147, 'out'], [220, -145], [228, -130], [246, -130, 'out'], [330, -128], [370, -24], [480, -24]]));
  t.push(tr(p + 'foreR', 'rotation', [[0, 20], [86, 20], [104, 0], [340, 0], [370, 20], [480, 20]]));
  t.push(tr(p + 'armL', 'rotation', [[0, 28], [240, 33], [480, 28]]));
  t.push(tr(p + 'pupils', 'x', [[0, 2], [90, 4], [480, 4]]));
  t.push(tr(p + 'pupils', 'y', [[0, 1], [90, -3], [170, -1], [240, 1], [340, 2], [480, 1]]));
  t.push(tr(p + 'faceLook', 'x', [[0, 2], [90, 4], [480, 2]]));
  t.push(...smile(p, 356, 440));
  t.push(tr(p + 'hop', 'y', [[0, 0], [356, 0], [368, -10, 'out'], [382, 0, 'in'], [480, 0]]));
  return { name: 'Teach', width: W, height: H, groups, shapes, animations: [
    { name: 'loop', fps: 60, duration: 480, loop: 'loop', tracks: t },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: { name: 'Teach', layers: [
    { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
    { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
    { name: 'scene', states: [{ name: 'loop', animation: 'loop' }], transitions: [{ from: 'entry', to: 'loop' }] },
  ] } };
}

// Động học thuận cho tay phải của Lumi (gốc root, tỉ lệ s): trả vị trí bàn tay và góc tổng
const rot = (deg, [x, y]) => { const r = (deg * Math.PI) / 180; return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]; };
function fk(root, s, r1, r2) {
  const e = rot(r1, [0, 27]), h = rot(r1 + r2, [0, 27]);
  return { hand: [root[0] + s * (86 + e[0] + h[0]), root[1] + s * (-100 + e[1] + h[1])], elbow: [root[0] + s * (86 + e[0]), root[1] + s * (-100 + e[1])] };
}
// Tìm góc vai/khuỷu đưa bàn tay tới target, ưu tiên khuỷu chĩa xuống-ra ngoài (dáng tự nhiên)
function ik(root, s, target) {
  let best;
  for (let r1 = -180; r1 <= 180; r1 += 1) for (let r2 = -150; r2 <= 150; r2 += 1) {
    const { hand, elbow } = fk(root, s, r1, r2);
    const err = Math.hypot(hand[0] - target[0], hand[1] - target[1]);
    if (err > 0.8) continue;
    const score = elbow[1] + elbow[0] * 0.5;
    if (!best || score > best.score) best = { r1, r2, score };
  }
  if (!best) throw new Error('ik: không với tới ' + target);
  return best;
}

// ─── 3. Ask: kính lúp sát mắt kiểu thám tử ───────────────────────────────
function ask() {
  const p = 'A_';
  const ROOT = [128, 326], S = 0.82;
  const EYE = [ROOT[0] + S * (-8 + 14), ROOT[1] + S * (-112 - 5)]; // mắt phải (phía người xem)
  const HAND_B = [EYE[0] + 40, EYE[1] + 30]; // tay cầm cán, kính ở mắt
  const B = ik(ROOT, S, HAND_B);
  const A = { r1: -26, r2: 18 }; // hạ kính bên hông
  const LZ = Math.hypot(EYE[0] - HAND_B[0], EYE[1] - HAND_B[1]) / S - 4; // tâm kính trong toạ độ của nhóm mag
  const dir = [(EYE[0] - HAND_B[0]) / S, (EYE[1] - HAND_B[1]) / S];
  const thetaB = (Math.atan2(-dir[0], dir[1]) * 180) / Math.PI; // góc tổng để trục +y của kính chĩa vào mắt
  const r3B = thetaB - (B.r1 + B.r2);
  let r3A = 200 - (A.r1 + A.r2); // lúc hạ: kính dựng chếch lên-phải
  while (r3A - r3B > 180) r3A -= 360;
  while (r3B - r3A > 180) r3A += 360;
  const L = lumi(p, undefined, ROOT[0], ROOT[1], S, { armR: A.r1, foreR: A.r2 });
  const groups = [
    { id: 'bubble', x: 330, y: 150 },
    { id: 'bigQ', parent: 'bubble', x: 0, y: -6 },
    ...L.groups,
    { id: 'mag', parent: p + 'handR', x: 0, y: 4, rotation: r3A },
    { id: 'magEye', parent: 'mag', x: 0, y: LZ, rotation: -thetaB, opacity: 0 },
    { id: 'magIris', parent: 'magEye', x: 5, y: 1 },
  ];
  const armR = L.shapes.filter((sh) => /(thumb|palm|lower|upper|elbow)R$/.test(sh.id));
  const rest = L.shapes.filter((sh) => !armR.includes(sh));
  const shapes = [
    stage('bg'),
    glowDot('bubGlow', 'bubble', 0, 0, 150, '#60a5fa', 0.14),
    path('bubS', 'bubble', 'M-90 -62 L74 -62 Q94 -62 94 -42 L94 32 Q94 52 74 52 L-20 52 L-58 70 L-46 52 L-70 52 Q-90 52 -90 32 L-90 -42 Q-90 -62 -70 -62 Z', { fill: { color: '#f8fafc' } }),
    path('bigQS', 'bigQ', ['M-14 -14 Q-14 -32 1 -32 Q17 -32 17 -16 Q17 -4 1 3 L1 13'], stroke('#2563eb', 9)),
    { id: 'bigQD', type: 'ellipse', parent: 'bigQ', x: 1, y: 30, width: 11, height: 11, fill: { color: '#2563eb' } },
    path('bigCk', 'bubble', 'M-28 -4 L-8 16 L28 -24', stroke('#16a34a', 10, { trim: { start: 0, end: 0 } })),
    ...rest,
    // Cán kính (bàn tay vẽ đè lên cán)
    { id: 'magHandle', type: 'rect', parent: 'mag', x: 0, y: (LZ - 18) / 2, width: 8, height: LZ - 18, cornerRadius: 4, fill: lin([['#fdba74', 0], ['#c2410c', 1]], { x: -4, y: 0 }, { x: 4, y: 0 }) },
    ...armR,
    // Mắt phóng to trong tròng kính (cắt theo hình tròn của kính)
    { id: 'magClip', type: 'ellipse', parent: 'magEye', x: 0, y: 0, width: 38, height: 38, fill: { color: '#ffffff' } },
    { id: 'bigSclera', type: 'ellipse', parent: 'magEye', x: 0, y: 0, width: 40, height: 48, fill: { color: '#ffffff' }, stroke: { color: '#1e3a8a', thickness: 2.4 }, clipBy: 'magClip' },
    { id: 'bigIris', type: 'ellipse', parent: 'magIris', x: 0, y: 0, width: 27, height: 32, fill: rad([['#7cb4fb', 0], ['#2563eb', 0.5], ['#0b1437', 1]], { x: 0, y: 6 }, { x: 0, y: -16 }), clipBy: 'magClip' },
    { id: 'bigPupil', type: 'ellipse', parent: 'magIris', x: 0, y: 2, width: 11, height: 13, fill: { color: '#0b1437' }, clipBy: 'magClip' },
    { id: 'bigHl', type: 'ellipse', parent: 'magIris', x: -6, y: -7, width: 9, height: 9, fill: { color: '#ffffff' }, clipBy: 'magClip' },
    { id: 'bigHl2', type: 'ellipse', parent: 'magIris', x: 6, y: 9, width: 4, height: 4, fill: { color: '#ffffff' }, clipBy: 'magClip' },
    // Tròng kính + vành
    { id: 'magGlass', type: 'ellipse', parent: 'mag', x: 0, y: LZ, width: 44, height: 44, fill: rad([[a('#dbeafe', 0.35), 0], [a('#93c5fd', 0.25), 1]], { x: -8, y: -8 }, { x: 22, y: 0 }), stroke: { color: '#f97316', thickness: 6 } },
    path('magGlint', 'mag', `M-12 ${LZ - 6} Q-10 ${LZ - 14} -2 ${LZ - 16}`, stroke('#ffffff', 3)),
  ];
  const t = [];
  // 0–40 nghỉ; 40–80 đưa kính lên mắt; 80–150 soi; 150 tìm ra; 166–206 hạ kính; 280–320 "?" quay lại
  t.push(tr(p + 'armR', 'rotation', [[0, A.r1], [40, A.r1], [80, B.r1], [150, B.r1], [166, B.r1], [206, A.r1], [360, A.r1]]));
  t.push(tr(p + 'foreR', 'rotation', [[0, A.r2], [40, A.r2], [80, B.r2], [166, B.r2], [206, A.r2], [360, A.r2]]));
  t.push(tr('mag', 'rotation', [[0, r3A], [40, r3A], [80, r3B], [110, r3B + 3], [130, r3B - 2], [166, r3B], [206, r3A], [360, r3A]]));
  t.push(tr('magEye', 'opacity', [[0, 0], [72, 0], [82, 1], [158, 1], [166, 0], [360, 0]]));
  t.push(tr('magIris', 'x', [[0, 5], [96, 5], [112, 2], [128, 7], [150, 5], [360, 5]]));
  t.push(tr('magEye', 'scaleX', [[0, 1], [140, 1], [150, 1.15, 'out'], [160, 1], [360, 1]]));
  t.push(tr('magEye', 'scaleY', [[0, 1], [140, 1], [150, 1.15, 'out'], [160, 1], [360, 1]]));
  t.push(tr(p + 'pupils', 'x', [[0, 1], [40, 1], [60, 4], [240, 4], [290, 1], [360, 1]]));
  t.push(tr(p + 'pupils', 'y', [[0, 1], [40, 1], [60, -1], [240, -1], [290, 1], [360, 1]]));
  t.push(tr(p + 'faceLook', 'x', [[0, 0], [60, 4], [260, 4], [300, 0], [360, 0]]));
  t.push(tr('bigQ', 'rotation', [[0, 0], [30, -7], [60, 6], [90, -5], [120, 4], [150, 0], [300, 0], [330, -6], [360, 0]]));
  t.push(tr('bigQ', 'scaleX', [[0, 1], [150, 1], [162, 0, 'in'], [300, 0], [316, 1, 'back'], [360, 1]]));
  t.push(tr('bigQ', 'scaleY', [[0, 1], [150, 1], [162, 0, 'in'], [300, 0], [316, 1, 'back'], [360, 1]]));
  t.push(tr('bigCk', 'trimEnd', [[0, 0], [160, 0], [182, 1, 'out'], [280, 1], [298, 0]]));
  t.push(tr('bubble', 'y', [[0, 150], [90, 144], [180, 152], [270, 144], [360, 150]]));
  t.push(...smile(p, 172, 262));
  t.push(tr(p + 'hop', 'y', [[0, 0], [176, 0], [188, -10, 'out'], [202, 0, 'in'], [360, 0]]));
  return { name: 'Ask', width: W, height: H, groups, shapes, animations: [
    { name: 'loop', fps: 60, duration: 360, loop: 'loop', tracks: t },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: sceneSM('Ask') };
}

export const sceneArtboards = [study(), teach(), ask()];
export { lumi, tr, path, a, lin, rad, stroke }; // cho graduate.mjs
