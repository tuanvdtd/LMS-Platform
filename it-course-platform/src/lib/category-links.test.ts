import assert from 'node:assert/strict';
import { test } from 'node:test';
import { categoryHref, topicHref } from './category-links.ts';

test('link danh mục cấp 1 và cấp 2', () => {
  assert.equal(categoryHref('development'), '/courses/development');
  assert.equal(categoryHref('development', 'web-development'), '/courses/development/web-development');
});

test('link topic', () => {
  assert.equal(topicHref('javascript'), '/topic/javascript');
});
