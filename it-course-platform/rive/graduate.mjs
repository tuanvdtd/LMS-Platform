// Cảnh chúc mừng hoàn thành khoá học (artboard Graduate → public/rive/celebrate.riv).
// Lumi đội mũ tốt nghiệp, tay trái cầm cuộn bằng. 'burst' chạy 1 lần: nhảy mừng + pháo giấy bắn chéo từ 2 góc dưới;
// xong chuyển sang 'loop': vẫy tay, thỉnh thoảng nhún, giấy rơi chậm phía sau.
// Hình lúc thiết kế (giảm chuyển động, không autoplay) = Lumi giơ bằng giữa pháo giấy đang bay.
// Nền không bo góc: khung HTML bên ngoài tự cắt theo góc dialog.
import { lumiArtboard } from './lumi-spec.mjs';
import { lumi, tr, path, lin, glowDot, stroke } from './scenes.mjs';

const W = 480, H = 320, p = 'G_';
const GOLD = '#fbbf24';
const COLORS = ['#60a5fa', '#f97316', '#fde68a', '#a78bfa', '#34d399', '#fb7185', '#f8fafc'];
const BURST_LEN = 150, LOOP_LEN = 480;

// Ngẫu nhiên có hạt giống để build lại ra đúng file cũ
let seed = 20261125;
const rnd = (lo, hi) => { seed = (seed * 16807) % 2147483647; return lo + ((seed - 1) / 2147483646) * (hi - lo); };
const FALL = [0.4, 0, 1, 1]; // rơi: chậm ở đỉnh rồi đều

// Mảnh giấy: chữ nhật, tròn, sợi xoăn
const bit = (id, parent, k, color) => [
  { id, type: 'rect', parent, x: 0, y: 0, width: 15, height: 7, cornerRadius: 2, fill: { color } },
  { id, type: 'ellipse', parent, x: 0, y: 0, width: 9, height: 9, fill: { color } },
  path(id, parent, 'M-10 0 Q-5 -6 0 0 Q5 6 10 0', stroke(color, 3.2)),
][k];
const star = (id, x, y, s, color) => ({ id, type: 'polygon', x, y, closed: true, scaleX: 0.8, scaleY: 0.8, fill: { color },
  points: Array.from({ length: 8 }, (_, k) => { const r = k % 2 ? s * 0.19 : s / 2; const t = (k * Math.PI) / 4 - Math.PI / 2; return { x: r * Math.cos(t), y: r * Math.sin(t) }; }) });
// Lật giấy: bề ngang co giãn 1 ↔ 0.2 theo chu kỳ
const flip = (from, to, per, s = 1) => { const k = []; for (let f = from, i = 0; f <= to; f += per, i++) k.push([f, (i % 2 ? 0.2 : 1) * s]); return k; };
// Rơi gần thẳng đứng từ x0 tới x1, lắc trái/phải biên độ amp mỗi step frame (như giấy bay trong không khí)
const fallX = (x0, x1, from, to, amp, step) => { const k = [[from, x0]]; for (let f = from + step, d = 1; f < to; f += step, d = -d) k.push([f, x0 + ((x1 - x0) * (f - from)) / (to - from) + d * amp]); k.push([to, x1]); return k; };

