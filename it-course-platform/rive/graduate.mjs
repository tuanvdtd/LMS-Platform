// Cảnh chúc mừng hoàn thành khoá học → public/rive/celebrate.riv. Hai artboard đặt chồng trên lớp phủ ink toàn màn hình:
// - Graduate (400×380, nền trong suốt): Lumi đội mũ tốt nghiệp, tay trái cầm cuộn bằng, sau lưng có quầng sáng + tia sáng.
//   'burst' chạy 1 lần (nhảy mừng, mũ bật, tia sáng bung) → 'loop' (vẫy tay, thỉnh thoảng nhún, tia sáng đung đưa).
// - Confetti (1600×900, trang hiển thị Fit.Cover phủ kín màn hình): 'burst' pháo giấy bắn chéo từ 2 góc dưới rồi rơi
//   → 'loop' giấy rơi kiểu mưa.
// Giảm chuyển động: trang chỉ dựng khung đầu của 'loop' ở cả 2 artboard (Lumi giơ cuộn bằng, giấy rải khắp màn hình).
import { lumiArtboard } from './lumi-spec.mjs';
import { lumi, tr, path, a, lin, rad, stroke } from './scenes.mjs';

const GOLD = '#fbbf24';
const COLORS = ['#60a5fa', '#f97316', '#fde68a', '#a78bfa', '#34d399', '#fb7185', '#f8fafc'];
const FALL = [0.4, 0, 1, 1]; // rơi: chậm ở đỉnh rồi đều

// Ngẫu nhiên có hạt giống để build lại ra đúng file cũ
let seed = 20261125;
const rnd = (lo, hi) => { seed = (seed * 16807) % 2147483647; return lo + ((seed - 1) / 2147483646) * (hi - lo); };

// Mảnh giấy: chữ nhật, tròn, sợi xoăn
const bit = (id, parent, k, color) => [
  { id, type: 'rect', parent, x: 0, y: 0, width: 15, height: 7, cornerRadius: 2, fill: { color } },
  { id, type: 'ellipse', parent, x: 0, y: 0, width: 9, height: 9, fill: { color } },
  path(id, parent, 'M-10 0 Q-5 -6 0 0 Q5 6 10 0', stroke(color, 3.2)),
][k];
const star = (id, x, y, s, color) => ({ id, type: 'polygon', x, y, closed: true, scaleX: 0.8, scaleY: 0.8, fill: { color },
  points: Array.from({ length: 8 }, (_, k) => { const r = k % 2 ? s * 0.19 : s / 2; const t = (k * Math.PI) / 4 - Math.PI / 2; return { x: r * Math.cos(t), y: r * Math.sin(t) }; }) });
// Lật giấy: bề ngang co giãn 1 ↔ 0.2 (nhân tỉ lệ s của mảnh) theo chu kỳ
const flip = (from, to, per, s = 1) => { const k = []; for (let f = from, i = 0; f <= to; f += per, i++) k.push([f, (i % 2 ? 0.2 : 1) * s]); return k; };
// Rơi gần thẳng đứng từ x0 tới x1, lắc trái/phải biên độ amp mỗi step frame (như giấy bay trong không khí)
const fallX = (x0, x1, from, to, amp, step) => { const k = [[from, x0]]; for (let f = from + step, d = 1; f < to; f += step, d = -d) k.push([f, x0 + ((x1 - x0) * (f - from)) / (to - from) + d * amp]); k.push([to, x1]); return k; };
// Rơi đều từ top xuống bottom theo chu kỳ P trong vòng lặp dài len, lệch pha o; chạm đáy thì nhảy lên đỉnh (cả hai ngoài khung)
const fallY = (P, o, len, top, bottom) => {
  const y = (f) => top + ((bottom - top) * ((f + o) % P)) / P;
  const k = [[0, y(0), 'linear']];
  for (let w = P - o; w < len; w += P) k.push([w, bottom, 'hold'], [w + 1, top, 'linear']);
  k.push([len, (len + o) % P ? y(len) : bottom]);
  return k;
};
// State machine: các lớp nền (nếu có) + lớp cảnh 'burst' chạy 1 lần rồi sang 'loop'
const sceneSM = (name, burstLen, extra = []) => ({ name, layers: [
  ...extra,
  { name: 'scene', states: [{ name: 'burst', animation: 'burst' }, { name: 'loop', animation: 'loop' }], transitions: [
    { from: 'entry', to: 'burst' },
    { from: 'burst', to: 'loop', durationMs: 400, exitTimeMs: Math.round((burstLen / 60) * 1000) },
  ] },
] });

