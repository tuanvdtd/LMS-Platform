import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeRedirect, withRedirect } from './safe-redirect.ts';

test('giữ đường dẫn nội bộ', () => {
  assert.equal(safeRedirect('/my-learning'), '/my-learning');
  assert.equal(safeRedirect('/courses?q=a'), '/courses?q=a');
});

test('chặn open redirect và giá trị rỗng', () => {
  for (const v of [
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
    'evil',
    '',
    null,
    undefined,
    '/\t/evil.com',
    '/\n/evil.com',
    '/\t\\evil.com',
  ]) {
    assert.equal(safeRedirect(v), '/', String(v));
  }
});

test('withRedirect gắn ?redirect= khi có đích hợp lệ', () => {
  assert.equal(withRedirect('/register', '/course/react?action=add-to-cart'), '/register?redirect=%2Fcourse%2Freact%3Faction%3Dadd-to-cart');
  assert.equal(withRedirect('/login', undefined), '/login');
  assert.equal(withRedirect('/login', '/'), '/login');
  assert.equal(withRedirect('/login', '//evil.com'), '/login');
});
