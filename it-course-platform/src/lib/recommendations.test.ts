import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reasonText } from './recommendations.ts';

const t = (name: string) => ({ id: name, slug: name, name });

test('reasonText: goal', () => {
  assert.equal(reasonText({ type: 'goal', topic: t('Docker') }), 'Bạn đang theo dõi Docker');
});

test('reasonText: occupation liệt kê topic khớp', () => {
  assert.equal(
    reasonText({ type: 'occupation', occupation: 'frontend_developer', topics: [t('React'), t('TypeScript')] }),
    'Phổ biến với Lập trình viên Frontend · React, TypeScript',
  );
});
