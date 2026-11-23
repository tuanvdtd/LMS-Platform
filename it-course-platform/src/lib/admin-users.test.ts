import assert from 'node:assert/strict';
import { test } from 'node:test';
import { changePct, describeUserAgent, formatDate, formatDateTime, parseUsersFilter, rememberUsersQuery, usersFilterQuery, usersListHref } from './admin-users.ts';

test('% thay đổi so với kỳ trước; kỳ trước 0 → null', () => {
  assert.equal(changePct(150, 100), 50);
  assert.equal(changePct(90, 120), -25);
  assert.equal(changePct(1, 3), -66.7);
  assert.equal(changePct(5, 0), null);
});

test('mô tả thiết bị từ user agent', () => {
  const win = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
  assert.equal(describeUserAgent(win), 'Chrome trên Windows');
  assert.equal(describeUserAgent(`${win} Edg/131.0`), 'Edge trên Windows');
  assert.equal(
    describeUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'),
    'Safari trên iOS',
  );
  assert.equal(
    describeUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'),
    'Chrome trên Android',
  );
  assert.equal(describeUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0; rv:132.0) Gecko/20100101 Firefox/132.0'), 'Firefox trên macOS');
  assert.equal(describeUserAgent(null), 'Không rõ thiết bị');
  assert.equal(describeUserAgent('node-superagent/3.8.3'), 'Thiết bị khác');
});

test('ngày giờ theo giờ VN', () => {
  assert.equal(formatDate('2026-11-22T18:30:00Z'), '23/11/2026');
  assert.equal(formatDateTime('2026-11-22T18:30:00Z'), '01:30 23/11/2026');
});

test('bộ lọc người dùng đọc/ghi URL, giá trị lạ về mặc định', () => {
  assert.deepEqual(parseUsersFilter(new URLSearchParams('q=an&role=verified&status=locked&page=3')), {
    q: 'an',
    role: 'verified',
    status: 'locked',
    page: 3,
  });
  assert.deepEqual(parseUsersFilter(new URLSearchParams('role=boss&status=x&page=-2')), { q: '', role: 'all', status: 'all', page: 1 });
  assert.equal(parseUsersFilter(new URLSearchParams('role=toString')).role, 'all');
  assert.equal(usersFilterQuery({ q: 'an b', role: 'all', status: 'locked', page: 1 }), '?q=an+b&status=locked');
  assert.equal(usersFilterQuery({ q: '', role: 'all', status: 'all', page: 1 }), '');
});

test('link quay lại danh sách giữ bộ lọc đã nhớ', () => {
  assert.equal(usersListHref(), '/admin/users');
  rememberUsersQuery('?status=locked&page=2');
  assert.equal(usersListHref(), '/admin/users?status=locked&page=2');
  rememberUsersQuery('');
  assert.equal(usersListHref(), '/admin/users');
});
