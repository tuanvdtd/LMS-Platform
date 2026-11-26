import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookPageSize, bookShift, hasNextSpread, hasPrevSpread, nextSpread, pagesToDraw, prevSpread, spreadLabel, spreadStart } from './pdf-book-pages.ts';

test('nextSpread / prevSpread: bìa ↔ cặp đầu, đứng yên ở hai đầu', () => {
  assert.equal(nextSpread(0, 17), 1);
  assert.equal(nextSpread(2, 17), 3);
  assert.equal(nextSpread(15, 17), 15);
  assert.equal(nextSpread(0, 1), 0);
  assert.equal(prevSpread(0), 0);
  assert.equal(prevSpread(2), 0);
  assert.equal(prevSpread(4), 1);
});

test('bookShift: bìa và trang lẻ cuối nằm giữa, cặp hai trang không dời', () => {
  assert.equal(bookShift(0, 17), -0.5);
  assert.equal(bookShift(0, 1), -0.5);
  assert.equal(bookShift(3, 17), 0);
  assert.equal(bookShift(15, 17), 0); // 17 trang: cặp cuối [15,16] đủ hai trang
  assert.equal(bookShift(15, 16), 0.5); // 16 trang: trang 16 đứng riêng bên trái
});

test('spreadStart: bìa đứng riêng, sau đó cặp [1,2], [3,4]', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(spreadStart), [0, 1, 1, 3, 3, 5]);
});

test('spreadLabel: bìa, cặp giữa, trang lẻ cuối', () => {
  assert.equal(spreadLabel(0, 17), 'Trang 1/17');
  assert.equal(spreadLabel(3, 17), 'Trang 4–5/17');
  assert.equal(spreadLabel(4, 17), 'Trang 4–5/17');
  assert.equal(spreadLabel(15, 17), 'Trang 16–17/17');
  assert.equal(spreadLabel(15, 16), 'Trang 16/16'); // số trang chẵn → trang cuối đứng riêng
  assert.equal(spreadLabel(0, 1), 'Trang 1/1');
});

test('hasPrev/hasNext ở hai đầu sách', () => {
  assert.equal(hasPrevSpread(0), false);
  assert.equal(hasPrevSpread(1), true);
  assert.equal(hasNextSpread(0, 1), false);
  assert.equal(hasNextSpread(0, 2), true);
  assert.equal(hasNextSpread(15, 17), false);
  assert.equal(hasNextSpread(13, 17), true);
  assert.equal(hasNextSpread(15, 16), false);
});

test('pagesToDraw: hai cặp mỗi bên, cặp đang mở đứng đầu, không vượt biên', () => {
  assert.deepEqual(pagesToDraw(0, 17).slice(0, 2).sort(), [0, 1]);
  assert.deepEqual([...pagesToDraw(7, 17)].sort((a, b) => a - b), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(pagesToDraw(7, 17).slice(0, 2).sort(), [7, 8]);
  assert.deepEqual([...pagesToDraw(15, 17)].sort((a, b) => a - b), [11, 12, 13, 14, 15, 16]);
  assert.deepEqual(pagesToDraw(0, 1), [0]);
});

test('bookPageSize: vừa theo chiều cao hoặc chiều rộng, nhân zoom', () => {
  const a4 = 595 / 842;
  assert.deepEqual(bookPageSize(1120, 538, a4, 1), { width: 380, height: 538 }); // khung rộng → chiều cao quyết định
  assert.deepEqual(bookPageSize(600, 1000, a4, 1), { width: 300, height: 424 }); // khung hẹp → chiều rộng quyết định
  assert.deepEqual(bookPageSize(1120, 538, a4, 1.5), { width: 570, height: 807 });
});
