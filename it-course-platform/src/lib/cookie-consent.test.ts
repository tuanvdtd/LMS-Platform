import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConsent, setConsent } from './cookie-consent.ts';
import { VISITOR_KEY } from './visitor-id.ts';

test('từ chối xoá mã khách đã lưu, đồng ý thì giữ', () => {
  const store = new Map<string, string>([[VISITOR_KEY, 'abc']]);
  const g = globalThis as Record<string, unknown>;
  const saved = { localStorage: g.localStorage, window: g.window };
  g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) };
  g.window = { dispatchEvent: () => true };
  try {
    setConsent('accepted');
    assert.equal(store.get(VISITOR_KEY), 'abc');
    setConsent('rejected');
    assert.equal(store.has(VISITOR_KEY), false);
  } finally {
    g.localStorage = saved.localStorage;
    g.window = saved.window;
  }
});

test('chỉ nhận đúng hai giá trị, còn lại coi như chưa chọn', () => {
  assert.equal(parseConsent('accepted'), 'accepted');
  assert.equal(parseConsent('rejected'), 'rejected');
  assert.equal(parseConsent(null), null);
  assert.equal(parseConsent(''), null);
  assert.equal(parseConsent('true'), null);
});
