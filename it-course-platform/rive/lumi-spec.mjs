// Scene spec cho rive-mcp-server: Lumi (chữ "a" có khối) + animation + state machine.
// Toạ độ y như bản dựng trong Rive Editor; gốc = mặt đất giữa chân.

const C = { hi: '#60a5fa', mid: '#2563eb', deep: '#1e3a8a', navy: '#172554', ink: '#0b1437', glow: '#93c5fd', white: '#ffffff' };
const lin = (stops, start, end) => ({ gradient: { type: 'linear', stops: stops.map(([color, position]) => ({ color, position })), start, end } });
const rad = (stops, start, end) => ({ gradient: { type: 'radial', stops: stops.map(([color, position]) => ({ color, position })), start, end } });
const a = (hex, alpha) => '#' + Math.round(alpha * 255).toString(16).padStart(2, '0') + hex.slice(1); // #AARRGGBB

// Path kiểu SVG (M/L/Q/C/Z, toạ độ tuyệt đối) → subpaths với tay nắm bezier cho writer
function sub(d) {
  const t = d.match(/[MLQCZ]|-?\d*\.?\d+/gi); let i = 0, op = '';
  const n = () => parseFloat(t[i++]);
  const pts = []; let closed = false;
  const deg = (dx, dy) => (Math.atan2(dy, dx) * 180) / Math.PI;
  while (i < t.length) {
    if (/[MLQCZ]/i.test(t[i])) op = t[i++].toUpperCase();
    if (op === 'M' || op === 'L') { pts.push({ x: n(), y: n(), in: null, out: null }); op = 'L'; }
    else if (op === 'Q' || op === 'C') {
      const p0 = pts[pts.length - 1];
      let c1, c2, x, y;
      if (op === 'Q') { const qx = n(), qy = n(); x = n(); y = n(); c1 = [p0.x + (2 / 3) * (qx - p0.x), p0.y + (2 / 3) * (qy - p0.y)]; c2 = [x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y)]; }
      else { c1 = [n(), n()]; c2 = [n(), n()]; x = n(); y = n(); }
      p0.out = c1; pts.push({ x, y, in: c2, out: null });
    } else if (op === 'Z') { closed = true; op = ''; }
  }
  // Path khép kín mà điểm cuối trùng điểm đầu: gộp lại
  if (closed && pts.length > 1) { const f = pts[0], l = pts[pts.length - 1]; if (Math.abs(f.x - l.x) < 1e-6 && Math.abs(f.y - l.y) < 1e-6) { f.in = l.in; pts.pop(); } }
  return { closed, points: pts.map((p) => {
    if (!p.in && !p.out) return { x: p.x, y: p.y };
    const o = p.out ? [p.out[0] - p.x, p.out[1] - p.y] : null;
    const ii = p.in ? [p.in[0] - p.x, p.in[1] - p.y] : null;
    return { x: p.x, y: p.y, cubic: {
      rotation: o ? deg(...o) : deg(-ii[0], -ii[1]), outDistance: o ? Math.hypot(...o) : 0,
      inRotation: ii ? deg(...ii) : deg(-o[0], -o[1]), inDistance: ii ? Math.hypot(...ii) : 0,
    } };
  }) };
}
const path = (id, parent, d, paint) => ({ id, type: 'polygon', parent, x: 0, y: 0, subpaths: [].concat(d).map(sub), ...paint });
const stroke = (color, thickness) => ({ stroke: { color, thickness, cap: 'round', join: 'round' } });

// Sao 4 cánh (polygon 8 đỉnh)
const star = (id, parent, x, y, s, color) => ({ id, type: 'polygon', parent, x, y, closed: true, fill: { color },
  points: Array.from({ length: 8 }, (_, k) => { const r = k % 2 ? s * 0.19 : s / 2; const t = (k * Math.PI) / 4 - Math.PI / 2; return { x: r * Math.cos(t), y: r * Math.sin(t) }; }) });

const tube = (w) => lin([[C.hi, 0], [C.mid, 0.42], [C.deep, 1]], { x: -w / 2, y: 0 }, { x: w / 2, y: 0 });
const bowlGrad = rad([[C.hi, 0], [C.mid, 0.45], [C.deep, 1]], { x: -34, y: -40 }, { x: 80, y: 70 });

