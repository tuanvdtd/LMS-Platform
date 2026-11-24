import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayLabel, deltaPct, dropText, fmtClock, fmtShare, monthLabel, peakText, weekLabel, flagText, fmtPct, fmtRatio, givenName, lastActiveText, personalize, reasonText, withinDays } from './analytics.ts';

test('định dạng số kiểu Việt Nam', () => {
  assert.equal(fmtPct(34.5), '34,5%');
  assert.equal(fmtPct(null), '—');
  assert.equal(fmtRatio(-0.312), '-0,31');
});

test('lời khuyên của cờ có tên phương án', () => {
  assert.match(flagText('dead_distractor', 'print total = 0'), /"print total = 0" gần như không ai chọn/);
  assert.match(flagText('negative_d'), /kiểm tra lại đáp án đúng/);
  // Phương án đã có ngoặc kép thì không bọc thêm lớp nữa.
  assert.match(flagText('attractive_distractor', '"object"'), /^Phương án sai "object" được chọn/);
});

test('lý do nguy cơ nói bằng con số của chính học viên', () => {
  assert.equal(reasonText({ code: 'inactive', days: 21 }), '21 ngày chưa vào học');
  assert.equal(
    reasonText({ code: 'lagging', lagPts: 34, peerMedianPct: 55, band: '14–30' }),
    'Chậm hơn bạn cùng lứa 34 điểm % (trung vị nhóm ghi danh 14–30 ngày: 55%)',
  );
  assert.equal(reasonText({ code: 'low_quiz', avgFirstPct: 48, gapPts: 22 }), 'Quiz lượt đầu TB 48%, dưới điểm đạt 22 điểm');
});

test('tên gọi + thay {ten}', () => {
  assert.equal(givenName('Nguyễn Thị  Mai '), 'Mai');
  assert.equal(personalize('Chào {ten}, {ten} ơi', 'Lê Văn An'), 'Chào An, An ơi');
});

test('lần hoạt động cuối + trong khoảng ngày', () => {
  const now = new Date('2026-11-21T12:00:00Z');
  assert.equal(lastActiveText(null, now), 'Chưa vào học');
  assert.equal(lastActiveText('2026-11-21T01:00:00Z', now), 'Hôm nay');
  assert.equal(lastActiveText('2026-11-18T11:00:00Z', now), '3 ngày trước');
  assert.equal(withinDays('2026-11-15T13:00:00Z', 7, now), true);
  assert.equal(withinDays('2026-11-13T11:00:00Z', 7, now), false);
});

test('fmtShare / deltaPct / nhãn thời gian', () => {
  assert.equal(fmtShare(0.345), '34,5%');
  assert.equal(fmtShare(null), '—');
  assert.equal(deltaPct(110, 100), 10);
  assert.equal(deltaPct(5, 0), undefined);
  assert.equal(dayLabel('2026-11-24'), '24/11');
  assert.equal(weekLabel('2026-11-23'), '23/11');
  assert.equal(monthLabel('2026-11'), 'T11/26');
  assert.equal(fmtClock(270), '4:30');
});
test('peakText / dropText', () => {
  assert.equal(
    peakText({ fromSec: 270, toSec: 310, rewatch: 0.38, people: 23, multiple: 4 }),
    'Đoạn 4:30–5:10: 38% người xem (23 người) tua lại, gấp 4 lần mức thường của bài.',
  );
  assert.equal(peakText({ fromSec: 270, toSec: 310, rewatch: 0.38, people: 23, multiple: null }), 'Đoạn 4:30–5:10: 38% người xem (23 người) tua lại.');
  assert.equal(dropText({ fromSec: 840, toSec: 870, lost: 0.18 }), 'Từ 14:00 đến 14:30, 18% người xem dừng xem.');
});
