// Thanh toán: Lumi đứng trên mép tấm vé, cầm con dấu. Input `mood`: 0 đang xác nhận (bong bóng ba chấm, nhử đóng dấu rồi khựng lại, chờ), 1 đóng dấu rồi giữ tư thế cuối, 11 vào thẳng tư thế cuối.
import { lumi, tr, path, a, lin, stroke } from './scenes.mjs';
import { K, rot, ik, star, sparks, anim, holdOf, moodLayer } from './moments.mjs';

const W = 300, H = 250, EDGE = 200, X = 110, S = 0.5;
const RUB = 75, SC = 1.45, HIT_HAND = [112, 68 - RUB * SC];
export const STAMP_HIT = { x: X + HIT_HAND[0] * S, y: EDGE + (HIT_HAND[1] + (RUB - 4) * SC) * S, frame: 32, w: W, h: H };

function stamp() {
  const p = 'T_';
  const L = lumi(p, undefined, X, EDGE, S);
  const ARM_R = ['upperR', 'elbowR', 'lowerR'].map((s) => p + s), HAND_R = ['palmR', 'thumbR'].map((s) => p + s);
  const reach = (target, lean = 0) => { const h = ik('R', rot(-lean, target)); return { armR: h.r1, foreR: h.r2, lean }; };
  const HOLD = reach([118, -110]);
  const MID = reach([112, -64], 6);
  const RAISE = reach([104, -146], -6);
  const HIT = reach(HIT_HAND, 15);
  const PROUD = reach([112, -128]);
  const upright = (q, tilt = 0) => -(q.lean + q.armR + q.foreR) + tilt;
  const HIT_X = STAMP_HIT.x, HIT_Y = STAMP_HIT.y;
  const BURST = Array.from({ length: 7 }, (_, i) => (i * 360) / 7 + 10);
  const DROPS = [[-26, -30], [22, -36], [-12, -44], [34, -18]];
  const SP = [[X + 92, 120, '#fde68a', 22], [X + 30, 96, K.orange, 16], [X + 128, 150, '#86efac', 14], [X - 8, 132, '#fde68a', 13]];

  const groups = [
    ...L.groups,
    { id: 'stamp', parent: p + 'handR', x: 0, y: 0, rotation: upright(HOLD), scaleX: SC, scaleY: SC },
    { id: 'think', parent: p + 'hop', x: 52, y: -262, opacity: 0 },
    ...[0, 1, 2].map((i) => ({ id: `dot${i}`, parent: 'think', x: (i - 1) * 22, y: 0 })),
    { id: 'burst', x: HIT_X, y: HIT_Y },
    ...DROPS.map((_, i) => ({ id: `drop${i}`, x: HIT_X, y: HIT_Y, opacity: 0 })),
  ];
  const wood = (w, h) => lin([['#d97706', 0], ['#92400e', 1]], { x: -w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 });
  const shapes = [
    ...L.shapes.filter((s) => !ARM_R.includes(s.id) && !HAND_R.includes(s.id)),
    ...L.shapes.filter((s) => ARM_R.includes(s.id)),
    { id: 'neck', type: 'rect', parent: 'stamp', x: 0, y: 32, width: 14, height: 38, cornerRadius: 4, fill: wood(14, 38) },
    { id: 'base', type: 'rect', parent: 'stamp', x: 0, y: 58, width: 72, height: 20, cornerRadius: 6, fill: wood(72, 20) },
    { id: 'baseHi', type: 'rect', parent: 'stamp', x: -8, y: 52, width: 46, height: 3, cornerRadius: 1.5, fill: { color: a('#ffffff', 0.35) } },
    { id: 'rubber', type: 'rect', parent: 'stamp', x: 0, y: RUB - 4, width: 64, height: 8, cornerRadius: 2, fill: { color: '#15803d' } },
    { id: 'knob', type: 'ellipse', parent: 'stamp', x: 0, y: 6, width: 30, height: 26, fill: wood(30, 26) },
    { id: 'knobHi', type: 'ellipse', parent: 'stamp', x: -6, y: 0, width: 9, height: 6, fill: { color: a('#ffffff', 0.4) } },
    ...L.shapes.filter((s) => HAND_R.includes(s.id)),
    path(p + 'browD', p + 'brows', ['M-25 -31 Q-17 -31 -9 -26', 'M9 -26 Q17 -31 25 -31'], { ...stroke(K.deep, 3.8), opacity: 0 }),
    ...[[-30, 36, 16], [-44, 54, 10]].map(([x, y, d], i) => ({ id: `thinkTail${i}`, type: 'ellipse', parent: 'think', x, y, width: d, height: d, fill: { color: '#f1f5f9' }, stroke: { color: '#cbd5e1', thickness: 3 } })),
    { id: 'thinkBox', type: 'ellipse', parent: 'think', x: 0, y: 0, width: 96, height: 58, fill: { color: '#f1f5f9' }, stroke: { color: '#cbd5e1', thickness: 3 } },
    ...[0, 1, 2].map((i) => ({ id: `dotS${i}`, type: 'ellipse', parent: `dot${i}`, x: 0, y: 0, width: 12, height: 12, fill: { color: '#64748b' } })),
    ...BURST.map((deg, i) => {
      const [x0, y0] = rot(deg, [0, -30]), [x1, y1] = rot(deg, [0, -44]);
      return path(`ray${i}`, 'burst', `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`, stroke('#16a34a', 3, { trim: { start: 0, end: 0 } }));
    }),
    ...DROPS.map((_, i) => ({ id: `dropS${i}`, type: 'ellipse', parent: `drop${i}`, x: 0, y: 0, width: 5 - (i % 2), height: 6 - (i % 2), fill: { color: '#16a34a' } })),
    ...SP.map(([x, y, c, s], i) => star(`spark${i}`, x, y, s, c)),
  ];

  const pose = (q, tilt = 0) => ({ [`${p}armR|rotation`]: q.armR, [`${p}foreR|rotation`]: q.foreR, [`${p}hop|rotation`]: q.lean, 'stamp|rotation': upright(q, tilt) });
  const B = {
    ...pose(HOLD), [`${p}armL|rotation`]: 28, [`${p}foreL|rotation`]: -16,
    [`${p}hop|y`]: 0, [`${p}hop|scaleY`]: 1, [`${p}hop|scaleX`]: 1,
    [`${p}eyesOpen|opacity`]: 1, [`${p}eyesHappy|opacity`]: 0, [`${p}mouth|opacity`]: 1, [`${p}mouthOpen|opacity`]: 0,
    [`${p}cheeks|opacity`]: 0.6, [`${p}browS|opacity`]: 1, [`${p}browD|opacity`]: 0, [`${p}brows|y`]: 0, [`${p}legR|y`]: -40,
    [`${p}pupils|x`]: 2, [`${p}pupils|y`]: 0, [`${p}faceLook|x`]: 0, 'think|opacity': 0,
    ...Object.fromEntries([0, 1, 2].flatMap((i) => [[`dot${i}|scaleX`, 1], [`dot${i}|scaleY`, 1], [`dot${i}|y`, 0]])),
    ...Object.fromEntries(BURST.map((_, i) => [`ray${i}|trimEnd`, 0])),
    ...Object.fromEntries(DROPS.flatMap((_, i) => [[`drop${i}|opacity`, 0], [`drop${i}|x`, HIT_X], [`drop${i}|y`, HIT_Y]])),
    ...Object.fromEntries(SP.flatMap((_, i) => [[`spark${i}|scaleX`, 0], [`spark${i}|scaleY`, 0]])),
  };
  const move = (keys) => Object.keys(pose(HOLD)).map((k) => {
    const [t, pr] = k.split('|');
    return tr(t, pr, keys.map(([f, q, tilt, e]) => [f, pose(q, tilt)[k], e]));
  });

  const T = 240;
  const taps = [[0, -40]];
  for (const f of [140, 152, 164, 176]) taps.push([f, -40], [f + 4, -45], [f + 8, -40]);
  taps.push([T, -40]);
  const pulse = (i) => {
    const k = [[0, 1]];
    for (let f = 0; f < T; f += 60) k.push([f + i * 12, 1], [f + i * 12 + 10, 1.45], [f + i * 12 + 22, 1]);
    k.push([T, 1]);
    return k;
  };
  const hop = (i) => { const k = [[0, 0]]; for (let f = 0; f < T; f += 60) k.push([f + i * 12, 0], [f + i * 12 + 10, -5], [f + i * 12 + 22, 0]); k.push([T, 0]); return k; };
  const wait = anim('wait', T, B, [
    ...move([[0, HOLD], [30, HOLD, 0, 'out'], [56, RAISE, 0, 'in'], [64, MID, 0], [100, MID, 0, 'out'], [124, HOLD], [T, HOLD]]),
    tr('think', 'opacity', [[0, 1]]),
    ...[0, 1, 2].flatMap((i) => [tr(`dot${i}`, 'scaleX', pulse(i)), tr(`dot${i}`, 'scaleY', pulse(i)), tr(`dot${i}`, 'y', hop(i))]),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [34, 0, 'hold'], [70, 1]]), tr(p + 'browD', 'opacity', [[0, 0, 'hold'], [34, 1, 'hold'], [70, 0]]),
    tr(p + 'brows', 'y', [[0, 0], [70, 0], [76, -4], [100, -4], [112, 0]]),
    tr(p + 'pupils', 'x', [[0, 3], [30, 3], [56, 2], [70, 0], [100, 0], [124, 0], [190, 0], [200, 3], [226, 3], [T, 3]]),
    tr(p + 'pupils', 'y', [[0, 3], [30, 3], [56, -2], [64, 3], [70, 0], [190, 0], [200, 3], [226, 3], [T, 3]]),
    tr(p + 'faceLook', 'x', [[0, 0], [72, 0], [78, -3], [84, 3], [90, -3], [96, 0]]),
    tr(p + 'hop', 'scaleY', [[0, 1], [56, 1], [64, 0.94], [72, 1], [T, 1]]),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [100, 0.6], [112, 0.85], [150, 0.6]]),
    tr(p + 'legR', 'y', taps),
  ], 'loop');

  const H0 = STAMP_HIT.frame;
  const win = anim('win', 150, B, [
    ...move([[0, HOLD], [14, RAISE, 0, 'in'], [24, RAISE, 0, 'in'], [H0, HIT], [H0 + 2, HIT, 2], [H0 + 6, HIT, -2], [H0 + 10, HIT], [60, HIT, 0, 'out'], [84, PROUD, -14], [150, PROUD, -14]]),
    tr(p + 'hop', 'y', [[0, 0], [14, 0, 'out'], [22, -22, 'in'], [H0, 0], [150, 0]]),
    tr(p + 'hop', 'scaleY', [[0, 1], [10, 0.92], [16, 1.06], [H0, 1], [H0 + 2, 0.9], [H0 + 12, 1.02], [H0 + 20, 1]]),
    tr(p + 'hop', 'scaleX', [[0, 1], [10, 1.06], [16, 0.96], [H0, 1], [H0 + 2, 1.08], [H0 + 12, 0.99], [H0 + 20, 1]]),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [6, 0, 'hold'], [62, 1]]), tr(p + 'browD', 'opacity', [[0, 0, 'hold'], [6, 1, 'hold'], [62, 0]]),
    tr(p + 'pupils', 'x', [[0, 2], [10, 3], [26, 4], [62, 4], [78, 0]]), tr(p + 'pupils', 'y', [[0, 0], [10, -3], [26, 3], [62, 3], [78, 0]]),
    tr(p + 'eyesOpen', 'opacity', [[0, 1, 'hold'], [64, 0]]), tr(p + 'eyesHappy', 'opacity', [[0, 0, 'hold'], [64, 1]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [64, 0]]), tr(p + 'mouthOpen', 'opacity', [[0, 0, 'hold'], [64, 1]]),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [64, 0.95], [150, 0.85]]), tr(p + 'brows', 'y', [[0, 0], [64, -3], [150, -2]]),
    ...BURST.map((_, i) => tr(`ray${i}`, 'trimEnd', [[0, 0], [H0, 0, 'out'], [H0 + 8, 1], [H0 + 16, 1], [H0 + 22, 0]])),
    ...DROPS.flatMap(([dx, dy], i) => [
      tr(`drop${i}`, 'opacity', [[0, 0, 'hold'], [H0, 1], [H0 + 22, 1], [H0 + 30, 0]]),
      tr(`drop${i}`, 'x', [[0, HIT_X], [H0, HIT_X, 'out'], [H0 + 26, HIT_X + dx]]),
      tr(`drop${i}`, 'y', [[0, HIT_Y], [H0, HIT_Y, 'out'], [H0 + 12, HIT_Y + dy, 'in'], [H0 + 28, HIT_Y + dy + 26]]),
    ]),
    ...sparks(SP, 66),
  ]);

  const extra = [
    { from: 'wait', to: 'win', durationMs: 120, condition: { input: 'mood', op: '==', value: 1 } },
    { from: 'wait', to: 'winHold', durationMs: 120, condition: { input: 'mood', op: '==', value: 11 } },
  ];
  return { name: 'Stamp', width: W, height: H, groups, shapes, animations: [
    anim('rest', 1, B, []), wait, win, holdOf('winHold', win, B, p),
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: { name: 'Stamp', inputs: [{ name: 'mood', type: 'number', initial: -1 }], layers: [
    { name: 'idle', states: [{ name: 'idle', animation: 'idle' }], transitions: [{ from: 'entry', to: 'idle' }] },
    { name: 'blink', states: [{ name: 'blink', animation: 'blink' }], transitions: [{ from: 'entry', to: 'blink' }] },
    moodLayer([{ name: 'wait', loop: true }, { name: 'win', len: 150 }], extra),
  ] } };
}

export const stampArtboard = stamp();
