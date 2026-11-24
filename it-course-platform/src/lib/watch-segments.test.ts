// src/lib/watch-segments.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTracker, onPlaying, onSeeked, onStop, onTimeUpdate, restore, takePending } from './watch-segments.ts';

const run = (t: ReturnType<typeof createTracker>, from: number, to: number, step = 0.25) => {
  for (let x = from; x <= to + 1e-9; x += step) onTimeUpdate(t, x);
};

test('phát liền rồi pause → một đoạn', () => {
  const t = createTracker();
  onPlaying(t, 0);
  run(t, 0, 30);
  onStop(t);
  assert.deepEqual(takePending(t), [{ s: 0, e: 30 }]);
});
test('tua lùi khi đang phát → đóng đoạn cũ, mở đoạn mới', () => {
  const t = createTracker();
  onPlaying(t, 0);
  run(t, 0, 50);
  onStop(t); // seeking
  onSeeked(t, 20, false);
  run(t, 20, 40);
  onStop(t);
  assert.deepEqual(takePending(t), [{ s: 0, e: 50 }, { s: 20, e: 40 }]);
});
test('tốc độ 2× (nhảy 0,5 s/lần) vẫn là phát liền; nhảy > 3 s là tua', () => {
  const t = createTracker();
  onPlaying(t, 0);
  run(t, 0, 20, 0.5);
  onTimeUpdate(t, 60);
  run(t, 60, 70, 0.5);
  onStop(t);
  assert.deepEqual(takePending(t), [{ s: 0, e: 20 }, { s: 60, e: 70 }]);
});
test('kéo thanh khi đang dừng không mở đoạn', () => {
  const t = createTracker();
  onTimeUpdate(t, 100);
  onSeeked(t, 120, true);
  assert.deepEqual(takePending(t), []);
});
test('lấy đoạn khi đang phát: cắt tại vị trí hiện tại rồi mở tiếp, không hở', () => {
  const t = createTracker();
  onPlaying(t, 0);
  run(t, 0, 60.5);
  assert.deepEqual(takePending(t), [{ s: 0, e: 60 }]);
  run(t, 60.75, 90);
  onStop(t);
  assert.deepEqual(takePending(t), [{ s: 60, e: 90 }]);
});
test('restore đưa đoạn gửi lỗi về đầu, giữ tối đa 20', () => {
  const t = createTracker();
  restore(t, Array.from({ length: 25 }, (_, i) => ({ s: i, e: i + 1 })));
  const p = takePending(t);
  assert.equal(p.length, 20);
  assert.deepEqual(p[0], { s: 5, e: 6 });
});
