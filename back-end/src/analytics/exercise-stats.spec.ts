import { exerciseStats, type StatSubmission } from './exercise-stats.js';

const tests = [
  { id: 't1', position: 0, isPublic: true },
  { id: 't2', position: 1, isPublic: false },
];
const at = (m: number) => new Date(Date.UTC(2026, 0, 1, 0, m));
const sub = (userId: string, minute: number, status: string, r1: string, r2: string): StatSubmission => ({
  userId,
  status,
  submittedAt: at(minute),
  results: [
    { testCaseId: 't1', status: r1 },
    { testCaseId: 't2', status: r2 },
  ],
});

describe('exerciseStats', () => {
  it('người đạt, số lần nộp tới khi đạt, người mắc kẹt, tỉ lệ rớt từng test; bỏ bài chưa chấm / lỗi hệ thống', () => {
    const s = exerciseStats(tests, [
      sub('u1', 2, 'accepted', 'accepted', 'accepted'),
      sub('u1', 1, 'wrong_answer', 'accepted', 'wrong_answer'),
      sub('u2', 1, 'runtime_error', 'runtime_error', 'runtime_error'),
      sub('u2', 2, 'runtime_error', 'runtime_error', 'runtime_error'),
      sub('u2', 3, 'runtime_error', 'runtime_error', 'runtime_error'),
      sub('u3', 1, 'pending', 'pending', 'pending'),
      sub('u4', 1, 'internal_error', 'accepted', 'accepted'),
    ]);
    expect(s).toMatchObject({ learners: 2, passed: 1, passRatePct: 50, avgSubmissionsToPass: 2, stuck: 1, submissions: 5 });
    expect(s.verdicts).toEqual({ accepted: 1, wrong_answer: 1, time_limit_exceeded: 0, runtime_error: 3, compile_error: 0 });
    expect(s.tests).toEqual([
      { id: 't1', position: 0, isPublic: true, graded: 5, failed: 3, failRatePct: 60 },
      { id: 't2', position: 1, isPublic: false, graded: 5, failed: 4, failRatePct: 80 },
    ]);
  });
  it('chưa có bài nộp → tỉ lệ null', () => {
    expect(exerciseStats(tests, [])).toMatchObject({ learners: 0, passRatePct: null, avgSubmissionsToPass: null, stuck: 0 });
  });
});