function arm(s, side) {
  return [
    { id: `thumb${s}`, type: 'ellipse', parent: `hand${s}`, x: -side * 10, y: 1, width: 9, height: 12, rotation: -side * 25, fill: { color: C.mid } },
    { id: `palm${s}`, type: 'ellipse', parent: `hand${s}`, x: 0, y: 6, width: 23, height: 21, fill: rad([['#7cb4fb', 0], [C.mid, 0.55], ['#1e40af', 1]], { x: -5, y: -3 }, { x: 12, y: 12 }) },
    { id: `lower${s}`, type: 'rect', parent: `fore${s}`, x: 0, y: 12, width: 16, height: 32, cornerRadius: 8, fill: tube(16) },
    { id: `upper${s}`, type: 'rect', parent: `arm${s}`, x: 0, y: 14, width: 17, height: 36, cornerRadius: 8.5, fill: tube(17) },
    { id: `elbow${s}`, type: 'ellipse', parent: `arm${s}`, x: 0, y: 27, width: 17, height: 17, fill: tube(17) },
  ];
}

const groups = [
  { id: 'lumi', x: 150, y: 288 },
  { id: 'shadowG', parent: 'lumi', x: -8, y: 0, scaleY: 0.09 },
  { id: 'hop', parent: 'lumi', x: 0, y: 0 },
  { id: 'breathe', parent: 'hop', x: 0, y: 0 },
  { id: 'legs', parent: 'breathe', x: 0, y: 0 },
  { id: 'armL', parent: 'breathe', x: -74, y: -100, rotation: 28 },
  { id: 'foreL', parent: 'armL', x: 0, y: 27, rotation: -16 },
  { id: 'handL', parent: 'foreL', x: 0, y: 27 },
  { id: 'bar', parent: 'breathe', x: 66, y: -32 },
  { id: 'barAOG', parent: 'bar', x: -14, y: -84, scaleX: 0.22 },
  { id: 'armR', parent: 'breathe', x: 86, y: -100, rotation: -18 },
  { id: 'foreR', parent: 'armR', x: 0, y: 27, rotation: 28 },
  { id: 'handR', parent: 'foreR', x: 0, y: 27 },
  { id: 'bowl', parent: 'breathe', x: -8, y: -112 },
  { id: 'bloomG', parent: 'bowl', x: 0, y: 0, opacity: 0.7 },
  { id: 'faceLook', parent: 'bowl', x: 0, y: 0 },
  { id: 'cheeks', parent: 'faceLook', x: 0, y: 0, opacity: 0.6 },
  { id: 'eyesLook', parent: 'faceLook', x: 0, y: 0 },
  { id: 'brows', parent: 'eyesLook', x: 0, y: 0 },
  { id: 'eyes', parent: 'eyesLook', x: 0, y: -5 },
  { id: 'eyesOpen', parent: 'eyes', x: 0, y: 0 },
  { id: 'pupils', parent: 'eyesOpen', x: 0, y: 0 },
  { id: 'eyesHappy', parent: 'eyes', x: 0, y: 0, opacity: 0 },
  { id: 'mouthOpen', parent: 'faceLook', x: 0, y: 0, opacity: 0 },
  { id: 'sparkles', parent: 'lumi', x: 0, y: 0 },
];

const leg = (id, x) => ({ id, type: 'rect', parent: 'legs', x, y: -40, width: 24, height: 80, cornerRadius: 12,
  fill: lin([[C.ink, 0], [C.ink, 0.47], ['#1d4ed8', 0.69], [C.navy, 1]], { x: 0, y: -40 }, { x: 0, y: 40 }) });

const SP = [[-112, -196, '#fde68a', 22], [104, -222, '#f97316', 18], [132, -146, '#93c5fd', 16], [-132, -126, '#f97316', 14], [6, -258, '#fde68a', 20]];

