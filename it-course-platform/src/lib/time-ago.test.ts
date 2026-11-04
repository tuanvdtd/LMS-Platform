import assert from 'node:assert/strict';
import { test } from 'node:test';
import { timeAgo } from './time-ago.ts';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

test('timeAgo', () => {
  assert.equal(timeAgo(ago(30_000)), 'Vừa xong');
  assert.equal(timeAgo(ago(5 * 60_000)), '5 phút trước');
  assert.equal(timeAgo(ago(3 * 3600_000)), '3 giờ trước');
});
