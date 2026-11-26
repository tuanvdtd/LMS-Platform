// Trang lỗi: Lost (404), Guard (403), Fixer (500). Input `mood`: 0 diễn một lần rồi giữ tư thế cuối, 10 vào thẳng tư thế cuối.
import { lumi, tr, path, a, lin, rad, stroke } from './scenes.mjs';
import { K, rot, star, sparks, anim, holdOf, moodLayer } from './moments.mjs';

const W = 360, H = 220, GROUND = 196, S = 0.56;
const ground = { id: 'ground', type: 'rect', x: W / 2, y: GROUND + 3, width: 320, height: 6, cornerRadius: 3, fill: { color: a(K.gray, 0.28) } };
const loopLayer = (name) => ({ name, states: [{ name, animation: name }], transitions: [{ from: 'entry', to: name }] });
const BROW_D = ['M-25 -31 Q-17 -31 -9 -26', 'M9 -26 Q17 -31 25 -31'];

const faceBase = (p) => ({
  [`${p}armL|rotation`]: 28, [`${p}foreL|rotation`]: -16, [`${p}armR|rotation`]: -18, [`${p}foreR|rotation`]: 28,
  [`${p}hop|y`]: 0, [`${p}hop|rotation`]: 0, [`${p}hop|scaleX`]: 1, [`${p}hop|scaleY`]: 1,
  [`${p}eyesOpen|scaleX`]: 1, [`${p}eyesOpen|scaleY`]: 1, [`${p}mouth|opacity`]: 1, [`${p}cheeks|opacity`]: 0.6,
  [`${p}brows|y`]: 0, [`${p}browS|opacity`]: 1, [`${p}pupils|x`]: 0, [`${p}pupils|y`]: 0, [`${p}faceLook|x`]: 0, [`${p}faceLook|y`]: 0,
});
const zeroScale = (ids) => Object.fromEntries(ids.flatMap((id) => [[`${id}|scaleX`, 0], [`${id}|scaleY`, 0]]));
const both = (target, prop, frames) => [tr(target, prop + 'X', frames), tr(target, prop + 'Y', frames)];

function artboard(name, p, L, { groups, shapes, B, react, env }) {
  return { name, width: W, height: H, groups, shapes, animations: [
    anim('rest', 1, B, []), react, holdOf(react.name + 'Hold', react, B, p),
    { name: 'env', fps: 60, duration: env.duration, loop: 'loop', tracks: env.tracks },
    { name: 'idle', fps: 60, duration: 240, loop: 'loop', tracks: L.idle },
    { name: 'blink', fps: 60, duration: 330, loop: 'loop', tracks: L.blink },
  ], stateMachine: { name, inputs: [{ name: 'mood', type: 'number', initial: -1 }], layers: [
    loopLayer('idle'), loopLayer('blink'), loopLayer('env'), moodLayer([{ name: react.name, len: react.duration }]),
  ] } };
}