const shapes = [
  { id: 'shadow', type: 'ellipse', parent: 'shadowG', x: 0, y: 0, width: 140, height: 140, fill: rad([[a('#0f172a', 0.22), 0], [a('#0f172a', 0.12), 0.55], [a('#0f172a', 0), 1]], { x: 0, y: 0 }, { x: 70, y: 0 }) },
  leg('legL', -38), leg('legR', 22),
  ...arm('L', -1),
  { id: 'barS', type: 'rect', parent: 'bar', x: 0, y: -80, width: 44, height: 160, cornerRadius: 22, fill: lin([[C.hi, 0], [C.mid, 0.45], [C.deep, 1]], { x: -22, y: -80 }, { x: 22, y: 60 }) },
  { id: 'barHi', type: 'rect', parent: 'bar', x: -11, y: -96, width: 10, height: 104, cornerRadius: 5, opacity: 0.75, fill: lin([[a('#ffffff', 0), 0], [a('#ffffff', 0.5), 0.5], [a('#ffffff', 0), 1]], { x: -5, y: 0 }, { x: 5, y: 0 }) },
  { id: 'barAO', type: 'ellipse', parent: 'barAOG', x: 0, y: 0, width: 92, height: 92, fill: rad([[a(C.navy, 0.55), 0], [a(C.navy, 0), 1]], { x: 0, y: 0 }, { x: 46, y: 0 }) },
  ...arm('R', 1),
  path('tail', 'bowl', 'M0 80 L-80 80 L-56.57 56.57 L0 0 Z', { fill: bowlGrad }),
  { id: 'body', type: 'ellipse', parent: 'bowl', x: 0, y: 0, width: 160, height: 160, fill: bowlGrad },
  path('rim', 'bowl', 'M74.34 15.8 C68.5 41.7 48.7 63.1 23.5 72.3', { ...stroke('#bfdbfe', 5), opacity: 0.3 }),
  { id: 'gloss', type: 'ellipse', parent: 'bowl', x: -46, y: -50, width: 40, height: 15, rotation: -42, opacity: 0.42, fill: { color: C.white } },
  { id: 'gloss2', type: 'ellipse', parent: 'bowl', x: -18, y: -66, width: 7, height: 7, opacity: 0.7, fill: { color: C.white } },
  { id: 'bloom', type: 'ellipse', parent: 'bloomG', x: 0, y: 0, width: 140, height: 140, fill: rad([[a(C.glow, 0.95), 0], [a(C.glow, 0.85), 0.6], [a(C.glow, 0), 1]], { x: 0, y: 0 }, { x: 70, y: 0 }) },
  { id: 'face', type: 'ellipse', parent: 'faceLook', x: 0, y: 0, width: 86, height: 86, fill: rad([[C.white, 0], ['#f8fbff', 0.5], ['#cfe1fd', 1]], { x: -6, y: -10 }, { x: 43, y: 43 }) },
  { id: 'cheekL', type: 'ellipse', parent: 'cheeks', x: -28, y: 10, width: 17, height: 10, fill: rad([[a('#fb923c', 0.95), 0], [a('#fb923c', 0), 1]], { x: 0, y: 0 }, { x: 8.5, y: 0 }) },
  { id: 'cheekR', type: 'ellipse', parent: 'cheeks', x: 28, y: 10, width: 17, height: 10, fill: rad([[a('#fb923c', 0.95), 0], [a('#fb923c', 0), 1]], { x: 0, y: 0 }, { x: 8.5, y: 0 }) },
  path('browS', 'brows', ['M-25 -26 Q-17 -31 -9 -27', 'M9 -27 Q17 -31 25 -26'], stroke(C.deep, 3.8)),
  { id: 'scleraL', type: 'ellipse', parent: 'eyesOpen', x: -14, y: 0, width: 24, height: 29, fill: { color: C.white }, stroke: { color: C.deep, thickness: 1.6 } },
  { id: 'scleraR', type: 'ellipse', parent: 'eyesOpen', x: 14, y: 0, width: 24, height: 29, fill: { color: C.white }, stroke: { color: C.deep, thickness: 1.6 } },
  ...[['L', -13], ['R', 15]].flatMap(([s, x]) => [
    { id: `iris${s}`, type: 'ellipse', parent: 'pupils', x, y: 2, width: 16, height: 19, fill: rad([['#7cb4fb', 0], [C.mid, 0.5], [C.ink, 1]], { x: 0, y: 4 }, { x: 0, y: -10 }) },
    { id: `pupil${s}`, type: 'ellipse', parent: 'pupils', x, y: 3, width: 7, height: 8, fill: { color: C.ink } },
    { id: `hl${s}`, type: 'ellipse', parent: 'pupils', x: x - 4, y: -3, width: 7.5, height: 7.5, fill: { color: C.white } },
    { id: `hl2${s}`, type: 'ellipse', parent: 'pupils', x: x + 4, y: 7, width: 3, height: 3, fill: { color: C.white } },
  ]),
  path('happy', 'eyesHappy', ['M-23 3 Q-14 -8 -5 3', 'M5 3 Q14 -8 23 3'], stroke(C.deep, 3.6)),
  path('mouth', 'faceLook', 'M-6 15 Q0 20 6 15', stroke(C.deep, 3)),
  path('mouthO', 'mouthOpen', 'M-9 12 Q0 14 9 12 Q7 25 0 25 Q-7 25 -9 12 Z', { fill: { color: C.ink } }),
  { id: 'tongue', type: 'ellipse', parent: 'mouthOpen', x: 0, y: 22, width: 8, height: 4, fill: { color: '#fb7185' } },
  ...SP.map(([x, y, c, s], i) => ({ ...star(`spark${i}`, 'sparkles', x, y, s, c), scaleX: 0, scaleY: 0 })),
];

