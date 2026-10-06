import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addTopic, removeTopic, setPrimary } from './course-topics.ts';

const t = (id: string) => ({ id, slug: id, name: id.toUpperCase() });
const ids = (list: { id: string; isPrimary: boolean }[]) => list.map((x) => `${x.id}${x.isPrimary ? '*' : ''}`);

test('topic đầu tiên tự là chủ đề chính, các topic sau không', () => {
  const list = addTopic(addTopic([], t('a')), t('b'));
  assert.deepEqual(ids(list), ['a*', 'b']);
});

test('thêm khi đủ 3 hoặc trùng → giữ nguyên', () => {
  const full = [t('a'), t('b'), t('c')].reduce(addTopic, []);
  assert.equal(addTopic(full, t('d')), full);
  assert.equal(addTopic(full, t('a')), full);
});

test('xoá chủ đề chính → topic đầu còn lại lên thay', () => {
  const list = [t('a'), t('b'), t('c')].reduce(addTopic, []);
  assert.deepEqual(ids(removeTopic(list, 'a')), ['b*', 'c']);
});

test('xoá topic phụ → chủ đề chính giữ nguyên; xoá hết → rỗng', () => {
  const list = [t('a'), t('b')].reduce(addTopic, []);
  assert.deepEqual(ids(removeTopic(list, 'b')), ['a*']);
  assert.deepEqual(removeTopic(removeTopic(list, 'a'), 'b'), []);
});

test('setPrimary chuyển chủ đề chính, đúng 1', () => {
  const list = [t('a'), t('b'), t('c')].reduce(addTopic, []);
  assert.deepEqual(ids(setPrimary(list, 'c')), ['a', 'b', 'c*']);
});
