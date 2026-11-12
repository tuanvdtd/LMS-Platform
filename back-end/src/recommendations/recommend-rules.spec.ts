// back-end/src/recommendations/recommend-rules.spec.ts
import { type CandidateCourse, recommend, type RecommendInput } from './recommend-rules.js';

const T = (id: string) => ({ id, slug: id, name: id.toUpperCase() });
const course = (id: string, topicId: string, extra: Partial<CandidateCourse> = {}): CandidateCourse => ({
  id,
  level: 'all_levels',
  ratingAvg: 4,
  topics: [{ topicId, isPrimary: true }],
  ...extra,
});
const base = (over: Partial<RecommendInput> = {}): RecommendInput => ({
  topics: new Map(['react', 'ts', 'docker'].map((id) => [id, T(id)])),
  targets: [],
  occupation: null,
  userLevel: null,
  courses: [],
  skills: new Map(),
  prereqs: new Map(),
  ...over,
});
const ids = (groups: ReturnType<typeof recommend>, type: string) =>
  groups.find((g) => g.type === type)?.picks.map((p) => p.courseId) ?? [];

describe('recommend', () => {
  it('không mục tiêu, không nghề → không nhóm nào', () => {
    expect(recommend(base({ courses: [course('a', 'react')] }))).toEqual([]);
  });

  it('goal: theo thứ tự topic theo dõi; trong topic primary trước rồi rating', () => {
    const g = recommend(
      base({
        targets: ['docker', 'react'],
        courses: [
          course('r1', 'react', { ratingAvg: 5 }),
          course('d-sub', 'docker', { ratingAvg: 5, topics: [{ topicId: 'docker', isPrimary: false }] }),
          course('d-low', 'docker', { ratingAvg: 3 }),
          course('d-high', 'docker', { ratingAvg: 4.5 }),
        ],
      }),
    );
    expect(ids(g, 'goal')).toEqual(['d-high', 'd-low', 'd-sub', 'r1']);
    expect(g[0].picks[0].reason).toEqual({ type: 'goal', topic: T('docker') });
  });

  it('khoá dạy 2 topic theo dõi chỉ xuất hiện 1 lần, ở topic đầu tiên', () => {
    const both = course('both', 'react', { topics: [{ topicId: 'react', isPrimary: true }, { topicId: 'ts', isPrimary: true }] });
    const g = recommend(base({ targets: ['ts', 'react'], courses: [both] }));
    expect(g[0].picks).toEqual([{ courseId: 'both', reason: { type: 'goal', topic: T('ts') } }]);
  });

  it('occupation: lọc level, nhiều topic khớp trước, đúng level trước all_levels, rồi rating', () => {
    const g = recommend(
      base({
        occupation: { value: 'frontend_developer', topicIds: ['react', 'ts'] },
        userLevel: 'beginner',
        courses: [
          course('adv', 'react', { level: 'advanced' }),
          course('all-hi', 'react', { ratingAvg: 5 }),
          course('beg', 'react', { level: 'beginner', ratingAvg: 3 }),
          course('no-level', 'react', { level: null }),
          course('two', 'react', { topics: [{ topicId: 'react', isPrimary: true }, { topicId: 'ts', isPrimary: false }] }),
        ],
      }),
    );
    expect(ids(g, 'occupation')).toEqual(['two', 'beg', 'all-hi']);
    expect(g[0].picks[0].reason).toEqual({ type: 'occupation', occupation: 'frontend_developer', topics: [T('react'), T('ts')] });
  });

  it('occupation: user chưa chọn level → không lọc level', () => {
    const g = recommend(
      base({ occupation: { value: 'frontend_developer', topicIds: ['react'] }, courses: [course('adv', 'react', { level: 'advanced' })] }),
    );
    expect(ids(g, 'occupation')).toEqual(['adv']);
  });

  it('khoá đã ở goal không lặp lại ở occupation', () => {
    const g = recommend(
      base({
        targets: ['react'],
        occupation: { value: 'frontend_developer', topicIds: ['react', 'ts'] },
        courses: [course('r', 'react'), course('t', 'ts')],
      }),
    );
    expect(ids(g, 'goal')).toEqual(['r']);
    expect(ids(g, 'occupation')).toEqual(['t']);
  });

  it('tối đa 8 khoá mỗi nhóm', () => {
    const many = Array.from({ length: 10 }, (_, i) => course(`d${i}`, 'docker'));
    expect(ids(recommend(base({ targets: ['docker'], courses: many })), 'goal')).toHaveLength(8);
  });
});

