import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loginSchema } from './login-form.schema.ts';

const paths = (input: unknown) => {
  const r = loginSchema.safeParse(input);
  assert.equal(r.success, false);
  return r.error!.issues.map((i) => i.path.join('.'));
};

test('email sai → lỗi email', () => {
  assert.deepEqual(paths({ email: 'abc', password: 'x' }), ['email']);
});

test('mật khẩu rỗng → lỗi password', () => {
  assert.deepEqual(paths({ email: 'a@b.com', password: '' }), ['password']);
});

test('mật khẩu ngắn vẫn hợp lệ; email được trim + lowercase', () => {
  const r = loginSchema.parse({ email: ' A@B.com ', password: 'abc' });
  assert.deepEqual(r, { email: 'a@b.com', password: 'abc' });
});
