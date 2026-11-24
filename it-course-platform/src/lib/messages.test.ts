import assert from 'node:assert/strict';
import { test } from 'node:test';
import { badgeText, shortDate, dayLabel, groupMessages, linkify, previewText } from './messages.ts';

test('linkify tách link http(s), giữ chữ còn lại; bỏ dấu câu cuối link', () => {
  assert.deepEqual(linkify('Xem https://a.dev/x?y=1. ok'), [
    { type: 'text', value: 'Xem ' },
    { type: 'link', href: 'https://a.dev/x?y=1', value: 'https://a.dev/x?y=1' },
    { type: 'text', value: '. ok' },
  ]);
  assert.deepEqual(linkify('javascript:alert(1)'), [{ type: 'text', value: 'javascript:alert(1)' }]);
});
test('previewText', () => {
  assert.equal(previewText('Chào', false, true), 'Bạn: Chào');
  assert.equal(previewText('', true, false), '[Ảnh]');
  assert.equal(previewText('Xem', true, true), 'Bạn: [Ảnh] Xem');
});
test('badgeText', () => {
  assert.equal(badgeText(0), null);
  assert.equal(badgeText(3), '3');
  assert.equal(badgeText(12), '9+');
});
test('dayLabel theo giờ VN', () => {
  const now = new Date('2026-11-24T10:00:00+07:00');
  assert.equal(dayLabel('2026-11-24T01:00:00+07:00', now), 'Hôm nay');
  assert.equal(dayLabel('2026-11-23T23:00:00+07:00', now), 'Hôm qua');
  assert.equal(dayLabel('2026-11-20T08:00:00+07:00', now), '20/11/2026');
});
test('groupMessages: theo ngày rồi theo người gửi liên tiếp, cũ → mới', () => {
  const m = (id: string, senderId: string, createdAt: string) => ({ id, conversationId: 'c', senderId, body: id, images: [], createdAt });
  const g = groupMessages([m('1', 'a', '2026-11-23T09:00:00+07:00'), m('2', 'a', '2026-11-24T09:00:00+07:00'), m('3', 'a', '2026-11-24T09:01:00+07:00'), m('4', 'b', '2026-11-24T09:02:00+07:00')], 'a');
  assert.equal(g.length, 2);
  assert.deepEqual(g[1].runs.map((r) => [r.mine, r.messages.map((x) => x.id)]), [[true, ['2', '3']], [false, ['4']]]);
});

test('shortDate dd/MM giờ VN', () => {
  assert.equal(shortDate('2026-11-20T10:00:00Z'), '20/11');
});