// Track theo kiểu Rive: [frame, value, interp-từ-key-này] → writer ghi easing ở key đích
const EASE = { cubic: 'ease-in-out', linear: 'linear', hold: 'hold' };
function track(target, property, frames) {
  return { target, property, keyframes: frames.map(([frame, value], i) => {
    const prev = frames[i - 1];
    const easing = i === 0 ? undefined : Array.isArray(prev[2]) ? prev[2] : EASE[prev[2] ?? 'cubic'];
    return easing ? { frame, value, easing } : { frame, value };
  }) };
}
const L = 'linear', E = [0.16, 1, 0.3, 1];
const face = (f, happy, ch, br) => [
  track('eyesOpen', 'opacity', [[f, happy ? 0 : 1]]), track('eyesHappy', 'opacity', [[f, happy ? 1 : 0]]),
  track('mouth', 'opacity', [[f, happy ? 0 : 1]]), track('mouthOpen', 'opacity', [[f, happy ? 1 : 0]]),
  track('cheeks', 'opacity', [[f, ch]]), track('brows', 'y', [[f, br]]),
];
// Ghép 2 key mặt (đầu/cuối) của celebrate thành 1 track mỗi thuộc tính
const faceSeq = (a1, a2) => a1.map((t, i) => ({ ...t, keyframes: [...t.keyframes, ...a2[i].keyframes].map((k, j) => (j === 0 ? { frame: k.frame, value: k.value } : { ...k, easing: 'hold' })) }));

const animations = [
  { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: [
    track('breathe', 'scaleY', [[0, 1], [120, 1.035], [240, 1]]),
    track('breathe', 'scaleX', [[0, 1], [120, 0.986], [240, 1]]),
    track('bar', 'rotation', [[0, -1], [150, 2.2], [240, -1]]),
    track('armL', 'rotation', [[0, 28], [90, 33], [210, 26], [240, 28]]),
    track('armR', 'rotation', [[0, -18], [60, -15], [180, -23], [240, -18]]),
    track('foreL', 'rotation', [[0, -16], [110, -22], [240, -16]]),
    track('foreR', 'rotation', [[0, 28], [140, 33], [240, 28]]),
    track('shadowG', 'scaleX', [[0, 1], [120, 0.97], [240, 1]]),
    track('bloomG', 'opacity', [[0, 0.7], [120, 0.92], [240, 0.7]]),
  ] },
  { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: [
    track('eyes', 'scaleY', [[0, 1], [196, 1, L], [200, 0.08, L], [206, 1], [282, 1, L], [285, 0.08, L], [290, 1, L], [294, 0.08, L], [300, 1], [330, 1]]),
  ] },
  { name: 'calm', fps: 60, duration: 6, loop: 'oneShot', tracks: face(0, false, 0.6, 0) },
  { name: 'happy', fps: 60, duration: 72, loop: 'loop', tracks: [
    ...face(0, true, 0.85, -3),
    track('armR', 'rotation', [[0, -150], [72, -150]]),
    track('foreR', 'rotation', [[0, 24], [18, -22], [36, 24], [54, -22], [72, 24]]),
    track('bar', 'rotation', [[0, 3], [36, 5], [72, 3]]),
  ] },
  { name: 'celebrate', fps: 60, duration: 96, loop: 'oneShot', tracks: [
    track('hop', 'y', [[0, 0], [8, 0, E], [28, -40], [40, -42], [56, 0, L], [96, 0]]),
    track('hop', 'scaleY', [[0, 1], [8, 0.86], [16, 1.1], [40, 1.03], [56, 1, L], [60, 0.88], [72, 1.04], [84, 1]]),
    track('hop', 'scaleX', [[0, 1], [8, 1.12], [16, 0.93], [40, 0.98], [56, 1, L], [60, 1.1], [72, 0.97], [84, 1]]),
    track('shadowG', 'scaleX', [[0, 1], [8, 1.06], [28, 0.66], [40, 0.6], [56, 1]]),
    track('shadowG', 'opacity', [[0, 1], [28, 0.4], [56, 1]]),
    track('bar', 'rotation', [[0, 0], [8, -7], [28, 10], [46, -5], [62, 6], [74, -2], [86, 0]]),
    track('armL', 'rotation', [[0, 28], [6, 40], [18, 160], [44, 150], [52, 162], [80, 28]]),
    track('armR', 'rotation', [[0, -18], [6, -30], [18, -150], [44, -140], [52, -152], [80, -18]]),
    track('foreL', 'rotation', [[0, -16], [18, 0], [44, -8], [80, -16]]),
    track('foreR', 'rotation', [[0, 28], [18, 12], [44, 20], [80, 28]]),
    ...faceSeq(face(4, true, 0.9, -4), face(84, false, 0.6, 0)),
    ...SP.flatMap((_, i) => {
      const t = 14 + i * 7;
      return [
        track(`spark${i}`, 'scaleX', [[0, 0], [t, 0], [t + 10, 1.1], [t + 26, 0]]),
        track(`spark${i}`, 'scaleY', [[0, 0], [t, 0], [t + 10, 1.1], [t + 26, 0]]),
        track(`spark${i}`, 'rotation', [[t, 0], [t + 26, 90]]),
      ];
    }),
  ] },
  // Tư thế nhìn cho blend: mặt dịch nhẹ (giả quay đầu), con ngươi dịch nhiều hơn
  { name: 'lookL', fps: 60, duration: 1, loop: 'oneShot', tracks: [track('faceLook', 'x', [[0, -5]]), track('pupils', 'x', [[0, -4]])] },
  { name: 'lookR', fps: 60, duration: 1, loop: 'oneShot', tracks: [track('faceLook', 'x', [[0, 5]]), track('pupils', 'x', [[0, 4]])] },
  { name: 'lookU', fps: 60, duration: 1, loop: 'oneShot', tracks: [track('faceLook', 'y', [[0, -4]]), track('pupils', 'y', [[0, -4]])] },
  { name: 'lookD', fps: 60, duration: 1, loop: 'oneShot', tracks: [track('faceLook', 'y', [[0, 4]]), track('pupils', 'y', [[0, 4]])] },
];

