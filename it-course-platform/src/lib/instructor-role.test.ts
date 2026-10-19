import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isAdmin, isInstructor, isModerator, isStaff, teachHref } from './instructor-role.ts';

test('isInstructor: chỉ true khi role chứa đúng "instructor"', () => {
  for (const u of [undefined, null, {}, { role: null }, { role: '' }, { role: 'user' }, { role: 'instructors' }, { role: 'user,instructors' }]) {
    assert.equal(isInstructor(u), false, JSON.stringify(u));
  }
  for (const u of [{ role: 'instructor' }, { role: 'user,instructor' }]) {
    assert.equal(isInstructor(u), true, JSON.stringify(u));
  }
});

test('isInstructor: staff kèm instructor vẫn là false', () => {
  assert.equal(isInstructor({ role: 'instructor,admin' }), false);
  assert.equal(isInstructor({ role: 'user,instructor,moderator' }), false);
});

test('isAdmin / isModerator / isStaff: khớp đúng từng role trong chuỗi', () => {
  for (const u of [undefined, null, { role: null }, { role: '' }, { role: 'user,instructor' }, { role: 'admins' }, { role: 'moderators' }]) {
    assert.equal(isStaff(u), false, JSON.stringify(u));
  }
  assert.deepEqual([isAdmin({ role: 'user,admin' }), isModerator({ role: 'user,admin' }), isStaff({ role: 'user,admin' })], [true, false, true]);
  assert.deepEqual([isAdmin({ role: 'moderator' }), isModerator({ role: 'moderator' }), isStaff({ role: 'moderator' })], [false, true, true]);
  assert.deepEqual([isAdmin({ role: 'admin,moderator' }), isModerator({ role: 'admin,moderator' })], [true, true]);
});

test('teachHref: giảng viên → /instructor, còn lại → /teach', () => {
  assert.equal(teachHref({ role: 'user,instructor' }), '/instructor');
  assert.equal(teachHref({ role: 'user' }), '/teach');
  assert.equal(teachHref(undefined), '/teach');
  assert.equal(teachHref({ role: 'instructor,admin' }), '/teach');
});