describe('recommend — nhóm gap', () => {
  const topics = new Map(['html', 'js', 'react', 'next', 'sql', 'a', 'b'].map((id) => [id, T(id)]));
  // html → js → react → next (mũi tên: học trước → học sau)
  const prereqs = new Map([['js', ['html']], ['react', ['js']], ['next', ['react']]]);
  const run = (skills: Record<string, number>, courses: CandidateCourse[], over: Partial<RecommendInput> = {}) =>
    recommend(base({ topics, prereqs, skills: new Map(Object.entries(skills)), courses, ...over }));
  const reasons = (groups: ReturnType<typeof recommend>) =>
    groups.find((g) => g.type === 'gap')?.picks.map((p) => p.reason) ?? [];
  const one = (id: string, topicId: string) => course(id, topicId);
  const all = [one('h1', 'html'), one('j1', 'js'), one('r1', 'react'), one('n1', 'next')];

  it('chưa đo topic nào → không có nhóm gap', () => {
    expect(run({}, all)).toEqual([]);
  });

  it('mọi topic đã đo từ 60% trở lên → không có nhóm gap', () => {
    expect(run({ react: 60, js: 95 }, all)).toEqual([]);
  });

  it('topic hụt, tiên quyết vững → gợi ý thẳng khoá topic đó', () => {
    const g = run({ react: 35, js: 80 }, all);
    expect(ids(g, 'gap')).toEqual(['r1']);
    expect(reasons(g)).toEqual([{ type: 'gap', topic: T('react'), pct: 35, unmeasuredPrereqs: [] }]);
  });

  it('tiên quyết trực tiếp cũng hụt → chuyển về tiên quyết, kèm topic bị chặn', () => {
    const g = run({ react: 35, js: 40 }, all);
    expect(ids(g, 'gap')).toEqual(['j1']);
    expect(reasons(g)).toEqual([
      { type: 'gap', topic: T('js'), pct: 40, blockedTopic: T('react'), unmeasuredPrereqs: [T('html')] },
    ]);
  });

  it('đi xuyên qua tiên quyết chưa đo để tìm gốc hụt', () => {
    const g = run({ next: 20, html: 30 }, all);
    expect(ids(g, 'gap')).toEqual(['h1']);
    expect(reasons(g)[0]).toMatchObject({ topic: T('html'), pct: 30, blockedTopic: T('next') });
  });

  it('nhiều tầng cùng hụt → về gốc sâu nhất, gộp một đích, topic bị chặn là topic hụt nặng nhất', () => {
    const g = run({ next: 20, react: 50, js: 30, html: 90 }, all);
    expect(ids(g, 'gap')).toEqual(['j1']);
    expect(reasons(g)).toEqual([
      { type: 'gap', topic: T('js'), pct: 30, blockedTopic: T('next'), unmeasuredPrereqs: [] },
    ]);
  });

  it('gốc hụt không còn khoá nào → lùi về topic hụt gần gốc nhất còn khoá', () => {
    const noHtml = all.filter((c) => c.id !== 'h1');
    const g = run({ next: 20, react: 50, js: 30, html: 40 }, noHtml);
    expect(ids(g, 'gap')).toEqual(['j1']);
    expect(reasons(g)[0]).toMatchObject({ topic: T('js'), pct: 30, blockedTopic: T('next') });
    // Không tiên quyết hụt nào còn khoá → gợi ý thẳng topic đó.
    const direct = run({ react: 35, js: 40 }, [one('r1', 'react')]);
    expect(ids(direct, 'gap')).toEqual(['r1']);
    expect(reasons(direct)[0]).not.toHaveProperty('blockedTopic');
  });

  it('tiên quyết chưa đo không chặn, nhưng được ghi lại', () => {
    const g = run({ react: 35 }, all);
    expect(ids(g, 'gap')).toEqual(['r1']);
    expect(reasons(g)[0]).toMatchObject({ unmeasuredPrereqs: [T('js')] });
  });

  it('xoay vòng giữa các đích (hụt nặng trước), tối đa 8 khoá', () => {
    const many = (p: string, topicId: string) =>
      Array.from({ length: 6 }, (_, i) => course(`${p}${i + 1}`, topicId, { ratingAvg: 5 - i * 0.1 }));
    const g = run({ react: 10, sql: 20 }, [...many('s', 'sql'), ...many('r', 'react')]);
    expect(ids(g, 'gap')).toEqual(['r1', 's1', 'r2', 's2', 'r3', 's3', 'r4', 's4']);
  });

  it('khoá topic chính của mọi đích đứng trước khoá chỉ gắn topic đó làm phụ', () => {
    const sub = (id: string, topicId: string) => course(id, topicId, { topics: [{ topicId, isPrimary: false }] });
    const g = run({ react: 10, sql: 20 }, [sub('rSub', 'react'), one('r1', 'react'), one('s1', 'sql'), one('s2', 'sql'), sub('sSub', 'sql')]);
    expect(ids(g, 'gap')).toEqual(['r1', 's1', 's2', 'rSub', 'sSub']);
  });

  it('trong một đích: topic chính → hợp mức đo được → rating', () => {
    const courses = [
      course('sub', 'react', { ratingAvg: 5, topics: [{ topicId: 'react', isPrimary: false }] }),
      course('adv', 'react', { ratingAvg: 5, level: 'advanced' }),
      course('beg', 'react', { ratingAvg: 3, level: 'beginner' }),
      course('any', 'react', { ratingAvg: 4, level: 'all_levels' }),
      course('mid', 'react', { ratingAvg: 2, level: 'intermediate' }),
    ];
    // Dưới 40% hợp khoá cơ bản.
    expect(ids(run({ react: 35 }, courses), 'gap')).toEqual(['any', 'beg', 'adv', 'mid', 'sub']);
    // 40–59% hợp khoá trung cấp.
    expect(ids(run({ react: 50 }, courses), 'gap')).toEqual(['any', 'mid', 'adv', 'beg', 'sub']);
  });

  it('nhóm gap đứng trước; khoá đã ở gap không lặp lại ở goal', () => {
    const g = run({ react: 35 }, [one('r1', 'react'), one('s1', 'sql')], { targets: ['react', 'sql'] });
    expect(g.map((x) => x.type)).toEqual(['gap', 'goal']);
    expect(ids(g, 'gap')).toEqual(['r1']);
    expect(ids(g, 'goal')).toEqual(['s1']);
  });

  it('dữ liệu cạnh tạo vòng → không lặp vô hạn, vẫn ra gợi ý', () => {
    const g = recommend(
      base({
        topics,
        prereqs: new Map([['a', ['b']], ['b', ['a']]]),
        skills: new Map([['a', 30], ['b', 20]]),
        courses: [one('a1', 'a'), one('b1', 'b')],
      }),
    );
    expect(ids(g, 'gap').sort()).toEqual(['a1', 'b1']);
  });
});
