import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ratingSummary, starFills } from './reviews.ts';

const close = (actual: number[], expected: number[]) =>
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-9, `sao ${i + 1}: ${v} ≠ ${expected[i]}`));

test('starFills: tô theo phần lẻ', () => {
  close(starFills(0), [0, 0, 0, 0, 0]);
  close(starFills(4.3), [1, 1, 1, 1, 0.3]);
  close(starFills(4.5), [1, 1, 1, 1, 0.5]);
  close(starFills(2.75), [1, 1, 0.75, 0, 0]);
  close(starFills(5), [1, 1, 1, 1, 1]);
});

test('starFills: kẹp giá trị ngoài 0..5', () => {
  close(starFills(-1), [0, 0, 0, 0, 0]);
  close(starFills(7), [1, 1, 1, 1, 1]);
});

test('ratingSummary: rỗng', () => {
  assert.deepEqual(ratingSummary({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }), { total: 0, average: 0, pct: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
});

test('ratingSummary: trung bình có trọng số và phần trăm', () => {
  const s = ratingSummary({ 1: 0, 2: 1, 3: 0, 4: 1, 5: 11 });
  assert.equal(s.total, 13);
  assert.ok(Math.abs(s.average - 61 / 13) < 1e-9);
  assert.deepEqual(s.pct, { 1: 0, 2: 8, 3: 0, 4: 8, 5: 85 });
});
