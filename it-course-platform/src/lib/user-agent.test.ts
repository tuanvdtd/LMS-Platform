import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeDevice } from './user-agent.ts';

test('nhận trình duyệt và hệ điều hành phổ biến', () => {
  const cases: [string, string, boolean][] = [
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'Chrome trên Windows', false],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0', 'Edge trên Windows', false],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15', 'Safari trên macOS', false],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1', 'Chrome trên iOS', true],
    ['Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36', 'Chrome trên Android', true],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0', 'Firefox trên Linux', false],
  ];
  for (const [ua, label, mobile] of cases) assert.deepEqual(describeDevice(ua), { label, mobile });
});

test('thiếu hoặc lạ thì không đoán', () => {
  assert.equal(describeDevice(null).label, 'Thiết bị không xác định');
  assert.equal(describeDevice('curl/8.0').label, 'Thiết bị không xác định');
});