// Pháo giấy bắn: chẵn từ góc trái, lẻ từ góc phải
const BURST = Array.from({ length: 36 }, (_, i) => {
  const left = i % 2 === 0;
  const t0 = 10 + (Math.floor(i / 2) % 9) + Math.floor(rnd(0, 3));
  const px = left ? rnd(40, 215) : W - rnd(40, 215), py = rnd(24, 120);
  const tPeak = t0 + Math.round(rnd(22, 30)), tEnd = tPeak + Math.round(rnd(80, 105));
  return { id: `cb${i}`, sx: left ? -8 : W + 8, sy: H + 12, px, py, fx: px + rnd(-14, 14), sw: rnd(5, 12), t0, tPeak, tEnd,
    r0: rnd(0, 360), spin: (i % 3 ? 1 : -1) * rnd(300, 640), per: Math.round(rnd(8, 13)), color: COLORS[i % COLORS.length], k: Math.floor(i / 2) % 3 };
});
// Giấy rơi trong vòng lặp (sau lưng Lumi) kiểu mưa: cột ngang xáo trộn và lệch pha ngẫu nhiên, độc lập với nhau
// (nếu cùng tăng theo thứ tự thì các mảnh xếp thành đường chéo). 2 tốc độ: chu kỳ phải chia hết vòng lặp để nối liền.
// Mảnh nhỏ thì nhạt hơn cho có chiều sâu.
const COLS = 20;
const cols = Array.from({ length: COLS }, (_, i) => i);
for (let i = COLS - 1; i > 0; i--) { const j = Math.floor(rnd(0, i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
const DRIFT = cols.map((c, i) => {
  const P = i % 3 ? LOOP_LEN : LOOP_LEN / 2, s = rnd(0.6, 1);
  return { id: `cl${i}`, P, o: Math.round(rnd(0, P - 20) / 10) * 10, x: 18 + (c * (W - 36)) / (COLS - 1) + rnd(-8, 8), s, alpha: 0.35 + 0.5 * s,
    amp: rnd(5, 14), sj: Math.floor(rnd(0, 4)), r0: rnd(0, 360), dir: i % 2 ? 1 : -1, per: [16, 20, 24, 30][i % 4], color: COLORS[(i * 3) % COLORS.length], k: i % 3 };
});
const SPARK = [[146, 128, '#fde68a', 20], [330, 112, '#f97316', 16], [352, 186, '#93c5fd', 14], [126, 196, '#f97316', 12], [240, 84, '#fde68a', 18]];

// Tư thế chung của hình tĩnh, cuối burst và đầu loop: tay trái giơ bằng, tay phải giơ vẫy
const POSE = { armL: 125, foreL: 25, armR: -150, foreR: 24 };
const L = lumi(p, undefined, W / 2, H - 16, 0.84, POSE);
// Mặt cười há miệng ở hình tĩnh
for (const g of L.groups) {
  if (g.id === p + 'mouthOpen') g.opacity = 1;
  if (g.id === p + 'cheeks') g.opacity = 0.85;
}
L.shapes.find((s) => s.id === p + 'mouth').opacity = 0;

const groups = [
  ...DRIFT.map((d) => ({ id: d.id, x: d.x, y: -20, opacity: 0, rotation: d.r0, scaleX: d.s, scaleY: d.s })),
  ...L.groups,
  // Mũ đặt trên đỉnh "bát" chữ a, nghiêng nhẹ; tua rua treo ở góc phải
  { id: 'cap', parent: p + 'bowl', x: 10, y: -86, rotation: -8 },
  { id: 'tassel', parent: 'cap', x: 60, y: 0 },
  { id: 'dip', parent: p + 'handL', x: 0, y: 6 },
  ...BURST.map((b) => ({ id: b.id, x: b.px, y: b.py, rotation: b.r0 })),
];

const capShapes = [
  path('capSkull', 'cap', 'M-34 0 L34 0 L30 18 Q0 25 -30 18 Z', { fill: lin([['#1e293b', 0], ['#0b1437', 1]], { x: 0, y: 0 }, { x: 0, y: 22 }) }),
  path('boardSide', 'cap', 'M-64 -2 L0 16 L64 -2 L64 3 L0 21 L-64 3 Z', { fill: { color: '#020617' } }),
  path('board', 'cap', 'M-64 -2 L0 -20 L64 -2 L0 16 Z', { fill: lin([['#334155', 0], ['#1e293b', 0.45], ['#0b1437', 1]], { x: -20, y: -20 }, { x: 20, y: 16 }) }),
  path('boardHi', 'cap', 'M-56 -3 L0 -18 L40 -7', { ...stroke('#64748b', 1.6), opacity: 0.7 }),
  path('cord', 'cap', 'M0 -2 Q32 -6 60 0', stroke(GOLD, 2.4)),
  { id: 'button', type: 'ellipse', parent: 'cap', x: 0, y: -2, width: 9, height: 5.5, fill: { color: GOLD } },
  path('tasselCord', 'tassel', 'M0 0 L0 20', stroke(GOLD, 2.4)),
  { id: 'tasselKnot', type: 'ellipse', parent: 'tassel', x: 0, y: 20, width: 7, height: 6, fill: { color: '#f59e0b' } },
  path('tasselFringe', 'tassel', 'M-3 22 L3 22 L6.5 36 L-6.5 36 Z', { fill: lin([[GOLD, 0], ['#d97706', 1]], { x: 0, y: 22 }, { x: 0, y: 36 }) }),
];
// Cuộn bằng nằm ngang trong bàn tay (vẽ trước bàn tay để ngón cái/lòng bàn tay đè lên)
const dipShapes = [
  { id: 'dipBody', type: 'rect', parent: 'dip', x: 0, y: 0, width: 68, height: 19, cornerRadius: 9.5, fill: lin([['#fffdf5', 0], ['#fef3c7', 0.5], ['#e9c46a', 1]], { x: 0, y: -9.5 }, { x: 0, y: 9.5 }) },
  { id: 'dipEndL', type: 'ellipse', parent: 'dip', x: -33, y: 0, width: 9, height: 19, fill: { color: '#fcd34d' } },
  { id: 'dipEndR', type: 'ellipse', parent: 'dip', x: 33, y: 0, width: 9, height: 19, fill: { color: '#fcd34d' } },
  { id: 'dipRoll', type: 'ellipse', parent: 'dip', x: 33, y: 0, width: 4, height: 9, fill: { color: '#d97706' } },
  { id: 'ribbon', type: 'rect', parent: 'dip', x: -18, y: 0, width: 8, height: 20, fill: { color: '#f97316' } },
  path('ribbonTails', 'dip', ['M-19 9 L-26 23 L-21 22 L-18 11 Z', 'M-17 9 L-11 23 L-15 22 L-18 11 Z'], { fill: { color: '#ea580c' } }),
];
const thumbAt = L.shapes.findIndex((s) => s.id === p + 'thumbL');
const lumiShapes = [...L.shapes.slice(0, thumbAt), ...dipShapes, ...L.shapes.slice(thumbAt)];

const shapes = [
  { id: 'bg', type: 'rect', x: W / 2, y: H / 2, width: W, height: H, fill: lin([['#1b2f74', 0], ['#0f1d4f', 0.55], ['#0b1437', 1]], { x: 0, y: -H / 2 }, { x: 0, y: H / 2 }) },
  glowDot('spot', undefined, W / 2, 196, 170, '#60a5fa', 0.24),
  ...DRIFT.map((d) => bit(`${d.id}S`, d.id, d.k, d.color)),
  ...lumiShapes,
  ...capShapes,
  ...BURST.map((b) => bit(`${b.id}S`, b.id, b.k, b.color)),
  ...SPARK.map(([x, y, c, s], i) => star(`spark${i}`, x, y, s, c)),
];

// ─── burst ───
const bt = [];
// Cú nhảy lấy lại từ celebrate của hero (thân, bóng, thanh chữ a)
bt.push(...lumiArtboard.animations.find((an) => an.name === 'celebrate').tracks
  .filter((t) => /^(hop|shadowG|bar)$/.test(t.target)).map((t) => ({ ...t, target: p + t.target })));
bt.push(tr(p + 'armL', 'rotation', [[0, 28], [6, 40], [18, 160], [44, 150], [52, 160], [84, POSE.armL]]));
bt.push(tr(p + 'foreL', 'rotation', [[0, -16], [18, 0], [44, -6], [84, POSE.foreL]]));
bt.push(tr(p + 'armR', 'rotation', [[0, -18], [6, -30], [18, -150], [44, -140], [52, -152], [84, POSE.armR]]));
bt.push(tr(p + 'foreR', 'rotation', [[0, 28], [18, 12], [44, 20], [84, POSE.foreR]]));
bt.push(tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [4, 0, 'hold'], [100, 1]]));
bt.push(tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [4, 1, 'hold'], [100, 0]]));
bt.push(tr(p + 'mouth', 'opacity', [[0, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 1]]));
bt.push(tr(p + 'cheeks', 'opacity', [[0, 0.6], [8, 0.95], [100, 0.85]]));
bt.push(tr(p + 'brows', 'y', [[0, 0], [8, -4], [100, -2]]));
// Mũ bật nhẹ khỏi đầu ở đỉnh cú nhảy rồi rơi về chỗ; tua rua văng theo
bt.push(tr('cap', 'y', [[0, -86], [24, -86, 'out'], [36, -102, 'in'], [52, -86], [58, -84], [66, -86]]));
bt.push(tr('cap', 'rotation', [[0, -8], [24, -8], [36, -22], [52, -6], [60, -10], [70, -8]]));
bt.push(tr('tassel', 'rotation', [[0, 0], [10, -25], [28, 35], [44, -30], [58, 28], [72, -16], [88, 8], [104, -4], [120, 0]]));
bt.push(tr('dip', 'rotation', [[0, 0], [20, 0], [30, -10], [40, 10], [50, -6], [60, 0]]));
bt.push(tr('spot', 'opacity', [[0, 0.5], [30, 1], [90, 0.8]]));
SPARK.forEach((_, i) => {
  const t = 24 + i * 6;
  bt.push(tr(`spark${i}`, 'scaleX', [[0, 0], [t, 0], [t + 10, 1.1], [t + 28, 0]]));
  bt.push(tr(`spark${i}`, 'scaleY', [[0, 0], [t, 0], [t + 10, 1.1], [t + 28, 0]]));
  bt.push(tr(`spark${i}`, 'rotation', [[t, 0], [t + 28, 90]]));
});
for (const b of BURST) {
  bt.push(tr(b.id, 'x', [[0, b.sx, 'hold'], [b.t0, b.sx, 'out'], ...fallX(b.px, b.fx, b.tPeak, b.tEnd, b.sw, 22)]));
  bt.push(tr(b.id, 'y', [[0, b.sy, 'hold'], [b.t0, b.sy, 'out'], [b.tPeak, b.py, FALL], [b.tEnd, H + 24]]));
  bt.push(tr(b.id, 'opacity', [[0, 0, 'hold'], [b.t0 - 1, 0, 'hold'], [b.t0, 1], [b.tEnd - 18, 1], [b.tEnd, 0]]));
  bt.push(tr(b.id, 'rotation', [[0, b.r0, 'hold'], [b.t0, b.r0, 'linear'], [b.tEnd, b.r0 + b.spin]]));
  bt.push(tr(b.id, 'scaleX', flip(b.t0, b.tEnd, b.per)));
}
for (const d of DRIFT) bt.push(tr(d.id, 'opacity', [[0, 0]]));

