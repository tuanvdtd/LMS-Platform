import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withoutCourse, type Cart } from './checkout.ts';

const line = (id: string, listPrice: number, finalPrice: number) => ({
  course: { id, slug: id, title: id, thumbnailUrl: null, instructorName: 'GV' },
  listPrice,
  finalPrice,
  couponApplied: finalPrice < listPrice,
});

test('withoutCourse bỏ dòng và tính lại summary như BE (tổng các dòng)', () => {
  const cart: Cart = { items: [line('a', 500_000, 300_000), line('b', 200_000, 200_000)], summary: { subtotal: 700_000, discount: 200_000, total: 500_000 } };
  assert.deepEqual(withoutCourse(cart, 'a').summary, { subtotal: 200_000, discount: 0, total: 200_000 });
  assert.deepEqual(withoutCourse(cart, 'b').items.map((i) => i.course.id), ['a']);
  assert.deepEqual(withoutCourse(withoutCourse(cart, 'a'), 'b').summary, { subtotal: 0, discount: 0, total: 0 });
});
