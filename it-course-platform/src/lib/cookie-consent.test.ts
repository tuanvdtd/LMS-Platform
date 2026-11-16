import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConsent } from './cookie-consent.ts';

test('chỉ nhận đúng hai giá trị, còn lại coi như chưa chọn', () => {
  assert.equal(parseConsent('accepted'), 'accepted');
  assert.equal(parseConsent('rejected'), 'rejected');
  assert.equal(parseConsent(null), null);
  assert.equal(parseConsent(''), null);
  assert.equal(parseConsent('true'), null);
});
