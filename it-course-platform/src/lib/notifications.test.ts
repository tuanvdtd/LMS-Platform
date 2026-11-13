import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isOnPage, metaOf, NOTIF_META, toastKind, typesFor } from './notifications.ts';

test('toastKind: verdict accepted / duyệt = success, verdict khác / từ chối = error, loại khác = info', () => {
  assert.equal(toastKind({ type: 'verdict', data: { status: 'accepted' } }), 'success');
  assert.equal(toastKind({ type: 'verdict', data: { status: 'wrong_answer' } }), 'error');
  assert.equal(toastKind({ type: 'verdict', data: { status: 'internal_error' } }), 'error');
  assert.equal(toastKind({ type: 'qa_answer', data: {} }), 'info');
  assert.equal(toastKind({ type: 'qa_question', data: {} }), 'info');
  assert.equal(toastKind({ type: 'course_review', data: { approved: true } }), 'success');
  assert.equal(toastKind({ type: 'course_review', data: { approved: false } }), 'error');
  assert.equal(toastKind({ type: 'instructor_application', data: { approved: true } }), 'success');
  assert.equal(toastKind({ type: 'instructor_application', data: { approved: false } }), 'error');
});

test('isOnPage so pathname, bỏ query', () => {
  assert.equal(isOnPage('/learn/a/code/b?submission=1', '/learn/a/code/b'), true);
  assert.equal(isOnPage('/learn/a/code/c?submission=1', '/learn/a/code/b'), false);
  assert.equal(isOnPage(null, '/learn/a/code/b'), false);
});

test('metaOf: loại đã khai lấy đúng, loại lạ / key prototype trả mặc định', () => {
  assert.deepEqual(metaOf('verdict'), NOTIF_META.verdict);
  assert.deepEqual(metaOf('some_future_type'), { label: 'Thông báo', audience: 'student' });
  assert.deepEqual(metaOf('course_review'), { label: 'Duyệt khoá', audience: 'instructor' });
  assert.deepEqual(metaOf('toString'), { label: 'Thông báo', audience: 'student' });
});

test('typesFor: học viên chỉ thấy loại của học viên, giảng viên thấy hết', () => {
  assert.deepEqual(typesFor(false), ['verdict', 'qa_answer']);
  assert.deepEqual(typesFor(true), ['verdict', 'qa_answer', 'qa_question', 'course_review', 'instructor_application']);
});
