import assert from 'node:assert/strict';
import { test } from 'node:test';
import { safeRedirect } from './safe-redirect.ts';

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
