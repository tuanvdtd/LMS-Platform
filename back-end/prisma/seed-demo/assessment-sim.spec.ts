import { chooseOptions, gradeAnswer, simulateExercise, simulateQuiz, thetaBank, type SimBug, type SimExercise, type SimQuiz } from './assessment-sim.ts';
import { DAY, mulberry32 } from './rng.ts';

const q1 = { id: 'q1', type: 'single_choice' as const, points: 1, options: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }, { id: 'c', isCorrect: false }] };
const q2 = { id: 'q2', type: 'multiple_choice' as const, points: 1, options: [{ id: 'x', isCorrect: true }, { id: 'y', isCorrect: true }, { id: 'z', isCorrect: false }] };
const quiz: SimQuiz = { id: 'quiz', passScorePct: 70, questions: [q1, q2] };
let seq = 0;
const id = () => `id${++seq}`;
const from = new Date('2026-01-01T00:00:00Z');
const to = new Date(from.getTime() + 3 * DAY);

describe('chooseOptions / gradeAnswer', () => {
  it('năng lực rất cao chọn đúng thật; câu đặt sai key thì bị chấm sai', () => {
    const rng = mulberry32(1);
    expect(chooseOptions(rng, q1, { a: 2, b: 0 }, 10)).toEqual(['a']);
    expect(chooseOptions(rng, q2, { a: 2, b: 0 }, 10).sort()).toEqual(['x', 'y']);
    const picked = chooseOptions(rng, q1, { a: 2, b: 0, truth: [1] }, 10);
    expect(picked).toEqual(['b']);
    expect(gradeAnswer(q1, picked)).toEqual({ isCorrect: false, pointsAwarded: 0 });
  });
  it('không biết thì chọn theo độ hút: phương án trọng số ~0 gần như không ai chọn', () => {
    const rng = mulberry32(2);
    const picks = Array.from({ length: 2000 }, () => chooseOptions(rng, q1, { a: 1, b: 100, weights: [1, 1, 0.01] }, 0)[0]);
    expect(picks.filter((p) => p === 'c').length).toBeLessThan(40);
    expect(picks.filter((p) => p === 'b').length).toBeGreaterThan(800);
  });
  it('câu nhiều đáp án: không biết thì không chọn rỗng, không trùng khít tập đúng', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const s = chooseOptions(rng, q2, { a: 1, b: 100 }, 0);
      expect(s.length).toBeGreaterThan(0);
      expect(gradeAnswer(q2, s).isCorrect).toBe(false);
    }
  });
});

describe('simulateQuiz', () => {
  it('mustPass: lượt cuối đạt, attemptNo tăng dần, lượt nằm trong (from, to], điểm khớp chấm', () => {
    const r = simulateQuiz(mulberry32(4), { quiz, param: () => ({ a: 1.5, b: 3 }), userId: 'u', theta: -2, from, to, run: { maxAttempts: 3, retake: 0, mustPass: true }, id });
    expect(r.passedAt).not.toBeNull();
    expect(r.attempts.map((a) => a.attemptNo)).toEqual(r.attempts.map((_, i) => i + 1));
    for (const a of r.attempts) {
      expect(a.submittedAt.getTime()).toBeGreaterThan(from.getTime());
      expect(a.submittedAt.getTime()).toBeLessThanOrEqual(to.getTime());
      expect(a.scorePct).toBeCloseTo((100 * a.answers.reduce((s, x) => s + x.pointsAwarded, 0)) / 2);
      expect(a.passed).toBe(a.scorePct >= 70);
    }
    expect(r.attempts.at(-1)!.passed).toBe(true);
  });
  it('không mustPass, retake 0: dừng sau lượt trượt đầu tiên', () => {
    const r = simulateQuiz(mulberry32(5), { quiz, param: () => ({ a: 1.5, b: 5 }), userId: 'u', theta: -3, from, to, run: { maxAttempts: 3, retake: 0 }, id });
    expect(r.attempts).toHaveLength(1);
    expect(r.passedAt).toBeNull();
  });
});

describe('simulateExercise', () => {
  const ex: SimExercise = { id: 'ex', language: 'javascript', starter: 'S', solution: 'if (score >= 8)', tests: [0, 1, 2].map((p) => ({ id: `t${p}`, position: p, points: 10 })) };
  const bugs: SimBug[] = [{ kind: 'boundary', weight: 1, failing: [2], status: 'wrong_answer', mutate: [['score >= 8', 'score > 8']] }];
  it('mustFail: mọi bài sai, rớt đúng test của lỗi, mã nguồn là lời giải bị sửa', () => {
    const r = simulateExercise(mulberry32(6), { exercise: ex, bugs, b: 0, userId: 'u', theta: 5, from, to, run: { maxSubmissions: 3, mustFail: true }, id });
    expect(r.acceptedAt).toBeNull();
    expect(r.submissions).toHaveLength(3);
    for (const s of r.submissions) {
      expect(s).toMatchObject({ status: 'wrong_answer', passedTests: 2, totalTests: 3, score: 67, sourceCode: 'if (score > 8)' });
      expect(s.results.filter((x) => x.status !== 'accepted').map((x) => x.testCaseId)).toEqual(['t2']);
    }
  });
  it('mustPass: bài cuối Accepted, qua mọi test, mã nguồn là lời giải', () => {
    const r = simulateExercise(mulberry32(7), { exercise: ex, bugs, b: 10, userId: 'u', theta: -5, from, to, run: { maxSubmissions: 2, mustPass: true }, id });
    const last = r.submissions.at(-1)!;
    expect(last).toMatchObject({ status: 'accepted', score: 100, passedTests: 3, sourceCode: 'if (score >= 8)' });
    expect(r.acceptedAt).toEqual(last.submittedAt);
  });
});

it('thetaBank: cùng id cùng θ', () => {
  const theta = thetaBank(mulberry32(8));
  expect(theta('a')).toBe(theta('a'));
  expect(theta('a')).not.toBe(theta('b'));
});
