import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPrivatePath } from './private-routes.ts';

test('trang riêng tư: đúng prefix và trang con', () => {
  for (const p of [
    '/my-learning', '/my-learning/x', '/cart', '/orders', '/settings', '/skills', '/certificates',
    '/notifications', '/messages', '/messages/abc', '/learn/react/1', '/onboarding', '/checkout/success',
    '/instructor', '/instructor/courses/1/manage/basics', '/admin', '/admin/payouts', '/home',
  ]) {
    assert.equal(isPrivatePath(p), true, p);
  }
});

test('trang công khai, kể cả path chỉ trùng phần đầu chữ', () => {
  for (const p of [
    '/', '/courses', '/courses/development', '/course/react', '/topic/react', '/instructors/1', '/search',
    '/teach', '/verify/ABC123', '/login', '/register', '/forgot-password', '/reset-password',
    '/learning-x', '/carts', '/instructors', '/administrator', '/homework',
  ]) {
    assert.equal(isPrivatePath(p), false, p);
  }
});