// ═══ Lost: 404 ═══
function lost() {
  const p = 'L_', X = 150, SX = 288;
  const HOLD = { armL: 40, foreL: 130 };
  const L = lumi(p, undefined, X, GROUND, S, HOLD);
  const at = rot(-(HOLD.armL + HOLD.foreL), [6, -24]);
  const ARM_L = ['upperL', 'elbowL', 'lowerL'].map((s) => p + s), HAND_L = ['palmL', 'thumbL'].map((s) => p + s);
  const MW = 76, MH = 56;
  const BOARDS = [['boardA', 1, 76, -104, -4], ['boardB', -1, 66, -78, 5], ['boardC', 1, 54, -54, -8]];
  const wood = lin([['#e0b273', 0], ['#a8743c', 1]], { x: 0, y: -11 }, { x: 0, y: 11 });

  const groups = [
    ...BOARDS.map(([id, , , y, r]) => ({ id, x: SX, y: GROUND + y, rotation: r })),
    ...L.groups,
    { id: 'map', parent: p + 'handL', x: at[0], y: at[1], rotation: -(HOLD.armL + HOLD.foreL) - 6 },
    { id: 'mapSpin', parent: 'map', x: 0, y: 0, rotation: 180 },
    { id: 'qG', parent: p + 'hop', x: 70, y: -236, scaleX: 0, scaleY: 0 },
  ];
  const shapes = [
    ground,
    ...[[30, -10, 30, 22], [46, -14, 30, 28], [60, -8, 24, 18], [334, -8, 22, 16], [347, -11, 22, 22]].map(([x, y, w, h], i) => ({
      id: `bush${i}`, type: 'ellipse', x, y: GROUND + y, width: w, height: h, fill: lin([['#4b8a74', 0], ['#24544a', 1]], { x: 0, y: -h / 2 }, { x: 0, y: h / 2 }) })),
    { id: 'pebble0', type: 'ellipse', x: 214, y: GROUND - 2, width: 10, height: 6, fill: { color: '#94a3b8' } },
    { id: 'pebble1', type: 'ellipse', x: 232, y: GROUND - 1, width: 7, height: 5, fill: { color: '#a3b1c6' } },
    { id: 'pole', type: 'rect', x: SX, y: GROUND - 60, width: 8, height: 120, cornerRadius: 3, fill: lin([['#8b6a46', 0], ['#5f4429', 1]], { x: -4, y: 0 }, { x: 4, y: 0 }) },
    { id: 'poleCap', type: 'ellipse', x: SX, y: GROUND - 120, width: 12, height: 6, fill: { color: '#5f4429' } },
    ...BOARDS.flatMap(([id, dir, w]) => [
      { id: id + 'S', type: 'polygon', parent: id, x: 0, y: 0, closed: true, fill: wood, stroke: { color: '#8a5a2b', thickness: 1.5, join: 'round' },
        points: [[-w / 2, -11], [w / 2 - 12, -11], [w / 2, 0], [w / 2 - 12, 11], [-w / 2, 11]].map(([x, y]) => ({ x: x * dir, y })) },
      path(id + 'Txt', id, [`M${(-w / 2 + 9) * dir} -3 L${(w / 2 - 22) * dir} -3`, `M${(-w / 2 + 9) * dir} 4 L${(w / 4 - 12) * dir} 4`], stroke(a('#5b3a1a', 0.5), 2.4)),
    ]),
    ...L.shapes.filter((s) => !ARM_L.includes(s.id) && !HAND_L.includes(s.id)),
    path(p + 'browQ', p + 'brows', ['M-25 -28 Q-17 -36 -9 -32', 'M9 -27 Q17 -28 25 -25'], { ...stroke(K.deep, 3.8), opacity: 0 }),
    path(p + 'mouthQ', p + 'faceLook', 'M-7 18 Q0 13 7 15', { ...stroke(K.deep, 3), opacity: 0 }),
    ...L.shapes.filter((s) => ARM_L.includes(s.id)),
    { id: 'mapBg', type: 'rect', parent: 'mapSpin', x: 0, y: 0, width: MW, height: MH, cornerRadius: 4, fill: { color: '#fbf3dc' }, stroke: { color: '#c9a86a', thickness: 2 } },
    { id: 'mapFold', type: 'rect', parent: 'mapSpin', x: 0, y: 0, width: MW / 3, height: MH - 2, fill: { color: a('#b98b3e', 0.16) } },
    path('river', 'mapSpin', 'M-37 12 Q-22 4 -10 13 Q2 22 14 12 Q24 4 37 9', stroke('#60a5fa', 3.4)),
    ...[[-24, -8], [-11, -13]].map(([x, y], i) => ({ id: `tree${i}`, type: 'polygon', parent: 'mapSpin', x, y, closed: true, fill: { color: '#3f7d66' },
      points: [{ x: 0, y: -9 }, { x: 7.5, y: 6 }, { x: -7.5, y: 6 }] })),
    path('route', 'mapSpin', ['M-28 21 L-23 18', 'M-17 14 L-12 11', 'M-6 7 L-1 4', 'M5 0 L10 -3', 'M15 -7 L19 -10'], stroke('#ef4444', 2.6)),
    path('mapX', 'mapSpin', ['M21 -21 L30 -12', 'M30 -21 L21 -12'], stroke('#dc2626', 3.2)),
    ...L.shapes.filter((s) => HAND_L.includes(s.id)),
    path('q', 'qG', 'M-12 -11 Q-12 -26 1 -26 Q14 -26 14 -13 Q14 -3 1 2 L1 10', stroke(K.orange, 8.5)),
    { id: 'qDot', type: 'ellipse', parent: 'qG', x: 1, y: 23, width: 10, height: 10, fill: { color: K.orange } },
  ];

  const B = { ...faceBase(p), [`${p}armL|rotation`]: HOLD.armL, [`${p}foreL|rotation`]: HOLD.foreL,
    'mapSpin|rotation': 180, [`${p}browQ|opacity`]: 0, [`${p}mouthQ|opacity`]: 0, 'qG|scaleX': 0, 'qG|scaleY': 0, 'qG|rotation': 0 };
  const widen = [[0, 1], [98, 1], [104, 1.14], [120, 1.06], [140, 1]];
  const pop = [[0, 0], [128, 0, 'back'], [146, 1]];
  const react = anim('lost', 200, B, [
    tr(p + 'faceLook', 'x', [[0, 0], [8, 0], [22, 4], [44, 4], [58, -4], [112, -4], [126, 0]]),
    tr(p + 'pupils', 'x', [[0, 0], [8, 0], [22, 4.5], [44, 4.5], [58, -4.5], [112, -4.5], [126, 0]]),
    tr(p + 'pupils', 'y', [[0, 0], [44, 0], [58, 2], [112, 2], [126, 0]]),
    tr('mapSpin', 'rotation', [[0, 180], [70, 180, 'back'], [98, 0]]),
    ...both(p + 'eyesOpen', 'scale', widen),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [112, 0]]), tr(p + 'browQ', 'opacity', [[0, 0, 'hold'], [112, 1]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [112, 0]]), tr(p + 'mouthQ', 'opacity', [[0, 0, 'hold'], [112, 1]]),
    tr(p + 'armR', 'rotation', [[0, -18], [114, -18, 'out'], [134, -72], [166, -72], [192, -18]]),
    tr(p + 'foreR', 'rotation', [[0, 28], [114, 28, 'out'], [134, -84], [166, -84], [192, 28]]),
    tr(p + 'hop', 'scaleY', [[0, 1], [114, 1], [122, 0.95], [134, 1.03], [144, 1]]),
    tr(p + 'hop', 'rotation', [[0, 0], [114, 0], [134, -4], [200, -3]]),
    ...both('qG', 'scale', pop),
    tr('qG', 'rotation', [[0, -16], [128, -16], [146, 8], [160, 0]]),
  ]);
  const env = { duration: 180, tracks: [tr('qG', 'y', [[0, -236], [90, -246], [180, -236]])] };
  return artboard('Lost', p, L, { groups, shapes, B, react, env });
}