const stateMachine = {
  name: 'Lumi',
  inputs: [{ name: 'lookX', type: 'number', initial: 0 }, { name: 'lookY', type: 'number', initial: 0 }, { name: 'hover', type: 'bool' }, { name: 'celebrate', type: 'trigger' }],
  layers: [
    { name: 'base', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
    { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
    { name: 'lookX', states: [{ name: 'lx', blend1d: { input: 'lookX', animations: [{ animation: 'lookL', value: -1 }, { animation: 'lookR', value: 1 }] } }], transitions: [{ from: 'entry', to: 'lx' }] },
    { name: 'lookY', states: [{ name: 'ly', blend1d: { input: 'lookY', animations: [{ animation: 'lookU', value: -1 }, { animation: 'lookD', value: 1 }] } }], transitions: [{ from: 'entry', to: 'ly' }] },
    { name: 'mood', states: [{ name: 'calm', animation: 'calm' }, { name: 'happy', animation: 'happy' }, { name: 'celebrate', animation: 'celebrate' }], transitions: [
      { from: 'entry', to: 'calm' },
      // ăn mừng xét trước hover: bấm chuột vừa bật hover vừa bắn trigger trong cùng một frame
      { from: 'calm', to: 'celebrate', durationMs: 80, condition: { input: 'celebrate' } },
      { from: 'happy', to: 'celebrate', durationMs: 80, condition: { input: 'celebrate' } },
      { from: 'calm', to: 'happy', durationMs: 200, condition: { input: 'hover', value: true } },
      { from: 'happy', to: 'calm', durationMs: 260, condition: { input: 'hover', value: false } },
      { from: 'celebrate', to: 'calm', durationMs: 180, exitTimeMs: 1600 },
    ] },
  ],
  listeners: ['body', 'barS'].flatMap((t) => [
    { target: t, type: 'enter', actions: [{ input: 'hover', value: true }] },
    { target: t, type: 'exit', actions: [{ input: 'hover', value: false }] },
    { target: t, type: 'down', actions: [{ input: 'celebrate' }] },
  ]),
};

export const lumiArtboard = { name: 'Lumi', width: 300, height: 300, groups, shapes, animations, stateMachine };
