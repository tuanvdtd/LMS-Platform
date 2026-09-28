import assert from 'node:assert/strict';
import { test } from 'node:test';
import { registerSchema } from './register-form.schema.ts';

const valid = {
  name: '  Minh Khoa ',
  email: ' MinhKhoa@Example.com ',
  password: '12345678',
  confirmPassword: '12345678',
  acceptTerms: true,
};

function errorPaths(input: unknown): string[] {
  const result = registerSchema.safeParse(input);
  assert.equal(result.success, false);
  return result.error!.issues.map((issue) => issue.path.join('.'));
}

test('dữ liệu hợp lệ: trim tên, trim + lowercase email', () => {
  const result = registerSchema.safeParse(valid);
  assert.equal(result.success, true);
  assert.equal(result.data!.name, 'Minh Khoa');
  assert.equal(result.data!.email, 'minhkhoa@example.com');
});

test('tên dưới 2 ký tự sau trim', () => {
  assert.deepEqual(errorPaths({ ...valid, name: ' a ' }), ['name']);
});

test('tên quá 50 ký tự', () => {
  assert.deepEqual(errorPaths({ ...valid, name: 'a'.repeat(51) }), ['name']);
});

test('email sai định dạng', () => {
  assert.deepEqual(errorPaths({ ...valid, email: 'abc' }), ['email']);
});

test('mật khẩu 7 ký tự', () => {
  assert.deepEqual(errorPaths({ ...valid, password: '1234567', confirmPassword: '1234567' }), ['password']);
});

test('mật khẩu 129 ký tự', () => {
  const long = 'a'.repeat(129);
  assert.deepEqual(errorPaths({ ...valid, password: long, confirmPassword: long }), ['password']);
});

test('nhập lại mật khẩu không khớp', () => {
  assert.deepEqual(errorPaths({ ...valid, confirmPassword: '87654321' }), ['confirmPassword']);
});

test('chưa đồng ý điều khoản', () => {
  assert.deepEqual(errorPaths({ ...valid, acceptTerms: false }), ['acceptTerms']);
});
