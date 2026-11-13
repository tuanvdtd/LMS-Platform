import { mulberry32 } from '../seed-demo/rng.ts';
import { type Catalog, evaluate, makeLearners, precisionAtK, rootGaps, runEval } from './simulate.ts';

const T = (id: string) => ({ id, slug: id, name: id });
const bank = (t: string) =>
  Array.from({ length: 40 }, (_, i) => ({ id: `${t}-q${i}`, rating: [1050, 1200, 1350][i % 3], answerCount: 0, correctCount: 0 }));
const IDS = ['a', 'b', 'c'];
// a → b → c (học trước → học sau); mỗi topic 3 khoá.
const catalog: Catalog = {
  topics: new Map(IDS.map((id) => [id, T(id)])),
  prereqs: new Map([['b', ['a']], ['c', ['b']]]),
  courses: IDS.flatMap((t) =>
    [1, 2, 3].map((i) => ({ id: `${t}${i}`, level: 'all_levels' as const, ratingAvg: 5 - i, topics: [{ topicId: t, isPrimary: true }] })),
  ),
  occupations: [{ value: 'frontend_developer', topicIds: IDS }],
  questions: new Map(IDS.map((t) => [t, bank(t)])),
};
const WEAK = 1000; // 12%
const STRONG = 1600; // 81%

describe('rootGaps', () => {
  const gaps = (a: number, b: number, c: number) => rootGaps(new Map([['a', a], ['b', b], ['c', c]]), catalog.prereqs);
  it('topic yếu có tổ tiên yếu không phải gốc', () => {
    expect(gaps(WEAK, WEAK, STRONG)).toEqual(['a']);
    expect(gaps(STRONG, WEAK, WEAK)).toEqual(['b']);
    expect(gaps(WEAK, STRONG, WEAK)).toEqual(['a']);
  });
  it('không yếu topic nào → rỗng', () => {
    expect(gaps(STRONG, STRONG, STRONG)).toEqual([]);
  });
});

describe('precisionAtK', () => {
  it('đếm khoá trúng trong K phần tử đầu', () => {
    expect(precisionAtK(['x', 'y', 'z'], new Set(['x', 'z']), 3)).toBeCloseTo(2 / 3);
    expect(precisionAtK(['x', 'y', 'z'], new Set(['z']), 2)).toBe(0);
  });
  it('danh sách ngắn hơn K vẫn chia K', () => {
    expect(precisionAtK(['x'], new Set(['x']), 5)).toBeCloseTo(0.2);
  });
});

describe('makeLearners', () => {
  const learners = makeLearners(catalog, 200, mulberry32(7));
  it('năng lực topic sau không vượt topic tiên quyết quá 100', () => {
    for (const l of learners) {
      expect(l.ability.get('b')!).toBeLessThanOrEqual(l.ability.get('a')! + 100);
      expect(l.ability.get('c')!).toBeLessThanOrEqual(Math.min(l.ability.get('a')!, l.ability.get('b')!) + 100);
      for (const v of l.ability.values()) expect(v).toBeGreaterThanOrEqual(900);
    }
  });
  it('mỗi người đo 2–3 topic khác nhau, có 2 mục tiêu khác nhau', () => {
    for (const l of learners) {
      expect(new Set(l.measured).size).toBe(l.measured.length);
      expect(l.measured.length).toBeGreaterThanOrEqual(2);
      expect(new Set(l.targets).size).toBe(2);
    }
  });
});

describe('evaluate', () => {
  it('học viên không có lỗ hổng gốc bị loại khỏi phép tính', () => {
    const strong = { id: 's', ability: new Map(IDS.map((t) => [t, STRONG])), occupation: catalog.occupations[0], targets: ['a', 'b'], measured: [] };
    expect(evaluate(catalog, [strong], new Map(), catalog.prereqs)).toMatchObject({ eligible: 0, excluded: 1 });
  });
  it('biết đúng lỗ hổng gốc → P@3 = 1', () => {
    const l = { id: 'w', ability: new Map([['a', STRONG], ['b', WEAK], ['c', WEAK]]), occupation: catalog.occupations[0], targets: ['a', 'c'], measured: ['b', 'c'] };
    const skills = new Map([['w', new Map([['b', 12], ['c', 12]])]]);
    expect(evaluate(catalog, [l], skills, catalog.prereqs).p[3]).toBe(1);
    // Không có đồ thị: khoá của b và c xen kẽ → chỉ 2 trong 3 khoá đầu trúng.
    expect(evaluate(catalog, [l], skills, new Map()).p[3]).toBeCloseTo(2 / 3);
  });
});

describe('runEval', () => {
  it('cùng seed cùng kết quả', () => {
    expect(runEval(catalog, 100)).toEqual(runEval(catalog, 100));
  });
  it('gợi ý theo lỗ hổng có đồ thị trúng hơn mốc nền mục tiêu + nghề', () => {
    const r = runEval(catalog, 200);
    expect(r.table1).toHaveLength(3);
    expect(r.table2.map((x) => x.attempts)).toEqual([1, 2, 3]);
    expect(r.table1[2].p[3]).toBeGreaterThan(r.table1[0].p[3]);
  });
});
