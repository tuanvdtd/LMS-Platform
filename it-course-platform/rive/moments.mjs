// Input `mood`: -1 trống, n chạy phản ứng rồi giữ tư thế cuối, 10+n vào thẳng tư thế cuối.
import { lumiArtboard } from './lumi-spec.mjs';
import { lumi, tr, path, a, lin, rad, stroke } from './scenes.mjs';

const K = { ink: '#0f172a', slate: '#1e293b', line: '#334155', mute: '#475569', gray: '#94a3b8', blue: '#60a5fa', deep: '#1e3a8a',
  ok: '#22c55e', okDeep: '#16a34a', bad: '#ef4444', badDeep: '#dc2626', orange: '#f97316', paper: '#f8fafc' };

const rot = (deg, [x, y]) => { const r = (deg * Math.PI) / 180; return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]; };
const SHOULDER = { L: [-74, -100], R: [86, -100] };
// Ưu tiên khuỷu chĩa ra ngoài và xuống cho dáng tay tự nhiên
function ik(side, target) {
  const [sx, sy] = SHOULDER[side], out = side === 'L' ? -1 : 1;
  let best;
  for (let r1 = -180; r1 <= 180; r1++) for (let r2 = -150; r2 <= 150; r2++) {
    const e = rot(r1, [0, 27]), h = rot(r1 + r2, [0, 27]);
    if (Math.hypot(sx + e[0] + h[0] - target[0], sy + e[1] + h[1] - target[1]) > 0.8) continue;
    const score = (sx + e[0]) * out + (sy + e[1]) * 0.5;
    if (!best || score > best.score) best = { r1, r2, score };
  }
  if (!best) throw new Error(`ik: tay ${side} không với tới ${target}`);
  return best;
}

// path() của scenes.mjs chỉ đọc M/L/Q nên cung tròn ghép từ các đoạn Q
function arc(cx, cy, r, a0, a1, n = 4) {
  const P = (deg, rr) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy - rr * Math.sin((deg * Math.PI) / 180)].map((v) => v.toFixed(2));
  const step = (a1 - a0) / n, k = r / Math.cos(((step / 2) * Math.PI) / 180);
  let d = `M${P(a0, r).join(' ')}`;
  for (let i = 0; i < n; i++) d += ` Q${P(a0 + step * (i + 0.5), k).join(' ')} ${P(a0 + step * (i + 1), r).join(' ')}`;
  return d;
}
const star = (id, x, y, s, color) => ({ id, type: 'polygon', x, y, closed: true, scaleX: 0, scaleY: 0, fill: { color },
  points: Array.from({ length: 8 }, (_, k) => { const r = k % 2 ? s * 0.19 : s / 2; const t = (k * Math.PI) / 4 - Math.PI / 2; return { x: r * Math.cos(t), y: r * Math.sin(t) }; }) });
const sparks = (list, from) => list.flatMap((_, i) => {
  const t = from + i * 6;
  return [tr(`spark${i}`, 'scaleX', [[0, 0], [t, 0], [t + 10, 1.1], [t + 28, 0]]), tr(`spark${i}`, 'scaleY', [[0, 0], [t, 0], [t + 10, 1.1], [t + 28, 0]]),
    tr(`spark${i}`, 'rotation', [[t, 0], [t + 28, 90]])];
});

// Rive không trả thuộc tính về mặc định khi đổi state nên mọi animation của lớp mood phải key đủ
const full = (base, tracks) => {
  const have = new Set(tracks.map((t) => `${t.target}|${t.property}`));
  return [...tracks, ...Object.entries(base).filter(([k]) => !have.has(k)).map(([k, v]) => { const [t, p] = k.split('|'); return tr(t, p, [[0, v]]); })];
};
const anim = (name, duration, base, tracks, loop = 'oneShot') => ({ name, fps: 60, duration, loop, tracks: full(base, tracks) });
// Bỏ thuộc tính lớp idle đang điều khiển để Lumi vẫn thở khi đứng ở tư thế cuối
const holdOf = (name, src, base, p) => anim(name, 1, base, src.tracks
  .filter((t) => !(t.target === p + 'bar' || (t.target === p + 'shadowG' && t.property === 'scaleX')))
  .map((t) => tr(t.target, t.property, [[0, t.keyframes.at(-1).value]])));
const hopOf = (p, d, withArms) => lumiArtboard.animations.find((an) => an.name === 'celebrate').tracks
  .filter((t) => (withArms ? /^(hop|shadowG|bar|arm|fore)/ : /^(hop|shadowG|bar)$/).test(t.target))
  .map((t) => ({ ...t, target: p + t.target, keyframes: t.keyframes.map((k) => ({ ...k, frame: k.frame + d })) }));
const msOf = (frames) => Math.round((frames / 60) * 1000);

function moodLayer(reacts, extra = []) {
  const states = [{ name: 'rest', animation: 'rest' }];
  const transitions = [{ from: 'entry', to: 'rest' }];
  reacts.forEach(({ name, len, loop }, i) => {
    states.push({ name, animation: name });
    transitions.push({ from: 'rest', to: name, durationMs: 160, condition: { input: 'mood', op: '==', value: i } });
    if (loop) {
      transitions.push({ from: 'rest', to: name, condition: { input: 'mood', op: '==', value: 10 + i } });
      return;
    }
    const hold = name + 'Hold';
    states.push({ name: hold, animation: hold });
    transitions.push({ from: 'rest', to: hold, condition: { input: 'mood', op: '==', value: 10 + i } });
    transitions.push({ from: name, to: hold, durationMs: 200, exitTimeMs: msOf(len) });
  });
  return { name: 'mood', states, transitions: [...transitions, ...extra] };
}

