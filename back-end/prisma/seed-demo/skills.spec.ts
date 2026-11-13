import { mulberry32 } from './rng.ts';
import { planSkillHistory } from './skills.ts';

const bank = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `q${i}`, rating: [1050, 1200, 1350][i % 3], answerCount: 0, correctCount: 0 }));

describe('planSkillHistory', () => {
  const now = new Date('2026-11-04T00:00:00Z');
  const run = (ability: number) =>
    planSkillHistory({ now, learners: [{ userId: 'u', topicId: 't', ability }], questions: new Map([['t', bank(40)]]) }, mulberry32(1));

  it('mỗi cặp học viên–topic 1–3 lượt, mỗi lượt 12 câu không trùng, lượt cuối đã qua thời gian chờ', () => {
    const p = run(1400);
    expect(p.attempts.length).toBeGreaterThanOrEqual(1);
    expect(p.attempts.length).toBeLessThanOrEqual(3);
    for (const a of p.attempts) {
      const qs = p.answers.filter((x) => x.attemptId === a.id).map((x) => x.questionId);
      expect(qs).toHaveLength(12);
      expect(new Set(qs).size).toBe(12);
    }
    const last = p.attempts.at(-1)!;
    expect(now.getTime() - last.startedAt.getTime()).toBeGreaterThan(24 * 3_600_000);
  });

  it('Elo đi về phía năng lực thật', () => {
    expect(run(1650).skills[0].rating).toBeGreaterThan(1350);
    expect(run(950).skills[0].rating).toBeLessThan(1200);
  });

  it('xác định: cùng seed cùng kết quả', () => {
    expect(run(1400)).toEqual(run(1400));
  });

  it('attempts cố định → đúng số lượt đó', () => {
    const p = planSkillHistory(
      { now, learners: [{ userId: 'u', topicId: 't', ability: 1400, attempts: 2 }], questions: new Map([['t', bank(40)]]) },
      mulberry32(1),
    );
    expect(p.attempts).toHaveLength(2);
    expect(p.skills[0].answerCount).toBe(24);
  });
});