// ═══ Graduate: Lumi ═══
const GW = 400, GH = 380, G_BURST = 150, G_LOOP = 480, p = 'G_';
const AC = { x: 196, y: 236 }; // tâm quầng sáng + tia sáng, sau mũ và đầu Lumi
const RAYS = Array.from({ length: 11 }, (_, i) => -165 + i * 15); // quạt tia phía trên (độ, 0 = sang phải)
const SPARK = [[106, 188, '#fde68a', 20], [290, 172, '#f97316', 16], [312, 246, '#93c5fd', 14], [86, 256, '#f97316', 12], [200, 144, '#fde68a', 18]];

// Tư thế chung của hình tĩnh, cuối burst và đầu loop: tay trái giơ bằng, tay phải giơ vẫy
const POSE = { armL: 125, foreL: 25, armR: -150, foreR: 24 };
const L = lumi(p, undefined, GW / 2, GH - 16, 0.84, POSE);
// Mặt cười há miệng ở hình tĩnh
for (const g of L.groups) {
  if (g.id === p + 'mouthOpen') g.opacity = 1;
  if (g.id === p + 'cheeks') g.opacity = 0.85;
}
L.shapes.find((s) => s.id === p + 'mouth').opacity = 0;

const capShapes = [
  path('capSkull', 'cap', 'M-34 0 L34 0 L30 18 Q0 25 -30 18 Z', { fill: lin([['#1e293b', 0], ['#0b1437', 1]], { x: 0, y: 0 }, { x: 0, y: 22 }) }),
  path('boardSide', 'cap', 'M-64 -2 L0 16 L64 -2 L64 3 L0 21 L-64 3 Z', { fill: { color: '#020617' } }),
  // Viền sáng quanh mặt mũ để mũ tối không chìm vào nền ink
  path('board', 'cap', 'M-64 -2 L0 -20 L64 -2 L0 16 Z', { fill: lin([['#334155', 0], ['#1e293b', 0.45], ['#0b1437', 1]], { x: -20, y: -20 }, { x: 20, y: 16 }), stroke: { color: '#64748b', thickness: 1.4, join: 'round' } }),
  path('boardHi', 'cap', 'M-56 -3 L0 -18 L40 -7', { ...stroke('#94a3b8', 1.6), opacity: 0.7 }),
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

const gGroups = [
  { id: 'aura', x: AC.x, y: AC.y },
  ...RAYS.map((deg, i) => ({ id: `ray${i}`, parent: 'aura', x: 0, y: 0, rotation: deg + 90 })),
  ...L.groups,
  // Mũ đặt trên đỉnh "bát" chữ a, nghiêng nhẹ; tua rua treo ở góc phải
  { id: 'cap', parent: p + 'bowl', x: 10, y: -86, rotation: -8 },
  { id: 'tassel', parent: 'cap', x: 60, y: 0 },
  { id: 'dip', parent: p + 'handL', x: 0, y: 6 },
];
const gShapes = [
  // Quầng sáng vàng ở tâm loang ra xanh, tắt hẳn trước mép artboard để nền trong suốt không lộ đường cắt
  { id: 'halo', type: 'ellipse', parent: 'aura', x: 0, y: 0, width: 272, height: 272,
    fill: rad([[a('#fde68a', 0.22), 0], [a('#60a5fa', 0.16), 0.5], [a('#60a5fa', 0), 1]], { x: 0, y: 0 }, { x: 136, y: 0 }) },
  ...RAYS.map((_, i) => path(`rayS${i}`, `ray${i}`, 'M-2.5 -96 L2.5 -96 L1 -146 L-1 -146 Z',
    { fill: lin([[a('#fde68a', 0.75), 0], [a('#fde68a', 0), 1]], { x: 0, y: -96 }, { x: 0, y: -146 }) })),
  ...L.shapes.slice(0, thumbAt), ...dipShapes, ...L.shapes.slice(thumbAt),
  ...capShapes,
  ...SPARK.map(([x, y, c, s], i) => star(`spark${i}`, x, y, s, c)),
];

// burst
const gb = [];
// Cú nhảy lấy lại từ celebrate của hero (thân, bóng, thanh chữ a)
gb.push(...lumiArtboard.animations.find((an) => an.name === 'celebrate').tracks
  .filter((t) => /^(hop|shadowG|bar)$/.test(t.target)).map((t) => ({ ...t, target: p + t.target })));
gb.push(tr(p + 'armL', 'rotation', [[0, 28], [6, 40], [18, 160], [44, 150], [52, 160], [84, POSE.armL]]));
gb.push(tr(p + 'foreL', 'rotation', [[0, -16], [18, 0], [44, -6], [84, POSE.foreL]]));
gb.push(tr(p + 'armR', 'rotation', [[0, -18], [6, -30], [18, -150], [44, -140], [52, -152], [84, POSE.armR]]));
gb.push(tr(p + 'foreR', 'rotation', [[0, 28], [18, 12], [44, 20], [84, POSE.foreR]]));
gb.push(tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [4, 0, 'hold'], [100, 1]]));
gb.push(tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [4, 1, 'hold'], [100, 0]]));
gb.push(tr(p + 'mouth', 'opacity', [[0, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 1]]));
gb.push(tr(p + 'cheeks', 'opacity', [[0, 0.6], [8, 0.95], [100, 0.85]]));
gb.push(tr(p + 'brows', 'y', [[0, 0], [8, -4], [100, -2]]));
// Mũ bật nhẹ khỏi đầu ở đỉnh cú nhảy rồi rơi về chỗ; tua rua văng theo
gb.push(tr('cap', 'y', [[0, -86], [24, -86, 'out'], [36, -102, 'in'], [52, -86], [58, -84], [66, -86]]));
gb.push(tr('cap', 'rotation', [[0, -8], [24, -8], [36, -22], [52, -6], [60, -10], [70, -8]]));
gb.push(tr('tassel', 'rotation', [[0, 0], [10, -25], [28, 35], [44, -30], [58, 28], [72, -16], [88, 8], [104, -4], [120, 0]]));
gb.push(tr('dip', 'rotation', [[0, 0], [20, 0], [30, -10], [40, 10], [50, -6], [60, 0]]));
// Tia sáng bung ra đúng lúc Lumi lên đỉnh
gb.push(tr('aura', 'scaleX', [[0, 0.6], [18, 0.6, 'out'], [36, 1.08], [64, 1]]), tr('aura', 'scaleY', [[0, 0.6], [18, 0.6, 'out'], [36, 1.08], [64, 1]]));
gb.push(tr('aura', 'opacity', [[0, 0.3], [18, 0.3], [32, 1]]));
SPARK.forEach((_, i) => {
  const t = 24 + i * 6;
  gb.push(tr(`spark${i}`, 'scaleX', [[0, 0], [t, 0], [t + 10, 1.1], [t + 28, 0]]));
  gb.push(tr(`spark${i}`, 'scaleY', [[0, 0], [t, 0], [t + 10, 1.1], [t + 28, 0]]));
  gb.push(tr(`spark${i}`, 'rotation', [[t, 0], [t + 28, 90]]));
});

