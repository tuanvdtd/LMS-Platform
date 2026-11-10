import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reasonText, unmeasuredTopics } from './recommendations.ts';

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

test('reasonText: gap trực tiếp', () => {
  assert.equal(
    reasonText({ type: 'gap', topic: t('React JS'), pct: 35, unmeasuredPrereqs: [] }),
    'Bạn đạt 35% ở React JS',
  );
});

test('reasonText: gap chuyển về topic cần vững trước', () => {
  assert.equal(
    reasonText({ type: 'gap', topic: t('JavaScript'), pct: 40, blockedTopic: t('React JS'), unmeasuredPrereqs: [] }),
    'Nên vững JavaScript (40%) trước khi học React JS',
  );
});

test('unmeasuredTopics: gom tên không trùng, bỏ qua lý do khác gap', () => {
  assert.deepEqual(
    unmeasuredTopics([
      { reason: { type: 'gap', topic: t('React JS'), pct: 35, unmeasuredPrereqs: [t('JavaScript')] } },
      { reason: { type: 'gap', topic: t('React JS'), pct: 35, unmeasuredPrereqs: [t('JavaScript')] } },
      { reason: { type: 'gap', topic: t('CSS'), pct: 20, unmeasuredPrereqs: [t('HTML')] } },
      { reason: { type: 'goal', topic: t('Docker') } },
    ]),
    ['JavaScript', 'HTML'],
  );
});
