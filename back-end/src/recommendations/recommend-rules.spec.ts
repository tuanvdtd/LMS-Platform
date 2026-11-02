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
