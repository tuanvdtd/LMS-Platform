import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resetPasswordSchema } from './reset-password.schema.ts';

const paths = (password: string, confirmPassword: string) => {
  const r = resetPasswordSchema.safeParse({ password, confirmPassword });
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
};

test('7 ký tự → lỗi password', () => {
  assert.ok(paths('1234567', '1234567').includes('password'));
});

test('129 ký tự → lỗi password', () => {
  const p = 'a'.repeat(129);
  assert.ok(paths(p, p).includes('password'));
});

test('nhập lại không khớp → lỗi confirmPassword', () => {
  assert.deepEqual(paths('12345678', '12345679'), ['confirmPassword']);
});

test('hợp lệ', () => {
  assert.deepEqual(paths('12345678', '12345678'), []);
});