// ─── loop ───
const lt = [];
const wave = []; for (let f = 0; f <= 144; f += 18) wave.push([f, (f / 18) % 2 ? -22 : 24]);
lt.push(tr(p + 'armR', 'rotation', [[0, -150], [144, -150], [170, -22], [410, -22], [440, -150], [LOOP_LEN, -150]]));
lt.push(tr(p + 'foreR', 'rotation', [...wave, [170, 26], [410, 26], [440, 24], [LOOP_LEN, 24]]));
lt.push(tr(p + 'armL', 'rotation', [[0, 125], [120, 120], [240, 127], [360, 121], [LOOP_LEN, 125]]));
lt.push(tr(p + 'foreL', 'rotation', [[0, 25], [240, 30], [LOOP_LEN, 25]]));
lt.push(tr('dip', 'rotation', [[0, 0], [240, -5], [LOOP_LEN, 0]]));
lt.push(tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [250, 0, 'hold'], [330, 1]]));
lt.push(tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [250, 1, 'hold'], [330, 0]]));
lt.push(tr(p + 'mouth', 'opacity', [[0, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 1]]));
lt.push(tr(p + 'cheeks', 'opacity', [[0, 0.85]]), tr(p + 'brows', 'y', [[0, -2]]));
lt.push(tr(p + 'hop', 'y', [[0, 0], [250, 0, 'out'], [262, -10, 'in'], [276, 0], [LOOP_LEN, 0]]));
lt.push(tr('tassel', 'rotation', [[0, 0], [60, 6], [120, 0], [180, -6], [250, 0], [262, 14], [280, -10], [300, 6], [360, -4], [420, 4], [LOOP_LEN, 0]]));
// Rơi đều từ trên xuống theo chu kỳ P, lệch pha o; chạm đáy thì nhảy lên đỉnh (cả hai ngoài khung nên không thấy)
const fallY = (P, o) => {
  const y = (f) => -20 + ((H + 40) * ((f + o) % P)) / P;
  const k = [[0, y(0), 'linear']];
  for (let w = P - o; w < LOOP_LEN; w += P) k.push([w, H + 20, 'hold'], [w + 1, -20, 'linear']);
  k.push([LOOP_LEN, (LOOP_LEN + o) % P ? y(LOOP_LEN) : H + 20]);
  return k;
};
for (const d of DRIFT) {
  lt.push(tr(d.id, 'y', fallY(d.P, d.o)));
  const sway = []; for (let f = 0, j = d.sj; f <= LOOP_LEN; f += 60, j++) sway.push([f, d.x + [0, d.amp, 0, -d.amp][j % 4]]);
  lt.push(tr(d.id, 'x', sway));
  lt.push(tr(d.id, 'rotation', [[0, d.r0, 'linear'], [LOOP_LEN, d.r0 + 360 * d.dir * (LOOP_LEN / d.P)]]));
  lt.push(tr(d.id, 'scaleX', flip(0, LOOP_LEN, d.per, d.s)));
  lt.push(tr(d.id, 'opacity', [[0, d.alpha]]));
}

export const graduateArtboard = { name: 'Graduate', width: W, height: H, groups, shapes, animations: [
  { name: 'burst', fps: 60, duration: BURST_LEN, loop: 'oneShot', tracks: bt },
  { name: 'loop', fps: 60, duration: LOOP_LEN, loop: 'loop', tracks: lt },
  { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
  { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
], stateMachine: { name: 'Graduate', layers: [
  { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
  { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
  { name: 'scene', states: [{ name: 'burst', animation: 'burst' }, { name: 'loop', animation: 'loop' }], transitions: [
    { from: 'entry', to: 'burst' },
    { from: 'burst', to: 'loop', durationMs: 400, exitTimeMs: (BURST_LEN / 60) * 1000 },
  ] },
] } };