// ═══ Guard: 403 ═══
function guard() {
  const p = 'G_', X = 122, PX = 240, BOOM = 104;
  const L = lumi(p, undefined, X, GROUND, S);

  const groups = [
    { id: 'post', x: PX, y: GROUND },
    { id: 'boom', x: PX, y: GROUND - 56, rotation: -80 },
    { id: 'tag', parent: 'boom', x: 64, y: 5, opacity: 0 },
    ...L.groups,
    { id: 'cap', parent: p + 'bowl', x: 0, y: 0, rotation: -5 },
  ];
  const shapes = [
    ground,
    { id: 'lampGlow', type: 'ellipse', parent: 'post', x: 0, y: -74, width: 44, height: 44, opacity: 0.3, fill: rad([[a(K.orange, 0.6), 0], [a(K.orange, 0), 1]], { x: 0, y: 0 }, { x: 22, y: 0 }) },
    { id: 'postS', type: 'rect', parent: 'post', x: 0, y: -32, width: 22, height: 64, cornerRadius: 5,
      fill: lin([['#64748b', 0], ['#334155', 1]], { x: -11, y: 0 }, { x: 11, y: 0 }), stroke: { color: a(K.ink, 0.35), thickness: 1.5 } },
    { id: 'postBand', type: 'rect', parent: 'post', x: 0, y: -40, width: 22, height: 7, fill: { color: K.orange } },
    { id: 'postFoot', type: 'rect', parent: 'post', x: 0, y: -3, width: 36, height: 6, cornerRadius: 3, fill: { color: K.line } },
    { id: 'lampBase', type: 'rect', parent: 'post', x: 0, y: -65, width: 14, height: 4, cornerRadius: 1, fill: { color: K.line } },
    path('lamp', 'post', 'M-6 -66 Q-6 -80 0 -80 Q6 -80 6 -66 Z', { fill: { color: K.orange } }),
    { id: 'weight', type: 'rect', parent: 'boom', x: -12, y: 0, width: 18, height: 16, cornerRadius: 3, fill: { color: K.mute } },
    { id: 'beam', type: 'rect', parent: 'boom', x: BOOM / 2, y: 0, width: BOOM, height: 11, cornerRadius: 5.5, fill: { color: K.paper }, stroke: { color: a(K.ink, 0.3), thickness: 1.5 } },
    ...[0, 1, 2, 3].map((i) => ({ id: `stripe${i}`, type: 'polygon', parent: 'boom', x: 18 + i * 24, y: 0, closed: true, fill: { color: K.orange },
      points: [{ x: -3, y: -4.5 }, { x: 9, y: -4.5 }, { x: 3, y: 4.5 }, { x: -9, y: 4.5 }] })),
    { id: 'hub', type: 'ellipse', parent: 'boom', x: 0, y: 0, width: 16, height: 16, fill: { color: K.line }, stroke: { color: K.gray, thickness: 2 } },
    path('chain', 'tag', ['M-7 0 L-7 10', 'M7 0 L7 10'], stroke(K.gray, 1.8)),
    { id: 'plate', type: 'rect', parent: 'tag', x: 0, y: 24, width: 32, height: 28, cornerRadius: 6, fill: { color: K.paper }, stroke: { color: '#cbd5e1', thickness: 1.6 } },
    path('shackle', 'tag', 'M-5 25 L-5 20 Q-5 14 0 14 Q5 14 5 20 L5 25', stroke(K.mute, 2.8)),
    { id: 'lockBody', type: 'rect', parent: 'tag', x: 0, y: 29, width: 17, height: 13, cornerRadius: 3, fill: { color: '#c2410c' } },
    { id: 'keyhole', type: 'ellipse', parent: 'tag', x: 0, y: 28.5, width: 3.6, height: 3.6, fill: { color: '#fff7ed' } },
    ...L.shapes,
    path(p + 'browD', p + 'brows', BROW_D, { ...stroke(K.deep, 3.8), opacity: 0 }),
    path(p + 'mouthF', p + 'faceLook', 'M-6 17 L6 17', { ...stroke(K.deep, 3), opacity: 0 }),
    path('capCrown', 'cap', 'M-63 -48 Q-70 -98 -4 -102 Q60 -100 60 -50 Z', { fill: lin([['#3b4a63', 0], [K.ink, 1]], { x: 0, y: -102 }, { x: 0, y: -48 }) }),
    { id: 'capBand', type: 'rect', parent: 'cap', x: -2, y: -50, width: 126, height: 10, cornerRadius: 3, fill: { color: K.slate } },
    { id: 'visor', type: 'ellipse', parent: 'cap', x: -4, y: -43, width: 130, height: 16, fill: lin([[K.slate, 0], ['#020617', 1]], { x: 0, y: -8 }, { x: 0, y: 8 }) },
    { id: 'badge', type: 'ellipse', parent: 'cap', x: -2, y: -74, width: 22, height: 22, fill: rad([['#fde68a', 0], ['#f59e0b', 1]], { x: -3, y: -3 }, { x: 11, y: 0 }) },
    { id: 'badgeA', type: 'ellipse', parent: 'cap', x: -4, y: -74, width: 8, height: 8, stroke: { color: '#92400e', thickness: 2 } },
    { id: 'badgeBar', type: 'rect', parent: 'cap', x: 1.5, y: -73, width: 2.4, height: 10, cornerRadius: 1.2, fill: { color: '#92400e' } },
  ];

  const B = { ...faceBase(p), [`${p}browD|opacity`]: 0, [`${p}mouthF|opacity`]: 0, 'boom|rotation': -80, 'tag|opacity': 0, 'tag|rotation': 0 };
  const react = anim('halt', 200, B, [
    tr('boom', 'rotation', [[0, -80], [4, -80, 'back'], [38, 0]]),
    tr('tag', 'opacity', [[0, 0, 'hold'], [36, 1]]),
    tr('tag', 'rotation', [[0, 0], [40, 0], [48, 16], [62, -10], [76, 6], [88, -3], [100, 0]]),
    tr(p + 'hop', 'y', [[0, 0], [2, 0, 'out'], [8, -6, 'in'], [14, 0]]),
    tr(p + 'armR', 'rotation', [[0, -18], [6, -18, 'out'], [24, -120], [86, -120], [104, -18]]),
    tr(p + 'foreR', 'rotation', [[0, 28], [6, 28, 'out'], [24, -40], [86, -40], [104, 28]]),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [10, 0, 'hold'], [100, 1]]), tr(p + 'browD', 'opacity', [[0, 0, 'hold'], [10, 1, 'hold'], [100, 0]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [10, 0, 'hold'], [100, 1]]), tr(p + 'mouthF', 'opacity', [[0, 0, 'hold'], [10, 1, 'hold'], [100, 0]]),
    tr(p + 'faceLook', 'x', [[0, 0], [30, 0], [38, -4], [46, 4], [54, -4], [62, 4], [70, 0], [106, 0], [118, -4], [166, -4], [180, 0]]),
    tr(p + 'pupils', 'x', [[0, 0], [30, 0], [38, -3], [46, 3], [54, -3], [62, 3], [70, 0], [106, 0], [118, -4.5], [166, -4.5], [180, 0]]),
    tr(p + 'armL', 'rotation', [[0, 28], [104, 28, 'out'], [122, 84], [160, 84], [184, 28]]),
    tr(p + 'foreL', 'rotation', [[0, -16], [104, -16, 'out'], [122, 6], [160, 6], [184, -16]]),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [100, 0.6], [112, 0.9], [200, 0.8]]),
  ]);
  const env = { duration: 120, tracks: [tr('lampGlow', 'opacity', [[0, 0.25], [60, 1], [120, 0.25]])] };
  return artboard('Guard', p, L, { groups, shapes, B, react, env });
}

