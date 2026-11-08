import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatClock, formatDuration, formatWait, layoutSkillGraph, masteryLevel } from './skills.ts';

test('masteryLevel theo ngưỡng 40/70', () => {
  assert.equal(masteryLevel(39), 'weak');
  assert.equal(masteryLevel(40), 'mid');
  assert.equal(masteryLevel(69), 'mid');
  assert.equal(masteryLevel(70), 'strong');
});

test('formatClock làm tròn lên, không âm', () => {
  assert.equal(formatClock(15 * 60_000), '15:00');
  assert.equal(formatClock(61_001), '1:02');
  assert.equal(formatClock(-5), '0:00');
});

test('formatWait: dưới 1 giờ ra phút, từ 1 giờ ra giờ (làm tròn lên)', () => {
  assert.equal(formatWait(35 * 60_000), 'Sau 35 phút');
  assert.equal(formatWait(10_000), 'Sau 1 phút');
  assert.equal(formatWait(13 * 3_600_000 + 60_000), 'Sau 14 giờ');
});

test('formatDuration', () => {
  assert.equal(formatDuration(680_000), '11 phút 20 giây');
  assert.equal(formatDuration(45_000), '45 giây');
});

test('layoutSkillGraph xếp lớp theo đường tiên quyết dài nhất, giữ thứ tự đầu vào trong mỗi lớp', () => {
  const ids = ['css', 'html', 'javascript', 'nextjs', 'nodejs', 'react', 'sql', 'typescript'];
  const edges = [
    { topicId: 'css', requiresId: 'html' }, { topicId: 'javascript', requiresId: 'css' },
    { topicId: 'react', requiresId: 'javascript' }, { topicId: 'nextjs', requiresId: 'react' },
    { topicId: 'nodejs', requiresId: 'javascript' }, { topicId: 'typescript', requiresId: 'javascript' },
  ];
  const at = new Map(layoutSkillGraph(ids, edges).map((n) => [n.id, n]));
  assert.deepEqual([at.get('html')!.layer, at.get('sql')!.layer, at.get('css')!.layer, at.get('javascript')!.layer], [0, 0, 1, 2]);
  assert.deepEqual(['nodejs', 'react', 'typescript'].map((id) => [at.get(id)!.layer, at.get(id)!.row]), [[3, 0], [3, 1], [3, 2]]);
  assert.equal(at.get('nextjs')!.layer, 4);
});

test('layoutSkillGraph không treo khi có vòng', () => {
  assert.equal(layoutSkillGraph(['a', 'b'], [{ topicId: 'a', requiresId: 'b' }, { topicId: 'b', requiresId: 'a' }]).length, 2);
});
