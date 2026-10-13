import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalogHref, formatHoursMinutes, parseCatalogParams } from './catalog.ts';

test('formatHoursMinutes', () => {
  assert.equal(formatHoursMinutes(0), '0 phút');
  assert.equal(formatHoursMinutes(59), '1 phút');
  assert.equal(formatHoursMinutes(2412), '40 phút');
  assert.equal(formatHoursMinutes(3601), '1 giờ');
  assert.equal(formatHoursMinutes(1), '1 phút');
  assert.equal(formatHoursMinutes(3600), '1 giờ');
  assert.equal(formatHoursMinutes(5400), '1 giờ 30 phút');
});

test('parseCatalogParams: bỏ giá trị lạ, page mặc định 1', () => {
  assert.deepEqual(parseCatalogParams({ q: ' react ', level: 'expert', sort: 'popular', page: 'x', price: 'free' }), {
    q: 'react',
    sort: 'popular',
    price: 'free',
    page: 1,
  });
});

test('catalogHref: đổi bộ lọc thì về trang 1, bỏ tham số mặc định', () => {
  assert.equal(catalogHref('/courses', { q: 'go', page: 3 }, { level: 'beginner' }), '/courses?q=go&level=beginner');
  assert.equal(catalogHref('/courses', { q: 'go', page: 1 }, { page: 2 }), '/courses?q=go&page=2');
  assert.equal(catalogHref('/courses', { sort: 'popular', page: 1 }, { sort: 'newest' }), '/courses');
});