// ═══ Fixer: 500 ═══
function fixer() {
  const p = 'F_', X = 120, RX = 258, RW = 84, RH = 124;
  const SLOTS = [-100, -62, -24];
  const L = lumi(p, undefined, X, GROUND, S);
  const SP = [[226, GROUND - 74, '#fde68a', 18], [246, GROUND - 90, K.orange, 14], [222, GROUND - 50, '#fde68a', 12], [262, GROUND - 82, '#93c5fd', 11]];
  const ZAP = [[232, GROUND - 64, '#fde68a', 13], [226, GROUND - 53, K.orange, 11], [240, GROUND - 56, '#fde68a', 10]];
  const ZAP_AT = [84, 108, 132, 156];
  const handR = L.shapes.findIndex((s) => s.id === p + 'thumbR');
  const metal = (w) => lin([['#e2e8f0', 0], ['#94a3b8', 1]], { x: -w / 2, y: 0 }, { x: w / 2, y: 0 });

  const groups = [
    { id: 'rack', x: RX, y: GROUND },
    { id: 'door', parent: 'rack', x: -33, y: SLOTS[1] - 13, rotation: 64 },
    ...[0, 1, 2].map((i) => ({ id: `puff${i}`, x: RX - 14 + i * 14, y: GROUND - RH - 4, opacity: 0 })),
    { id: 'poof', x: RX - 4, y: GROUND + SLOTS[1], opacity: 0, scaleX: 0.3, scaleY: 0.3 },
    ...L.groups,
    { id: 'hat', parent: p + 'bowl', x: 0, y: 0, rotation: 5 },
    { id: 'wrench', parent: p + 'handR', x: 0, y: 0 },
  ];
  const shapes = [
    ground,
    ...[0, 1, 2].map((i) => ({ id: `puffS${i}`, type: 'ellipse', parent: `puff${i}`, x: 0, y: 0, width: 22, height: 18, fill: { color: a(K.gray, 0.5) } })),
    { id: 'rackS', type: 'rect', parent: 'rack', x: 0, y: -RH / 2, width: RW, height: RH, cornerRadius: 10,
      fill: lin([['#475569', 0], [K.slate, 1]], { x: 0, y: -RH }, { x: 0, y: 0 }), stroke: { color: '#64748b', thickness: 2 } },
    ...SLOTS.map((y, i) => ({ id: `slot${i}`, type: 'rect', parent: 'rack', x: 0, y, width: 66, height: 26, cornerRadius: 5, fill: { color: K.ink } })),
    ...[0, 2].flatMap((i) => [
      path(`vent${i}`, 'rack', [`M-25 ${SLOTS[i] - 4} L3 ${SLOTS[i] - 4}`, `M-25 ${SLOTS[i] + 4} L3 ${SLOTS[i] + 4}`], stroke(K.line, 3)),
      { id: `ledA${i}`, type: 'ellipse', parent: 'rack', x: 16, y: SLOTS[i], width: 6, height: 6, fill: { color: i ? K.bad : K.ok } },
      { id: `ledB${i}`, type: 'ellipse', parent: 'rack', x: 25, y: SLOTS[i], width: 6, height: 6, fill: { color: i ? K.orange : K.line } },
    ]),
    path('wireA', 'rack', `M-26 ${SLOTS[1]} Q-14 ${SLOTS[1] + 14} -2 ${SLOTS[1] - 2} Q8 ${SLOTS[1] - 12} 22 ${SLOTS[1] + 4}`, stroke(K.blue, 3)),
    path('wireB', 'rack', `M-24 ${SLOTS[1] + 6} Q-6 ${SLOTS[1] - 10} 8 ${SLOTS[1] + 6} Q16 ${SLOTS[1] + 14} 26 ${SLOTS[1] - 4}`, stroke(K.orange, 3)),
    { id: 'doorS', type: 'rect', parent: 'door', x: 33, y: 13, width: 66, height: 26, cornerRadius: 5,
      fill: lin([['#64748b', 0], [K.mute, 1]], { x: 0, y: -13 }, { x: 0, y: 13 }), stroke: { color: K.gray, thickness: 1.5 } },
    { id: 'doorKnob', type: 'rect', parent: 'door', x: 54, y: 13, width: 10, height: 4, cornerRadius: 2, fill: { color: '#cbd5e1' } },
    { id: 'hinge', type: 'ellipse', parent: 'rack', x: -33, y: SLOTS[1] - 13, width: 6, height: 6, fill: { color: '#cbd5e1' } },
    ...[[0, 0, 40, 30], [-16, 6, 28, 22], [16, 4, 30, 24], [2, -12, 26, 22]].map(([x, y, w, h], i) => ({
      id: `poofS${i}`, type: 'ellipse', parent: 'poof', x, y, width: w, height: h, fill: { color: a(K.gray, 0.6) } })),
    ...L.shapes.slice(0, handR),
    { id: 'wrHandle', type: 'rect', parent: 'wrench', x: 0, y: 26, width: 10, height: 44, cornerRadius: 5, fill: metal(10) },
    path('wrHead', 'wrench', 'M-12 46 Q-16 60 -7 66 L-4 56 L4 56 L7 66 Q16 60 12 46 Q0 40 -12 46 Z',
      { fill: metal(24), stroke: { color: '#64748b', thickness: 1.5, join: 'round' } }),
    ...L.shapes.slice(handR),
    path(p + 'browD', p + 'brows', BROW_D, { ...stroke(K.deep, 3.8), opacity: 0 }),
    { id: p + 'mouthO', type: 'ellipse', parent: p + 'faceLook', x: 0, y: 18, width: 9, height: 10, opacity: 0, fill: { color: K.deep } },
    path('hatDome', 'hat', 'M-64 -48 Q-68 -104 -4 -106 Q60 -104 60 -48 Z', { fill: lin([['#fde047', 0], ['#f59e0b', 1]], { x: -30, y: -106 }, { x: 30, y: -48 }) }),
    { id: 'hatRidge', type: 'rect', parent: 'hat', x: -3, y: -80, width: 16, height: 50, cornerRadius: 8, fill: { color: a('#fef9c3', 0.55) } },
    { id: 'hatBrim', type: 'ellipse', parent: 'hat', x: -3, y: -46, width: 146, height: 16, fill: lin([['#f59e0b', 0], ['#b45309', 1]], { x: 0, y: -8 }, { x: 0, y: 8 }) },
    { id: 'hatGloss', type: 'ellipse', parent: 'hat', x: -36, y: -84, width: 18, height: 8, rotation: -30, opacity: 0.6, fill: { color: '#ffffff' } },
    ...SP.map(([x, y, c, s], i) => star(`spark${i}`, x, y, s, c)),
    ...ZAP.map(([x, y, c, s], i) => star(`zap${i}`, x, y, s, c)),
  ];

  const B = { ...faceBase(p), [`${p}foreR|rotation`]: -30, [`${p}browD|opacity`]: 0, [`${p}mouthO|opacity`]: 0,
    'poof|opacity': 0, 'poof|scaleX': 0.3, 'poof|scaleY': 0.3,
    ...zeroScale([...SP.map((_, i) => `spark${i}`), ...ZAP.map((_, i) => `zap${i}`)]) };
  const turn = [[0, -30], [50, -30, 'out'], [70, -10]];
  for (let f = 82, k = 0; f <= 154; f += 12, k++) turn.push([f, k % 2 ? -4 : -30]);
  turn.push([166, -12], [190, -70]);
  const widen = [[0, 1], [4, 1.18], [36, 1.1], [52, 1]];
  const react = anim('fix', 240, B, [
    tr('poof', 'opacity', [[0, 0], [2, 0.9], [40, 0]]), ...both('poof', 'scale', [[0, 0.3], [2, 0.3, 'out'], [40, 1.5]]),
    ...sparks(SP, 2),
    ...ZAP.flatMap((_, i) => both(`zap${i}`, 'scale', [[0, 0], ...ZAP_AT.flatMap((t, j) => (j % 3 === i ? [[t, 0], [t + 6, 1], [t + 18, 0]] : []))])),
    tr(p + 'hop', 'y', [[0, 0], [2, 0, 'out'], [10, -16, 'in'], [20, 0]]),
    tr(p + 'hop', 'rotation', [[0, 0], [56, 0], [72, 5], [160, 5], [182, 0]]),
    ...both(p + 'eyesOpen', 'scale', widen),
    tr(p + 'brows', 'y', [[0, 0], [4, -5], [36, -4], [50, 0]]),
    tr(p + 'mouth', 'opacity', [[0, 1, 'hold'], [4, 0, 'hold'], [44, 1]]), tr(p + 'mouthO', 'opacity', [[0, 0, 'hold'], [4, 1, 'hold'], [44, 0]]),
    tr(p + 'browS', 'opacity', [[0, 1, 'hold'], [44, 0]]), tr(p + 'browD', 'opacity', [[0, 0, 'hold'], [44, 1]]),
    tr(p + 'faceLook', 'x', [[0, 0], [24, 0], [36, 4], [170, 4], [184, 0]]),
    tr(p + 'faceLook', 'y', [[0, 0], [196, 0], [204, 3], [212, 0], [220, 3], [228, 0]]),
    tr(p + 'pupils', 'x', [[0, 0], [24, 0], [36, 4.5], [170, 4.5], [184, 0]]),
    tr(p + 'armR', 'rotation', [[0, -18], [50, -18, 'out'], [70, -88], [166, -88], [190, -100]]),
    tr(p + 'foreR', 'rotation', turn),
    tr(p + 'cheeks', 'opacity', [[0, 0.6], [180, 0.6], [192, 0.9]]),
  ]);
  const blink = [[0, 1]];
  for (let f = 15; f <= 180; f += 15) blink.push([f, blink.length % 2 ? 0.2 : 1]);
  const env = { duration: 180, tracks: [
    ...[0, 1, 2].flatMap((i) => {
      const t = i * 50, y0 = GROUND - RH - 4;
      const from = (v) => (t ? [[0, v], [t, v, 'linear']] : [[0, v, 'linear']]);
      return [
        tr(`puff${i}`, 'opacity', [...from(0), [t + 10, 0.6], [t + 80, 0]]),
        tr(`puff${i}`, 'y', [...from(y0), [t + 80, y0 - 46]]),
        ...both(`puff${i}`, 'scale', [...from(0.6), [t + 80, 1.5]]),
      ];
    }),
    tr('ledA2', 'opacity', blink),
    tr('door', 'rotation', [[0, 64], [90, 58], [180, 64]]),
  ] };
  return artboard('Fixer', p, L, { groups, shapes, B, react, env });
}

export const lostArtboard = lost();
export const guardArtboard = guard();
export const fixerArtboard = fixer();