// loop
const gl = [];
const wave = []; for (let f = 0; f <= 144; f += 18) wave.push([f, (f / 18) % 2 ? -22 : 24]);
gl.push(tr(p + 'armR', 'rotation', [[0, -150], [144, -150], [170, -22], [410, -22], [440, -150], [G_LOOP, -150]]));
gl.push(tr(p + 'foreR', 'rotation', [...wave, [170, 26], [410, 26], [440, 24], [G_LOOP, 24]]));
gl.push(tr(p + 'armL', 'rotation', [[0, 125], [120, 120], [240, 127], [360, 121], [G_LOOP, 125]]));
gl.push(tr(p + 'foreL', 'rotation', [[0, 25], [240, 30], [G_LOOP, 25]]));
gl.push(tr('dip', 'rotation', [[0, 0], [240, -5], [G_LOOP, 0]]));
gl.push(tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [250, 0, 'hold'], [330, 1]]));
gl.push(tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [250, 1, 'hold'], [330, 0]]));
gl.push(tr(p + 'mouth', 'opacity', [[0, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 1]]));
gl.push(tr(p + 'cheeks', 'opacity', [[0, 0.85]]), tr(p + 'brows', 'y', [[0, -2]]));
gl.push(tr(p + 'hop', 'y', [[0, 0], [250, 0, 'out'], [262, -10, 'in'], [276, 0], [G_LOOP, 0]]));
gl.push(tr('tassel', 'rotation', [[0, 0], [60, 6], [120, 0], [180, -6], [250, 0], [262, 14], [280, -10], [300, 6], [360, -4], [420, 4], [G_LOOP, 0]]));
// Tia sáng đung đưa chậm, từng tia nhấp nháy so le
gl.push(tr('aura', 'rotation', [[0, 0], [120, 4], [240, 0], [360, -4], [G_LOOP, 0]]));
RAYS.forEach((_, i) => { const k = []; for (let f = 0, j = i; f <= G_LOOP; f += 60, j++) k.push([f, j % 2 ? 0.45 : 1]); gl.push(tr(`ray${i}`, 'opacity', k)); });

