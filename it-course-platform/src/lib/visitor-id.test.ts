// src/lib/visitor-id.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VISITOR_KEY, visitorId } from './visitor-id.ts';

const store = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};
const make = () => crypto.randomUUID();

test('đã đồng ý: lưu lâu dài, lần sau dùng lại', () => {
  const s = store();
  const a = visitorId(true, s, make);
  assert.equal(s.m.get(VISITOR_KEY), a);
  assert.equal(visitorId(true, s, make), a);
});
test('chưa đồng ý: không ghi storage, xoá mã cũ nếu có', () => {
  const s = store();
  s.m.set(VISITOR_KEY, '00000000-0000-4000-8000-000000000000');
  const a = visitorId(false, s, make);
  assert.notEqual(a, '00000000-0000-4000-8000-000000000000');
  assert.equal(s.m.has(VISITOR_KEY), false);
});
test('storage lỗi → mã tạm, không ném lỗi', () => {
  const bad = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => { throw new Error('x'); } };
  assert.match(visitorId(true, bad, make), /^[0-9a-f-]{36}$/);
});
