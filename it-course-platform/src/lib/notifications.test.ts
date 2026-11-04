import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isOnPage, metaOf, NOTIF_META, toastKind } from './notifications.ts';

test('toastKind: verdict accepted = success, verdict khác = error, loại khác = info', () => {
  assert.equal(toastKind({ type: 'verdict', data: { status: 'accepted' } }), 'success');
  assert.equal(toastKind({ type: 'verdict', data: { status: 'wrong_answer' } }), 'error');
  assert.equal(toastKind({ type: 'verdict', data: { status: 'internal_error' } }), 'error');
  assert.equal(toastKind({ type: 'qa_answer', data: {} }), 'info');
});

test('isOnPage so pathname, bỏ query', () => {
  assert.equal(isOnPage('/learn/a/code/b?submission=1', '/learn/a/code/b'), true);
  assert.equal(isOnPage('/learn/a/code/c?submission=1', '/learn/a/code/b'), false);
  assert.equal(isOnPage(null, '/learn/a/code/b'), false);
});

test('metaOf: loại đã khai lấy đúng, loại lạ / key prototype trả mặc định', () => {
  assert.deepEqual(metaOf('verdict'), NOTIF_META.verdict);
  assert.deepEqual(metaOf('course_review'), { label: 'Thông báo', audience: 'student' });
  assert.deepEqual(metaOf('toString'), { label: 'Thông báo', audience: 'student' });
});