// ═══ Coder: kết quả chấm code ═══
function coder() {
  const p = 'C_', W = 300, H = 200, S = 0.6, R = [84, 186];
  const L = lumi(p, undefined, R[0], R[1], S);
  const T = { x: 226, y: 94, w: 120, h: 88 };
  const BUG0 = [T.x - 28, T.y + 40], BUG1 = [180, R[1] - 6];
  const SCR = ik('L', [-96, -146]); // ngoài quai tai nghe để không bị che
  const SP = [[30, 64, '#fde68a', 18], [150, 34, K.orange, 14], [150, 132, '#93c5fd', 12], [16, 128, K.orange, 11], [98, 22, '#fde68a', 15]];
  const LEGS = [-5, 0, 5];

  const groups = [
    ...L.groups,
    { id: 'sweatG', parent: p + 'bowl', x: -52, y: -96, opacity: 0 },
    { id: 'term', x: T.x, y: T.y },
    { id: 'cursor', parent: 'term', x: -30, y: -7 },
    { id: 'dots', parent: 'term', x: 0, y: 18 },
    { id: 'ckG', parent: 'term', x: 0, y: 12 },
    { id: 'xG', parent: 'term', x: 0, y: 14 },
    { id: 'bug', x: BUG0[0], y: BUG0[1], scaleX: 0, scaleY: 0, opacity: 0 },
    ...LEGS.map((x, i) => ({ id: `leg${i}`, parent: 'bug', x, y: 2 })),
  ];
  const shapes = [
    ...L.shapes,
    path(p + 'browW', p + 'brows', ['M-25 -26 Q-17 -27 -9 -32', 'M9 -32 Q17 -27 25 -26'], { ...stroke(K.deep, 3.8), opacity: 0 }),
    path(p + 'mouthW', p + 'faceLook', 'M-7 17 Q-3.5 13 0 17 Q3.5 21 7 17', { ...stroke(K.deep, 3), opacity: 0 }),
    path('band', p + 'bowl', arc(0, -2, 88, 180, 0), stroke(K.slate, 9)),
    path('bandHi', p + 'bowl', arc(0, -2, 88, 160, 20), { ...stroke('#64748b', 2.2), opacity: 0.7 }),
    path('mic', p + 'bowl', 'M-86 12 Q-80 40 -42 35', stroke(K.slate, 4.5)),
    { id: 'micTip', type: 'ellipse', parent: p + 'bowl', x: -39, y: 35, width: 12, height: 9, fill: { color: K.slate } },
    { id: 'micDot', type: 'ellipse', parent: p + 'bowl', x: -37, y: 34, width: 4, height: 3, fill: { color: K.orange } },
    ...[-1, 1].flatMap((s) => [
      { id: `cup${s}`, type: 'rect', parent: p + 'bowl', x: s * 88, y: 2, width: 20, height: 38, cornerRadius: 9, fill: lin([[K.line, 0], [K.slate, 1]], { x: 0, y: -19 }, { x: 0, y: 19 }) },
      { id: `pad${s}`, type: 'rect', parent: p + 'bowl', x: s * 80, y: 2, width: 7, height: 28, cornerRadius: 3.5, fill: { color: K.orange } },
    ]),
    path('sweat', 'sweatG', 'M0 -8 Q7 2 0 6 Q-7 2 0 -8 Z', { fill: { color: '#e0f2fe' }, stroke: { color: K.blue, thickness: 1.6, join: 'round' } }),
    // Viền sáng để terminal không chìm vào nền tối
    { id: 'termBox', type: 'rect', parent: 'term', x: 0, y: 0, width: T.w, height: T.h, cornerRadius: 12,
      fill: lin([[K.slate, 0], [K.ink, 1]], { x: 0, y: -T.h / 2 }, { x: 0, y: T.h / 2 }), stroke: { color: K.mute, thickness: 2 } },
    path('termBar', 'term', `M${-T.w / 2 + 2} -26 L${T.w / 2 - 2} -26`, stroke(K.line, 1.6)),
    ...[-46, -37, -28].map((x, i) => ({ id: `light${i}`, type: 'ellipse', parent: 'term', x, y: -35, width: 6, height: 6, fill: { color: K.mute } })),
    path('prompt', 'term', 'M-47 -16 L-41 -11 L-47 -6', stroke(K.blue, 3)),
    { id: 'cursorS', type: 'rect', parent: 'cursor', x: 0, y: 0, width: 10, height: 3.5, cornerRadius: 1, fill: { color: '#e2e8f0' } },
    ...[-26, 0, 26].flatMap((x, i) => [
      { id: `td${i}`, type: 'rect', parent: 'dots', x, y: 0, width: 17, height: 17, cornerRadius: 4.5, fill: { color: K.line } },
      { id: `tdOn${i}`, type: 'rect', parent: 'dots', x, y: 0, width: 17, height: 17, cornerRadius: 4.5, opacity: 0, fill: { color: K.blue } },
    ]),
    { id: 'ckGlow', type: 'ellipse', parent: 'ckG', x: 0, y: 0, width: 76, height: 76, opacity: 0, fill: rad([[a(K.ok, 0.35), 0], [a(K.ok, 0), 1]], { x: 0, y: 0 }, { x: 38, y: 0 }) },
    path('ck', 'ckG', 'M-17 1 L-5 13 L18 -12', stroke(K.ok, 8, { trim: { start: 0, end: 0 } })),
    { id: 'xGlow', type: 'ellipse', parent: 'xG', x: 0, y: 0, width: 72, height: 72, opacity: 0, fill: rad([[a(K.bad, 0.32), 0], [a(K.bad, 0), 1]], { x: 0, y: 0 }, { x: 36, y: 0 }) },
    path('xA', 'xG', 'M-12 -12 L12 12', stroke(K.bad, 8, { trim: { start: 0, end: 0 } })),
    path('xB', 'xG', 'M12 -12 L-12 12', stroke(K.bad, 8, { trim: { start: 0, end: 0 } })),
    ...LEGS.map((_, i) => path(`legS${i}`, `leg${i}`, 'M0 0 L-2.5 7', stroke('#64748b', 2))),
    { id: 'shell', type: 'ellipse', parent: 'bug', x: 2, y: -3, width: 20, height: 14, fill: rad([['#fb7185', 0], [K.bad, 0.55], ['#b91c1c', 1]], { x: -2, y: -6 }, { x: 10, y: 4 }) },
    path('shellLine', 'bug', 'M2 -10 L2 4', stroke('#7f1d1d', 1.4)),
    ...[[-3, -5], [7, -5], [5, 0]].map(([x, y], i) => ({ id: `spot${i}`, type: 'ellipse', parent: 'bug', x, y, width: 3.6, height: 3.6, fill: { color: K.slate } })),
    { id: 'bugHead', type: 'ellipse', parent: 'bug', x: -9, y: -1, width: 10, height: 9, fill: { color: K.line }, stroke: { color: '#64748b', thickness: 1.2 } },
    { id: 'bugEye', type: 'ellipse', parent: 'bug', x: -11, y: -2, width: 3.2, height: 3.2, fill: { color: '#ffffff' } },
    path('antenna', 'bug', ['M-11 -4 Q-14 -11 -18 -11', 'M-8 -5 Q-9 -12 -12 -14'], stroke('#64748b', 1.5)),
    ...SP.map(([x, y, c, s], i) => star(`spark${i}`, x, y, s, c)),
  ];

  const B = {
    [`${p}armL|rotation`]: 28, [`${p}foreL|rotation`]: -16, [`${p}armR|rotation`]: -18, [`${p}foreR|rotation`]: 28,
    [`${p}hop|y`]: 0, [`${p}hop|rotation`]: 0, [`${p}hop|scaleX`]: 1, [`${p}hop|scaleY`]: 1, [`${p}shadowG|opacity`]: 1,
    [`${p}eyesOpen|opacity`]: 1, [`${p}eyesOpen|scaleX`]: 1, [`${p}eyesOpen|scaleY`]: 1, [`${p}eyesHappy|opacity`]: 0,
    [`${p}mouth|opacity`]: 1, [`${p}mouthOpen|opacity`]: 0, [`${p}mouthW|opacity`]: 0, [`${p}cheeks|opacity`]: 0.6,
    [`${p}brows|y`]: 0, [`${p}browS|opacity`]: 1, [`${p}browW|opacity`]: 0,
    [`${p}pupils|x`]: 2, [`${p}pupils|y`]: -1, [`${p}faceLook|x`]: 2, [`${p}faceLook|y`]: 0,
    'dots|opacity': 1, 'tdOn0|opacity': 0, 'tdOn1|opacity': 0, 'tdOn2|opacity': 0,
    'ck|trimEnd': 0, 'ckGlow|opacity': 0, 'xA|trimEnd': 0, 'xB|trimEnd': 0, 'xGlow|opacity': 0,
    'bug|x': BUG0[0], 'bug|y': BUG0[1], 'bug|opacity': 0, 'bug|scaleX': 0, 'bug|scaleY': 0,
    ...Object.fromEntries(LEGS.map((_, i) => [`leg${i}|rotation`, 0])),
    'sweatG|opacity': 0, 'sweatG|y': -96,
    ...Object.fromEntries(SP.flatMap((_, i) => [[`spark${i}|scaleX`, 0], [`spark${i}|scaleY`, 0]])),
  };

  const grading = anim('grading', 120, B, [
    tr(p + 'hop', 'rotation', [[0, 3]]),
    tr(p + 'armR', 'rotation', [[0, -36]]),
    tr(p + 'foreR', 'rotation', [[0, -48], [8, -32], [16, -48], [30, -48], [38, -32], [46, -48], [60, -48], [68, -32], [76, -48], [90, -48], [98, -32], [106, -48], [120, -48]]),
    tr(p + 'faceLook', 'x', [[0, 4]]), tr(p + 'faceLook', 'y', [[0, -2]]),
    tr(p + 'pupils', 'x', [[0, 1], [14, 1], [20, 3], [39, 3], [45, 4.5], [64, 4.5], [104, 4.5], [116, 1], [120, 1]]),
    tr(p + 'pupils', 'y', [[0, -2]]),
    ...[10, 35, 60].map((t, i) => tr(`tdOn${i}`, 'opacity', [[0, 0], [t, 0], [t + 6, 1], [100, 1], [108, 0], [120, 0]])),
  ], 'loop');

  const win = anim('win', 120, B, [
    ...hopOf(p, 6, true),
    tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [10, 0, 'hold'], [96, 1]]),
    tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [10, 1, 'hold'], [96, 0]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [10, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 0, 'hold'], [10, 1]]),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [14, 0.95], [120, 0.85]]), tr(p + 'brows', 'y', [[0, 0], [14, -4], [120, -2]]),
    tr(p + 'pupils', 'x', [[0, 4], [96, 4], [114, 0]]), tr(p + 'pupils', 'y', [[0, -2], [96, -2], [114, 0]]),
    tr(p + 'faceLook', 'x', [[0, 3], [96, 3], [114, 0]]),
    tr('dots', 'opacity', [[0, 1], [8, 0]]),
    tr('ck', 'trimEnd', [[0, 0], [4, 0, 'out'], [22, 1]]),
    tr('ckGlow', 'opacity', [[0, 0], [10, 0], [26, 1], [60, 0.6], [120, 0.75]]),
    ...sparks(SP, 22),
  ]);

  const scratch = [[0, 28], [58, 28, 'out'], [84, SCR.r1], [152, SCR.r1], [178, 28]];
  const scratchF = [[0, -16], [58, -16, 'out'], [84, SCR.r2]];
  for (let f = 92, k = 0; f <= 148; f += 8, k++) scratchF.push([f, SCR.r2 + (k % 2 ? -14 : 10)]);
  scratchF.push([152, SCR.r2], [178, -16]);
  const crawl = (i) => { const k = [[0, 0], [66, 0, 'linear']]; for (let f = 72, j = i; f <= 132; f += 6, j++) k.push([f, j % 2 ? -24 : 22, 'linear']); k.push([138, 0]); return k; };
  const fail = anim('fail', 200, B, [
    tr('dots', 'opacity', [[0, 1], [8, 0]]),
    tr('xA', 'trimEnd', [[0, 0], [4, 0, 'out'], [14, 1]]), tr('xB', 'trimEnd', [[0, 0], [12, 0, 'out'], [22, 1]]),
    tr('xGlow', 'opacity', [[0, 0], [8, 0], [22, 0.9], [200, 0.7]]),
    tr(p + 'eyesOpen', 'scaleX', [[0, 1], [14, 1, 'out'], [20, 1.16], [46, 1.04], [200, 1]]),
    tr(p + 'eyesOpen', 'scaleY', [[0, 1], [14, 1, 'out'], [20, 1.16], [46, 1.04], [200, 1]]),
    tr(p + 'hop', 'y', [[0, 0], [12, 0, 'out'], [18, -7, 'in'], [26, 0]]),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [16, 0]]), tr(p + 'browW', 'opacity', [[0, 0, 'hold'], [16, 1]]),
    tr(p + 'brows', 'y', [[0, 0], [16, -3], [200, -1]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [16, 0]]), tr(p + 'mouthW', 'opacity', [[0, 0, 'hold'], [16, 1]]),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [30, 0.35]]),
    tr(p + 'faceLook', 'x', [[0, 4], [44, 4], [70, 4]]), tr(p + 'faceLook', 'y', [[0, -2], [44, -2], [70, 2]]),
    tr(p + 'pupils', 'x', [[0, 4], [44, 4], [70, 4.5], [134, 3]]), tr(p + 'pupils', 'y', [[0, -2], [44, -2], [70, 3]]),
    tr(p + 'armL', 'rotation', scratch), tr(p + 'foreL', 'rotation', scratchF),
    tr('sweatG', 'opacity', [[0, 0], [86, 0], [92, 1], [140, 1], [156, 0]]), tr('sweatG', 'y', [[0, -96], [86, -96], [156, -78]]),
    tr('bug', 'opacity', [[0, 0, 'hold'], [36, 1]]),
    tr('bug', 'scaleX', [[0, 0], [36, 0, 'back'], [50, 1.3]]), tr('bug', 'scaleY', [[0, 0], [36, 0, 'back'], [50, 1.3]]),
    tr('bug', 'y', [[0, BUG0[1]], [50, BUG0[1], 'in'], [62, BUG1[1]], [66, BUG1[1] - 3], [70, BUG1[1]]]),
    tr('bug', 'x', [[0, BUG0[0]], [66, BUG0[0], 'linear'], [132, BUG1[0], 'out'], [138, BUG1[0]]]),
    ...LEGS.map((_, i) => tr(`leg${i}`, 'rotation', crawl(i))),
  ]);

  const extra = [
    { from: 'grading', to: 'win', durationMs: 120, condition: { input: 'mood', op: '==', value: 1 } },
    { from: 'grading', to: 'fail', durationMs: 120, condition: { input: 'mood', op: '==', value: 2 } },
    { from: 'grading', to: 'winHold', durationMs: 120, condition: { input: 'mood', op: '==', value: 11 } },
    { from: 'grading', to: 'failHold', durationMs: 120, condition: { input: 'mood', op: '==', value: 12 } },
    // Đổi bài nộp giữa lúc đang diễn thì chuyển ngay
    ...['win', 'fail'].flatMap((r) => [
      { from: r, to: 'grading', durationMs: 160, condition: { input: 'mood', op: '==', value: 0 } },
      { from: r, to: 'grading', condition: { input: 'mood', op: '==', value: 10 } },
      { from: r, to: 'winHold', durationMs: 160, condition: { input: 'mood', op: '==', value: 11 } },
      { from: r, to: 'failHold', durationMs: 160, condition: { input: 'mood', op: '==', value: 12 } },
    ]),
    ...['winHold', 'failHold'].flatMap((h) => [
      { from: h, to: 'grading', durationMs: 160, condition: { input: 'mood', op: '==', value: 0 } },
      { from: h, to: 'grading', condition: { input: 'mood', op: '==', value: 10 } },
      { from: h, to: h === 'winHold' ? 'failHold' : 'winHold', durationMs: 160, condition: { input: 'mood', op: '==', value: h === 'winHold' ? 12 : 11 } },
    ]),
  ];
  const mood = moodLayer([{ name: 'grading', loop: true }, { name: 'win', len: 120 }, { name: 'fail', len: 200 }], extra);

  return { name: 'Coder', width: W, height: H, groups, shapes, animations: [
    anim('rest', 1, B, []), grading, win, fail, holdOf('winHold', win, B, p), holdOf('failHold', fail, B, p),
    { name: 'cursor', fps: 60, duration: 60, loop: 'loop', tracks: [tr('cursor', 'opacity', [[0, 1, 'hold'], [30, 0, 'hold'], [60, 1]])] },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: { name: 'Coder', inputs: [{ name: 'mood', type: 'number', initial: -1 }], layers: [
    { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
    { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
    { name: 'cursor', states: [{ name: 'cursor', animation: 'cursor' }], transitions: [{ from: 'entry', to: 'cursor' }] },
    mood,
  ] } };
}

// ═══ Examiner: kết quả bài đánh giá kỹ năng ═══
function examiner() {
  const p = 'E_', W = 280, H = 210, S = 0.42, GROUND = 200, CX = 140;
  const LOW = 0.14, HIGH = 1.1; // scaleY của núi ở 0% và 100%
  const HOLD = { armL: 40, foreL: 130 };
  const SHOW = { armL: 62, foreL: 116 };
  const L = lumi(p, undefined, CX, GROUND - 100 * LOW, S, HOLD);
  // Toạ độ của Lumi nên sao đi theo Lumi
  const SP = [[-130, -170, '#fde68a', 40], [120, -196, K.orange, 32], [150, -110, '#93c5fd', 28], [-150, -90, K.orange, 26], [0, -205, '#fde68a', 34]];
  const tiltOf = (pose) => -(pose.armL + pose.foreL) - 6;
  const boardAt = rot(-(HOLD.armL + HOLD.foreL), [4, -14]);
  const ARM_L = ['upperL', 'elbowL', 'lowerL'].map((s) => p + s), HAND_L = ['palmL', 'thumbL'].map((s) => p + s);
  const PEAK = 'M-110 0 L-70 -42 L-52 -36 L-20 -96 Q0 -103 20 -96 L58 -48 L74 -54 L110 0 Z';
  const FLAG_X = 48, FLAG_Y = -60.6;
  const PINES = [[30, 0.9], [46, 1.12], [236, 1], [252, 0.8]];
  const ROCKS = [[16, -6, 9, 7], [26, 2, 7, 6], [8, 8, 6, 5]]; // [x, y, w, h] tính từ đỉnh núi

  const groups = [
    { id: 'cloud', x: 52, y: 54 },
    { id: 'mtn', x: CX, y: GROUND, scaleY: LOW },
    ...PINES.map(([x, k], i) => ({ id: `pine${i}`, x, y: GROUND, scaleX: k, scaleY: k })),
    { id: 'slide', x: CX, y: GROUND - 100 * LOW },
    ...ROCKS.map(([x, y], i) => ({ id: `rock${i}`, parent: 'slide', x, y, opacity: 0 })),
    { id: 'flagG', x: CX + FLAG_X, y: GROUND + FLAG_Y * LOW, opacity: 0 },
    { id: 'flagDrop', parent: 'flagG', x: 0, y: 0 },
    { id: 'clothWave', parent: 'flagDrop', x: 0, y: -56 },
    { id: 'cloth', parent: 'clothWave', x: 0, y: 0 },
    ...L.groups,
    { id: 'board', parent: p + 'handL', x: boardAt[0], y: boardAt[1], rotation: tiltOf(HOLD) },
    { id: 'glintL', parent: p + 'faceLook', x: -45, y: -5 },
    { id: 'glintR', parent: p + 'faceLook', x: -14, y: -5 },
    { id: 'fx', parent: p + 'hop', x: 0, y: 0 },
  ];
  const lens = (s, x) => [
    { id: `lens${s}`, type: 'ellipse', parent: p + 'faceLook', x, y: -5, width: 29, height: 29, fill: { color: a('#bfdbfe', 0.16) } },
    path(`glint${s}S`, `glint${s}`, ['M-3 9 L7 -9', 'M3 11 L9 0'], { ...stroke('#ffffff', 2.6), opacity: 0.85, clipBy: `lens${s}` }),
    { id: `rim${s}`, type: 'ellipse', parent: p + 'faceLook', x, y: -5, width: 29, height: 29, stroke: { color: K.deep, thickness: 2.6 } },
  ];
  const shapes = [
    // Màu có alpha để hợp cả nền sáng lẫn tối
    ...[[0, 0, 34, 18], [14, -7, 26, 20], [-13, 2, 20, 13]].map(([x, y, w, h], i) => ({ id: `cloudS${i}`, type: 'ellipse', parent: 'cloud', x, y, width: w, height: h, fill: { color: a(K.gray, 0.2) } })),
    { id: 'ground', type: 'rect', x: CX, y: GROUND + 3, width: 256, height: 6, cornerRadius: 3, fill: { color: a(K.gray, 0.28) } },
    // Viền để mép núi không chìm vào nền trắng
    path('mtnS', 'mtn', PEAK, { fill: lin([['#8fa3c0', 0], ['#5b6f8f', 1]], { x: 0, y: -100 }, { x: 0, y: 0 }), stroke: { color: a('#475569', 0.6), thickness: 1.5, join: 'round' } }),
    path('mtnShade', 'mtn', 'M2 -100 L20 -96 L58 -48 L74 -54 L110 0 L18 0 L-4 -52 Z', { fill: { color: a('#1e293b', 0.22) } }),
    path('mtnRidge', 'mtn', 'M-52 -36 L-36 -20 M-70 -42 L-84 -18', { ...stroke(a('#ffffff', 0.25), 2), opacity: 0.8 }),
    path('trail', 'mtn', 'M-64 -4 L-14 -18 L-50 -34 L-10 -50 L-34 -64 L-8 -82', { ...stroke(a('#e2e8f0', 0.6), 1.8), opacity: 0.9 }),
    path('snow', 'mtn', 'M-33 -72 L-20 -96 Q0 -103 20 -96 L39 -72 L28 -65 L18 -73 L8 -63 L-4 -72 L-16 -64 L-24 -73 Z',
      { fill: lin([['#ffffff', 0], ['#dbeafe', 1]], { x: 0, y: -100 }, { x: 0, y: -64 }), opacity: 0 }),
    ...PINES.flatMap((_, i) => [
      { id: `trunk${i}`, type: 'rect', parent: `pine${i}`, x: 0, y: -3, width: 3.5, height: 7, fill: { color: '#7c5a3a' } },
      path(`pineS${i}`, `pine${i}`, ['M0 -38 L9 -22 L-9 -22 Z', 'M0 -30 L12 -12 L-12 -12 Z', 'M0 -20 L14 -4 L-14 -4 Z'],
        { fill: lin([['#4b8a74', 0], ['#24544a', 1]], { x: 0, y: -38 }, { x: 0, y: -4 }) }),
    ]),
    { id: 'stone0', type: 'ellipse', x: 70, y: GROUND - 2, width: 12, height: 7, fill: { color: '#94a3b8' } },
    { id: 'stone1', type: 'ellipse', x: 212, y: GROUND - 2, width: 9, height: 6, fill: { color: '#a3b1c6' } },
    ...ROCKS.map(([, , w, h], i) => ({ id: `rockS${i}`, type: 'ellipse', parent: `rock${i}`, x: 0, y: 0, width: w, height: h,
      fill: lin([['#a3b1c6', 0], ['#64748b', 1]], { x: 0, y: -h / 2 }, { x: 0, y: h / 2 }) })),
    path('pole', 'flagDrop', 'M0 0 L0 -58', stroke('#64748b', 2.4)),
    { id: 'knob', type: 'ellipse', parent: 'flagDrop', x: 0, y: -59, width: 5, height: 5, fill: { color: '#fbbf24' } },
    path('clothS', 'cloth', 'M0 0 Q14 -3 28 1 Q22 8 28 15 Q14 12 0 15 Z', { fill: lin([[K.blue, 0], ['#2563eb', 1]], { x: 0, y: 0 }, { x: 28, y: 15 }) }),
    { id: 'clothA', type: 'ellipse', parent: 'cloth', x: 11, y: 8, width: 8, height: 8, stroke: { color: '#ffffff', thickness: 2.2 } },
    { id: 'clothBar', type: 'rect', parent: 'cloth', x: 16.2, y: 8.5, width: 2.4, height: 9, cornerRadius: 1.2, fill: { color: '#ffffff' } },
    ...L.shapes.filter((s) => !ARM_L.includes(s.id) && !HAND_L.includes(s.id)),
    path(p + 'browD', p + 'brows', ['M-25 -31 Q-17 -31 -9 -26', 'M9 -26 Q17 -31 25 -31'], { ...stroke(K.deep, 3.8), opacity: 0 }),
    ...lens('L', -15.5), ...lens('R', 15.5),
    path('bridge', p + 'faceLook', 'M-2 -8 Q0 -10.5 2 -8', stroke(K.deep, 2.4)),
    path('temples', p + 'faceLook', ['M-30 -7 L-41 -10', 'M30 -7 L41 -10'], stroke(K.deep, 2.4)),
    // Tay trái vẽ đè lên thân vì đang cầm bảng kẹp phía trước
    ...L.shapes.filter((s) => ARM_L.includes(s.id)),
    { id: 'bdBack', type: 'rect', parent: 'board', x: 0, y: 0, width: 36, height: 46, cornerRadius: 5, fill: lin([['#f59e0b', 0], ['#b45309', 1]], { x: -18, y: -23 }, { x: 18, y: 23 }) },
    { id: 'bdPaper', type: 'rect', parent: 'board', x: 0, y: 3, width: 29, height: 37, cornerRadius: 2, fill: { color: K.paper } },
    path('bdLines', 'board', ['M-3 -6 L9 -6', 'M-3 2 L9 2', 'M-3 10 L6 10'], stroke(K.gray, 2.2)),
    path('bdTicks', 'board', ['M-10.5 -6 L-8.5 -4 L-5.5 -8', 'M-10.5 2 L-8.5 4 L-5.5 0', 'M-10.5 10 L-8.5 12 L-5.5 8'], stroke('#2563eb', 1.8)),
    { id: 'bdClip', type: 'rect', parent: 'board', x: 0, y: -22, width: 15, height: 7, cornerRadius: 2.5, fill: { color: K.mute } },
    { id: 'bdClipHi', type: 'rect', parent: 'board', x: 0, y: -23.5, width: 9, height: 2, cornerRadius: 1, fill: { color: '#cbd5e1' } },
    ...L.shapes.filter((s) => HAND_L.includes(s.id)),
    ...SP.map(([x, y, c, s], i) => ({ ...star(`spark${i}`, x, y, s, c), parent: 'fx' })),
  ];

  const B = {
    [`${p}armL|rotation`]: HOLD.armL, [`${p}foreL|rotation`]: HOLD.foreL, 'board|rotation': tiltOf(HOLD),
    [`${p}armR|rotation`]: -18, [`${p}foreR|rotation`]: 28,
    [`${p}hop|y`]: 0, [`${p}hop|rotation`]: 0, [`${p}hop|scaleX`]: 1, [`${p}hop|scaleY`]: 1,
    [`${p}eyesOpen|opacity`]: 1, [`${p}eyesOpen|scaleX`]: 1, [`${p}eyesOpen|scaleY`]: 1, [`${p}eyesHappy|opacity`]: 0,
    [`${p}mouth|opacity`]: 1, [`${p}mouthOpen|opacity`]: 0,
    [`${p}cheeks|opacity`]: 0.6, [`${p}brows|y`]: 0, [`${p}browS|opacity`]: 1, [`${p}browD|opacity`]: 0,
    [`${p}pupils|x`]: 0, [`${p}pupils|y`]: 0, [`${p}faceLook|x`]: 0, [`${p}faceLook|y`]: 0,
    'glintL|x': -45, 'glintR|x': -14,
    ...Object.fromEntries(ROCKS.flatMap(([x, y], i) => [[`rock${i}|x`, x], [`rock${i}|y`, y], [`rock${i}|opacity`, 0], [`rock${i}|rotation`, 0]])),
    ...Object.fromEntries(SP.flatMap((_, i) => [[`spark${i}|scaleX`, 0], [`spark${i}|scaleY`, 0]])),
  };
  const glint = (t) => [tr('glintL', 'x', [[0, -45], [t, -45, 'out'], [t + 22, 6]]), tr('glintR', 'x', [[0, -14], [t + 4, -14, 'out'], [t + 26, 37]])];
  // 60 khung = 1s, khớp tween level của trang
  const rise = [
    tr(p + 'hop', 'scaleY', [[0, 1], [8, 0.9], [56, 0.93], [62, 1.06], [70, 1]]),
    tr(p + 'hop', 'scaleX', [[0, 1], [8, 1.08], [56, 1.06], [62, 0.96], [70, 1]]),
    tr(p + 'pupils', 'y', [[0, 0], [8, -3], [56, -3], [66, 0]]),
  ];
  const balanceR = [[0, -18], [8, -52], [56, -48, 'out']];
  const smileOpen = (from) => [
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [from, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 0, 'hold'], [from, 1]]),
  ];

  const first = anim('first', 160, B, [
    ...rise,
    tr(p + 'armR', 'rotation', [...balanceR, [70, -18]]),
    ...glint(66),
    tr(p + 'armL', 'rotation', [[0, HOLD.armL], [70, HOLD.armL, 'out'], [88, SHOW.armL], [126, SHOW.armL], [150, HOLD.armL]]),
    tr(p + 'foreL', 'rotation', [[0, HOLD.foreL], [70, HOLD.foreL, 'out'], [88, SHOW.foreL], [126, SHOW.foreL], [150, HOLD.foreL]]),
    tr('board', 'rotation', [[0, tiltOf(HOLD)], [70, tiltOf(HOLD), 'out'], [88, tiltOf(SHOW) + 8], [126, tiltOf(SHOW) + 8], [150, tiltOf(HOLD)]]),
    ...smileOpen(62),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [70, 0.85]]),
  ]);
  const up = anim('up', 170, B, [
    ...rise,
    tr(p + 'armR', 'rotation', [...balanceR, [74, -166], [84, -124], [92, -166], [100, -124], [108, -166], [134, -160], [160, -18]]),
    tr(p + 'foreR', 'rotation', [[0, 28], [8, 10], [56, 10, 'out'], [74, -4], [134, -4], [160, 28]]),
    tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [62, 0, 'hold'], [134, 1]]),
    tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [62, 1, 'hold'], [134, 0]]),
    ...smileOpen(62),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [66, 0.95], [170, 0.85]]), tr(p + 'brows', 'y', [[0, 0], [66, -4], [170, -2]]),
    ...sparks(SP, 64),
  ]);
  const flexF = [[0, 28], [8, 6], [56, 6, 'out'], [84, -96]];
  for (let f = 96, k = 0; f <= 132; f += 12, k++) flexF.push([f, k % 2 ? -96 : -78]);
  flexF.push([150, -90], [172, 28]);
  const down = anim('down', 180, B, [
    tr(p + 'hop', 'rotation', [[0, 0], [10, -7], [22, 6], [34, -4], [46, 3], [60, 0]]),
    tr(p + 'hop', 'y', [[0, 0], [6, -5, 'in'], [14, 0]]),
    tr(p + 'eyesOpen', 'scaleX', [[0, 1], [6, 1.14], [50, 1.1], [64, 1]]), tr(p + 'eyesOpen', 'scaleY', [[0, 1], [6, 1.14], [50, 1.1], [64, 1]]),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [62, 0]]), tr(p + 'browD', 'opacity', [[0, 0, 'hold'], [62, 1]]),
    tr(p + 'brows', 'y', [[0, 0], [8, -3], [56, -3], [64, 1.5]]),
    tr(p + 'armR', 'rotation', [[0, -18], [8, -64], [56, -56, 'out'], [84, -104], [150, -104], [172, -18]]),
    tr(p + 'foreR', 'rotation', flexF),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [70, 0.75]]),
    tr(p + 'faceLook', 'y', [[0, 0], [154, 0], [162, 3], [170, 0]]),
    ...ROCKS.flatMap(([x, y], i) => {
      const t = 4 + i * 9, dx = 44 + i * 10;
      return [
        tr(`rock${i}`, 'opacity', [[0, 0, 'hold'], [t, 1], [t + 40, 1], [t + 52, 0]]),
        tr(`rock${i}`, 'x', [[0, x], [t, x, 'linear'], [t + 52, x + dx]]),
        tr(`rock${i}`, 'y', [[0, y], [t, y, 'in'], [t + 22, y + 34, 'out'], [t + 30, y + 26, 'in'], [t + 42, y + 52, 'out'], [t + 47, y + 48, 'in'], [t + 52, y + 58]]),
        tr(`rock${i}`, 'rotation', [[0, 0], [t, 0, 'linear'], [t + 52, 300 + i * 90]]),
      ];
    }),
  ]);
  const same = anim('same', 120, B, [
    ...glint(4),
    tr(p + 'faceLook', 'y', [[0, 0], [34, 0], [42, 3], [50, 0], [58, 3], [66, 0]]),
    tr(p + 'hop', 'scaleY', [[0, 1], [38, 0.98], [46, 1], [54, 0.98], [62, 1]]),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [40, 0.75]]),
  ]);

  const reacts = [first, up, down, same];
  const lv = (k) => [tr('mtn', 'scaleY', [[0, k]]), tr(p + 'lumi', 'y', [[0, GROUND - 100 * k]]),
    tr('slide', 'y', [[0, GROUND - 100 * k]]), tr('flagG', 'y', [[0, GROUND + FLAG_Y * k]])];
  const peak = (name, len, snow, flag, drop, cloth) => ({ name, fps: 60, duration: len, loop: 'oneShot', tracks: [
    tr('snow', 'opacity', snow), tr('flagG', 'opacity', flag), tr('flagDrop', 'y', drop), tr('cloth', 'scaleX', cloth)] });
  return { name: 'Examiner', width: W, height: H, groups, shapes, animations: [
    anim('rest', 1, B, []), ...reacts, ...reacts.map((r) => holdOf(r.name + 'Hold', r, B, p)),
    { name: 'lv0', fps: 60, duration: 1, loop: 'oneShot', tracks: lv(LOW) },
    { name: 'lv100', fps: 60, duration: 1, loop: 'oneShot', tracks: lv(HIGH) },
    peak('peakOff', 1, [[0, 0]], [[0, 0]], [[0, 0]], [[0, 1]]),
    peak('peakIn', 48, [[0, 0], [24, 1]], [[0, 0, 'hold'], [8, 1]], [[0, -44], [8, -44, 'in'], [20, 0, 'out'], [26, -4, 'in'], [32, 0]], [[0, 0], [20, 0, 'back'], [40, 1]]),
    peak('peakStill', 1, [[0, 1]], [[0, 1]], [[0, 0]], [[0, 1]]),
    peak('peakOut', 18, [[0, 1], [18, 0]], [[0, 1], [12, 0]], [[0, 0]], [[0, 1]]),
    { name: 'wave', fps: 60, duration: 150, loop: 'loop', tracks: [
      tr('clothWave', 'rotation', [[0, 0], [75, -6], [150, 0]]), tr('clothWave', 'scaleX', [[0, 1], [38, 0.92], [75, 1], [112, 0.95], [150, 1]])] },
    { name: 'drift', fps: 60, duration: 600, loop: 'loop', tracks: [tr('cloud', 'x', [[0, 52], [300, 66], [600, 52]])] },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: { name: 'Examiner', inputs: [
    { name: 'mood', type: 'number', initial: -1 }, { name: 'level', type: 'number', initial: 0 }, { name: 'peak', type: 'number', initial: 0 },
  ], layers: [
    { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
    { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
    { name: 'drift', states: [{ name: 'drift', animation: 'drift' }], transitions: [{ from: 'entry', to: 'drift' }] },
    { name: 'wave', states: [{ name: 'wave', animation: 'wave' }], transitions: [{ from: 'entry', to: 'wave' }] },
    // Blend 1D trộn từ giá trị khung trước nên lệch phi tuyến; lớp này đặt lại về 0% mỗi khung
    { name: 'levelBase', states: [{ name: 'lv0', animation: 'lv0' }], transitions: [{ from: 'entry', to: 'lv0' }] },
    { name: 'level', states: [{ name: 'lv', blend1d: { input: 'level', animations: [{ animation: 'lv0', value: 0 }, { animation: 'lv100', value: 100 }] } }], transitions: [{ from: 'entry', to: 'lv' }] },
    { name: 'peak', states: ['peakOff', 'peakIn', 'peakStill', 'peakOut'].map((n) => ({ name: n, animation: n })), transitions: [
      { from: 'entry', to: 'peakOff' },
      { from: 'peakOff', to: 'peakIn', condition: { input: 'peak', op: '==', value: 1 } },
      { from: 'peakOff', to: 'peakStill', condition: { input: 'peak', op: '==', value: 2 } },
      { from: 'peakIn', to: 'peakOut', condition: { input: 'peak', op: '==', value: 0 } },
      { from: 'peakStill', to: 'peakOut', condition: { input: 'peak', op: '==', value: 0 } },
      { from: 'peakOut', to: 'peakOff', exitTimeMs: msOf(18) },
      { from: 'peakOut', to: 'peakIn', condition: { input: 'peak', op: '==', value: 1 } },
    ] },
    moodLayer(reacts.map((r) => ({ name: r.name, len: r.duration }))),
  ] } };
}

export const coderArtboard = coder();
export const examinerArtboard = examiner();