export const graduateArtboard = { name: 'Graduate', width: GW, height: GH, groups: gGroups, shapes: gShapes, animations: [
  { name: 'burst', fps: 60, duration: G_BURST, loop: 'oneShot', tracks: gb },
  { name: 'loop', fps: 60, duration: G_LOOP, loop: 'loop', tracks: gl },
  { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
  { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
], stateMachine: sceneSM('Graduate', G_BURST, [
  { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
  { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
]) };

// ═══ Confetti: phủ toàn màn hình ═══
const CW = 1600, CH = 900, C_BURST = 220, C_LOOP = 960;

// Pháo giấy bắn: chẵn từ góc trái, lẻ từ góc phải; lên đỉnh rồi rơi gần thẳng đứng, lắc nhẹ
const BURST = Array.from({ length: 90 }, (_, i) => {
  const left = i % 2 === 0;
  const t0 = 8 + (Math.floor(i / 2) % 12) + Math.floor(rnd(0, 3));
  const px = left ? rnd(80, 900) : CW - rnd(80, 900), py = rnd(50, 420);
  const tPeak = t0 + Math.round(rnd(28, 38)), tEnd = tPeak + Math.round(rnd(120, 160));
  return { id: `cb${i}`, sx: left ? -20 : CW + 20, sy: CH + 20, px, py, fx: px + rnd(-30, 30), sw: rnd(8, 20), s: rnd(0.9, 1.35), t0, tPeak, tEnd,
    r0: rnd(0, 360), spin: (i % 3 ? 1 : -1) * rnd(360, 800), per: Math.round(rnd(9, 14)), color: COLORS[i % COLORS.length], k: Math.floor(i / 2) % 3 };
});
// Giấy rơi kiểu mưa trong vòng lặp: cột ngang xáo trộn và lệch pha ngẫu nhiên, độc lập với nhau (nếu cùng tăng theo thứ tự
// thì các mảnh xếp thành đường chéo). 2 tốc độ: chu kỳ chia hết vòng lặp để nối liền. Mảnh nhỏ thì nhạt hơn cho có chiều sâu.
const COLS = 48;
const cols = Array.from({ length: COLS }, (_, i) => i);
for (let i = COLS - 1; i > 0; i--) { const j = Math.floor(rnd(0, i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; }
const DRIFT = cols.map((c, i) => {
  const P = i % 3 ? C_LOOP : C_LOOP / 2, s = rnd(0.7, 1.25);
  return { id: `cl${i}`, P, o: Math.round(rnd(0, P - 20) / 10) * 10, x: 24 + (c * (CW - 48)) / (COLS - 1) + rnd(-16, 16), s, alpha: 0.35 + (0.5 * (s - 0.7)) / 0.55,
    amp: rnd(8, 22), sj: Math.floor(rnd(0, 4)), r0: rnd(0, 360), dir: i % 2 ? 1 : -1, per: [16, 20, 24, 30][i % 4], color: COLORS[(i * 3) % COLORS.length], k: i % 3 };
});

// Lúc thiết kế mọi mảnh đều ẩn: hình tĩnh (khung đầu của loop) chỉ còn giấy rơi, không rối sau chữ
const cGroups = [
  ...DRIFT.map((d) => ({ id: d.id, x: d.x, y: -30, opacity: 0, rotation: d.r0, scaleX: d.s, scaleY: d.s })),
  ...BURST.map((b) => ({ id: b.id, x: b.px, y: b.py, opacity: 0, rotation: b.r0, scaleX: b.s, scaleY: b.s })),
];
const cShapes = [...DRIFT, ...BURST].map((d) => bit(`${d.id}S`, d.id, d.k, d.color));

const cb = [];
for (const b of BURST) {
  cb.push(tr(b.id, 'x', [[0, b.sx, 'hold'], [b.t0, b.sx, 'out'], ...fallX(b.px, b.fx, b.tPeak, b.tEnd, b.sw, 26)]));
  cb.push(tr(b.id, 'y', [[0, b.sy, 'hold'], [b.t0, b.sy, 'out'], [b.tPeak, b.py, FALL], [b.tEnd, CH + 30]]));
  cb.push(tr(b.id, 'opacity', [[0, 0, 'hold'], [b.t0 - 1, 0, 'hold'], [b.t0, 1], [b.tEnd - 20, 1], [b.tEnd, 0]]));
  cb.push(tr(b.id, 'rotation', [[0, b.r0, 'hold'], [b.t0, b.r0, 'linear'], [b.tEnd, b.r0 + b.spin]]));
  cb.push(tr(b.id, 'scaleX', flip(b.t0, b.tEnd, b.per, b.s)));
}
for (const d of DRIFT) cb.push(tr(d.id, 'opacity', [[0, 0]]));

const cl = [];
for (const d of DRIFT) {
  cl.push(tr(d.id, 'y', fallY(d.P, d.o, C_LOOP, -30, CH + 30)));
  const sway = []; for (let f = 0, j = d.sj; f <= C_LOOP; f += 60, j++) sway.push([f, d.x + [0, d.amp, 0, -d.amp][j % 4]]);
  cl.push(tr(d.id, 'x', sway));
  cl.push(tr(d.id, 'rotation', [[0, d.r0, 'linear'], [C_LOOP, d.r0 + 360 * d.dir * (C_LOOP / d.P)]]));
  cl.push(tr(d.id, 'scaleX', flip(0, C_LOOP, d.per, d.s)));
  cl.push(tr(d.id, 'opacity', [[0, d.alpha]]));
}

export const confettiArtboard = { name: 'Confetti', width: CW, height: CH, groups: cGroups, shapes: cShapes, animations: [
  { name: 'burst', fps: 60, duration: C_BURST, loop: 'oneShot', tracks: cb },
  { name: 'loop', fps: 60, duration: C_LOOP, loop: 'loop', tracks: cl },
], stateMachine: sceneSM('Confetti', C_BURST) };
