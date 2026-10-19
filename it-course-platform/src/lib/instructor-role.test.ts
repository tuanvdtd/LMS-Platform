import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isInstructor, teachHref } from './instructor-role.ts';

test('isInstructor: chỉ true khi role chứa đúng "instructor"', () => {
  for (const u of [undefined, null, {}, { role: null }, { role: '' }, { role: 'user' }, { role: 'instructors' }, { role: 'user,instructors' }]) {
    assert.equal(isInstructor(u), false, JSON.stringify(u));
  }
  for (const u of [{ role: 'instructor' }, { role: 'user,instructor' }, { role: 'instructor,admin' }]) {
    assert.equal(isInstructor(u), true, JSON.stringify(u));
  }
});

test('teachHref: giảng viên → /instructor, còn lại → /teach', () => {
  assert.equal(teachHref({ role: 'user,instructor' }), '/instructor');
  assert.equal(teachHref({ role: 'user' }), '/teach');
  assert.equal(teachHref(undefined), '/teach');
});
